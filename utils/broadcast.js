const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// Fungsi untuk menghasilkan delay random
function getRandomDelay() {
return Math.floor(
Math.random() * (config.BROADCAST_DELAY_RANGE.MAX - config.BROADCAST_DELAY_RANGE.MIN + 1)
) + config.BROADCAST_DELAY_RANGE.MIN;
}

async function broadcastImage(sock, message, groupIds, groups) {
try {
const caption = message.message.imageMessage.caption || '';
console.log('Caption gambar:', caption);
const mediaBuffer = await downloadMediaMessage(message, 'buffer', { logger: sock.logger });

if (mediaBuffer) {
fs.writeFileSync(config.TEMP_IMAGE_PATH, mediaBuffer);

for (const groupId of groupIds) {
try {
const groupMetadata = groups[groupId];
if (groupMetadata.announce) {
console.log(`Grup ${groupId} hanya mengizinkan admin untuk mengirim pesan. Bot tidak bisa mengirim pesan ke grup ini.`);
continue;
}

await sock.sendMessage(groupId, { image: { url: config.TEMP_IMAGE_PATH }, caption });
console.log(`Pesan gambar terkirim ke grup: ${groupId}`);

// Tambahkan delay random
const delay = getRandomDelay();
console.log(`Menunggu ${delay/1000} detik sebelum mengirim ke grup berikutnya...`);
await new Promise(resolve => setTimeout(resolve, delay));

} catch (error) {
console.error(`Gagal mengirim pesan ke grup ${groupId}:`, error.message);
}
}

fs.unlinkSync(config.TEMP_IMAGE_PATH);
console.log('Broadcast gambar selesai.');
}
} catch (error) {
console.error('Terjadi kesalahan saat broadcast gambar:', error.message);
}
}

async function broadcastText(sock, textMessage, groupIds, groups) {
try {
console.log('Pesan teks untuk broadcast:', textMessage);

for (const groupId of groupIds) {
try {
const groupMetadata = groups[groupId];
if (groupMetadata.announce) {
console.log(`Grup ${groupId} hanya mengizinkan admin untuk mengirim pesan. Bot tidak bisa mengirim pesan ke grup ini.`);
continue;
}

await sock.sendMessage(groupId, {
text: textMessage,
contextInfo: {
isFromStatus: true,
forwardingScore: 69,
isForwarded: true,
externalAdReply: config.ADVERTISEMENT
}
});

console.log(`Pesan teks terkirim ke grup: ${groupId}`);

// Tambahkan delay random
const delay = getRandomDelay();
console.log(`Menunggu ${delay/1000} detik sebelum mengirim ke grup berikutnya...`);
await new Promise(resolve => setTimeout(resolve, delay));

} catch (error) {
console.error(`Gagal mengirim pesan ke grup ${groupId}:`, error.message);
}
}

console.log('Broadcast teks selesai.');
} catch (error) {
console.error('Terjadi kesalahan saat broadcast teks:', error.message);
}
}

module.exports = {
broadcastText,
broadcastImage
};