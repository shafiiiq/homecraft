var express = require('express');
var router = express.Router();
var adminHelper = require('../helpers/admin-helper');
var clientHelper = require('../helpers/client-helper');
var contractorHelper = require('../helpers/contractor-helper');

// verify login middleware 
const verifyLogin = (req, res, next) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    next()
  } else {
    res.render('account/account', { account: true, admin: true })
  }
}

// verify is logged in and prevent to going to previous page
const isLoggedIn = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (req.session.admin) {
    res.redirect('/admin/dashboard');
  } else {
    next();
  }
};

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// admin account 
router.get('/account', isLoggedIn, (req, res) => {
    res.render('account/account', { account: true, admin: true })
})
  
router.post('/signup', (req, res) => {
  adminHelper.signUp(req.body).then((response) => {
    if (response) {
      res.render('account/account', { account: true, admin: true, popup: true })
    }
  })
});

// admin login 
router.get('/login', verifyLogin, (req, res) => {
  res.render('admin/home', { adminHome: true, })
})

router.post('/login', (req, res) => {
  adminHelper.login(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('dashboard')
    } else {
      res.render('account/account', { account: true, admin: true, logginErr: "Invalid email or password" });
    }
  })
});
// admin login ends 

router.get('/dashboard', verifyLogin, (req, res) => {
  adminHelper.getContractorProfile().then((profiles) => {
    adminHelper.getContractorName().then((result) => {
      adminHelper.getApprovedContractor().then((approved) => {
        adminHelper.getRejectedContractor().then((rejected) => {
          adminHelper.getClientRequest().then((request) => {
            adminHelper.getClientCount().then((client) => {
              adminHelper.getContractorCount().then((contractor) => {
                adminHelper.getPropertiesCount().then((properties) => {
                  if (client.length > 0) {
                    var clientCount = client.length
                  }
                  if (contractor.length > 0) {
                    var contractorCount = contractor.length
                  }
                  if (client.length > 0 && contractor.length > 0) {
                    var totalCount = client.length + contractor.length
                  }
                  if (properties.length > 0) {
                    var propertyCount = properties.length
                  }
                  console.log(propertyCount);
                  res.render('admin/dashboard', { dashboard: true, profiles, result, approved, rejected, request, clientCount, contractorCount, totalCount, propertyCount })
                })
                })
            })
          })
        })
      })
    })
  })
})

// admin contractor approval 
router.post('/approve', (req, res) => {
  const thisObject = {
    id: req.body.id,
    companyName: req.body.companyName,
    phoneNumber: req.body.phoneNumber,
    alternateNumber: req.body.alternateNumber,
    workStatus: req.body.workStatus,
    name: req.body.name,
    email: req.body.email,
    class: req.body.class
  };
  adminHelper.approveContractor(thisObject).then((result) => {
    adminHelper.deleteFromProfile(thisObject).then((result) => {
      res.redirect('/admin/dashboard')
    })
  })
});

router.post('/reject', (req, res) => {
  const thisObject = {
    id: req.body.id,
    companyName: req.body.companyName,
    phoneNumber: req.body.phoneNumber,
    alternateNumber: req.body.alternateNumber,
    workStatus: req.body.workStatus,
    name: req.body.name,
    email: req.body.email,
    reason: req.body.reason
  };
  adminHelper.rejectContractor(thisObject).then((result) => {
    adminHelper.deleteFromProfile(thisObject).then((result) => {
      rres.redirect('/admin/dashboard')
    })
  })
});

// approve client 
router.post('/approve-client', (req, res) => {
  const thisObject = {
    id: req.body.id,
    name: req.body.name,
    email: req.body.email
  };
  adminHelper.approveClient(thisObject).then((result) => {
    res.redirect('/admin/dashboard')
    })
});

// reject client 
router.post('/reject-client', (req, res) => {
  const thisObject = {
    id: req.body.id,
    name: req.body.name,
    email: req.body.email
  };
  adminHelper.rejectClient(thisObject).then((result) => {
    res.redirect('/admin/dashboard')
    })
});

// add contractor to class 
router.get('/add-class', (req, res) => {
  res.render('admin/add-class')
})

router.get('/logout', (req, res) => {
  req.session.admin = null
  clientHelper.getProperties().then((properties) => {
    contractorHelper.getLatestContractor().then((contractors) => {
      res.render('index', { index: true, logout: true, properties, contractors });
    })
  })
});

module.exports = router;