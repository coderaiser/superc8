/* global describe, it */
import assert from 'node:assert';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import getSourceMapFromFile from '../lib/source-map-from-file.js';

const resolveConfig = (a) => fileURLToPath(import.meta.resolve(a));

describe('source-map-from-file', () => {
    it('should parse source maps from compiled targets', () => {
        const sourceMap = getSourceMapFromFile('./test/fixtures/all/ts-compiled/main.js');
        const expected = JSON.parse(readFileSync(resolveConfig('./fixtures/all/ts-compiled/main.js.map'), 'utf8'));
        
        assert.deepStrictEqual(sourceMap, expected);
    });
    it('should handle extra whitespace characters', () => {
        const sourceMap = getSourceMapFromFile('./test/fixtures/source-maps/padded.js');
        
        assert.deepStrictEqual(sourceMap, {
            version: 3,
        });
    });
    it('should support base64 encoded inline source maps', () => {
        const sourceMap = getSourceMapFromFile('./test/fixtures/source-maps/inline.js');
        assert.strictEqual(sourceMap.version, 3);
    });
});
