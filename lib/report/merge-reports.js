import {resolve} from 'node:path';
import v8toIstanbul from 'v8-to-istanbul';

const isExcludedPath = (superc8) => (path) => {
    if (superc8.excludeAfterRemap)
        return !superc8._shouldInstrument(path);
};

export const mergeReports = async (v8ScriptCov, {map, superc8, resultCountPerPath}) => {
    const sources = superc8._getSourceMap(v8ScriptCov);
    const path = resolve(superc8.resolve, v8ScriptCov.url);
    const converter = v8toIstanbul(
        path,
        superc8.wrapperLength,
        sources,
        isExcludedPath(superc8),
    );

    await converter.load();

    resultCountPerPath.set(path, resultCountPerPath.get(path) + 1 || 0);

    converter.applyCoverage(v8ScriptCov.functions);
    map.merge(converter.toIstanbul());
};
