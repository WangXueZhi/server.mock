const xss = require('xss')
const { dbexec } = require('../db/mysql')
const moment = require('moment')
const { SuccessModel, ErrorModel } = require('../model/resModel')
const SqlQuery = require("../utils/sql");
const { columnsTransformToLine, columnsTransformToHump } = require("../utils/strUtil");

// 项目列表
const getList = async (keyword) => {
    const sql = new SqlQuery()
    const queryObject = sql.select("*")
        .from("project_list");
    // 拼接关键词
    if (keyword) {
        queryObject.where([{ key: "p_name", value: `%${keyword}%`, type: "like" }])
    }
    // 排序
    queryObject.orderBy("create_time")

    const query = queryObject.end();
    const list = await dbexec(query);
    for (let i = 0; i < list.length; i++) {
        list[i] = columnsTransformToHump(list[i]);
        list[i]["createTime"] = moment(list[i]["creatTime"]).format('YYYY-MM-DD HH:mm:ss');
    }
    return new SuccessModel(list);
}

// 项目详情
const getDetail = async (id) => {
    const sql = new SqlQuery();
    const query = sql.select("*")
        .from("project_list")
        .where({ key: "id", value: id, type: "=" })
        .end();
    const rows = await dbexec(query);
    const detail = columnsTransformToHump(rows[0]);
    detail["createTime"] = moment(detail["creatTime"]).format('YYYY-MM-DD HH:mm:ss');
    return new SuccessModel(detail);
}

// 新建项目
const newProject = async (data = {}) => {
    // 转换到下划线
    const newData = columnsTransformToLine(data);
    delete newData.id;
    newData["create_time"] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    const sql = new SqlQuery()

    // 重复项目名校验
    const queryByName = sql.select("*")
        .from("project_list")
        .where([{ key: "p_name", value: newData["p_name"], type: "=" }])
        .end();

    const resultByName = await dbexec(queryByName);
    if (resultByName.length > 0) {
        return new ErrorModel(null, "项目名已存在")
    }

    // 插入数据
    const query = sql.insert("project_list")
        .columnsWidthValues(newData)
        .end();

    const insertData = await dbexec(query);
    return new SuccessModel({
        id: insertData.insertId
    })
}

// 更新项目信息
const updateProject = async (data = {}) => {
    // 转换到下划线
    const newData = columnsTransformToLine(data);

    const sql = new SqlQuery()
    const query = sql.update("project_list")
        .set(newData)
        .where([{ key: "id", value: newData.id, type: "=" }])
        .end();

    const updateData = await dbexec(query)

    if (updateData.affectedRows > 0) {
        return new SuccessModel(null, "更新成功")
    }
    return new ErrorModel(null, "更新失败")
}

// 删除项目
const delProject = async (id) => {
    const sql = new SqlQuery()
    const query = sql.update("project_list")
        .set({
            is_delete: 1
        })
        .where([{ key: "id", value: id, type: "=" }])
        .end();

    const updateData = await dbexec(query);
    if (updateData.affectedRows > 0) {
        return new SuccessModel(null, "删除成功")
    }
    return new ErrorModel(null, "删除失败")
}

module.exports = {
    getList,
    getDetail,
    newProject,
    updateProject,
    delProject
}