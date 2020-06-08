const { dbexec } = require('../db/mysql');
const SqlQuery = require("../utils/sql");
const GitUtil = require("../utils/git");
const moment = require('moment')
const { columnsTransformToLine, columnsTransformToHump } = require("../utils/strUtil");
const publishConfig = require("../conf/publish");
const childProcess = require('child_process');
const { SuccessModel, ErrorModel } = require('../model/resModel')
const cmdExecSync = childProcess.execSync;
const Publisher = require("../utils/publisher");
const fs = require("fs");
const path = require("path");

// 项目git状态枚举
const PROJECT_GIT_STATE = {
    NO_DIR: "NO_DIR",
    NO_GIT: "NO_GIT",
    HAS_GIT: "HAS_GIT"
}

// 发布流程枚举
const PUBLISH_STEP = {
    UPDATE: "update",
    BUILD: "build",
    PUBLISH: "publish"
}

// 命令行子进程
const cmdChildProcess = {}

// 新发布
const newPublish = async (data = { pid: "", branch: "" }) => {
    const newData = data;
    newData["last_time"] = newData["create_time"] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    const sql = new SqlQuery()

    // 设置spid
    const queryByID = sql.select("MAX(spid) AS spid")
        .from("publish_records")
        .where([{ key: "pid", value: data.pid, type: "=" }])
        .end();
    const rowData = await dbexec(queryByID);
    if (rowData[0].spid) {
        newData["spid"] = rowData[0].spid + 1;
    } else {
        newData["spid"] = 1
    }

    // 获取提交信息
    const { projectDir, projectDetail, gitState } = await checkProjectGitState(data.pid);
    // 更新和构建操作
    const git = new GitUtil(projectDir);

    // 已存在git文件，检查分支是否存在
    if (gitState == PROJECT_GIT_STATE.HAS_GIT) {
        const branchList = git.getBranchList();
        const hasThisBranch = branchList.includes(data.branch);
        if (!hasThisBranch) {
            newData.branch = "master";
        }
    }

    // 获取并设置提交日志
    const commit_log = git.getCommitNotes({
        branch: newData.branch,
        count: 1
    })[0]
    newData["commit_log"] = commit_log;

    // 插入数据
    const insertQuery = sql.insert("publish_records")
        .columnsWidthValues(newData)
        .end();
    const insertData = await dbexec(insertQuery);

    // 开始更新项目
    startPublish(git, gitState, projectDetail, insertData.insertId, newData.branch || "")

    return new SuccessModel({
        id: insertData.insertId
    })
}

// 重新发布
const rePublish = async (publishId) => {
    const sql = new SqlQuery()

    // 获取发布信息
    const queryByID = sql.select("*")
        .from("publish_records")
        .where([{ key: "id", value: publishId, type: "=" }])
        .end();
    const rowData = await dbexec(queryByID);
    const publishInfo = rowData[0];

    // 设置发布信息
    const newData = {};
    newData["last_time"] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    newData["is_cancle"] = 0;
    newData["is_complete"] = 0
    newData["is_error"] = 0

    // 更新发布信息
    const updateByID = sql.update("publish_records")
        .set(newData)
        .where([{ key: "id", value: publishId, type: "=" }])
        .end();
    await dbexec(updateByID);

    // 获取提交信息
    const { projectDir, projectDetail, gitState } = await checkProjectGitState(publishInfo.pid);
    // 更新和构建操作
    const git = new GitUtil(projectDir);

    // 开始发布
    startPublish(git, gitState, projectDetail, publishId, publishInfo.branch || "")

    return new SuccessModel({
        id: publishId
    })
}

// 终止发布
const stopPublish = async (publishId) => {
    const sql = new SqlQuery()
    const query = sql.update("publish_records")
        .set({ is_cancle: 1 })
        .where([{ key: "id", value: publishId, type: "=" }])
        .end();

    const updateData = await dbexec(query);
    if (updateData.affectedRows > 0) {
        console.log("updateData.affectedRows", updateData.affectedRows)
        console.log(publishId)
        // 退出子进程
        cmdChildProcess[publishId].kill();
        return new SuccessModel(null, "发布已终止");
    }
    return new ErrorModel(null, "发布未终止")

}

// 查询发布列表
const publishList = async (publishId) => {
    const sql = new SqlQuery()
    const query = sql.select("*")
        .from("publish_records")
        .end();

    const list = await dbexec(query);
    for (let i = 0; i < list.length; i++) {
        list[i] = columnsTransformToHump(list[i]);
    }

    return new SuccessModel(list);
}

// 查询某条记录的发布详情
const publishDetail = async (publishId) => {
    const sql = new SqlQuery()
    const query = sql.select("*")
        .from("publish_records")
        .where([{ key: "id", value: publishId, type: "=" }])
        .end();

    const list = await dbexec(query);
    const detail = columnsTransformToHump(list[0]);
    return new SuccessModel(detail);
}

