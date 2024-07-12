const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const {
  extractDatesHandler,
  uploadHandler,
    fetchAllHandler,
    // deleteFileHandler,
  upload
} = require('../Controllers/DataControllers');

router.post('/extract-dates', bodyParser.text(), extractDatesHandler);
router.post('/upload', upload.single('file'), uploadHandler);
router.get('/fetch-all', fetchAllHandler);
// router.delete('/delete-file/:id', deleteFileHandler)

module.exports = router;
