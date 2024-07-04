const cron = require("node-cron");

const shell = require("shelljs");

cron.schedule("* * * * * *", function () {
    console.log("testing cron successfully")
})

// const { cekDokumenKadaluarsa } = require('./src/Controllers/DataControllers'); // Ganti dengan controller yang sesuai

// // Jalankan cekDokumenKadaluarsa setiap hari pukul 00:00
// cron.schedule('* * * * *', () => {
//   cekDokumenKadaluarsa();
// });