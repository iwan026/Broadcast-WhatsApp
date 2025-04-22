const { DisconnectReason } = require('@whiskeysockets/baileys');

module.exports = function createConnectionHandler(reconnectFn) {
return (update) => {
try {
const { connection, lastDisconnect, qr } = update;

if (qr) {
console.log('Scan QR berikut:');
require('qrcode-terminal').generate(qr, { small: true });
}

if (connection === 'close') {
const statusCode = lastDisconnect?.error?.output?.statusCode;
const isLoggedOut = statusCode === DisconnectReason.loggedOut;

console.error(`Koneksi terputus:`, lastDisconnect?.error?.message || 'Unknown error');

if (!isLoggedOut && reconnectFn) {
console.log('Mencoba reconnect...');
setTimeout(reconnectFn, 3000);
}
}
} catch (error) {
console.error('Error di connection handler:', error);
}
};
};