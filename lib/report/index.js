import {readdirSync, statSync} from 'node:fs';
import {
    isAbsolute,
    resolve,
    extname,
} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import util from 'node:util';
import process from 'node:process';
import Exclude from 'test-exclude';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import {mergeProcessCovs} from '@bcoe/v8-coverage';
import {tryToCatch} from 'try-to-catch';
import {tryCatch} from 'try-catch';
import {processFile} from './process-file.js';
import {readReport} from './read-report.js';
import {mergeReports} from './merge-reports.js';
// TODO: switch back to @c88/v8-coverage once patch is landed.
import getSourceMapFromFile from '../source-map-from-file.js';
import {getMonocart, importMonocart} from './monocart.js';

const isUndefined = (a) => typeof a === 'undefined';
const isString = (a) => typeof a === 'string';

const debuglog = util.debuglog('c8');

class ReportInstance {
    constructor(overrides) {
        const {
            exclude,
            extension,
            excludeAfterRemap,
            include,
            reporter,
            reporterOptions,
            reportsDirectory,
            tempDirectory,
            watermarks,
            omitRelative,
            wrapperLength,
            resolve: resolvePaths,
            all,
            src,
            allowExternal = false,
            skipFull,
            excludeNodeModules,
            mergeAsync,
            monocartArgv,
        } = overrides;
        
        this.importMonocart = importMonocart;
        
        this.reporter = reporter;
        this.reporterOptions = reporterOptions || {};
        this.reportsDirectory = reportsDirectory;
        this.tempDirectory = tempDirectory;
        this.watermarks = watermarks;
        this.resolve = resolvePaths;
        this.exclude = new Exclude({
            exclude,
            include,
            extension,
            relativePath: !allowExternal,
            excludeNodeModules,
        });
        this.excludeAfterRemap = excludeAfterRemap;
        this.shouldInstrumentCache = new Map();
        this.omitRelative = omitRelative;
        this.sourceMapCache = {};
        this.wrapperLength = wrapperLength;
        this.all = all;
        this.src = this._getSrc(src);
        this.skipFull = skipFull;
        this.mergeAsync = mergeAsync;
        this.monocartArgv = monocartArgv;
    }
    
    _getSrc(src) {
        if (isString(src))
            return [src];
        
        if (Array.isArray(src))
            return src;
        
        return [
            process.cwd(),
        ];
    }
    
    async run() {
        if (this.monocartArgv)
            return this.runMonocart();
        
        const context = libReport.createContext({
            dir: this.reportsDirectory,
            watermarks: this.watermarks,
            coverageMap: await this.getCoverageMapFromAllCoverageFiles(),
        });
        
        for (const _reporter of this.reporter) {
            reports
                .create(_reporter, {
                    skipEmpty: false,
                    skipFull: this.skipFull,
                    maxCols: process.stdout.columns || 100,
                    ...this.reporterOptions[_reporter],
                })
                .execute(context);
        }
    }
    
    async runMonocart() {
        /* c8 ignore start */
        const MCR = await getMonocart(this);
        
        if (!MCR)
            return;
        
        /* c8 ignore end */
        const argv = this.monocartArgv;
        const {exclude} = this;
        
        function getEntryFilter() {
            return argv.entryFilter || argv.filter || function(entry) {
                return exclude.shouldInstrument(fileURLToPath(entry.url));
            };
        }
        
        function getSourceFilter() {
            return argv.sourceFilter || argv.filter || function(sourcePath) {
                if (argv.excludeAfterRemap)
                    return exclude.shouldInstrument(sourcePath);
                
                return true;
            };
        }
        
        function getReports() {
            const reports = [argv.reporter];
            const reporterOptions = argv.reporterOptions || {};
            
            return reports.map((reportName) => {
                const reportOptions = {
                    ...reporterOptions[reportName],
                };
                
                /* c8 ignore start */
                if (reportName === 'text') {
                    reportOptions.skipEmpty = false;
                    reportOptions.skipFull = argv.skipFull;
                    reportOptions.maxCols = process.stdout.columns || 100;
                }
                
                /* c8 ignore end */
                return [reportName, reportOptions];
            });
        }
        
        // --all: add empty coverage for all files
        function getAllOptions() {
            if (!argv.all)
                return;
            
            const {src} = argv;
            const workingDirs = Array.isArray(src) ? src : isString(src) ? [src] : [
                process.cwd(),
            ];
            
            return {
                dir: workingDirs,
                filter: (filePath) => {
                    return exclude.shouldInstrument(filePath);
                },
            };
        }
        
        function initPct(summary) {
            for (const k of Object.keys(summary)) {
                if (summary[k].pct === '')
                    summary[k].pct = 100;
            }
            
            return summary;
        }
        
        // adapt coverage options
        const coverageOptions = {
            logging: argv.logging,
            name: argv.name,
            
            reports: getReports(),
            
            outputDir: argv.reportsDir,
            baseDir: argv.baseDir,
            
            entryFilter: getEntryFilter(),
            sourceFilter: getSourceFilter(),
            
            inline: argv.inline,
            lcov: argv.lcov,
            
            all: getAllOptions(),
            
            clean: argv.clean,
            // use default value for istanbul
            defaultSummarizer: 'pkg',
            
            onEnd: (coverageResults) => {
                // for check coverage
                this._allCoverageFiles = {
                    files: () => {
                        return coverageResults.files.map((it) => it.sourcePath);
                    },
                    fileCoverageFor: (file) => {
                        const fileCoverage = coverageResults.files.find((it) => it.sourcePath === file);
                        
                        return {
                            toSummary: () => {
                                return initPct(fileCoverage.summary);
                            },
                        };
                    },
                    getCoverageSummary: () => {
                        return initPct(coverageResults.summary);
                    },
                };
            },
        };
        
        const coverageReport = new MCR.CoverageReport(coverageOptions);
        
        coverageReport.cleanCache();
        // read v8 coverage data from tempDirectory
        await coverageReport.addFromDir(argv.tempDirectory);
        // generate report
        await coverageReport.generate();
    }
    
