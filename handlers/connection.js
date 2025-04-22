// Penangan koneksi dan reconnect
const { DisconnectReason } = require('@whiskeysockets/baileys');

module.exports = function handleConnectionUpdate(sock) {
return (update) => {
try {
const { connection, lastDisconnect, qr } = update;

if (qr) {
console.log('QR Code tersedia di URL berikut:');
console.log(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`);
}

if (connection === 'close') {
const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
console.error('Bot terputus:', lastDisconnect?.error);
console.log(shouldReconnect ? 'Mencoba menghubungkan ulang...' : 'Koneksi logout. Harap scan ulang QR.');

if (shouldReconnect) {
require('../index').startSock();
}
} else if (connection === 'open') {
console.log('Bot sudah nyala.');
}
} catch (error) {
console.error('Terjadi kesalahan saat menangani pembaruan koneksi:', error.message);
}
};
};