// 更新或克隆项目
const startPublish = async (git, gitState, projectDetail, publishId, branch) => {
    const projectDir = path.resolve(`${publishConfig.frontAssetsDir}${projectDetail.pName}`);
    const sql = new SqlQuery();
    const publisher = new Publisher();
    cmdChildProcess[publishId] = publisher;
    // 没目录，重新克隆
    if (gitState == PROJECT_GIT_STATE.NO_DIR) {
        const frontAssetsDir = path.resolve(publishConfig.frontAssetsDir);
        publisher.add(git.cloneText(frontAssetsDir, projectDetail.gitLink), "克隆项目");
    }

    // 有目录没有git文件，删除目录后重新克隆
    if (gitState == PROJECT_GIT_STATE.NO_GIT) {
        const frontAssetsDir = path.resolve(publishConfig.frontAssetsDir);
        const projectDir = path.resolve(`${publishConfig.frontAssetsDir}${projectDetail.pName}`);
        cmdExecSync(`rm -rf ${projectDir}`);
        publisher.add(git.cloneText(frontAssetsDir, projectDetail.gitLink), "克隆项目");
    }

    // 已存在git文件，直接更新
    if (gitState == PROJECT_GIT_STATE.HAS_GIT) {
        const commitID = git.getCommitID({
            branch: branch,
            count: 1
        })[0]
        // 保存命令行子进程
        publisher.add(git.fetchText(), "fetch");
        publisher.add(git.checkoutByCommitIDText(commitID), "checkout分支");
    }
    if (projectDetail.installScript) {
        // 安装npm
        publisher.add(`cd ${projectDir} && ${projectDetail.installScript}`, "安装npm", function () {
            const query = sql.update("publish_records")
                .set({ step: PUBLISH_STEP.UPDATE })
                .where([{ key: "id", value: publishId, type: "=" }])
                .end();
            dbexec(query);
        });
    }
    if (projectDetail.buildScript) {
        // 构建
        publisher.add(`cd ${projectDir} && ${projectDetail.buildScript}`, "构建", function () {
            const query = sql.update("publish_records")
                .set({ step: PUBLISH_STEP.BUILD })
                .where([{ key: "id", value: publishId, type: "=" }])
                .end();
            dbexec(query);
        });
    }
    publisher.start("开始发布");
    publisher.complete(function () {
        // 构建结束
        console.log("发布结束")
        publishComplete(publishId);
    });
}

// 发布结束
const publishComplete = async (publishId) => {
    const sql = new SqlQuery()
    const query = sql.update("publish_records")
        .set({ is_complete: 1, is_cancle: 0 })
        .where([{ key: "id", value: publishId, type: "=" }])
        .end();
    await dbexec(query);
}

// 查询项目分支列表
const getBranchList = async (projectId) => {
    const { projectDir, gitState } = await checkProjectGitState(projectId);
    var branchs = [];
    if (gitState == PROJECT_GIT_STATE.NO_DIR) {
        // 没有目录，需要克隆项目，分支为master
        branchs.push("master");
    }
    if (gitState == PROJECT_GIT_STATE.NO_GIT) {
        // 没有目录，需要清空目录，然后克隆项目，分支为master
        branchs.push("master");
    }
    if (gitState == PROJECT_GIT_STATE.HAS_GIT) {
        // 获取包含最新提交信息的分支列表
        const git = new GitUtil(projectDir);
        const commitID = git.getLatestCommitID();
        branchs = git.getBranchListByCommitID(commitID);

        // 获取所有分支列表
        const originAllBranchArr = git.getBranchList();
        branchs = branchs.concat(...originAllBranchArr);
    }

    return new SuccessModel([...(new Set(branchs))]);
}

/**
 * 检查项目的git状态
 * @param {*} projectId 项目id
 * @returns
 * {
 *      projectDir
 *      gitState
 * }
 */
const checkProjectGitState = async (projectId) => {
    const sql = new SqlQuery();

    // 查询项目信息
    const queryByID = sql.select("*")
        .from("project_list")
        .where([{ key: "id", value: projectId, type: "=" }])
        .end();

    const list = await dbexec(queryByID);
    const projectDetail = columnsTransformToHump(list[0]);
    const projectDir = path.resolve(`${publishConfig.frontAssetsDir}${projectDetail.pName}`);


    // 项目目录是否存在
    let gitState = PROJECT_GIT_STATE.NO_DIR;
    const projectExists = fs.existsSync(projectDir);
    if (!!projectExists) {
        // .git目录是否存在
        const gitExists = fs.existsSync(path.join(projectDir, ".git"));
        if (gitExists) {
            gitState = PROJECT_GIT_STATE.HAS_GIT;
        } else {
            gitState = PROJECT_GIT_STATE.NO_GIT;
        }
    }

    return {
        projectDir,
        gitState,
        projectDetail
    }
}

module.exports = {
    newPublish,
    rePublish,
    stopPublish,
    getBranchList,
    publishList,
    publishDetail
}