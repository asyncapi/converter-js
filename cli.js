#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const program = require('commander');
const packageInfo = require('./package.json');
const converter = require('./lib');

const red = text => `\x1b[31m${text}\x1b[0m`;

let asyncapiFile;
let version;

const showErrorAndExit = err => {
  console.error(red('Something went wrong:'));
  console.error(red(err.stack || err.message));
  process.exit(1);
};

program
  .version(packageInfo.version)
  .arguments('<document> [version]')
  .action((asyncAPIPath, v) => {
    asyncapiFile = path.resolve(asyncAPIPath);
    version = v;
  })
  .option('--id <id>', 'application id (defaults to a generated one)')
  .parse(process.argv);

if (!asyncapiFile) {
  console.error(red('> Path to AsyncAPI file not provided.'));
  program.help(); // This exits the process
}
if (!version) {
  version = '2.2.0';
}

try {
  const asyncapi = fs.readFileSync(asyncapiFile, 'utf-8');
  console.log(converter.convert(asyncapi, version, {
    id: program.id,
  }));
} catch (e) {
  showErrorAndExit(e);
}

process.on('unhandledRejection', showErrorAndExit);
