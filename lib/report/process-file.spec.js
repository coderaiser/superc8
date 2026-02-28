import {test, stub} from 'supertape';
import {processFile} from './process-file.js';

test('superc8: report: process-file', async (t) => {
    const readFile = stub().returns('{}');
    const _isCoverageObject = stub().returns(false);
    const superc8 = {
        tempDirectory: 'hello',
        _isCoverageObject,
    };
    
    const mergedCov = await processFile({
        file: '1.json',
        readFile,
        mergedCov: null,
        superc8,
    });
    
    t.notOk(mergedCov);
    t.end();
});
