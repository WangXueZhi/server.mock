const env = process.env.NODE_ENV  // 环境参数

// 配置
let CONF

if (env === 'dev') {
    CONF = {
        frontAssetsDir: "/Applications/MAMP/htdocs/github/web/"
    }
}

if (env === 'production') {
    CONF = {
        frontAssetsDir: "/Applications/MAMP/htdocs/github/web/"
    }
}

module.exports = CONF