    async getCoverageMapFromAllCoverageFiles() {
        // the merge process can be very expensive, and it's often the case that
        // check-coverage is called immediately after a report. We memoize the
        // result from getCoverageMapFromAllCoverageFiles() to address this
        // use-case.
        if (this._allCoverageFiles)
            return this._allCoverageFiles;
        
        const map = libCoverage.createCoverageMap();
        let v8ProcessCov;
        
        if (this.mergeAsync)
            v8ProcessCov = await this._getMergedProcessCovAsync();
        else
            v8ProcessCov = this._getMergedProcessCov();
        
        const resultCountPerPath = new Map();
        
        for (const v8ScriptCov of v8ProcessCov.result) {
            const [error] = await tryToCatch(mergeReports, v8ScriptCov, {
                map,
                superc8: this,
                resultCountPerPath,
            });
            
            if (error)
                debuglog(`file: ${v8ScriptCov.url} error: ${error.stack}`);
        }
        
        this._allCoverageFiles = map;
        return this._allCoverageFiles;
    }
    /**
   * Returns source-map and fake source file, if cached during Node.js'
   * execution. This is used to support tools like ts-node, which transpile
   * using runtime hooks.
   *
   * Note: requires Node.js 13+
   *
   * @return {Object} sourceMap and fake source file (created from line #s).
   * @private
   */
    _getSourceMap(v8ScriptCov) {
        const sources = {};
        const sourceMapAndLineLengths = this.sourceMapCache[pathToFileURL(v8ScriptCov.url).href];
        
        if (sourceMapAndLineLengths) {
            // See: https://github.com/nodejs/node/pull/34305
            if (!sourceMapAndLineLengths.data)
                return;
            
            sources.sourceMap = {
                sourcemap: sourceMapAndLineLengths.data,
            };
            
            if (sourceMapAndLineLengths.lineLengths) {
                let source = '';
                
                for (const length of sourceMapAndLineLengths.lineLengths) {
                    source += `${''.padEnd(length, '.')}\n`;
                }
                
                sources.source = source;
            }
        }
        
        return sources;
    }
    /**
   * Returns the merged V8 process coverage.
   *
   * The result is computed from the individual process coverages generated
   * by Node. It represents the sum of their counts.
   *
   * @return {ProcessCov} Merged V8 process coverage.
   * @private
   */
    _getMergedProcessCov() {
        const v8ProcessCovs = [];
        const fileIndex = new Set();
        
        // Set<string>
        for (const v8ProcessCov of this._loadReports()) {
            if (this._isCoverageObject(v8ProcessCov)) {
                if (v8ProcessCov['source-map-cache'])
                    Object.assign(this.sourceMapCache, this._normalizeSourceMapCache(v8ProcessCov['source-map-cache']));
                
                v8ProcessCovs.push(this._normalizeProcessCov(
                    v8ProcessCov,
                    fileIndex,
                ));
            }
        }
        
        if (this.all) {
            const emptyReports = this._includeUncoveredFiles(fileIndex);
            
            v8ProcessCovs.unshift({
                result: emptyReports,
            });
        }
        
        return mergeProcessCovs(v8ProcessCovs);
    }
    /**
   * Returns the merged V8 process coverage.
   *
   * It asynchronously and incrementally reads and merges individual process coverages
   * generated by Node. This can be used via the `--merge-async` CLI arg.  It's intended
   * to be used across a large multi-process test run.
   *
   * @return {ProcessCov} Merged V8 process coverage.
   * @private
   */
    async _getMergedProcessCovAsync() {
        const {mergeProcessCovs} = await import('@bcoe/v8-coverage');
        const fileIndex = new Set(); // Set<string>
        let mergedCov = null;
        
        const superc8 = this;
        
        for (const file of readdirSync(this.tempDirectory)) {
            let error;
            
            [error, mergedCov] = await tryToCatch(processFile, {
                file,
                fileIndex,
                mergedCov,
                superc8,
                mergeProcessCovs,
            });
            
            /* c8 ignore start */
            if (error)
                debuglog(String(error.stack));
            /* c8 ignore end */
        }
        
        if (this.all) {
            const emptyReports = this._includeUncoveredFiles(fileIndex);
            const emptyReport = {
                result: emptyReports,
            };
            
            mergedCov = mergeProcessCovs([emptyReport, mergedCov]);
        }
        
        return mergedCov;
    }
    /**
   * Adds empty coverage reports to account for uncovered/untested code.
   * This is only done when the `--all` flag is present.
   *
   * @param {Set} fileIndex list of files that have coverage
   * @returns {Array} list of empty coverage reports
   */
    _includeUncoveredFiles(fileIndex) {
        const emptyReports = [];
        const workingDirs = this.src;
        const {extension} = this.exclude;
        
        for (const workingDir of workingDirs) {
            for (const f of this.exclude.globSync(workingDir)) {
                const fullPath = resolve(workingDir, f);
                
                if (!fileIndex.has(fullPath)) {
                    const ext = extname(fullPath);
                    
                    if (extension.includes(ext)) {
                        const stat = statSync(fullPath);
                        const sourceMap = getSourceMapFromFile(fullPath);
                        
                        if (sourceMap)
                            this.sourceMapCache[pathToFileURL(fullPath)] = {
                                data: sourceMap,
                            };
                        
                        emptyReports.push({
                            scriptId: 0,
                            url: resolve(fullPath),
                            functions: [{
                                functionName: '(empty-report)',
                                ranges: [{
                                    startOffset: 0,
                                    endOffset: stat.size,
                                    count: 0,
                                }],
                                isBlockCoverage: true,
                            }],
                        });
                    }
                }
            }
        }
        
        return emptyReports;
    }
    /**
   * Make sure v8ProcessCov actually contains coverage information.
   *
   * @return {boolean} does it look like v8ProcessCov?
   * @private
   */
    _isCoverageObject(maybeV8ProcessCov) {
        return maybeV8ProcessCov && Array.isArray(maybeV8ProcessCov.result);
    }
    /**
   * Returns the list of V8 process coverages generated by Node.
   *
   * @return {ProcessCov[]} Process coverages generated by Node.
   * @private
   */
    _loadReports() {
        const reports = [];
        const {tempDirectory} = this;
        
        for (const file of readdirSync(tempDirectory)) {
            const [error, report] = tryCatch(readReport, {
                file,
                tempDirectory,
            });
            
            if (error) {
                debuglog(String(error.stack));
                continue;
            }
            
            reports.push(report);
        }
        
        return reports;
    }
    /**
   * Normalizes a process coverage.
   *
   * This function replaces file URLs (`url` property) by their corresponding
   * system-dependent path and applies the current inclusion rules to filter out
   * the excluded script coverages.
   *
   * The result is a copy of the input, with script coverages filtered based
   * on their `url` and the current inclusion rules.
   * There is no deep cloning.
   *
   * @param v8ProcessCov V8 process coverage to normalize.
   * @param fileIndex a Set<string> of paths discovered in coverage
   * @return {v8ProcessCov} Normalized V8 process coverage.
   * @private
   */
    _normalizeProcessCov(v8ProcessCov, fileIndex) {
        const result = [];
        
        for (const v8ScriptCov of v8ProcessCov.result) {
            // https://github.com/nodejs/node/pull/35498 updates Node.js'
            // builtin module filenames:
            if (v8ScriptCov.url.startsWith('node:'))
                v8ScriptCov.url = `${v8ScriptCov.url.replace(/^node:/, '')}.js`;
            
            if (v8ScriptCov.url.startsWith('file://'))
                try {
                    v8ScriptCov.url = fileURLToPath(v8ScriptCov.url);
                    fileIndex.add(v8ScriptCov.url);
                } catch(err) {
                    debuglog(String(err.stack));
                    continue;
                }
            
            const shouldAddReport = !this.omitRelative
                || isAbsolute(v8ScriptCov.url)
                && this.excludeAfterRemap
                || this._shouldInstrument(v8ScriptCov.url);
            
            if (shouldAddReport)
                result.push(v8ScriptCov);
        }
        
        return {
            result,
        };
    }
    /**
   * Normalizes a V8 source map cache.
   *
   * This function normalizes file URLs to a system-independent format.
   *
   * @param v8SourceMapCache V8 source map cache to normalize.
   * @return {v8SourceMapCache} Normalized V8 source map cache.
   * @private
   */
    _normalizeSourceMapCache(v8SourceMapCache) {
        const cache = {};
        
        for (const fileURL of Object.keys(v8SourceMapCache)) {
            cache[pathToFileURL(fileURLToPath(fileURL)).href] = v8SourceMapCache[fileURL];
        }
        
        return cache;
    }
    /**
   * this.exclude.shouldInstrument with cache
   *
   * @private
   * @return {boolean}
   */
    _shouldInstrument(filename) {
        const cacheResult = this.shouldInstrumentCache.get(filename);
        
        if (!isUndefined(cacheResult))
            return cacheResult;
        
        const result = this.exclude.shouldInstrument(filename);
        this.shouldInstrumentCache.set(filename, result);
        
        return result;
    }
}

export const Report = (opts) => new ReportInstance(opts);
