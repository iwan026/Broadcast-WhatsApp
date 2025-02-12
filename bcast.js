const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const pino = require('pino');

const AUTHORIZED_NUMBER = '6282228462822@s.whatsapp.net';
const TEMP_IMAGE_PATH = './temp-image.jpg';

let waitingForBroadcast = false;

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

function handleMessages(sock) {
return async ({ messages }) => {
try {
const message = messages[0];
const from = message.key.remoteJid;
const isFromAuthorized = from === AUTHORIZED_NUMBER;

if (!message.key.fromMe && message.message && isFromAuthorized) {
const textMessage = message.message.conversation || message.message.extendedTextMessage?.text || '';
const isImageMessage = message.message.imageMessage;

if (textMessage.startsWith('/bcast')) {
console.log('Perintah /bcast diterima.');
waitingForBroadcast = true;
await sock.sendMessage(from, { text: 'Silahkan kirimkan pesan yang ingin di-broadcast (support teks atau gambar).' });
return;
}

if (waitingForBroadcast) {
console.log('Pesan broadcast diterima.');
await sock.sendMessage(AUTHORIZED_NUMBER, { text: 'Broadcast dimulai...' });

const groups = await sock.groupFetchAllParticipating();
const groupIds = Object.keys(groups);

try {
if (isImageMessage) {
await broadcastImage(sock, message, groupIds, groups);
} else if (textMessage) {
await broadcastText(sock, textMessage, groupIds, groups);
}
} catch (error) {
console.error('Terjadi kesalahan saat broadcast:', error.message);
} finally {
await sock.sendMessage(AUTHORIZED_NUMBER, { text: `Broadcast ke ${groupIds.length} grup selesai.` });
waitingForBroadcast = false;
}
}
}
} catch (error) {
console.error('Terjadi kesalahan saat menangani pesan:', error.message);
}
};
}

async function broadcastImage(sock, message, groupIds, groups) {
try {
const caption = message.message.imageMessage.caption || '';
console.log('Caption gambar:', caption);
const mediaBuffer = await downloadMediaMessage(message, 'buffer', { logger: sock.logger });

if (mediaBuffer) {
fs.writeFileSync(TEMP_IMAGE_PATH, mediaBuffer);

for (const groupId of groupIds) {
try {
const groupMetadata = groups[groupId];
if (groupMetadata.announce) {
console.log(`Grup ${groupId} hanya mengizinkan admin untuk mengirim pesan. Bot tidak bisa mengirim pesan ke grup ini.`);
continue; 
}

await sock.sendMessage(groupId, { image: { url: TEMP_IMAGE_PATH }, caption });
console.log(`Pesan gambar terkirim ke grup: ${groupId}`);
} catch (error) {
console.error(`Gagal mengirim pesan ke grup ${groupId}:`, error.message);
}
}

fs.unlinkSync(TEMP_IMAGE_PATH);
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

await sock.sendMessage(groupId, { text: textMessage });
console.log(`Pesan teks terkirim ke grup: ${groupId}`);
} catch (error) {
console.error(`Gagal mengirim pesan ke grup ${groupId}:`, error.message);
}
}

console.log('Broadcast teks selesai.');
} catch (error) {
console.error('Terjadi kesalahan saat broadcast teks:', error.message);
}
}

function handleConnectionUpdate(sock) {
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
startSock();
}
} else if (connection === 'open') {
console.log('Bot sudah nyala.');
}
} catch (error) {
console.error('Terjadi kesalahan saat menangani pembaruan koneksi:', error.message);
}
};
}

startSock();