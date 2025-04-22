const pengaturan = require('../config/pengaturan');
const logger = require('../utils/logger');
const fs = require('fs');

module.exports = {
broadcastTeks: async (sock, pesanTeks, idGrup, daftarGrup) => {
logger.info('Memulai broadcast teks');

for (const grupId of idGrup) {
try {
if (daftarGrup[grupId].announce) {
logger.warn(`Melewati grup announcement-only: ${grupId}`);
continue;
}

await sock.sendMessage(grupId, { 
text: pesanTeks,
contextInfo: {
isFromStatus: true,
forwardingScore: 69,
isForwarded: true,
externalAdReply: {
title: "Yuipedia VPN",
body: "Anti Jomok",
thumbnailUrl: "https://i.ibb.co.com/Z1Lqr76G/ssstik-io-1738140168050.jpg",
mediaUrl: "https://yuivpn.com",
mediaType: 1,
sourceUrl: "https://yuivpn.com"
}
}
});

logger.info(`Pesan terkirim ke grup: ${grupId}`);
await new Promise(resolve => setTimeout(resolve, pengaturan.JEDA_BROADCAST));
} catch (error) {
logger.error(`Gagal kirim ke grup ${grupId}:`, error.message);
}
}
},

broadcastGambar: async (sock, pesan, idGrup, daftarGrup) => {
logger.info('Memulai broadcast gambar');
const caption = pesan.message.imageMessage.caption || '';
const mediaBuffer = await downloadMediaMessage(pesan, 'buffer', { logger: sock.logger });

if (!mediaBuffer) {
throw new Error('Gagal mengunduh media');
}

try {
fs.writeFileSync(pengaturan.PATH_GAMBAR_SEMENTARA, mediaBuffer);

for (const grupId of idGrup) {
try {
if (daftarGrup[grupId].announce) {
logger.warn(`Melewati grup announcement-only: ${grupId}`);
continue;
}

await sock.sendMessage(grupId, { 
image: { url: pengaturan.PATH_GAMBAR_SEMENTARA }, 
caption 
});
logger.info(`Gambar terkirim ke grup: ${grupId}`);
} catch (error) {
logger.error(`Gagal kirim gambar ke grup ${grupId}:`, error.message);
}
}
} finally {
if (fs.existsSync(pengaturan.PATH_GAMBAR_SEMENTARA)) {
fs.unlinkSync(pengaturan.PATH_GAMBAR_SEMENTARA);
}
}
}
};