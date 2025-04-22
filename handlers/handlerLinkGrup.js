const pengaturan = require('../config/pengaturan');
const { prosesLinkGrup } = require('../services/layananLinkGrup');
const logger = require('../utils/logger');

module.exports = async (sock, pesan, pengirim) => {
const pesanTeks = pesan.message.conversation || 
pesan.message.extendedTextMessage?.text || '';

// Cek apakah pesan mengandung link grup WhatsApp
const cocokLink = pesanTeks.match(/https:\/\/chat\.whatsapp\.com\/[^\s]+/);
if (!cocokLink) return;

try {
const namaGrup = pesanTeks.split('\n')[0].trim();
const linkGrup = cocokLink[0];

await prosesLinkGrup(sock, {
nama: namaGrup || 'Tanpa Nama',
link: linkGrup,
ditambahkanOleh: pengirim,
waktu: new Date().toISOString()
});

logger.info(`Link grup diproses dari ${pengirim}`);
} catch (error) {
logger.error('Error proses link grup:', error);
await sock.sendMessage(pengirim, { text: 'Gagal memproses link grup: ' + error.message });
}
};