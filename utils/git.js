
const childProcess = require('child_process');
const cmdExecSync = childProcess.execSync
const exec = require("./publisher");

class GitUtil {
    constructor(dir) {
        this.dir = dir;
    }
    // 克隆项目
    cloneText(dir, gitLink) {
        return `cd ${dir} && git clone ${gitLink}`;
    }
    // 拉取
    fetchText() {
        return `cd ${this.dir} && git fetch origin --prune --progress`
    }
    // 更新指定提交的id
    checkoutByCommitIDText(commitID) {
        const _this = this;
        let commitid = commitID || this.getLatestCommitID();
        return `cd ${this.dir} && git checkout --force --progress --detach ${commitid}`;
    }
    // 克隆项目
    clone(dir, gitLink) {
        return cmdExecSync(`cd ${dir} && git clone ${gitLink}`).toString();
    }
    // 拉取
    fetch() {
        return cmdExecSync(`cd ${this.dir} && git fetch origin --prune --progress`).toString();
    }
    // 更新指定提交的id
    checkoutByCommitID(commitID) {
        const _this = this;
        let commitid = commitID || this.getLatestCommitID();
        return cmdExecSync(`cd ${this.dir} && git checkout --force --progress --detach ${commitid}`).toString();
    }
    // 获取最新提交的id
    getLatestCommitID() {
        return cmdExecSync(`cd ${this.dir} && git show -s --pretty=format:"%H"`).toString();
    }
    // 获取包含指定提交id的分支列表，如果没传commitID，默认使用最新提交的id
    getBranchListByCommitID(commitID) {
        // git for-each-ref --sort=-committerdate refs/remotes/origin 另一种方式
        // 获取最新的commitID
        let commitid = commitID || this.getLatestCommitID();
        // 根据commitid查询对应的分支
        const branchText = cmdExecSync(`cd ${this.dir} && git branch -r --contains ${commitid}`).toString();
        const branchArr = branchText.replace(/origin\//g, "").split(/\s/).filter(function (item) {
            return !!item && item != "->" && item != "HEAD";
        });
        return [...(new Set(branchArr))];
    }
    // 获取所有分支列表
    getBranchList() {
        const branchText = cmdExecSync(`cd ${this.dir} && git branch -r`).toString();
        const branchArr = branchText.replace(/origin\//g, "").split(/\s/).filter(function (item) {
            return !!item && item != "->" && item != "HEAD";
        });
        return [...(new Set(branchArr))];
    }
    // 获取提交信息
    getCommitNotes(options = { branch: "", count: 1 }) {
        const { branch, count } = options;
        let commitLogs = [];
        if (branch && count) {
            const commitLogsText = cmdExecSync(`cd ${this.dir} && git log${count ? " -" + count : ""}${branch ? " " + branch : ""} --pretty=format:"%B"`).toString();
            commitLogs = commitLogsText.split(/\s/).filter(function (item) {
                return !!item;
            });
        }
        return commitLogs;
    }
    // 获取提交ID
    getCommitID(options = { branch: "", count: 1 }) {
        const { branch, count } = options;
        let commitLogs = [];
        if (branch && count) {
            const commitLogsText = cmdExecSync(`cd ${this.dir} && git log${count ? " -" + count : ""}${branch ? " " + branch : ""} --pretty=format:"%H"`).toString();
            commitLogs = commitLogsText.split(/\s/).filter(function (item) {
                return !!item;
            });
        }
        return commitLogs;
    }
}


module.exports = GitUtil;