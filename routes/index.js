const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
var contractorHelper = require('../helpers/contractor-helper');
var clientHelper = require('../helpers/client-helper')

// index page 
router.get('/', function (req, res, next) {
  res.render('index', { index: true});
  // clientHelper.getProperties().then((properties) => {
  //   contractorHelper.getLatestContractor().then((contractors) => {
  //     console.log(contractors);
  //     res.render('index', { index: true, properties, contractors }); 
  //   })
  // })
});

// redirect page 
router.get('/redirect', (req, res) => {
  res.render('account/redirect', { redirect: true })
})

let count = 1

let email;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req, file, cb) {
    let contractor = req.session.contractor

    // to format the date 
    const currentTime = new Date();
    const day = currentTime.getDate().toString().padStart(2, '0');
    const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
    const year = currentTime.getFullYear();

    // formated date '01 - 11 - 2034' format 
    const formattedDate = `${day} - ${month} - ${year}`;

    cb(null, contractor.email + "to" + email + "timeline" + count + formattedDate + path.extname(file.originalname));
  }
});


const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), function (req, res) {
  let contractor = req.session.contractor
  contractorHelper.projectTimeline(contractor.email, email).then((result) => {

  })
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  count++;
  res.send('File uploaded successfully.');
});

router.get('/updates', (req, res) => {
  let contractor = req.session.contractor
  contractorHelper.getContracted(contractor).then((list) => {
    // console.log(list);
    res.render('contractor/updation-list', { list })
  })
})

router.get('/updates:email', (req, res) => {
  let clientEmail = req.params.email.replace(':', '');
  email = clientEmail
  console.log(email);
  res.render('camera', { projectUpdates: true })
})

router.get('/camera', (req, res) => {
  res.render('camera')
})

module.exports = router;
