import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';

const {parse} = JSON;

export const readReport = ({file, tempDirectory}) => {
    const resolved = resolve(tempDirectory, file);
    return parse(readFileSync(resolved, 'utf8'));
};
