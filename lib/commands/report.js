import process from 'node:process';
import {checkCoverages} from './check-coverage.js';
import {Report} from '../report.js';

const {isArray} = Array;
const maybeArray = (a) => isArray(a) ? a : [a];

export const command = 'report';

export const describe = 'read V8 coverage data from temp and output report';

export const handler = async function(argv) {
    await outputReport(argv);
};

export const outputReport = async function(argv) {
    const report = Report({
        include: argv.include,
        exclude: argv.exclude,
        extension: argv.extension,
        excludeAfterRemap: argv.excludeAfterRemap,
        reporter: maybeArray(argv.reporter),
        reportsDirectory: argv['reports-dir'],
        reporterOptions: argv.reporterOptions || {},
        tempDirectory: argv.tempDirectory,
        watermarks: argv.watermarks,
        resolve: argv.resolve,
        omitRelative: argv.omitRelative,
        wrapperLength: argv.wrapperLength,
        all: argv.all,
        allowExternal: argv.allowExternal,
        src: argv.src,
        skipFull: argv.skipFull,
        excludeNodeModules: argv.excludeNodeModules,
        mergeAsync: argv.mergeAsync,
        monocartArgv: argv.experimentalMonocart || process.env.EXPERIMENTAL_MONOCART ? argv : null,
    });
    
    await report.run();
    
    if (argv.checkCoverage)
        await checkCoverages(argv, report);
};
