import {run, cutEnv} from 'madrun';

const env = {
    TS_NODE_SKIP_PROJECT: true,
};

const fixtureEnv = {
    CHAI_JEST_SNAPSHOT_UPDATE_ALL: true,
};

export default {
    'lint': () => 'putout .',
    'fix:lint': () => run('lint', '--fix'),
    'test': () => `./bin/c8.js mocha --timeout=10000 ./test/*.js 'lib/**/*.spec.js'`,
    'coverage': () => [env, `./bin/c8.js --check-coverage mocha --timeout=10000 ./test/*.js 'lib/**/*.spec.js'`],
    'test:snap': () => [fixtureEnv, 'npm test'],
    'fixture': async () => [fixtureEnv, await cutEnv('test:snap')],
    'report': () => 'c8 report --reporter=lcov',
};
