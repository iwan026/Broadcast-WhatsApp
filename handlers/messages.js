const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const config = require('../config');
const { broadcastText, broadcastImage } = require('../utils/broadcast');
const { addNewLinks } = require('../utils/groupLinksHandler');

let waitingForBroadcast = false;

module.exports = function handleMessages(sock) {
return async ({ messages }) => {
try {
const message = messages[0];
const from = message.key.remoteJid;
const isFromAuthorized = from === config.AUTHORIZED_NUMBER;

if (!message.key.fromMe && message.message) {
await addNewLinks(sock, message);
}

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
await sock.sendMessage(config.AUTHORIZED_NUMBER, { text: 'Broadcast dimulai...' });

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
await sock.sendMessage(config.AUTHORIZED_NUMBER, { text: `Broadcast ke ${groupIds.length} grup selesai.` });
waitingForBroadcast = false;
}
}
}
} catch (error) {
console.error('Terjadi kesalahan saat menangani pesan:', error.message);
}
};
};



// handlers/messages.js

// Kode yang sudah ada...
}
} catch (error) {
console.error('Terjadi kesalahan saat menangani pesan:', error.message);
}
};
};