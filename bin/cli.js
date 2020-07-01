#!/usr/bin/env node
const pkg = require("../package.json");
const commander = require('commander');
const main = require('./www');


commander.version(pkg.version).description('一键启动mock服务')

// api操作
commander
  .description('一键启动mock服务')
  .option("--port <port>", "端口号")
  .option("--p <port>", "端口号")
  .action(function (cmd) {
    main(cmd.port || cmd.p)
  });

commander.parse(process.argv)