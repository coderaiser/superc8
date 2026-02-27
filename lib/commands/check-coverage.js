const {relative} = require('path');
const Report = require('../report');

module.exports.command = 'check-coverage';

module.exports.describe = 'check whether coverage is within thresholds provided';

module.exports.builder = function(yargs) {
    yargs.example('$0 check-coverage --lines 95', `check whether the JSON in c8's output folder meets the thresholds provided`);
};

module.exports.handler = function(argv) {
    // TODO: this is a workaround until yargs gets upgraded to v17, see https://github.com/bcoe/c8/pull/332#discussion_r721636191
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
        reporter: Array.isArray(argv.reporter) ? argv.reporter : [argv.reporter],
        reportsDirectory: argv['reports-dir'],
        tempDirectory: argv.tempDirectory,
        watermarks: argv.watermarks,
        resolve: argv.resolve,
        omitRelative: argv.omitRelative,
        wrapperLength: argv.wrapperLength,
        all: argv.all,
    });
    
    module.exports.checkCoverages(argv, report);
};

module.exports.checkCoverages = async function(argv, report) {
    const thresholds = {
        lines: argv.lines,
        functions: argv.functions,
        branches: argv.branches,
        statements: argv.statements,
    };
    
    const map = await report.getCoverageMapFromAllCoverageFiles();
    
    if (argv.perFile)
        for (const file of map.files()) {
            checkCoverage(
                map
                    .fileCoverageFor(file)
                    .toSummary(),
                thresholds,
                file,
            );
        }
    
    else
        checkCoverage(map.getCoverageSummary(), thresholds);
};

function checkCoverage(summary, thresholds, file) {
    for (const key of Object.keys(thresholds)) {
        const coverage = summary[key].pct;
        
        if (coverage < thresholds[key]) {
            process.exitCode = 1;
            
            if (file) {
                // standardize path for Windows.
                console.error('ERROR: Coverage for ' + key + ' (' + coverage + '%) does not meet threshold (' + thresholds[key] + '%) for ' + relative('./', file).replace(/\\/g, '/'));
            } else {
                console.error('ERROR: Coverage for ' + key + ' (' + coverage + '%) does not meet global threshold (' + thresholds[key] + '%)');
            }
        }
    }
}
