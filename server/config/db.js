// 引入数据库
const mysql = require("mysql");
// 数据库连接配置
const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "user",
    password: "password",
    database: "loaf-online"
});
//对数据库进行增删改查操作的基础
function query(sql, callback) {
    pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, rows) {
            callback && callback(err, rows)
            connection.release()
        })
    })
};

const dbQuery = (sql) => {
    return new Promise((resolve, reject) => {
        query(sql, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        })
    })
};

exports.query = query;
exports.dbQuery = dbQuery;