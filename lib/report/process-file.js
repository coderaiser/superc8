import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

export async function processFile(options) {
    const {
        file,
        fileIndex,
        mergedCov,
        superc8,
        mergeProcessCovs,
    } = options;
    const rawFile = await readFile(resolve(superc8.tempDirectory, file), 'utf8');

    let report = JSON.parse(rawFile);

    if (superc8._isCoverageObject(report)) {
        if (report['source-map-cache'])
            Object.assign(superc8.sourceMapCache, superc8._normalizeSourceMapCache(report['source-map-cache']));

        report = superc8._normalizeProcessCov(report, fileIndex);

        if (mergedCov)
            return mergeProcessCovs([mergedCov, report]);

        return mergeProcessCovs([report]);
    }

    return mergedCov;
}
