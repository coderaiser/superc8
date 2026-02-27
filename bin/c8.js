#!/usr/bin/env node

import {rm, mkdir} from 'node:fs/promises';
import process from 'node:process';
import {foregroundChild} from 'foreground-child';
import {tryToCatch} from 'try-to-catch';
import {outputReport} from '../lib/commands/report.js';
import {
    buildYargs,
    hideInstrumenteeArgs,
    hideInstrumenterArgs,
} from '../lib/parse-args.js';

const instrumenterArgs = hideInstrumenteeArgs();
let argv = buildYargs().parse(instrumenterArgs);

const [error] = await tryToCatch(run);

if (error) {
    console.error(error.stack);
    process.exitCode = 1;
}

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
