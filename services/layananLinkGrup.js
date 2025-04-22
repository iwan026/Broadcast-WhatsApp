const pengaturan = require('../config/pengaturan');
const { simpanLinkGrup, beriTahuAdminJikaSampaiBatas } = require('./penyimpanan');
const logger = require('../utils/logger');

module.exports = {
prosesLinkGrup: async (sock, dataGrup) => {
// Validasi link grup WhatsApp
if (!dataGrup.link.startsWith('https://chat.whatsapp.com/')) {
throw new Error('Link harus berupa invite WhatsApp yang valid');
}

// Simpan ke penyimpanan
await simpanLinkGrup(dataGrup);

// Kirim konfirmasi ke pengirim
await sock.sendMessage(dataGrup.ditambahkanOleh, { 
text: 'Link grup berhasil disimpan! Akan dikirim ke admin setelah terkumpul beberapa link.'
});

// Cek apakah perlu memberi tahu admin
await beriTahuAdminJikaSampaiBatas(sock);
}
};