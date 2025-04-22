const fs = require('fs');
const path = require('path');
const pengaturan = require('../config/pengaturan');
const logger = require('../utils/logger');

let grupTersimpan = [];
let grupTertunda = [];

// Inisialisasi penyimpanan
function inisialisasiPenyimpanan() {
try {
const direktori = path.dirname(pengaturan.FILE_PENYIMPANAN);
if (!fs.existsSync(direktori)) {
fs.mkdirSync(direktori, { recursive: true });
}

if (fs.existsSync(pengaturan.FILE_PENYIMPANAN)) {
const data = fs.readFileSync(pengaturan.FILE_PENYIMPANAN, 'utf8');
grupTersimpan = JSON.parse(data);
logger.info(`Memuat ${grupTersimpan.length} link grup tersimpan`);
}
} catch (error) {
logger.error('Error inisialisasi penyimpanan:', error);
}
}

// Simpan link grup
async function simpanLinkGrup(dataGrup) {
// Cek duplikat
const isDuplikat = [...grupTersimpan, ...grupTertunda].some(
grup => grup.link === dataGrup.link
);

if (isDuplikat) {
throw new Error('Link ini sudah pernah disimpan sebelumnya');
}

grupTertunda.push(dataGrup);
logger.info(`Link grup baru disimpan (tertunda): ${dataGrup.link}`);
}

// Beri tahu admin jika mencapai batas
async function beriTahuAdminJikaSampaiBatas(sock) {
if (grupTertunda.length < pengaturan.BATAS_NOTIFIKASI) {
return;
}

try {
let pesan = `📢 *NOTIFIKASI LINK GRUP BARU* 📢\n\n` +
`Terdapat ${grupTertunda.length} link grup baru:\n\n`;

grupTertunda.forEach((grup, index) => {
pesan += `*${index + 1}. ${grup.nama}*\n` +
`Ditambahkan oleh: ${grup.ditambahkanOleh}\n` +
`Link: ${grup.link}\n\n`;
});

await sock.sendMessage(pengaturan.NOMOR_ADMIN, { text: pesan });

// Pindahkan ke penyimpanan permanen
grupTersimpan.push(...grupTertunda);
grupTertunda = [];
fs.writeFileSync(pengaturan.FILE_PENYIMPANAN, JSON.stringify(grupTersimpan, null, 2));

logger.info(`Admin diberitahu tentang ${grupTersimpan.length} link grup`);
} catch (error) {
logger.error('Gagal memberi tahu admin:', error);
}
}

// Pengecekan berkala untuk memastikan tidak ada yang tertunda
setInterval(() => {
if (grupTertunda.length > 0) {
logger.info(`Pengecekan link tertunda: ${grupTertunda.length} link menunggu`);
}
}, 24 * 60 * 60 * 1000); // Cek harian

module.exports = {
inisialisasiPenyimpanan,
simpanLinkGrup,
beriTahuAdminJikaSampaiBatas
};