var db = require('../db/chat-db');
var clientDb = require('../db/client-db')
var ObjectId = require('mongodb').ObjectId

module.exports = {
    putclientChat: (userData, client, contractorEmail, contractorName) => {
        return new Promise(async (resolve, reject) => {
            const currentTime = new Date();
            const formattedCurrentTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const connection = client.email + ' - ' + contractorEmail
            userData.clientSendedTime = formattedCurrentTime
            userData.sendedTime = formattedCurrentTime
            userData.sender = client.email
            userData.reciever = contractorEmail

            let couple = await db.get().collection('chat').findOne({ connection: connection })

            // console.log(couple._id);

            if (couple) {
                await db.get().collection('chat').updateOne(
                    { _id: couple._id },
                    { $push: { chats: userData } }
                );
                resolve(couple)
            } else {
                db.get().collection('chat').insertOne({
                    _id: new ObjectId(),
                    connection: connection,
                    clientName: client.name,
                    clientEmail: client.email,
                    contractorName: contractorName,
                    contractorEmail: contractorEmail,
                    chats: [
                        userData
                    ]
                }).then((data) => {
                    resolve(data)
                })
            }


        })
    },

    putcontractorChat: (userData, contractor, clientEmail, clientName) => {
        return new Promise(async (resolve, reject) => {
            const currentTime = new Date();
            const formattedCurrentTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const connection = clientEmail + ' - ' + contractor.email
            userData.contractorSendedTime = formattedCurrentTime
            userData.sendedTime = formattedCurrentTime
            userData.sender = contractor.email
            userData.reciever = clientEmail

            let forTakeId = await clientDb.get().collection('profile').findOne({ email: clientEmail })

            let couple = await db.get().collection('chat').findOne({ connection: connection })

            // console.log("here is " + couple.chats);

            if (couple) {
                await db.get().collection('chat').updateOne(
                    { _id: couple._id },
                    { $push: { chats: userData } }
                );
                resolve(couple)
            } else if (couple && couple.chats.length == 0 ) {
                // console.log("heloo");
            } else {
                db.get().collection('chat').insertOne({
                    _id: new ObjectId(),
                    connection: connection,
                    clientName: clientName,
                    clientEmail: clientEmail,
                    clientProfileId: forTakeId._id,
                    contractorName: contractor.name,
                    contractorEmail: contractor.email,
                    chats: [
                        userData
                    ]
                }).then((data) => {
                    resolve(data)
                })
            }


        })
    },

    getAllmessages: (client) => {
        return new Promise(async (resolve, reject) => {
            let allChats = await db.get().collection('chat').find({ clientEmail: client.email }).toArray();
            if (allChats) {
                resolve(allChats)
            }
        })
    },

    getContractorAllmessages: (contractor) => {
        return new Promise(async (resolve, reject) => {
            let allChats = await db.get().collection('chat').find({ contractorEmail: contractor.email }).toArray();
            if (allChats) {
                resolve(allChats)
                console.log("this contractor mesage allchats");
                console.log(allChats);
            }
        })
    },

    addToChat: (chatData) => {
        return new Promise(async (resolve, reject) => {
            const currentTime = new Date();
            const formattedCurrentTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const connection = chatData.clientEmail + ' - ' + chatData.contractorEmail

            let forTakeId = await clientDb.get().collection('profile').findOne({ email: chatData.clientEmail })

            db.get().collection('chat').insertOne({
                _id: new ObjectId(),
                connection: connection,
                clientName: chatData.clientName,
                clientEmail: chatData.clientEmail,
                clientProfileId: forTakeId._id,
                contractorName: chatData.contractorName,
                contractorEmail: chatData.contractorEmail,
                chats: [

                ]
            }).then((data) => {
                resolve(data)
            })

        })
    },


    getWithThisEmail: (clientEmail, contractorEmail) => {
        let thisConnection = clientEmail + ' - ' + contractorEmail
        return new Promise(async (resolve, reject) => {
            let allChats = await db.get().collection('chat').find({ connection: thisConnection }).toArray();
            if (allChats) {
                resolve(allChats)
            }
        })
    }

};