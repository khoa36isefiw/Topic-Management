const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let isOpen = false;
let mongo = null;

module.exports.connect = async function(url) {
    await mongoose.connect(url);
}

module.exports.startSession = async function() {
    return await mongoose.startSession();
}

module.exports.close = async function() {
    if (!isOpen) return;

    await mongoose.connection.close();
    if (mongo) {
        await mongo.stop();
        mongo = null;
    }

    isOpen = false;
}
