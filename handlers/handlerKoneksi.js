const pengaturan = require('../config/pengaturan');
const konstanta = require('../config/konstanta');
const logger = require('../utils/logger');

module.exports = (sock) => (update) => {
try {
const { connection, lastDisconnect, qr } = update;

// Handle QR Code
if (qr) {
logger.info('QR Code tersedia untuk scanning');
logger.info(`Gunakan WhatsApp di perangkat lain untuk scan QR ini:`);
logger.info(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`);
}

// Handle koneksi terputus
if (connection === 'close') {
const apakahHarusReconnect = 
lastDisconnect?.error?.output?.statusCode !== konstanta.ALASAN_DISKONEK.KELUAR;

logger.error('Koneksi terputus:', lastDisconnect?.error);

if (apakahHarusReconnect) {
logger.info('Mencoba menghubungkan ulang dalam 5 detik...');
setTimeout(() => {
require('../index').mulaiSock();
}, 5000);
} else {
logger.warn('Koneksi logout. Harap scan QR code baru.');
}
} 

// Handle koneksi terbuka
else if (connection === 'open') {
logger.info('Berhasil terhubung ke WhatsApp');
sock.sendMessage(pengaturan.NOMOR_ADMIN, { 
text: '🤖 Bot WhatsApp sudah aktif dan siap digunakan!' 
}).catch(err => {
logger.error('Gagal mengirim notifikasi ke admin:', err);
});
}

// Handle perubahan status koneksi lainnya
else if (connection) {
logger.info(`Status koneksi berubah: ${connection}`);
}

} catch (error) {
logger.error('Error dalam handler koneksi:', error);
}
};