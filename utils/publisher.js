
const { exec } = require('child_process');

class Publisher {
    constructor() {
        this.list = [];
        this.process = null;
    }
    add(cmd, log, cb) {
        if (cmd) {
            const cmdObj = {
                cmd: cmd
            };
            if (arguments[1]) {
                if (typeof arguments[1] == "function") {
                    cmdObj.cb = arguments[1];
                }
                if (typeof arguments[1] == "string") {
                    cmdObj.log = arguments[1];
                }
            }
            if (arguments[2]) {
                cmdObj.cb = arguments[2];
            }
            this.list.push(cmdObj)
        }
    }
    next() {
        const cmdObj = this.list.shift();
        if (cmdObj.log) {
            console.log("start：", cmdObj.log);
        }
        this.process = exec(cmdObj.cmd, {
            timeout: 30000
        }, (error, stdout, stderr) => {
            console.log("结束回调");
            console.log(error)
            console.log(stdout)
            console.log(stderr)
        })
        this.process.on('exit', (code) => {
            if (code == null) {
                console.log('发布流程终止: ' + cmdObj.log);
                return
            }
            console.log("end：", cmdObj.log);

            // 触发当前命令完成回调
            if (cmdObj.cb) {
                cmdObj.cb();
            }
            // 下一步
            if (this.list.length > 0) {
                this.next();
                return;
            }
            // 全部结束
            if (this.end) {
                this.end();
            }
        });
    }
    start(log) {
        if (log) {
            console.log(log)
        }
        this.next();
    }
    complete(cb) {
        if (cb) {
            this.end = cb;
        }
    }
    kill() {
        if (this.process) {
            this.process.kill();
        }
    }
}

module.exports = Publisher;


