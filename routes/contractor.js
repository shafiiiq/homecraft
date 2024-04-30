var express = require('express');
var router = express.Router();
var contractorHelper = require('../helpers/contractor-helper');
const chatHelper = require('../helpers/chat.helper');
const { verify } = require('crypto');
const { log } = require('console');
var fileUpload = require('express-fileupload');
const clientHelper = require('../helpers/client-helper');

// file  upload 
router.use(fileUpload());


// verify login middleware 
const contractorLogin = (req, res, next) => {
  if (req.session.contractor && req.session.contractor.loggedIn) {
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

  if (req.session.contractor) {
    res.redirect('/contractor/home');
  } else {
    next();
  }
};


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/account', isLoggedIn, (req, res) => {
  if (req.session.loggedIn) {
    let contractor = req.session.contractor
    res.render('contractor/contractor', { contractorHome: true, contractor })
  } else {
    res.render('account/account', { account: true, contractor: true });
  }
});

router.post('/signup', (req, res) => {
  contractorHelper.checkInSignup(req.body).then((ifHave) => {
    if (ifHave) {
      res.render('account/account', { account: true, client: true, already: "Account is already exist" })
    } else {
      contractorHelper.signUp(req.body).then((response) => {
        if (response) {
          res.render('account/account', { account: true, contractor: true, popup: true })
        }
      })
    }
  })
});

router.post('/login', (req, res) => {
  contractorHelper.login(req.body).then((response) => {
    if (response.status) {
      req.session.contractor = response.contractor
      req.session.contractor.loggedIn = true;
      res.redirect('home')
    } else {
      res.render('account/account', { account: true, contractor: true, logginErr: "Invalid email or password" })
      loggedIn = false
    }
  })
})

router.get('/home', contractorLogin, (req, res) => {
  chatPostedContractor = false
  let contractor = req.session.contractor
  contractorHelper.getProposal(contractor).then((proposal) => {
    contractorHelper.getContracted(contractor).then((list) => {
      let listCount = list.length
      let count = proposal.length
      res.render('contractor/contractor', { contractorHome: true, contractor, count, listCount })
    })
  })
})

router.get('/home-popup', contractorLogin, (req, res) => {
  let contractor = req.session.contractor
  res.render('contractor/contractor', { contractorHome: true, submitProfile: true, contractor })
})

router.get('/add-profile', contractorLogin, (req, res) => {
  let contractor = req.session.contractor
  contractorHelper.getStatus(contractor.email).then((result) => {
    console.log(result);
    contractorHelper.getProfile(contractor).then((profile) => {
      console.log(profile);
      if (result && profile) {
        res.render('contractor/submitted', { profile, submitted: true });
      } else {
        res.render('contractor/add-profile', { contractorProfile: true });
      }
    })
  })
});


router.post('/add-profile', (req, res) => {
  let contractor = req.session.contractor
  contractorHelper.addProfile(req.body, contractor, (id) => {
    let contractorLicence = req.files.contractorLicence;
    let supervisorLicence = req.files.supervisorLicence;
    let wiremanLicence = req.files.wiremanLicence;
    let profilePhoto = req.files.profilePhoto;
    contractorLicence.mv('./public/contractor_data/' + id + 'contractor.jpg', (err, done) => {
      supervisorLicence.mv('./public/contractor_data/' + id + 'supervisor.jpg', (err, done) => {
        wiremanLicence.mv('./public/contractor_data/' + id + 'wireman.jpg', (err, done) => {
          profilePhoto.mv('./public/contractor_data/' + contractor.email + 'profile.jpg', (err, done) => {
            if (!err) {
              contractor._id = false;
              res.render('contractor/submitted-popup', { submittedPupup: true })
            }
          })
        })
      })
    })
  });
});

// update profile 
router.post('/update-profile', (req, res) => {
  let contractor = req.session.contractor
  contractorHelper.updateProfile(contractor, req.body).then((response) => {
    if (response) {
      res.send('updated')
    }
  })
})

var chatPostedContractor = false

var thisEmail;

router.get('/chat', contractorLogin, (req, res) => {
  let contractor = req.session.contractor
  // const clientEmail = passEmail()
  if (thisEmail) {
    chatHelper.getContractorAllmessages(contractor).then((allChats) => {
      chatHelper.getWithThisEmail(thisEmail, contractor.email).then((thisEmailChats) => {
        if (chatPostedContractor == true) {
          // console.log(chatPostedContractor);
          // let contractorSended = true
          res.render('chat/chat', { chat: true, contractorChat: true, contractor, allChats, contractorSended: true, thisEmailChats });
          // chatPostedContractor = false;
        } else {
          res.render('chat/chat', { chat: true, contractorChat: true, contractor, thisEmailChats, allChats });
        }
      })
    })
  } else {
    chatHelper.getContractorAllmessages(contractor).then((allChats) => {
      if (chatPostedContractor == true) {
        // console.log(chatPostedContractor);
        // let contractorSended = true
        res.render('chat/chat', { chat: true, contractorChat: true, contractor, allChats, contractorSended: true });
        chatPostedContractor = false;
      } else {
        res.render('chat/chat', { chat: true, contractorChat: true, contractor, allChats });
      }
    })
  }
})

