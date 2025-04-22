const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const handleMessages = require('./handlers/messages'); // Pindahkan require ke sini

// Polyfill crypto
const crypto = require('crypto');
globalThis.crypto = crypto;

let sockInstance = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 30000;

async function initializeSock() {
try {
console.log('Memulai inisialisasi bot...');

// Cleanup previous instance
if (sockInstance) {
sockInstance.ev.removeAllListeners();
sockInstance.ws.close();
sockInstance = null;
}

const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth'));
const { version } = await fetchLatestBaileysVersion();

sockInstance = makeWASocket({
version,
auth: state,
printQRInTerminal: true,
logger: pino({ level: 'error' }),
browser: ['Yuipedia Bot', 'Safari', '1.0.0'],
syncFullHistory: false,
markOnlineOnConnect: false,
generateHighQualityLinkPreview: false,
getMessage: async () => undefined
});

// Setup event listeners
sockInstance.ev.on('creds.update', saveCreds);
sockInstance.ev.on('connection.update', handleConnectionUpdate);
sockInstance.ev.on('messages.upsert', handleMessages(sockInstance)); // Pindahkan ke sini

reconnectAttempts = 0;
return sockInstance;

} catch (error) {
console.error('Inisialisasi gagal:', error.message);
throw error;
}
}

function handleConnectionUpdate(update) {
try {
const { connection, lastDisconnect } = update;

if (connection === 'close') {
const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

if (shouldReconnect) {
if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
reconnectAttempts++;
const delay = Math.min(RECONNECT_INTERVAL * reconnectAttempts, 300000); // Maksimal 5 menit
console.log(`Mencoba reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) dalam ${delay/1000} detik...`);
setTimeout(initializeSock, delay);
} else {
console.error('Maksimum percobaan reconnect tercapai');
}
}
} else if (connection === 'open') {
reconnectAttempts = 0; // Reset counter jika berhasil terkoneksi
}
} catch (error) {
console.error('Error handleConnectionUpdate:', error);
}
}

// Handle process events
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
console.log('\nShutting down gracefully...');
if (sockInstance) {
sockInstance.ev.removeAllListeners();
sockInstance.ws.close();
}
process.exit(0);
}

module.exports = initializeSock;

// Start the bot
initializeSock().catch(console.error);