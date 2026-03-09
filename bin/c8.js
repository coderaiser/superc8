#!/usr/bin/env node

import {rm, mkdir} from 'node:fs/promises';
import process from 'node:process';
import {execa} from 'execa';
import {tryToCatch} from 'try-to-catch';
import {outputReport} from '#commands/report';
import {
    buildYargs,
    hideInstrumenteeArgs,
    hideInstrumenterArgs,
} from '../lib/parse-args.js';

const instrumenterArgs = hideInstrumenteeArgs();
let argv = buildYargs().parse(instrumenterArgs);

process.exitCode = await run();

async function run() {
    const is = [
        'check-coverage',
        'report',
    ].includes(argv._[0]);

    if (is) {
        argv = buildYargs(true).parse(process.argv.slice(2));
        return;
    }

    if (argv.clean)
        await rm(argv.tempDirectory, {
            recursive: true,
            force: true,
        });

    await mkdir(argv.tempDirectory, {
        recursive: true,
    });

    process.env.NODE_V8_COVERAGE = argv.tempDirectory;

    const [cmd, ...args] = hideInstrumenterArgs(argv);

    const [cmdError] = await tryToCatch(execa, cmd, args, {
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
    });

    if (cmdError)
        return cmdError.exitCode;

    const [error] = await tryToCatch(outputReport, argv);

    if (error) {
        console.error(error.stack);
        return 1;
    }

    return process.exitCode;
}
