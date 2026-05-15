import {test} from 'supertape';
import {fromIstanbul} from '@escover/converter-istanbul';
import responsiveFormatter from '@escover/formatter-responsive';

test('superc8: report: length', (t) => {
    const coverageMap = {
        data: {
            'test/fixtures/normal.js': {
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
                s: {
                    0: 1,
                    1: 0,
                },
                fnMap: {},
                branchMap: {},
                f: {},
                b: {},
            },
        },
    };
    
    const result = fromIstanbul(coverageMap);
    
    t.equal(result.length, 1);
    t.end();
});

test('superc8: report: name', (t) => {
    const coverageMap = {
        data: {
            'test/fixtures/normal.js': {
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
                s: {
                    0: 1,
                    1: 0,
                },
                fnMap: {},
                branchMap: {},
                f: {},
                b: {},
            },
        },
    };
    
    const result = fromIstanbul(coverageMap);
    
    t.equal(result[0].name, 'test/fixtures/normal.js');
    t.end();
});

test('superc8: report: lines', (t) => {
    const coverageMap = {
        data: {
            'test/fixtures/normal.js': {
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
                s: {
                    0: 1,
                    1: 0,
                },
                fnMap: {},
                branchMap: {},
                f: {},
                b: {},
            },
        },
    };
    
    const result = fromIstanbul(coverageMap);
    
    t.deepEqual(result[0].lines, {
        1: 1,
        3: 0,
    });
    t.end();
});

test('superc8: report: formatter shows file name', (t) => {
    const coverageMap = {
        data: {
            'test/fixtures/normal.js': {
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
                s: {
                    0: 1,
                    1: 0,
                },
                fnMap: {},
                branchMap: {},
                f: {},
                b: {},
            },
        },
    };
    
    const data = fromIstanbul(coverageMap);
    
    const output = responsiveFormatter(data, {
        skipFull: false,
    });
    
    t.match(output, 'normal.js');
    t.end();
});

test('superc8: report: formatter shows percent', (t) => {
    const coverageMap = {
        data: {
            'test/fixtures/normal.js': {
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
                s: {
                    0: 1,
                    1: 0,
                },
                fnMap: {},
                branchMap: {},
                f: {},
                b: {},
            },
        },
    };
    
    const output = responsiveFormatter(fromIstanbul(coverageMap), {
        skipFull: false,
    });
    
    t.match(output, '50%');
    t.end();
});
