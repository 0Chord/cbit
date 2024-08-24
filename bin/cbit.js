#!/usr/bin/env node

const { program } = require('commander');
const {init} = require('../init');
const {add} = require('../add');
const {commit} = require('../commit');
const {log} = require('../log');
const {restore} = require('../restore');
const {status} = require('../status');

program
  .version('1.0.0')
  .description('A git-like CLI tool');

program
  .command('init')
  .description('Initialize a new repository')
  .action(() => {
    init(process.cwd());
  });

program
  .command('add')
  .description('Add file(s) to the staging area')
  .action(() => {
    add(process.cwd());
  });

program
  .command('commit')
  .description('Commit staged changes')
  .action(() => {
    commit(process.cwd());
  });

program
  .command('log')
  .description('Show commit logs')
  .action(() => {
    log(process.cwd());
  });

program
  .command('restore <commitHash>')
  .description('Restore to a specific commit')
  .action((commitHash) => {
    restore(process.cwd(), commitHash);
  });

program
  .command('status')
  .description('Show the working tree status')
  .action(() => {
    status(process.cwd());
  });

program.parse(process.argv);