const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer'); // for handling file uploads
const fs = require('fs'); // for file system operations
const db_mysql = require("./models");
const pdfParse = require("pdf-parse");
const { json } = require('sequelize');
const moment = require("moment");

app.use(cors());
app.use(bodyParser.json());
db_mysql.sequelize.sync();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // save file with its original name
  }
});

const upload = multer({ storage: storage });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan pada server');
});

// Fungsi untuk mengekstrak tanggal dari teks menggunakan regular expression
function extractDates(text) {
  // Regular expression untuk mencocokkan format tanggal DD/MM/YYYY, DD-MM-YYYY, atau DD.MM.YYYY
  const dateRegex = /(\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\b)/g;
  const dates = text.match(dateRegex);
  return dates ;
}

// Contoh penggunaan fungsi extractDates
app.post('/extract-dates', bodyParser.text(), (req, res) => {
  const text = req.body;
  const dates = extractDates(text);
  res.json({ extractedDates: dates });
});

// Endpoint for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.file.path);
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(fileContent);
    const dates = extractDates(data.text);
    const { originalname, path } = req.file;

    // Check if the dates are expired
    const currentDate = moment();
    const datesStatus = dates.map(date => {
      const dateMoment = moment(date, 'DD/MM/YYYY'); // Sesuaikan format dengan format tanggal di dokumen Anda
      return {
        date: date,
        status: dateMoment.isBefore(currentDate) ? 'expired' : 'not expired'
      };
    });


    // Simpan informasi file ke dalam tabel
    const query = 'INSERT INTO Files (FileName, FilePath, ExtractedDates) VALUES (?, ?, ?)';
    try {
        await db_mysql.sequelize.query(query, { replacements: [originalname, path, JSON.stringify(dates)] });
        res.json({ message: 'File berhasil diunggah', file: req.file, dates: dates});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint for fetching all documents with expiration status
app.get('/fetch-all', async (req, res) => {
    try {
        const query = 'SELECT * FROM Files';
        const [results] = await db_mysql.sequelize.query(query);
        const currentDate = moment().format('YYYY-MM-DD'); // Format tanggal saat ini

        // Menambahkan status kedaluwarsa pada setiap dokumen
        const documentsWithStatus = results.map(doc => {
            const extractedDates = JSON.parse(doc.ExtractedDates);
            const isExpired = extractedDates.some(date => {
                const dateMoment = moment(date, 'DD/MM/YYYY');
                return dateMoment.isBefore(currentDate);
            });
            return {
                ...doc,
                Status: isExpired ? 1 : 0 // 1 untuk expired, 0 untuk not expired
            };
        });

        res.json({ documents: documentsWithStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});





const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

