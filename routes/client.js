var express = require('express');
const app = express(); //temp not it
var router = express.Router();
var clientHelper = require('../helpers/client-helper')
var chatHelper = require('../helpers/chat.helper');
var contractorHelper = require('../helpers/contractor-helper');
const { render, response } = require('../app');
const adminHelper = require('../helpers/admin-helper');
const { log } = require('handlebars');
var fileUpload = require('express-fileupload')

// file upload 
router.use(fileUpload());

// verify login 
const verifyLogin = (req, res, next) => {
  if (req.session.client && req.session.client.loggedIn) {
    next()
  } else {
    res.redirect('account')
  }
}

// verify is logged in and prevent to going to previous page
const isLoggedIn = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (req.session.client) {
    res.redirect('/client/home');
  } else {
    next();
  }
};

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// client account 
router.get('/account', isLoggedIn, (req, res) => {
  if (req.session.loggedIn) {
    let client = req.session.client
    res.render('client/home', { clientHome: true, client })
  } else {
    res.render('account/account', { account: true, client: true })
  }
})

// account creation 
router.post('/signup', (req, res) => {
  clientHelper.checkInSignup(req.body).then((ifHave) => {
    if (ifHave) {
      res.render('account/account', { account: true, client: true, already: "Account is already exist" })
    } else {
      clientHelper.signUp(req.body).then((response) => {
        if (response) {
          res.render('account/account', { account: true, client: true, popup: true })
        }
      })
    }
  })
});

// account updation
router.post('/update-signup', (req, res) => {
  let client = req.session.client
  // console.log(req.body);
  clientHelper.updateSignup(client, req.body).then((response) => {
    if (response) {
      res.redirect('home')
    }
  })
})

// login 
router.get('/login', verifyLogin, (req, res) => {
  let client = req.session.client
  res.render('client/home', { clientHome: true, client })
})

router.post('/login', (req, res) => {
  clientHelper.login(req.body).then((response) => {
    if (response.status) {
      req.session.client = response.client
      req.session.client.loggedIn = true;
      res.redirect('home')
    } else {
      res.render('account/account', { account: true, client: true, logginErr: "Invalid email or password" })
      loggedIn = false
    }
  })
})
// login ends 


// client home 
router.get('/home', verifyLogin, (req, res) => {
  chatPosted = false
  let client = req.session.client
  clientHelper.getProfileId(client.email).then((profile) => {
    clientHelper.isFinished(client).then((isFinished) => {
      if (isFinished) {
        res.render('client/home', { clientHome: true, client, isFinished })
      } else {
        let hasProfile = profile._id
        console.log("here from " + hasProfile);
        res.render('client/home', { clientHome: true, client, hasProfile })
      }
    })
  })
})

//client requires 
router.get('/requires', verifyLogin, (req, res) => {
  let client = req.session.client
  clientHelper.checkInProfile(client.email).then((inProfile) => {
    clientHelper.checkInRequires(client.email).then((inRequires) => {
      clientHelper.isApproved(client.email).then((isApproved) => {
        if (inProfile && inRequires && isApproved) {
          // res.send("Submitted Already")
          res.render('client/submitted', { submitted: true })
        } else if (inProfile && !inRequires && isApproved) {
          res.render('client/requires', { requires: true, client });
        } else if (inProfile && !isApproved) {
          res.render('client/submitted', { waitFor: true })
        } else if (!inProfile && !inRequires && !isApproved) {
          res.render('client/client-authorise', { clientAuthorise: true })
        } else {
          res.send('error')
        }
      })
    })
  })
})

// authorise the client 
router.post('/authorise', verifyLogin, (req, res) => {
  let client = req.session.client;
  clientHelper.addProfile(req.body, client, (id) => {
    if (req.files.clientProfile) {
      let profilePhoto = req.files.clientProfile;
      profilePhoto.mv('./public/client_data/' + id + 'profile.jpg', (err, done) => {
      });
    }
    if (req.files.reciept) {
      let reciept = req.files.reciept
      reciept.mv('./public/client_data/' + id + 'reciept.jpg', (err, done) => {
      });
    }
    clientHelper.isApproved(client.email).then((isApproved) => {
      if (isApproved) {
        res.render('client/requires', { requires: true, client });
      } else {
        // res.send('Wait for admin authorisation')// this authorise
        res.render('client/submitted', { waitFor: true })
      }
    })
  });
});


router.post('/requires', (req, res) => {
  let client = req.session.client
  clientHelper.clientRequires(req.body, client).then((response) => {
    if (response) {
      res.redirect('home')
    }
  })
})

var chatPosted = false

// client chat 
router.get('/chat', (req, res) => {
  let client = req.session.client;
  clientHelper.checkAuthority(client).then((result) => {
    if (result) {
      chatHelper.getAllmessages(client).then((allChats) => {
        if (allChats.length > 0 && allChats[0].chats.length > 0) {
          let findLast = allChats[0].chats[allChats[0].chats.length - 1];
          if (findLast.clientMessage) {
            var lastMessage = findLast.clientMessage
          } else {
            var lastMessage = findLast.contractorMessage
          }
          var lastTime = findLast.sendedTime

          if (chatPosted) {
            console.log("yes this is");
            console.log(lastMessage + 'this is last mesage');
            res.render('chat/chat', { chat: true, clientChat: true, client, allChats, lastMessage, lastTime, clientSended: true });
          } else {
            res.render('chat/chat', { chat: true, clientChat: true, client, allChats, lastMessage, lastTime });
          }
        } else {
          res.render('chat/chat', { chat: true, clientChat: true, client, allChats });
        }
      });
    } else {
      res.render('client/start-first', { caution: "Don't try to be too clever.", message: "Ensure you have proper authorization before proceeding." })
    }
  })
});


