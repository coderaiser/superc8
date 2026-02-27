const {checkCoverages} = require('./check-coverage');
const Report = require('../report');

module.exports.command = 'report';

module.exports.describe = 'read V8 coverage data from temp and output report';

module.exports.handler = async function(argv) {
    await module.exports.outputReport(argv);
};

module.exports.outputReport = async function(argv) {
    // TODO: this is a workaround until yargs gets upgraded to v17, see https://github.com/bcoe/c8/pull/332#discussion_r721636191
    if (argv['100']) {
        argv.checkCoverage = 100;
        argv.lines = 100;
        argv.functions = 100;
        argv.branches = 100;
        argv.statements = 100;
    }
    
    const report = Report({
        include: argv.include,
        exclude: argv.exclude,
        extension: argv.extension,
        excludeAfterRemap: argv.excludeAfterRemap,
        reporter: Array.isArray(argv.reporter) ? argv.reporter : [argv.reporter],
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
