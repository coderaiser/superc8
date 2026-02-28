import {relative} from 'node:path';
import process from 'node:process';
import {Report} from '../report.js';

const {isArray} = Array;
const consoleError = console.error;

export const command = 'check-coverage';

export const describe = 'check whether coverage is within thresholds provided';

export const builder = function(yargs) {
    yargs.example('$0 check-coverage --lines 95', `check whether the JSON in c8's output folder meets the thresholds provided`);
};

export const handler = function(argv) {
    if (argv['100']) {
        argv.lines = 100;
        argv.functions = 100;
        argv.branches = 100;
        argv.statements = 100;
    }
    
    const report = Report({
        include: argv.include,
        exclude: argv.exclude,
        extension: argv.extension,
        reporter: [argv.reporter],
        reportsDirectory: argv['reports-dir'],
        tempDirectory: argv.tempDirectory,
        watermarks: argv.watermarks,
        resolve: argv.resolve,
        omitRelative: argv.omitRelative,
        wrapperLength: argv.wrapperLength,
        all: argv.all,
    });
    
    checkCoverages(argv, report);
};

export const checkCoverages = async function(argv, report) {
    const thresholds = {
        lines: argv.lines,
        functions: argv.functions,
        branches: argv.branches,
        statements: argv.statements,
    };
    
    const map = await report.getCoverageMapFromAllCoverageFiles();
    
    if (argv.perFile) {
        for (const file of map.files()) {
            checkCoverage(
                map
                    .fileCoverageFor(file)
                    .toSummary(),
                thresholds,
                file,
            );
        }
        
        return;
    }
    
    checkCoverage(map.getCoverageSummary(), thresholds);
};

function checkCoverage(summary, thresholds, file) {
    for (const key of Object.keys(thresholds)) {
        const coverage = summary[key].pct;
        
        if (coverage < thresholds[key]) {
            process.exitCode = 1;
            
            if (file) {
                // standardize path for Windows.
                consoleError('ERROR: Coverage for ' + key + ' (' + coverage + '%) does not meet threshold (' + thresholds[key] + '%) for ' + relative('./', file).replace(/\\/g, '/'));
            } else {
                consoleError('ERROR: Coverage for ' + key + ' (' + coverage + '%) does not meet global threshold (' + thresholds[key] + '%)');
            }
        }
    }
}
