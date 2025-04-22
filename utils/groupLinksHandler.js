const fs = require('fs');
const path = require('path');
const config = require('../config');

// Buat folder data jika belum ada
if (!fs.existsSync(path.dirname(config.GROUP_LINKS.STORAGE_FILE))) {
fs.mkdirSync(path.dirname(config.GROUP_LINKS.STORAGE_FILE), { recursive: true });
}

// Inisialisasi file jika belum ada
if (!fs.existsSync(config.GROUP_LINKS.STORAGE_FILE)) {
fs.writeFileSync(config.GROUP_LINKS.STORAGE_FILE, JSON.stringify({
links: [],
sentToAdmin: []
}, null, 2));
}

function readLinksData() {
const data = fs.readFileSync(config.GROUP_LINKS.STORAGE_FILE, 'utf-8');
return JSON.parse(data);
}

function writeLinksData(data) {
fs.writeFileSync(config.GROUP_LINKS.STORAGE_FILE, JSON.stringify(data, null, 2));
}

// Fungsi untuk mengekstrak link grup dari pesan
function extractGroupLinks(text) {
const groupLinkRegex = /https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]+/g;
return text.match(groupLinkRegex) || [];
}

// Fungsi untuk menambahkan link baru
async function addNewLinks(sock, message) {
try {
const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
const links = extractGroupLinks(text);

if (links.length === 0) return;

const data = readLinksData();
const newLinks = [];

for (const link of links) {
// Cek apakah link sudah ada (termasuk yang sudah dikirim ke admin)
if (!data.links.includes(link) && !data.sentToAdmin.includes(link)) {
data.links.push(link);
newLinks.push(link);
console.log(`Link grup baru ditambahkan: ${link}`);
}
}

if (newLinks.length > 0) {
writeLinksData(data);

// Cek apakah sudah mencapai threshold untuk notifikasi
const unsentLinks = data.links.filter(link => !data.sentToAdmin.includes(link));
if (unsentLinks.length >= config.GROUP_LINKS.NOTIFY_THRESHOLD) {
await notifyAdmin(sock, unsentLinks.slice(0, config.GROUP_LINKS.NOTIFY_THRESHOLD));
}
}
} catch (error) {
console.error('Gagal memproses link grup:', error.message);
}
}

// Fungsi untuk mengirim notifikasi ke admin
async function notifyAdmin(sock, links) {
try {
const data = readLinksData();
const message = config.GROUP_LINKS.ADMIN_NOTIFY_MESSAGE + links.join('\n');

await sock.sendMessage(config.AUTHORIZED_NUMBER, { text: message });
console.log('Notifikasi link grup terkirim ke admin');

// Tandai link yang sudah dikirim ke admin
data.sentToAdmin = [...data.sentToAdmin, ...links];
writeLinksData(data);
} catch (error) {
console.error('Gagal mengirim notifikasi ke admin:', error.message);
}
}

module.exports = {
addNewLinks,
extractGroupLinks
};