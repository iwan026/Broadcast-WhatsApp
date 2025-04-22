// File utama untuk menjalankan bot
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const handleMessages = require('./handlers/messages');
const handleConnectionUpdate = require('./handlers/connection');

async function startSock() {
console.log('Memulai bot...');
try {
const { state, saveCreds } = await useMultiFileAuthState('./auth');
const { version } = await fetchLatestBaileysVersion();
console.log('Versi Baileys:', version);

const sock = makeWASocket({
version,
auth: state,
printQRInTerminal: true,
logger: pino({ level: 'silent' }),
});

sock.ev.on('creds.update', saveCreds);
sock.ev.on('messages.upsert', handleMessages(sock));
sock.ev.on('connection.update', handleConnectionUpdate(sock));

} catch (error) {
console.error('Terjadi kesalahan saat memulai bot:', error.message);
console.log('Mencoba menghubungkan ulang dalam 60 detik...');
setTimeout(startSock, 60000);
}
}

// Export untuk bisa digunakan oleh handler koneksi
module.exports = {
startSock
};

startSock();