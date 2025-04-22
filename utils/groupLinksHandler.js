const fs = require('fs');
const path = require('path');
const config = require('../config');

// Helper untuk operasi file
class LinkStorage {
constructor(filePath) {
this.filePath = filePath;
this.ensureStorageFile();
}

ensureStorageFile() {
// Buat folder jika belum ada
const dir = path.dirname(this.filePath);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}

// Buat file jika belum ada
if (!fs.existsSync(this.filePath)) {
fs.writeFileSync(this.filePath, JSON.stringify({
links: [],
sentToAdmin: []
}, null, 2));
}
}

readData() {
try {
const data = fs.readFileSync(this.filePath, 'utf-8');
return JSON.parse(data);
} catch (error) {
console.error('Gagal membaca file links:', error.message);
return { links: [], sentToAdmin: [] };
}
}

writeData(data) {
try {
fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
return true;
} catch (error) {
console.error('Gagal menulis file links:', error.message);
return false;
}
}
}

const linkStorage = new LinkStorage(config.GROUP_LINKS.STORAGE_FILE);

// Fungsi untuk mengekstrak link grup dari pesan
function extractGroupLinks(text) {
const groupLinkRegex = /https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9_-]+/g;
return text.match(groupLinkRegex) || [];
}

// Fungsi untuk menambahkan link baru
async function addNewLinks(sock, message) {
try {
const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
const links = extractGroupLinks(text);
if (links.length === 0) return;

const data = linkStorage.readData();
const newLinks = links.filter(link => 
!data.links.includes(link) && !data.sentToAdmin.includes(link)
);

if (newLinks.length === 0) return;

// Tambahkan link baru
data.links.push(...newLinks);
if (!linkStorage.writeData(data)) return;

console.log(`Ditambahkan ${newLinks.length} link baru.`);

// Cek threshold untuk notifikasi admin
const unsentLinks = data.links.filter(link => !data.sentToAdmin.includes(link));
if (unsentLinks.length >= config.GROUP_LINKS.NOTIFY_THRESHOLD) {
await notifyAdmin(sock, unsentLinks.slice(0, config.GROUP_LINKS.NOTIFY_THRESHOLD));
}

} catch (error) {
console.error('Error dalam addNewLinks:', error.message);
throw error;
}
}

// Fungsi untuk mengirim notifikasi ke admin
async function notifyAdmin(sock, links) {
try {
const data = linkStorage.readData();
const message = config.GROUP_LINKS.ADMIN_NOTIFY_MESSAGE + links.join('\n');

// Update status terlebih dahulu
data.sentToAdmin = [...data.sentToAdmin, ...links];
if (!linkStorage.writeData(data)) return;

// Kirim notifikasi
await sock.sendMessage(config.AUTHORIZED_NUMBER, { text: message });
console.log(`Notifikasi terkirim ke admin untuk ${links.length} link.`);

} catch (error) {
console.error('Gagal mengirim notifikasi ke admin:', error.message);
throw error;
}
}

module.exports = {
addNewLinks,
extractGroupLinks
};