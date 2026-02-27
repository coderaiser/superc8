'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    'test': () => 'cross-env TS_NODE_SKIP_PROJECT=true node ./bin/c8.js mocha --timeout=10000 ./test/*.js',
    'coverage': () => 'cross-env TS_NODE_SKIP_PROJECT=true node ./bin/c8.js --check-coverage mocha --timeout=10000 ./test/*.js',
    'test:snap': () => 'cross-env CHAI_JEST_SNAPSHOT_UPDATE_ALL=true npm test',
    'fix': () => 'standard --fix',
    'posttest': () => 'standard',
};
