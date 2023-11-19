const mongoose = require('mongoose');

/**
 * Ensure that the password is provided in the header
 */
async function transacted(req, res, next) {
    const session = await mongoose.startSession();
    req.session = session;

    

    res.on('finish', async () => {
        await session.endSession();
    });

    // Run the next middleware or function
    next();
}

module.exports = transacted;
