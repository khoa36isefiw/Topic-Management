const jwt = require('jsonwebtoken')

/**
 * Reads the token from the authorization header.
 * 
 * @param {import('express').Request} req Incoming request
 * @param {import('express').Response} res Outgoing response (used in case of error)
 * @param {import('express').NextFunction} next Next function to run
 */
async function requireToken(req, res, next) {
    let rawToken = '';
    let accessToken = {};
    
    // Retrieve the authorization header
    const header = req.headers['authorization'];
    if (header) {
        // Authorization header exists

        // Ensure it is a Bearer token
        if (!header.startsWith('Bearer')) {
            return res.status(401).json({
                message: 'Invalid authorization header'
            });
        }
    
        // Get the bearer token (the second part)
        const token = header.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Invalid access token'
            });
        }

        rawToken = token;
    } else if (req.cookies) {
        // Use http cookie instead

        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                message: 'Missing authorization header or cookie'
            });
        }

        rawToken = token;
    } else {
        return res.status(401).json({
            message: 'Missing authorization header or cookie'
        });
    }

    try {
        const token = jwt.verify(rawToken, 'secret');
        req.token = token.data;
        req.token.kind = req.token.kind.toLowerCase();
    } catch (err) {
        return res.status(401).json({
            message: 'Cannot decode token',
            details: err
        });
    }

    // Run the next middleware or function
    next();
}

module.exports = requireToken;
