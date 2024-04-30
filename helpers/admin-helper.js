var db = require('../db/admin-db');
var contractorDb = require('../db/contractor-db')
var clinetDb = require('../db/client-db')
const bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectId

module.exports = {
    login: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection('signup').findOne({ email: userData.email })
            if (admin) {
                bcrypt.compare(userData.password, admin.password).then((status) => {
                    if (status) {
                        console.log('Login succes');
                        response.admin = admin
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

    getContractorProfile: () => {
        return new Promise(async (resolve, reject) => {
            let profiles = await contractorDb.get().collection('profile').find().toArray()
            resolve(profiles)
        })
    },

    getContractorName: () => {
        return new Promise(async (resolve, reject) => {
            let contractorDetails = await contractorDb.get().collection('signup').find().toArray()
            resolve(contractorDetails)
        })
    },

    getContractorDetails: async () => {
        try {
            const profile = await contractorDb.get().collection('profile').find().toArray();
            const signup = await contractorDb.get().collection('signup').find().toArray();

            return { profile, signup };
        } catch (error) {
            throw new Error('Error fetching chat messages: ' + error.message);
        }
    },

    approveContractor: (thisObject) => {
        return new Promise(async (resolve, reject) => {
            const result = await db.get().collection('approvedContractor').insertOne({
                id: thisObject.id,
                companyName: thisObject.companyName,
                phoneNumber: thisObject.phoneNumber,
                alternateNumber: thisObject.alternateNumber,
                workStatus: thisObject.workStatus,
                name: thisObject.name,
                email: thisObject.email,
                class: thisObject.class
            });
            resolve(true);
        });
    },

    deleteFromProfile: (thisEmail) => {
        return new Promise(async (resolve, reject) => {
            contractorDb.get().collection('profile').deleteOne({ email: thisEmail.email })
            resolve(true)
        })
    },

    getApprovedContractor: () => {
        return new Promise(async (resolve, reject) => {
            let approvedContractor = await db.get().collection('approvedContractor').find().toArray()
            if (approvedContractor) {
                resolve(approvedContractor)
            } else {
                resolve(false)
            }
        })
    },


    rejectContractor: (thisObject) => {
        return new Promise(async (resolve, reject) => {
            const result = await db.get().collection('rejectedContractor').insertOne({
                id: thisObject.id,
                companyName: thisObject.companyName,
                phoneNumber: thisObject.phoneNumber,
                alternateNumber: thisObject.alternateNumber,
                workStatus: thisObject.workStatus,
                name: thisObject.name,
                email: thisObject.email,
                reason: thisObject.reason
            });
            resolve(true);
        });
    },

    getRejectedContractor: () => {
        return new Promise(async (resolve, reject) => {
            let rejectedContractor = await db.get().collection('rejectedContractor').find().toArray()
            if (rejectedContractor) {
                resolve(rejectedContractor)
            } else {
                resolve(false)
            }
        })
    },

    getClientRequest: () => {
        return new Promise(async (resolve, reject) => {
            let request = await clinetDb.get().collection('profile').find().toArray()
            resolve(request)
        })
    },

    approveClient: (thisObject) => {
        return new Promise(async (resolve, reject) => {
            const result = await db.get().collection('approvedClient').insertOne({
                id: thisObject.id,
                name: thisObject.name,
                email: thisObject.email
            });
            resolve(true);
        });
    },

    rejectClient: (thisObject) => {
        return new Promise(async (resolve, reject) => {
            const result = await db.get().collection('approvedClient').insertOne({
                id: thisObject.id,
                name: thisObject.name,
                email: thisObject.email
            });
            resolve(true);
        });
    },

    getContractorCount: () => {
        return new Promise(async (resolve, reject) => {
            let contractor = await db.get().collection('approvedContractor').find().toArray()
            // console.log(contractor);
            resolve(contractor)
        })
    },

    getClientCount: () => {
        return new Promise(async (resolve, reject) => {
            let client = await db.get().collection('approvedClient').find().toArray()
            resolve(client)
        })
    },

    getPropertiesCount: () => {
        return new Promise(async (resolve, reject) => {
            let properties = await clinetDb.get().collection('propeties').find().toArray()
            resolve(properties)
        })
    }
    
};