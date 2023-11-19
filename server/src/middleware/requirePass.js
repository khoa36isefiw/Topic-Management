const Account = require('../models/Account');
const ServerError = require('../utility/error');

/**
 * Ensure that the password is provided in the header
 */
async function requirePass(req, res, next) {
    // Retrieve the token (requires requireToken)
    const { token } = req;
    if (!token) {
        return res.status(401).json({
            message: 'Token required'
        });
    }
    
    // Retrieve the password from the header
    const password = req.get('x-password-reentry');
    if (!password) {
        return res.status(401).json({
            message: 'Password required'
        });
    }

    try {
        const account = await Account.User.findById(token.accountID);
        if (!account) throw new ServerError(500, 'Missing account');
        
        if (!await Account.User.verifyPassword(password, account.password)) {
            throw new ServerError(401, 'Invalid credentials');
        }
    } catch (err) {
        return res.error(err, 'Could not process password');
    }

    // Run the next middleware or function
    next();
}

module.exports = requirePass;
