const { handleBroadcast } = require('./handlerBroadcast');
const { handleLinkGrup } = require('./handlerLinkGrup');

module.exports = (sock) => async ({ messages }) => {
const pesan = messages[0];
const pengirim = pesan.key.remoteJid;

// Handle pesan broadcast
if (await handleBroadcast(sock, pesan, pengirim)) {
return;
}

// Handle link grup
await handleLinkGrup(sock, pesan, pengirim);
};