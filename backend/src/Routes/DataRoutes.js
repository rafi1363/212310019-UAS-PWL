const express = require("express");
const router = express.Router();
const dataController = express("../Controllers/DataControllers.js")
router.get("/dataroutes", dataController.index);
module.exports = router;
