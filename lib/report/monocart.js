import process from 'node:process';
import {tryToCatch} from 'try-to-catch';

const consoleError = console.error;

export async function importMonocart() {
    return await import('monocart-coverage-reports');
}

export async function getMonocart(superc8) {
    const [error, MCR] = await tryToCatch(superc8.importMonocart);
    
    if (error) {
        consoleError('--experimental-monocart requires the plugin monocart-coverage-reports. Run: "npm i monocart-coverage-reports@2 --save-dev"');
        process.exit(1);
    }
    
    return MCR;
}
