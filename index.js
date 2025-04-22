const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { inisialisasiPenyimpanan } = require('./services/penyimpanan');
const handlerPesan = require('./handlers/handlerPesan');
const handlerKoneksi = require('./handlers/handlerKoneksi');
const pengaturan = require('./config/pengaturan');
const logger = require('./utils/logger');

async function mulaiSock() {
logger.info('Memulai bot WhatsApp...');
inisialisasiPenyimpanan();

try {
const { state, saveCreds } = await useMultiFileAuthState('./auth');
const { version } = await fetchLatestBaileysVersion();
logger.info(`Menggunakan versi Baileys: ${version}`);

const sock = makeWASocket({
version,
auth: state,
printQRInTerminal: true,
logger: logger.child({ module: 'baileys' })
});

// Penangan event
sock.ev.on('creds.update', saveCreds);
sock.ev.on('messages.upsert', handlerPesan(sock));
sock.ev.on('connection.update', handlerKoneksi(sock));

} catch (error) {
logger.error('Error memulai bot:', error);
logger.info('Menghubungkan ulang dalam 60 detik...');
setTimeout(mulaiSock, 60000);
}
}

mulaiSock();