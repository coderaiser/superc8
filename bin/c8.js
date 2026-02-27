#!/usr/bin/env node

import {rm, mkdir} from 'node:fs/promises';
import {foregroundChild} from 'foreground-child';
import {outputReport} from '../lib/commands/report.js';
import {
    buildYargs,
    hideInstrumenteeArgs,
    hideInstrumenterArgs,
} from '../lib/parse-args.js';

const instrumenterArgs = hideInstrumenteeArgs();
let argv = buildYargs().parse(instrumenterArgs);

async function run() {
    if ([
        'check-coverage',
        'report',
    ].includes(argv._[0])) {
        argv = buildYargs(true).parse(process.argv.slice(2));
    } else {
        if (argv.clean)
            await rm(argv.tempDirectory, {
                recursive: true,
                force: true,
            });
        
        await mkdir(argv.tempDirectory, {
            recursive: true,
        });
        process.env.NODE_V8_COVERAGE = argv.tempDirectory;
        foregroundChild(hideInstrumenterArgs(argv), async () => {
            try {
                await outputReport(argv);
                return process.exitCode;
            } catch(err) {
                console.error(err.stack);
                return 1;
            }
        });
    }
}

run().catch((err) => {
    console.error(err.stack);
    process.exitCode = 1;
});
