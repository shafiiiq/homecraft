var db = require('../db/contractor-db');
var clientDb = require('../db/client-db');
var adminDb = require('../db/admin-db')
var contractorDb = require('../db/contractor-db')
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt')

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
            let contractor = await db.get().collection('signup').findOne({ email: userData.email })
            if (contractor) {
                bcrypt.compare(userData.password, contractor.password).then((status) => {
                    if (status) {
                        console.log('Login succes');
                        response.contractor = contractor
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

    addProfile: (profile, contractor, callback) => {
        const contractorName = contractor.name;
        const contractorEmail = contractor.email;
        profile.name = contractorName;
        profile.email = contractorEmail;
        db.get().collection('profile').insertOne(profile).then(data => {
            const insertedId = data?.insertedId?.toString();
            callback(insertedId);
        });
    },

    getStatus: (contractorEmail) => {
        return new Promise(async (resolve, reject) => {
            let contractorStatus = await db.get().collection('profile').findOne({ email: contractorEmail });
            let adminStatus = await adminDb.get().collection('approvedContractor').findOne({ email: contractorEmail });
            if (contractorStatus || adminStatus) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    },

    addPortfolio: (contractor, userData) => {
        return new Promise(async (resolve, reject) => {
            userData.email = contractor.email
            db.get().collection('portfolio').insertOne(userData).then(data => {
                resolve(true)
            });
        })
    },

    // getProposal: (contractor) => {
    //     return new Promise(async (resolve, reject) => {
    //         let proposals = await db.get().collection('proposals').find({ contractorEmail: contractor.email }).toArray();
    //         resolve(proposals);
    //     });
    // },

    getProposal: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let proposals = await db.get().collection('proposals').find({ contractorEmail: contractor.email }).toArray();
            let requires = await clientDb.get().collection('requires').find().toArray()
            let profile = await clientDb.get().collection('profile').find().toArray()
            proposals.forEach(proposal => {
                let matchingRequires = requires.find(require => require.email === proposal.clientEmail);
                if (matchingRequires) {
                    proposal.requires = matchingRequires;
                }
            });
            proposals.forEach(proposal => {
                let matchingProfile = profile.find(profile => profile.email === proposal.clientEmail);
                if (matchingProfile) {
                    proposal.profile = matchingProfile;
                }
            });
            if (proposals) {
                resolve(proposals)
            } else {
                resolve(false)
            }
        })
    },

    makeContract: (userData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('contracted').insertOne(userData).then(data => {
                adminDb.get().collection('contracted').insertOne(userData).then(data => {
                    resolve(true)
                });
            });
        })
    },

    getContracted: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let list = await db.get().collection('contracted').find({ contractoEmail: contractor.email }).toArray();
            let profiles = await clientDb.get().collection('profile').find().toArray();
            let timelines = await contractorDb.get().collection('timeline').find().toArray();


            //get formated time for compare
            const currentTime = new Date();
            const day = currentTime.getDate().toString().padStart(2, '0'); // Get day and ensure it's two digits
            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0'); // Get month and ensure it's two digits 
            const year = currentTime.getFullYear(); // Get full year

            const formattedDate = `${day} - ${month} - ${year}`;
            console.log(formattedDate);

            list.forEach(obj => {
                timelines.forEach(timeline => {
                    if (timeline.clientEmail === obj.clientEmail && timeline.date === formattedDate) {

                        let matchingObj = list.find(item => item.clientEmail === timeline.clientEmail);
                        if (matchingObj) {
                            list = list.filter(item => item !== matchingObj);
                        }
                    }
                });
            });

            list.forEach(obj => {
                let profile = profiles.find(profile => profile.email === obj.clientEmail);
                if (profile) {
                    obj.id = profile._id;
                }
            });
            resolve(list);
        });
    },

    getContractedList: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let list = await db.get().collection('contracted').find({ contractoEmail: contractor.email }).toArray();
            let profiles = await clientDb.get().collection('profile').find().toArray();

            list.forEach(obj => {
                let profile = profiles.find(profile => profile.email === obj.clientEmail);
                if (profile) {
                    obj.id = profile._id;
                }
            });
            resolve(list);
        });
    },

    finished: (clientEmail) => {
        return new Promise(async (resolve, reject) => {
            let data = {
                _id: new ObjectId(),
                clientEmail: clientEmail
            }
            console.log(data);
            db.get().collection('finished').insertOne(data).then(data => {
                resolve(true)
            });
        })
    },

    deleteFromProposal: (thisEmail) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('proposal').deleteOne({ email: thisEmail.email })
            resolve(true)
        })
    },


    getProfile: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let profileIn = await db.get().collection('profile').find({ email: contractor.email }).toArray()
            let profilePassed = await adminDb.get().collection('approvedContractor').find({ email: contractor.email }).toArray()
            if (profileIn.length > 0) {
                resolve(profileIn)
                console.log('from profile');
            } else if (profilePassed.length > 0) {
                resolve(profilePassed)
                console.log('from approved');
            } else {
                resolve(false)
            }
        })
    },


    updateProfile: (contractor, userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {

            let profileIn = await db.get().collection('profile').find({ email: contractor.email }).toArray()
            let profilePassed = await adminDb.get().collection('approvedContractor').find({ email: contractor.email }).toArray()

            if (profileIn.length > 0) {
                console.log("2");
                db.get().collection('profile').updateOne(
                    { email: contractor.email },
                    { $set: userData }
                );
                resolve(true)
            }

            if (profilePassed.length > 0) {
                console.log("3");
                adminDb.get().collection('approvedContractor').updateOne(
                    { email: contractor.email },
                    { $set: userData }
                );
                resolve(true)
            }
        })
    },

    checkInSignup: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let ifHave = await db.get().collection('signup').findOne({ email: contractor.email })

            if (ifHave) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    },

    ejectAll: (email) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection('contracted').deleteOne({ clientEmail: email })
            await db.get().collection('proposals').deleteOne({ clientEmail: email })
            resolve(true)
        })
    },

    projectTimeline: (contractorEmail, clientEmail) => {
        console.log("this ckkkj" + clientEmail);
        const currentTime = new Date();
        const day = currentTime.getDate().toString().padStart(2, '0'); // Get day and ensure it's two digits
        const month = (currentTime.getMonth() + 1).toString().padStart(2, '0'); // Get month and ensure it's two digits
        const year = currentTime.getFullYear(); // Get full year

        const months = {
            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",
            7: "July",
            8: "August",
            9: "September",
            10: "October",
            11: "November",
            12: "December"
        };

        const formattedDate = `${day} - ${month} - ${year}`;
        const formattedCurrentTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        let userData = {
            contractorEmail: contractorEmail,
            clientEmail: clientEmail,
            day: day,
            month: months[parseInt(month)],
            year: year,
            time: formattedCurrentTime,
            date: formattedDate
        };

        return new Promise(async (resolve, reject) => {
            const existingData = await db.get().collection('timeline').find({
                contractorEmail: contractorEmail,
                clientEmail: clientEmail
            }).toArray();

            console.log(existingData);

            let dataExists = false;

            existingData.forEach(item => {
                if (item.date === formattedDate) {
                    dataExists = true;
                }
            });

            if (dataExists) {
                // If data with the same date exists, do not store
                resolve(false);
            } else {
                // If no data with the same date exists, store the new data
                db.get().collection('timeline').insertOne(userData).then(data => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            }
        });

    },

    getFeedback: async (contractor) => {
        let checkIn = await adminDb.get().collection('contracted').find({ contractoEmail: contractor.email }).toArray();
        let feedbackData = await clientDb.get().collection('feedback').find({}).toArray();
        let profile = await clientDb.get().collection('profile').find({}).toArray();

        let matchedObjects = [];

        checkIn.forEach(checkInObj => {
            let clientEmail = checkInObj.clientEmail;
            let matchedFeedback = feedbackData.filter(feedbackObj => feedbackObj.email === clientEmail);
            matchedFeedback.forEach(feedback => {
                // Find the profile of the client to get their _id
                let clientProfile = profile.find(profileObj => profileObj.email === clientEmail);
                if (clientProfile) {
                    // Add the _id to the feedback object
                    feedback.id = clientProfile._id;
                    matchedObjects.push(feedback);
                }
            });
        });

        console.log(matchedObjects);

        return matchedObjects;
    },



    getLatestContractor: () => {
        return new Promise(async (resolve, reject) => {
            let contractors = await adminDb.get().collection('approvedContractor').find().toArray();
            let portfolios = await adminDb.get().collection('approvedContractor').find().toArray();


            if (portfolios.length == 0) {
                resolve(false)
            } else if (portfolios.length == 1) {
                let latestFour = [
                    portfolios[portfolios.length - 1]
                ];
                resolve(latestFour);
            } else if (portfolios.length == 2) {
                let latestFour = [
                    portfolios[portfolios.length - 1],
                    portfolios[portfolios.length - 2]
                ];
                resolve(latestFour);
            }
            else if (portfolios.length == 3) {
                let latestFour = [
                    portfolios[portfolios.length - 1],
                    portfolios[portfolios.length - 2],
                    portfolios[portfolios.length - 3]
                ];
                resolve(latestFour);
            }
            else if (portfolios.length == 4) {
                let latestFour = [
                    portfolios[portfolios.length - 1],
                    portfolios[portfolios.length - 2],
                    portfolios[portfolios.length - 3],
                    portfolios[portfolios.length - 4],
                ];
                resolve(latestFour);
            }
        });
    }





};