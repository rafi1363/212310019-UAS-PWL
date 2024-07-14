const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pdfParse = require('pdf-parse');
const db_mysql = require('../../models'); // Sesuaikan dengan path yang benar
const bodyParser = require('body-parser');
const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // save file with its original name
  }
});


const upload = multer({ storage: storage });

function extractExpirationDate(text) {
  const phraseRegex = /Expired in\s*:\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/g;
  const matches = text.match(phraseRegex);
  if (matches) {
    return matches.map(match => {
      const dateMatch = match.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/);
      return dateMatch ? dateMatch[0] : null;
    }).filter(date => date !== null);
  }
  return [];
}

const extractDatesHandler = (req, res) => {
  const text = req.body;
  const dates = extractExpirationDate(text);
  res.json({ extractedDates: dates });
};

const uploadHandler = async (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.file.path);
    const data = await pdfParse(fileContent);
    const dates = extractExpirationDate(data.text);
    const { originalname, path } = req.file;
    const currentDate = moment();

    const datesStatus = dates.map(date => {
      const dateMoment = moment(date, 'DD/MM/YYYY');
      return {
        date: date,
        status: dateMoment.isBefore(currentDate) ? 1 : 0
      };
    });

    const query = 'INSERT INTO Files (FileName, FilePath, ExtractedDates, Status) VALUES (?, ?, ?, ?)';
    const statusValues = datesStatus.map(d => d.status);
    try {
      await db_mysql.sequelize.query(query, { replacements: [originalname, path, JSON.stringify(dates), statusValues] });
      res.json({ message: 'File berhasil diunggah', file: req.file, dates: datesStatus });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

const fetchAllHandler = async (req, res) => {
  try {
    const query = 'SELECT * FROM Files';
    const [results] = await db_mysql.sequelize.query(query);
    const currentDate = moment().format('YYYY-MM-DD');

    const documentsWithStatus = results.map(doc => {
      const extractedDates = JSON.parse(doc.ExtractedDates);
      const isExpired = extractedDates.some(date => {
        const dateMoment = moment(date, 'DD/MM/YYYY');
        return dateMoment.isBefore(currentDate);
      });
      return {
        ...doc,
        Status: isExpired ? 1 : 0
      };
    });

    res.json({ documents: documentsWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};




// const deleteFileHandler = async (req, res) => {
//   const fileID = req.params.id;
//   const deleteQuery = 'DELETE FROM files WHERE FileID = ?';
//   const selectQuery = 'SELECT filePath FROM files WHERE FileID = ?';

//   try {
//     const [files] = await db_mysql.sequelize.query(selectQuery, { replacements: [fileID] });
    
//     if (files.length === 0) {
//       console.error('File not found in database');
//       return res.status(404).send('File not found');
//     }

//     const filePath = files[0].filePath;
//     console.log('File path:', filePath);

//     const fullPath = path.join(__dirname, filePath);
//     console.log('Full path:', fullPath);

//     await fs.unlink(fullPath);

//     await db_mysql.sequelize.query(deleteQuery, { replacements: [fileID] });
//     console.log('File record deleted from database');

//     res.send('File deleted successfully');
//   } catch (error) {
//     console.error('Error during file deletion process:', error);
//     res.status(500).send('Error deleting file');
//   }
// };

module.exports = {
  extractDatesHandler,
  uploadHandler,
  fetchAllHandler,
  // deleteFileHandler,
  upload // Export the upload configuration
};
