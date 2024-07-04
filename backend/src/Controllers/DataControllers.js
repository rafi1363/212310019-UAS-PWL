const { dokumen } = require("../../models")

exports.index = async (req, res) => {
  res.json({
    status: 200,
    message: "prefix for end-poin users",
  });
};

// File: dokumenController.js

const Dokumen = require('../../models/dokumen'); // Ganti dengan model yang sesuai

async function cekDokumenKadaluarsa() {
  try {
    const semuaDokumen = await File.find(); // Ambil semua dokumen dari database
    const waktuSekarang = new Date();

    semuaDokumen.forEach(async (dokumen) => {
      if (dokumen.tanggalKadaluarsa <= waktuSekarang) {
        // Tandai dokumen sebagai "kadaluarsa" dalam database
        await Dokumen.findByIdAndUpdate(File.ID, { status: 'kadaluarsa' });
      }
    });
  } catch (error) {
    console.error('Error saat memeriksa dokumen kadaluarsa:', error);
  }
}

module.exports = { cekDokumenKadaluarsa };
