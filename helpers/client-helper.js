var db = require('../db/client-db');
const bcrypt = require('bcrypt');
var admindb = require('../db/admin-db')
var contractorDb = require('../db/contractor-db')


module.exports = {
    signUp: (userData, callback) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection('signup').insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    login: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let client = await db.get().collection('signup').findOne({ email: userData.email })
            if (client) {
                bcrypt.compare(userData.password, client.password).then((status) => {
                    if (status) {
                        console.log('Login succes');
                        response.client = client
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("Login failed");
                resolve({ status: false })
            }
        })
    },

    clientRequires: (userData, clientSession, callback) => {
        return new Promise(async (resolve, reject) => {
            cleintEmail = clientSession.email
            userData.email = cleintEmail
            db.get().collection('requires').insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },

    getApprovedContractor: () => {
        return new Promise(async (resolve, reject) => {
            let approvedContractor = await admindb.get().collection('approvedContractor').find().toArray()
            let portfolio = await contractorDb.get().collection('portfolio').find().toArray()
            let feedbacks = await db.get().collection('feedback').find().toArray()

            // console.log(feedback);

            approvedContractor.forEach(approved => {
                approved.feedback = [];
                feedbacks.forEach(feedback => {
                    if (feedback.contractorEmail === approved.email) {
                        approved.feedback.push(feedback);
                    }
                });
            });
            

            approvedContractor.forEach(approved => {
                let matchingPortfolio = portfolio.find(portfolio => portfolio.email === approved.email);
                if (matchingPortfolio) {
                    approved.portfolio = matchingPortfolio;
                }
            });
            if (approvedContractor) {
                resolve(approvedContractor)
                console.log(approvedContractor);
            } else {
                resolve(false)
            }
        })
    },

    addProfile: (profile, client, callback) => {
        const clientName = client.name;
        const clientEmail = client.email;
        profile.name = clientName;
        profile.email = clientEmail;
        db.get().collection('profile').insertOne(profile).then(data => {
            const insertedId = data?.insertedId?.toString();
            callback(insertedId);
        });
    },

    getProjectDetails: (client) => {
        return new Promise(async (resolve, reject) => {
            let projectDetails = await db.get().collection('requires').find({ email: client.email }).toArray()
            if (projectDetails.length > 0) {
                // console.log("here from details");
                // console.log(projectDetails);
                resolve(projectDetails)
            } else {
                console.log('not here')
                resolve(false)
            }
        })
    },

    checkInProfile: (clientEmail, callback) => {
        return new Promise(async (resolve, reject) => {
            let status = await db.get().collection('profile').findOne({ email: clientEmail });
            if (status) {
                resolve(status)
            } else {
                resolve(false)
            }
        })
    },

    checkInRequires: (clientEmail, callback) => {
        return new Promise(async (resolve, reject) => {
            let status = await db.get().collection('requires').findOne({ email: clientEmail });
            if (status) {
                resolve(status)
            } else {
                resolve(false)
            }
        })
    },

    isApproved: (clientEmail, callback) => {
        return new Promise(async (resolve, reject) => {
            let status = await admindb.get().collection('approvedClient').findOne({ email: clientEmail });
            if (status) {
                resolve(status)
            } else {
                resolve(false)
            }
        })
    },

    getPortfolio: () => {
        return new Promise(async (resolve, reject) => {
            let portfolio = await contractorDb.get().collection('portfolio').find().toArray()
            if (portfolio) {
                resolve(portfolio)
            } else {
                resolve(false)
            }
        })
    },

    sendRequest: (contractormail, client) => {
        return new Promise(async (resolve, reject) => {
            let already = await contractorDb.get().collection('proposals').findOne({ clientEmail: client.email, contractorEmail: contractormail })
            console.log(already);
            if (already) {
                resolve(false)
            } else {
                let owned = {
                    contractorEmail: contractormail,
                    clientEmail: client.email
                };
                contractorDb.get().collection('proposals').insertOne(owned).then(data => {
                    resolve(true)
                });
            }
        })
    },

    isFinished: (client) => {
        return new Promise(async (resolve, reject) => {
            let isFinished = await contractorDb.get().collection('finished').findOne({ clientEmail: client.email })
            resolve(isFinished)
        })
    },

    addProperty: (userData, client) => {
        return new Promise(async (resolve, reject) => {
            cleintEmail = client.email
            userData.email = cleintEmail
            db.get().collection('propeties').insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },

    getProperties: (client) => {
        return new Promise(async (resolve, reject) => {
            let properties = await db.get().collection('propeties').find({ email: { $ne: client.email } }).toArray();
            if (properties) {
                resolve(properties)
            } else {
                resolve(false)
            }
        })
    },

    getOwnProperties: (client) => {
        return new Promise(async (resolve, reject) => {
            let ownProperties = await db.get().collection('propeties').find({ email: client.email }).toArray();
            if (ownProperties) {
                resolve(ownProperties)
            } else {
                resolve(false)
            }
        })
    },

    checkAuthority: (client) => {
        return new Promise(async (resolve, reject) => {
            let adminChecked = await admindb.get().collection('approvedClient').findOne({ email: client.email })

            if (adminChecked) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    },

    getProfileId: (clientEmail) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.get().collection('profile').findOne({ email: clientEmail })
            console.log("here is the profile" + profile);
            if (profile) {
                resolve(profile)
            } else {
                resolve(false)
            }
        })
    },

    updateSignup: (client, userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)

            console.log("here from");
            console.log(userData);

            let profileIn = await db.get().collection('signup').find({ email: client.email }).toArray()

            if (profileIn.length > 0) {
                db.get().collection('signup').updateOne(
                    { email: client.email },
                    { $set: userData }
                );
                resolve(true)
            }
        })
    },

    checkInSignup: (client) => {
        return new Promise(async (resolve, reject) => {
            let ifHave = await db.get().collection('signup').findOne({ email: client.email })

            if (ifHave) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    },

    getOwnedContractor: (client) => {
        return new Promise(async (resolve, reject) => {
            let ownedContractor = await admindb.get().collection('contracted').find({ clientEmail: client.email }).toArray()


            if (ownedContractor.length > 0) {
                // you can only access like this [0] if you get the data into an array 
                let thisEmail = ownedContractor[0].contractoEmail
                let contractor = await admindb.get().collection('approvedContractor').find({ email: thisEmail }).toArray()
                let portfoio = await contractorDb.get().collection('portfolio').find({ email: thisEmail }).toArray()
                // let profile = await contractorDb.get().collection('profile').find({ email: thisEmail }).toArray()

                let thisObject

                if (contractor.length > 0 && portfoio.length > 0) {
                    thisObject = [
                        {
                            // id: profile[0]._id,
                            companyName: contractor[0].companyName,
                            phoneNumber: contractor[0].phoneNumber,
                            alternateNumber: contractor[0].alternateNumber,
                            workStatus: contractor[0].workStatus,
                            name: contractor[0].name,
                            class: contractor[0].class,
                            projectName: portfoio[0].projectName,
                            startDate: portfoio[0].startDate,
                            endDate: portfoio[0].endDate,
                            category: portfoio[0].category,
                            type: portfoio[0].type,
                            budget: portfoio[0].budget,
                            decription: portfoio[0].decription,
                            buisinessName: portfoio[0].buisinessName,
                            Experience: portfoio[0].Experience,
                            worth: portfoio[0].worth,
                            totalProjects: portfoio[0].totalProjects,
                            finished: portfoio[0].finished,
                            ongoing: portfoio[0].ongoing,
                            education: portfoio[0].education,
                            licenceNumber: portfoio[0].licenceNumber,
                            langauge1: portfoio[0].langauge1,
                            country: portfoio[0].country,
                            state: portfoio[0].state,
                            city: portfoio[0].city,
                            address: portfoio[0].address,
                            email: portfoio[0].email
                        }
                    ]
                    resolve(thisObject)
                    console.log('one')
                } else if (contractor.length > 0) {
                    thisObject = [
                        {
                            // id: profile[0]._id,
                            companyName: contractor[0].companyName,
                            phoneNumber: contractor[0].phoneNumber,
                            alternateNumber: contractor[0].alternateNumber,
                            workStatus: contractor[0].workStatus,
                            name: contractor[0].name,
                            class: contractor[0].class,
                            email: thisEmail
                        }
                    ]
                    resolve(thisObject)
                    console.log('two')
                } else if (portfoio.length > 0) {
                    thisObject = [
                        {
                            projectName: portfoio[0].projectName,
                            startDate: portfoio[0].startDate,
                            endDate: portfoio[0].endDate,
                            category: portfoio[0].category,
                            type: portfoio[0].type,
                            budget: portfoio[0].budget,
                            decription: portfoio[0].decription,
                            buisinessName: portfoio[0].buisinessName,
                            Experience: portfoio[0].Experience,
                            worth: portfoio[0].worth,
                            totalProjects: portfoio[0].totalProjects,
                            finished: portfoio[0].finished,
                            ongoing: portfoio[0].ongoing,
                            education: portfoio[0].education,
                            licenceNumber: portfoio[0].licenceNumber,
                            langauge1: portfoio[0].langauge1,
                            country: portfoio[0].country,
                            state: portfoio[0].state,
                            city: portfoio[0].city,
                            address: portfoio[0].address,
                            email: portfoio[0].email
                        }
                    ]
                    resolve(thisObject)
                    console.log('three')
                } else {
                    resolve(false)
                    console.log(false)
                }
            } else {
                resolve(false)
            }
        })
    },

    storeFeedback: (client, userData) => {
        return new Promise(async (resolve, reject) => {

            let contracted = await admindb.get().collection('contracted').find().toArray();

            contracted.forEach(contractor => {
                if (contractor.clientEmail === client.email) {
                    console.log("yes have");
                    console.log(contractor);
                    userData.contractorEmail = contractor.contractoEmail
                }
            });
            

            const currentTime = new Date();
            const day = currentTime.getDate().toString().padStart(2, '0');
            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
            const year = currentTime.getFullYear();

            // formated date 
            const formattedDate = `${day} - ${month} - ${year}`;
            // formated time 
            const formattedCurrentTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });


            userData.email = client.email
            userData.name = client.name
            userData.date = formattedDate
            userData.time = formattedCurrentTime
            db.get().collection('feedback').insertOne(userData)
        })
    },

    getTimelines: (client) => {
        return new Promise(async (resolve, reject) => {
            let timelines = await contractorDb.get().collection('timeline').find({ clientEmail: client.email }).toArray();
            let requires = await db.get().collection('requires').find({ email: client.email }).toArray();

            if (requires.length > 0) {
                if (requires[0].startDate) {
                    timelines.forEach(timeline => {
                        timeline.startDate = requires[0].startDate;
                    });
                }
                if (requires[0].endDate) {
                    timelines.forEach(timeline => {
                        timeline.endDate = requires[0].endDate;
                    });
                }
            }

            console.log(timelines);
            if (timelines) {
                resolve(timelines);
            } else {
                resolve(false);
            }
        });
    },

    getProperties: () => {
        return new Promise(async (resolve, reject) => {
            let properties = await db.get().collection('propeties').find().toArray();
            // console.log(properties.length);
            if (properties) {
                var latestThree = [
                    properties[properties.length - 1],
                    properties[properties.length - 2],
                    properties[properties.length - 3]
                ]
                resolve(latestThree)
            } else {
                resolve(false)
            }
        })
    },

    checkPassword: (userData, cleintEmail) => {
        console.log(userData.currentPassword);
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let client = await db.get().collection('signup').findOne({ email: cleintEmail })
            let newPassword = await bcrypt.hash(userData.newPassword, 10)
            if (client) {
                bcrypt.compare(userData.currentPassword, client.password).then((status) => {
                    if (status) {
                        console.log(newPassword);
                        db.get().collection('signup').updateOne(
                            { email: cleintEmail },
                            { $set: { password: newPassword } }
                        );
                        console.log('Correct Password');
                        response.client = client
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Incorrect Password here");
                        resolve(false)
                    }
                })
            }
        })
    }
};
