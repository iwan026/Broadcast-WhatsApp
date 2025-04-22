const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// Random delay
function getRandomDelay() {
return Math.floor(
Math.random() * (config.BROADCAST_DELAY_RANGE.MAX - config.BROADCAST_DELAY_RANGE.MIN + 1)
) + config.BROADCAST_DELAY_RANGE.MIN;
}

// Bersihkan file temporary
function cleanupTempFile(filePath) {
try {
if (fs.existsSync(filePath)) {
fs.unlinkSync(filePath);
}
} catch (error) {
console.error('Gagal membersihkan file temporary:', error.message);
}
}

async function broadcastImage(sock, message, groupIds, groups) {
let tempFilePath = config.TEMP_IMAGE_PATH;

try {
const caption = message.message.imageMessage.caption || '';
console.log('Mempersiapkan broadcast gambar dengan caption:', caption);

const mediaBuffer = await downloadMediaMessage(message, 'buffer', { logger: sock.logger });
if (!mediaBuffer) {
throw new Error('Gagal mengunduh media gambar');
}

// Tulis ke file temporary
fs.writeFileSync(tempFilePath, mediaBuffer);
console.log('Gambar temporary disimpan:', tempFilePath);

// Proses broadcast ke setiap grup
for (const groupId of groupIds) {
try {
const groupMetadata = groups[groupId];

// Validasi grup
if (groupMetadata.announce) {
console.log(`[Skip] Grup ${groupId} hanya mengizinkan admin untuk mengirim pesan.`);
continue;
}

// Kirim pesan
await sock.sendMessage(groupId, { 
image: { url: tempFilePath }, 
caption 
});
console.log(`[Sukses] Pesan gambar terkirim ke grup: ${groupId}`);

// Delay random antara pengiriman
const delay = getRandomDelay();
console.log(`Menunggu ${delay/1000} detik sebelum mengirim ke grup berikutnya...`);
await new Promise(resolve => setTimeout(resolve, delay));

} catch (error) {
console.error(`[Gagal] Mengirim ke grup ${groupId}:`, error.message);
// Lanjut ke grup berikutnya meskipun ada error
}
}

console.log('Broadcast gambar selesai.');

} catch (error) {
console.error('[Error] Broadcast gambar:', error.message);
throw error;
} finally {
cleanupTempFile(tempFilePath);
}
}

async function broadcastText(sock, textMessage, groupIds, groups) {
try {
console.log('Memulai broadcast teks:', textMessage);

for (const groupId of groupIds) {
try {
const groupMetadata = groups[groupId];

// Validasi grup
if (groupMetadata.announce) {
console.log(`[Skip] Grup ${groupId} hanya mengizinkan admin untuk mengirim pesan.`);
continue;
}

// Kirim pesan
await sock.sendMessage(groupId, {
text: textMessage,
contextInfo: {
isFromStatus: true,
forwardingScore: 69,
isForwarded: true,
externalAdReply: config.ADVERTISEMENT
}
});
console.log(`[Sukses] Pesan teks terkirim ke grup: ${groupId}`);

// Delay random antara pengiriman
const delay = getRandomDelay();
console.log(`Menunggu ${delay/1000} detik sebelum mengirim ke grup berikutnya...`);
await new Promise(resolve => setTimeout(resolve, delay));

} catch (error) {
console.error(`[Gagal] Mengirim ke grup ${groupId}:`, error.message);
// Lanjut ke grup berikutnya meskipun ada error
}
}

console.log('Broadcast teks selesai.');

} catch (error) {
console.error('[Error] Broadcast teks:', error.message);
throw error;
}
}

module.exports = {
broadcastText,
broadcastImage
};