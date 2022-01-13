#! /usr/bin/env node

const util = require('util');
const chalk = require('chalk-next');
const yargs = require('yargs');
const figlet = util.promisify(require('figlet'));
const path = require('path');
const { cwd } = require('process');

const App = require('./app');

async function run(options) {
    const logo = await figlet('md-docs-cli');
    console.log(chalk.blueBright(logo));

    options.src = path.resolve(cwd(), `docs`)
    options.dst = path.resolve(cwd(), `dist`);
    options.testExecutionLocation = path.resolve(cwd(), `.temp/executions`);

    const app = new App(options);    
    await app.run();
}

const options = yargs
    .usage("Usage: -b")
    .option("b", { alias: "branches", describe: "Output banches only", type: "boolean", demandOption: false })
    .argv;

run(options);