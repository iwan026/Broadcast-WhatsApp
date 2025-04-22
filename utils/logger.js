const pino = require('pino');

module.exports = pino({
level: process.env.LOG_LEVEL || 'info',
transport: {
target: 'pino-pretty',
options: {
colorize: true,
translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
ignore: 'pid,hostname'
}
}
});