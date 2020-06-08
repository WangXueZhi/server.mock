
function transformDatatype(value) {
    if (typeof value == "number") {
        return value;
    }
    if (typeof value == "string") {
        return `'${value}'`;
    }
}

class SqlQuery {
    constructor(data, message) {
        this.sql = "";
        this.hasWhere = false;
    }
    select(columns) {
        this.sql = "select ";
        if (typeof columns == "string") {
            this.sql += `${columns} `;
        }
        if (Array.isArray(columns)) {
            if (columns.length < 1) {
                this.sql += "* ";
            } else {
                this.sql += columns.join(",") + " ";
            }
        }
        if (columns == undefined) {
            this.sql += "* ";
        }
        return this;
    }
    update(tableName) {
        this.sql = `update ${tableName} `;
        return this;
    }
    insert(tableName) {
        this.sql = `insert into ${tableName} `;
        return this;
    }
    from(tableName) {
        this.sql += `from ${tableName}`;
        return this;
    }
    where(datas) {
        const whereQuery = this.conditions(datas);
        this.sql += whereQuery ? " where " + whereQuery : "";
        this.hasWhere = true;
        return this;
    }
    or(datas) {
        if (this.hasWhere) {
            const whereQuery = this.conditions(datas);
            this.sql += whereQuery ? " or " + whereQuery : "";
        }
        return this;
    }
    orderBy(name, type = "desc") {
        if (name) {
            this.sql += ` order by ${name} ${type}`;
        }
        return this;
    }
    set(data) {
        let setDatas = [];
        for (let key in data) {
            setDatas.push(`${key}=${transformDatatype(data[key])}`);
        }
        this.sql += `set ${setDatas.join(", ")}`;
        return this;
    }
    columns(columns) {
        if (typeof columns == "string") {
            this.sql += `(${columns}) `;
        }
        if (Array.isArray(columns)) {
            this.sql += `(${columns.join(", ")}) `;
        }
        return this;
    }
    values(values) {
        if (typeof values == "string") {
            this.sql += `values (${values}) `;
        }
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; i++) {
                values[i] = `${transformDatatype(values[i])}`;
            }
            this.sql += `values (${values.join(", ")}) `;
        }
        return this;
    }
    columnsWidthValues(data) {
        let columns = [];
        let values = [];
        for (let key in data) {
            columns.push(key);
            values.push(`${transformDatatype(data[key])}`)
        }
        this.sql += `(${columns.join(", ")}) values (${values.join(", ")}) `;
        return this;
    }
    conditions(datas) {
        let arr = [];
        for (let i = 0; i < datas.length; i++) {
            const type = datas[i].type;
            const key = datas[i].key;
            const value = datas[i].value;
            if (type == "=") {
                arr.push(`${key}=${transformDatatype(value)}`);
            }
            if (type == "like") {
                arr.push(`${key} like ${transformDatatype(value)}`);
            }
        }
        return arr.join(" and ");
    }
    end() {
        const sql = this.sql + ";";
        this.sql = "";
        this.hasWhere = false;
        return sql;
    }
}


module.exports = SqlQuery;