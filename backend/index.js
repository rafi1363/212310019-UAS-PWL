const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
// const multer = require('multer'); // for handling file uploads
const fs = require('fs').promises; // for file system operations
const db_mysql = require("./models");
const dataRoutes = require('./src/Routes/DataRoutes')

app.use(cors());
app.use(bodyParser.json());
db_mysql.sequelize.sync();


app.use('/data', dataRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

