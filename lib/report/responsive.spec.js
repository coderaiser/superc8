import {test} from 'supertape';
import {fromIstanbul} from '@escover/converter-istanbul';
import responsiveFormatter from '@escover/formatter-responsive';

test('superc8: report: responsive: fromIstanbul: length', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const result = fromIstanbul(coverageMap);
    
    t.equal(result.length, 1);
    t.end();
});

test('superc8: report: responsive: fromIstanbul: name', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const result = fromIstanbul(coverageMap);
    
    t.equal(result[0].name, 'test/fixtures/normal.js');
    t.end();
});

test('superc8: report: responsive: fromIstanbul: lines', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const result = fromIstanbul(coverageMap);
    
    t.deepEqual(result[0].lines, {
        1: 1,
        3: 0,
    });
    t.end();
});

test('superc8: report: responsive: formatter returns string', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: false,
    });
    
    t.equal(typeof output, 'string');
    t.end();
});

test('superc8: report: responsive: formatter shows file name', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: false,
    });
    
    t.match(output, 'normal.js');
    t.end();
});

test('superc8: report: responsive: formatter shows percent', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: false,
    });
    
    t.match(output, '50%');
    t.end();
});

test('superc8: report: responsive: formatter shows uncovered lines', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/normal.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 3,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: false,
    });
    
    t.match(output, '3');
    t.end();
});

test('superc8: report: responsive: skipFull hides 100% files', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/full.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }],
    }, {
        path: 'test/fixtures/partial.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 2,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: true,
    });
    
    t.notOk(output.includes('full.js'));
    t.end();
});

test('superc8: report: responsive: skipFull shows partial files', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/full.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }],
    }, {
        path: 'test/fixtures/partial.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }, {
            id: 1,
            line: 2,
            count: 0,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: true,
    });
    
    t.match(output, 'partial.js');
    t.end();
});

test('superc8: report: responsive: skipFull all covered shows message', (t) => {
    const coverageMap = createCoverageMap([{
        path: 'test/fixtures/all.js',
        lines: [{
            id: 0,
            line: 1,
            count: 1,
        }],
    }]);
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: true,
    });
    
    t.match(output, '100%');
    t.end();
});

test('superc8: report: responsive: works with CoverageMap toJSON', async (t) => {
    const libCoverage = await import('istanbul-lib-coverage');
    const map = libCoverage.default.createCoverageMap();
    
    map.addFileCoverage({
        path: 'test/fixtures/normal.js',
        statementMap: {
            0: {
                start: {
                    line: 1,
                    column: 0,
                },
                end: {
                    line: 1,
                    column: 10,
                },
            },
            1: {
                start: {
                    line: 3,
                    column: 0,
                },
                end: {
                    line: 3,
                    column: 10,
                },
            },
        },
        fnMap: {},
        branchMap: {},
        s: {
            0: 1,
            1: 0,
        },
        f: {},
        b: {},
    });
    
    const data = fromIstanbul(map.toJSON());
    
    t.equal(data.length, 1);
    t.end();
});

function createCoverageMap(files) {
    const map = {};
    
    for (const {path: filePath, lines} of files) {
        const statementMap = {};
        const s = {};
        
        for (const {id, line, count} of lines) {
            statementMap[id] = {
                start: {
                    line,
                    column: 0,
                },
                end: {
                    line,
                    column: 10,
                },
            };
            s[id] = count;
        }
        
        map[filePath] = {
            path: filePath,
            statementMap,
            s,
            fnMap: {},
            branchMap: {},
            f: {},
            b: {},
        };
    }
    
    return map;
}
