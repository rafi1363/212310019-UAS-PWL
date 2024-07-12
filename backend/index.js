const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer'); // for handling file uploads
const fs = require('fs').promises; // for file system operations
const db_mysql = require("./models");
const pdfParse = require("pdf-parse");
const { json } = require('sequelize');
const moment = require("moment");
const path = require('path');

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
// Endpoint for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.file.path);
    const data = await pdfParse(fileContent);
    const dates = extractDates(data.text);
    const { originalname, path } = req.file;
    const currentDate = moment();

    // Check if the dates are expired and prepare the data for insertion
    const datesStatus = dates.map(date => {
      const dateMoment = moment(date, 'DD/MM/YYYY');
      return {
        date: date,
        status: dateMoment.isBefore(currentDate) ? 1 : 0 // 1 for expired, 0 for not expired
      };
    });

    // Insert file information and dates status into the table
    const query = 'INSERT INTO Files (FileName, FilePath, ExtractedDates, Status) VALUES (?, ?, ?, ?)';
    const statusValues = datesStatus.map(d => d.status); // Will be 1 for expired, 0 for not expired
    try {
        await db_mysql.sequelize.query(query, { replacements: [originalname, path, JSON.stringify(dates), statusValues] });
        res.json({ message: 'File berhasil diunggah', file: req.file, dates: datesStatus});
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

app.delete('/delete-file/:id', async (req, res) => {
  const fileID = req.params.id;
  const deleteQuery = 'DELETE FROM files WHERE FileID = ?';
  const selectQuery = 'SELECT filePath FROM files WHERE FileID = ?';

  try {
    // Fetch the file path from the database
    const [files] = await db_mysql.sequelize.query(selectQuery, { replacements: [fileID] });
    
    if (files.length === 0) {
      console.error('File not found in database');
      return res.status(404).send('File not found');
    }

    const filePath = files[0].filePath;
    console.log('File path:', filePath);

    // Correct the file path
    const fullPath = path.join(__dirname, filePath);
    console.log('Full path:', fullPath);

    // Delete the file from the uploads folder
    await fs.unlink(fullPath);

    // Delete the file record from the database
    await db_mysql.sequelize.query(deleteQuery, { replacements: [fileID] });
    console.log('File record deleted from database');

    res.send('File deleted successfully');
  } catch (error) {
    console.error('Error during file deletion process:', error);
    res.status(500).send('Error deleting file');
  }
});

// Endpoint untuk menghapus file berdasarkan ID
// app.delete('/delete-file/:id', async (req, res) => {
//   const fileId = req.params.id;
//   if (!fileId) {
//     return res.status(400).json({ error: 'ID file tidak diberikan atau tidak valid' });
//   }

//   try {
//     // Menghapus file dari database
//     const deleteQuery = 'DELETE FROM files WHERE FileID = ?';
//     const result = await db_mysql.sequelize.query(deleteQuery, { replacements: [fileId] });

//     // Opsional: Hapus file dari sistem file jika diperlukan
//     // Pastikan Anda mendapatkan `fileName` dari database sebelum menghapus file
//     // Contoh: const fileName = result[0].fileName;
//     const filePath = 'uploads/' + __filename;
//     fs.unlinkSync(filePath);

//     res.json({ message: 'File berhasil dihapus' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Terjadi kesalahan saat menghapus file' });
//   }
// });

// app.get('/get-by-id/:id', async (req, res) => {
//   const fileId = req.query.id;
//   const query = "SELECT * FROM `files` WHERE FileID = ?";

//   // Query ke database dengan parameter yang aman untuk mencegah SQL injection
//   await db_mysql.sequelize.query(query, [fileId], (err, results) => {
//     if (err) {
//       // Handle error
//       res.status(500).send('Server error');
//     } else {
//       // Kirim hasil
//       res.json(results);
//     }
//   });
// })



const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