let storedData = {}
// chat middile to store the sender that contractor details to identify the chat connection
router.post('/chat-middle', (req, res) => {
  var thisObject = {
    contractorEmail: req.body.email,
    contractorName: req.body.name
  }
  storedData = thisObject
})

// chat post 
router.post('/chat', (req, res) => {
  chatPosted = true
  // console.log(chatPosted);
  let client = req.session.client
  chatHelper.putclientChat(req.body, client, storedData.contractorEmail, storedData.contractorName).then((response) => {
    res.redirect('/client/chat')
  })
})

// client project
router.get('/project', verifyLogin, (req, res) => {
  let client = req.session.client
  let clientEmail = client.email
  clientHelper.checkAuthority(client).then((result) => {
    if (result) {
      clientHelper.getApprovedContractor().then((approvedContractor) => {
        clientHelper.getProjectDetails(client).then((projectDetails) => {
          clientHelper.getPortfolio().then((portfoio) => {
            clientHelper.getOwnedContractor(client).then((ownedContractor) => {
              clientHelper.getProfileId(client.email).then((profile) => {
                let hasProfile = profile._id
                // console.log(ownedContractor);
                if (ownedContractor) {
                  let contractorEmail = ownedContractor.email
                  res.render('client/project', { project: true, approvedContractor, projectDetails, client, portfoio, ownedContractor, clientEmail, contractorEmail, hasProfile })
                  console.log("top here");
                } else {
                  console.log("bottom here");
                  res.render('client/project', { project: true, approvedContractor, projectDetails, client, portfoio, clientEmail, hasProfile })
                }
              })
            })
          })
        })
      })
    } else {
      res.render('client/start-first', { caution: "Don't try to be too clever.", message: "Ensure you have proper authorization before proceeding." })
    }
  })
})

// own the contractor 
router.get('/own-contractor/:email', (req, res) => {
  let contractorEmail = req.params.email
  console.log(contractorEmail);
  let client = req.session.client
  clientHelper.sendRequest(contractorEmail, client).then((result) => {
    if (result) {
      res.render('client/submitted', { requestToContractor: true })
    } else {
      res.render('client/submitted', { alreadyContracted: true })
    }
  })
})


// client property 
router.get('/property', verifyLogin, (req, res) => {
  let client = req.session.client
  clientHelper.checkAuthority(client).then((result) => {
    if (result) {
      clientHelper.getProperties(client).then((properties) => {
        clientHelper.getOwnProperties(client).then((ownProperty) => {
          res.render('client/property', { property: true, properties, ownProperty })
          console.log(properties);
        })
      })
    } else {
      res.render('client/start-first', { caution: "Don't try to be too clever.", message: "Ensure you have proper authorization before proceeding." })
    }
  })
})

//add property
router.post('/add-property', (req, res) => {
  let client = req.session.client
  let email = client.email
  if (req.files.propertyImage) {
    let propertyImage = req.files.propertyImage;
    propertyImage.mv('./public/property-data/' + email + 'propertyImage.jpg', (err, done) => {
    });
  }

  if (req.files.propertyVideo) {
    let propertyVideo = req.files.propertyVideo;
    propertyVideo.mv('./public/property-data/' + email + 'propertyVideo.mp4', (err, done) => {
    });
  }

  if (req.files.propertyReciept) {
    let propertyReciept = req.files.propertyReciept;
    propertyReciept.mv('./public/property-data/' + email + 'landReciept.jpg', (err, done) => {
    });
  }

  clientHelper.addProperty(req.body, client).then((result) => {
    res.redirect('property')
  })
})

//project timeline tracker
router.get('/project-timeline', verifyLogin, (req, res) => {
  let client = req.session.client
  clientHelper.getTimelines(client).then((timelines) => {
    res.render('client/project-timeline', { timeline: true, timelines })
  })
})

router.get('/report', verifyLogin, (req, res) => {
  res.render('client/submitted', { report: true })
})

//client feedback
router.post('/feedback', (req, res) => {
  let client = req.session.client
  clientHelper.storeFeedback(client, req.body)
})

router.post('/update-password', verifyLogin, (req, res) => {
  let client = req.session.client
  clientHelper.checkPassword(req.body, client.email).then((isValid) => {
    if (isValid) {
      res.redirect('/client/home')
      console.log("VALID");
    } else {
      console.log("INVALID");
      chatPosted = false
      clientHelper.getProfileId(client.email).then((profile) => {
        clientHelper.isFinished(client).then((isFinished) => {
          if (isFinished) {
            res.render('client/home', { clientHome: true, client, isFinished })
          } else {
            let hasProfile = profile._id
            console.log("here from " + hasProfile);
            res.render('client/home', { clientHome: true, client, hasProfile, passwordIncorrect: "Old password is incorrect try again" })
          }
        })
      })
    }
  })
})

router.get('/not-the-function', verifyLogin, (req, res) => {
  res.render('client/submitted', { report: true })
})

// logout 
router.get('/logout', (req, res) => {
  req.session.client = null
  clientHelper.getProperties().then((properties) => {
    console.log(properties);
    contractorHelper.getLatestContractor().then((contractors) => {
      res.render('index', { index: true, logout: true, properties, contractors });
    })
  })
});

module.exports = router;