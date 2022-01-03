const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: true });

const port = 3000;
const db = require('./config/db.js');

io.on('connection', (socket) => {
    // 注册中间件
    socket.use((packet, next) => {
        if (packet.includes('login') || socket.userId) return next();
        socket.emit('logout');
    });
    socket.on('login', async ({ userLogin, password }) => {
        const sql = `SELECT userId, userName FROM users WHERE userId = ${userLogin} and password = ${password}`;
        const result = await db.dbQuery(sql);
        const userInfo = {
            code: 0,
            msg: ''
        }
        if (result.length === 1) {
            Object.assign(userInfo, {
                accessToken: socket.id,
                ...result[0]
            })
        } else {
            Object.assign(userInfo, {
                code: 1,
                msg: '用户名或密码错误'
            })
        }
        // 更新用户在线状态
        const updateSql = `UPDATE users SET online = 1 WHERE userId = ${userLogin}`
        await db.dbQuery(updateSql);
        socket.emit('login', userInfo);
        // 将userId写入socket中
        socket.userId = userInfo.userId;
        // 广播用户上线
        // 广播更新用户信息
        io.emit('userChange', { userId: userInfo.userId, online: 1 });
    });
    // 获取用户列表
    socket.on('userList', async () => {
        const sql = 'SELECT userId, userName, online FROM users';
        const result = await db.dbQuery(sql);
        socket.emit('userList', result);
    });
    // 获取最新消息
    socket.on('msgList', async ({ limit = 10, offset = 0 } = {}) => {
        const sql = `
                    SELECT
                        w.id,
                        w.content as msg,
                        w.createUserId as userId,
                        u.userName,
                        w.createTime
                    FROM water w
                    LEFT JOIN users u
                    ON u.userId = w.createUserId
                    WHERE w.id >=(SELECT id FROM water ORDER BY id DESC LIMIT 9,1)
                    ORDER BY w.id
                    LIMIT ${limit}
                    `;
        const result = await db.dbQuery(sql);
        socket.emit('msgList', result);
    })
    // 退出登录
    socket.on('logout', async () => {
        const { userId } = socket;
        // 更新用户在线状态
        const updateSql = `UPDATE users SET online = 0 WHERE userId = ${userId}`
        await db.dbQuery(updateSql);
        // 广播更新用户信息
        io.emit('userChange', { userId, online: 0 });
    })
    // 发送消息
    socket.on('sendMsg', async ({ msg }) => {
        const { userId } = socket;
        const now = new Date().getTime()
        const sql = `INSERT water(createUserId,content,createTime) VALUES(${userId},'${msg}',${now})`
        const rows = await db.dbQuery(sql);
        if (rows.affectedRows === 1) {
            // 广播新消息
            io.emit('sendMsg', { id: rows.insertId, userId, msg, createTime: now });
        } else {
            // 消息发送失败
            socket.emit('sendMsg', { code: 1, msg })
        }
    });
    // 连接断开
    socket.on('disconnect', async (reason) => {
        const { userId } = socket;
        if (!userId) { return }
        // socket.close();
        // 更新用户在线状态
        const updateSql = `UPDATE users SET online = 0 WHERE userId = ${userId}`
        await db.dbQuery(updateSql);
        // 广播更新用户信息
        io.emit('userChange', { userId, online: 0 });
    });
    // 修改用户信息
    socket.on('edit', async ({ userName, oldPwd, newPwd }) => {
        const { userId } = socket;
        // 更新用户信息
        let updateSql = `UPDATE users SET userName = '${userName}'`
        if (oldPwd && newPwd) {
            updateSql += `, password = '${newPwd}'`
        }
        updateSql += ` WHERE userId = ${userId}`
        if (oldPwd && newPwd) {
            updateSql += ` AND password = '${oldPwd}'`
        }
        const rows = await db.dbQuery(updateSql);
        if (rows.affectedRows) {
            if (oldPwd && newPwd) {
                socket.emit('logout')
            }
            // 广播更新用户信息
            io.emit('userChange', { userId, userName });
        }
    });
});

server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});