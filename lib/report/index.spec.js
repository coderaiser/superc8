import process from 'node:process';
import {test, stub} from 'supertape';
import {Report} from './index.js';

test('superc8: report: run: responsive: should call runResponsive and write to stdout', async (t) => {
    const report = Report({
        responsive: true,
        reporter: ['text'],
        tempDirectory: '/tmp',
        reportsDirectory: '/tmp',
    });

    report.getCoverageMapFromAllCoverageFiles = async () => createCoverageMap();

    const write = stub();
    await report.run({
        write,
    });

    t.ok(write.called, 'should call process.stdout.write');
    t.end();
});

test('superc8: report: run: not responsive: should use standard report path', async (t) => {
    const report = Report({
        responsive: false,
        reporter: ['text'],
        tempDirectory: '/tmp',
        reportsDirectory: '/tmp',
    });

    report._loadReports = () => [];

    await report.run();

    t.pass('should not throw');
    t.end();
});

test('superc8: report: run: responsive: should produce output with file name', async (t) => {
    const report = Report({
        responsive: true,
        reporter: ['text'],
        tempDirectory: '/tmp',
        reportsDirectory: '/tmp',
    });

    report.getCoverageMapFromAllCoverageFiles = async () => createCoverageMap();

    let output = '';
    const write = (str) => {
        output += str;
    };

    await report.run({
        write,
    });

    t.match(output, 'normal.js', 'should include file name');
    t.end();
});

test('superc8: report: _getSrc: should return src wrapped in array when string', (t) => {
    const report = Report({});
    const result = report._getSrc('src/path');

    t.deepEqual(result, ['src/path']);
    t.end();
});

test('superc8: report: _getSrc: should return src as is when array', (t) => {
    const report = Report({});

    const result = report._getSrc(['src/path']);

    t.deepEqual(result, ['src/path']);
    t.end();
});

test('superc8: report: _getSrc: should return cwd when not provided', (t) => {
    const report = Report({});
    const result = report._getSrc();

    t.deepEqual(result, [process.cwd()]);
    t.end();
});

const createCoverageMap = () => ({
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
            },
            fnMap: {},
            branchMap: {},
            s: {
                0: 1,
            },
            f: {},
            b: {},
        },
    },
});

