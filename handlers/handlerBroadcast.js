const pengaturan = require('../config/pengaturan');
const konstanta = require('../config/konstanta');
const { broadcastTeks, broadcastGambar } = require('../services/layananBroadcast');
const logger = require('../utils/logger');

let statusBroadcast = konstanta.STATUS_BROADCAST.IDLE;

module.exports = async (sock, pesan, pengirim) => {
if (pengirim !== pengaturan.NOMOR_TEROTORISASI || pesan.key.fromMe) {
return false;
}

const pesanTeks = pesan.message[konstanta.JENIS_PESAN.TEKS] || 
pesan.message[konstanta.JENIS_PESAN.TEKS_PANJANG]?.text || '';
const isPesanGambar = pesan.message[konstanta.JENIS_PESAN.GAMBAR];

if (pesanTeks.startsWith('/bcast')) {
logger.info('Perintah broadcast diterima');
statusBroadcast = konstanta.STATUS_BROADCAST.MENUNGGU;
await sock.sendMessage(pengirim, { 
text: 'Silahkan kirimkan pesan yang ingin di-broadcast (support teks atau gambar).' 
});
return true;
}

if (statusBroadcast === konstanta.STATUS_BROADCAST.MENUNGGU) {
logger.info('Memproses pesan broadcast');
statusBroadcast = konstanta.STATUS_BROADCAST.PROSES;

await sock.sendMessage(pengaturan.NOMOR_TEROTORISASI, { text: 'Broadcast dimulai...' });
const grup = await sock.groupFetchAllParticipating();
const idGrup = Object.keys(grup);

try {
if (isPesanGambar) {
await broadcastGambar(sock, pesan, idGrup, grup);
} else if (pesanTeks) {
await broadcastTeks(sock, pesanTeks, idGrup, grup);
}
} catch (error) {
logger.error('Error broadcast:', error);
} finally {
await sock.sendMessage(pengaturan.NOMOR_TEROTORISASI, { 
text: `Broadcast ke ${idGrup.length} grup selesai.` 
});
statusBroadcast = konstanta.STATUS_BROADCAST.IDLE;
}
return true;
}

return false;
};