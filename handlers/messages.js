const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const { broadcastText, broadcastImage } = require('../utils/broadcast');
const { addNewLinks } = require('../utils/groupLinksHandler');

// State management untuk broadcast
const broadcastState = {
waiting: false,
lastActivity: null
};

// Timeout untuk reset state broadcast (5 menit)
const BROADCAST_TIMEOUT = 5 * 60 * 1000; 

module.exports = function handleMessages(sock) {
return async ({ messages }) => {
try {
const message = messages[0];
if (!message || !message.key || !message.message) return;

const from = message.key.remoteJid;
const isFromAuthorized = from === config.AUTHORIZED_NUMBER;

// Handle group links untuk semua pesan masuk
if (!message.key.fromMe && message.message) {
try {
await addNewLinks(sock, message);
} catch (error) {
console.error('Gagal memproses link grup:', error.message);
}
}

// Handle broadcast hanya dari nomor authorized
if (!message.key.fromMe && message.message && isFromAuthorized) {
const textMessage = message.message.conversation || message.message.extendedTextMessage?.text || '';
const isImageMessage = message.message.imageMessage;

// Reset state jika timeout
if (broadcastState.lastActivity && (Date.now() - broadcastState.lastActivity) > BROADCAST_TIMEOUT) {
broadcastState.waiting = false;
}

// Perintah /bcast
if (textMessage.startsWith('/bcast')) {
console.log('Perintah broadcast diterima.');
broadcastState.waiting = true;
broadcastState.lastActivity = Date.now();

await sock.sendMessage(from, { 
text: 'Silahkan kirimkan pesan yang ingin di-broadcast (teks/gambar).\nKetik /cancel untuk membatalkan.' 
});
return;
}

// Perintah /cancel
if (textMessage.startsWith('/cancel') && broadcastState.waiting) {
broadcastState.waiting = false;
await sock.sendMessage(from, { text: 'Broadcast dibatalkan.' });
return;
}

// Proses broadcast
if (broadcastState.waiting) {
console.log('Memproses pesan broadcast...');
broadcastState.lastActivity = Date.now();

await sock.sendMessage(from, { text: 'Broadcast dimulai...' });

try {
const groups = await sock.groupFetchAllParticipating();
const groupIds = Object.keys(groups);

if (isImageMessage) {
await broadcastImage(sock, message, groupIds, groups);
} else if (textMessage) {
await broadcastText(sock, textMessage, groupIds, groups);
}

await sock.sendMessage(from, { 
text: `Broadcast selesai ke ${groupIds.length} grup.` 
});

} catch (error) {
console.error('Error saat broadcast:', error.message);
await sock.sendMessage(from, { 
text: `Gagal broadcast: ${error.message}` 
});
} finally {
broadcastState.waiting = false;
}
}
}
} catch (error) {
console.error('Error dalam menangani pesan:', error.message);
}
};
};