// chat middile to store the sender that contractor details to identify the chat connection
let storedData = {}
router.post('/chat-middle', (req, res) => {
  var thisObject = {
    clientEmail: req.body.email,
    clientName: req.body.name
  }
  storedData = thisObject
})


function callToTakeChat(email) {
  const clientEmail = email
  // console.log(clientEmail + 'note that this is email');
  thisEmail = clientEmail
  // passEmail(clientEmail)
}

router.post('/chat', (req, res) => {
  chatPostedContractor = true;
  callToTakeChat(storedData.clientEmail)
  let contractor = req.session.contractor
  chatHelper.putcontractorChat(req.body, contractor, storedData.clientEmail, storedData.clientName).then((response) => {
    chatHelper.getContractorAllmessages(contractor).then((allChats) => {
      if (allChats) {
        let findLast = allChats[0].chats[allChats[0].chats.length - 1];
        if (findLast.clientMessage) {
          var lastMessage = findLast.clientMessage
        } else {
          var lastMessage = findLast.contractorMessage
        }
        var lastTime = findLast.sendedTime
        res.redirect('/contractor/chat')
      } else {
        console.log("error from chat post not allChats object");
      }
    });
  })
})


router.get('/portfolio', contractorLogin, (req, res) => {
  res.render('contractor/portfolio', { portfolio: true })
})

router.post('/portfolio', (req, res) => {
  let contractor = req.session.contractor
  let email = contractor.email
  contractorHelper.addPortfolio(contractor, req.body,).then((portfolio) => {
    let video = req.files.video;
    video.mv('./public/portfolio_video/' + email + 'Video.mp4', (err, done) => {
      res.redirect("/contractor/home")
    })
  })
})


router.get('/proposal', (req, res) => {
  let contractor = req.session.contractor
  contractorHelper.getProposal(contractor).then((proposals) => {
    console.log(proposals);
    res.render('contractor/proposal', { proposal: true, proposals })
  })
})

let takeThisClientEmail

// make contract 
router.post('/make-contract', (req, res) => {
  let contractor = req.session.contractor
  var thisObject = {
    clientEmail: req.body.email,
    contractoEmail: contractor.email
  }

  var chatData = {
    clientEmail: req.body.email,
    clientName: req.body.name,
    contractorEmail: contractor.email,
    contractorName: contractor.name
  }

  takeThisClientEmail = thisObject.clientEmail

  contractorHelper.makeContract(thisObject).then((result) => {
    chatHelper.addToChat(chatData).then((result) => {
      contractorHelper.deleteFromProposal(chatData.clientEmail).then((result) => {
        res.render('contractor/contracted', { contracted: true })
      })
    })
  })
})

// send project data 
router.get('/project-data', (req, res) => {
  res.render('contractor/project-data', { projectData: true })
})

router.post('/project-data', (req, res) => {
  let contractor = req.session.contractor
  let planGf = req.files.planGf;
  let planTf = req.files.planTf;
  let model1 = req.files.model1;
  let model2 = req.files.model2;
  let model3 = req.files.model3;
  let contractForum = req.files.contractForum;
  let email = takeThisClientEmail
  console.log(email);
  planGf.mv('./public/project_data/' + email + 'planGf.jpg', (err, done) => {
    planTf.mv('./public/project_data/' + email + 'planTf.jpg', (err, done) => {
      model1.mv('./public/project_data/' + email + 'model1.jpg', (err, done) => {
        model2.mv('./public/project_data/' + email + 'model2.jpg', (err, done) => {
          model3.mv('./public/project_data/' + email + 'model3.jpg', (err, done) => {
            contractForum.mv('./public/project_data/' + email + 'contractForum.jpg', (err, done) => {
              res.send('sended')
            })
          })
        })
      })
    })
  });
});

// contractor action 
router.get('/action', async (req, res) => {
  let contractor = req.session.contractor;
  let list = await contractorHelper.getContractedList(contractor);
  console.log(list);
  res.render('contractor/action', { action: true, list });
});

router.get('/action:email', async (req, res) => {
  let clientEmail = req.params.email.replace(':', '');
  console.log(clientEmail);
  let contractor = req.session.contractor;
  let list = await contractorHelper.getContracted(contractor);

  contractorHelper.finished(clientEmail).then((result) => {
    contractorHelper.ejectAll(clientEmail).then((result) => {
      res.render('contractor/action', { action: true, list });
    })
  })
});

router.get('/feedback', (req, res) => {
  let contractor = req.session.contractor;
  contractorHelper.getFeedback(contractor).then((feedbacks) => {
    console.log(feedbacks);
    res.render('contractor/feedbacks', { feedback: true, feedbacks })
  })
})

router.get('/create-proposal', (req, res) => {
  res.render('contractor/submitted', { createProposal: true })
});

// contractor account logout
router.get('/logout', (req, res) => {
  req.session.contractor = null
  clientHelper.getProperties().then((properties) => {
    contractorHelper.getLatestContractor().then((contractors) => {
      res.render('index', { index: true, logout: true, properties, contractors });
    })
  })
});

module.exports = router;