const express = require('express');
const jwt = require('jsonwebtoken');
const transacted = require('../middleware/transacted');
const ServerError = require('../utility/error');
const Account = require('../models/Account');
const requireToken = require('../middleware/requireToken');

const AccountController = express.Router();

function buildTokenInfo(account) {
    const validity = Number.parseInt(process.env.SESSION_VALIDITY || 60);
    return {
        exp: Math.floor(Date.now() / 1000) + (60 * validity),
        data: {
            accountID: account._id.toString(),
            /*userID: account.idnum,*/
            kind: account.kind,
            lastName: account.lastName,
            firstName: account.firstName,
        }
    };
}

AccountController.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email) throw new ServerError(400, 'error.validation.email', 'Email required', { field: 'email' });
        if (!password) throw new ServerError(400, 'error.validation.password', 'Password required', { field: 'password' });

        const user = await Account.User.authenticate(email, password);
        const tokenInfo = buildTokenInfo(user);
        const token = jwt.sign(tokenInfo,'secret');

        return res.json({
            token: token,
            data: tokenInfo.data
        });
    } catch (error) {
        return res.error(error, 'Could not sign in.');
    }
});

AccountController.post('/auth/code', async (req, res) => {
    const { email, code, password, repeat } = req.body;

    try {
        let complete = false;
        if (!email) throw new ServerError(400, 'error.validation.email', 'Email required', { field: 'email' });
        if (!code) throw new ServerError(400, 'error.validation.code', 'Code required', { field: 'code' });
        if (password) {
            complete = true;
            if (password !== repeat) throw new ServerError(400, 'error.validation.password_mismatch', 'Password mismatch', { field: 'repeat' });
        }

        const user = await Account.User.findOne({ email, accessCode: code });
        if (!user) throw new ServerError(401, 'Invalid access code or email');

        user.password = password;
        user.activated = true;
        await user.save();

        return res.sendStatus(204);
    } catch (error) {
        return res.error(error, 'Could not sign in.');
    }
});

AccountController.post('/auth/token', requireToken, async (req, res) => {
    return res.json(req.token);
});

AccountController.post('/auth/register', transacted, async (req, res) => {
    const { body, session } = req;
    const { userID, email } = body;

    try {
        session.startTransaction();
        if (!email) throw new ServerError(400, 'error.validation.email', 'Email required', { field: 'email' });

        const user = await Account.User.findOne({ email });
        if (user) {
            const validity = Number.parseInt(process.env.VERIFICATION_VALIDITY || 10);
            const token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * validity),
                data: { userID, email }
            }, 'secret');
        }

        await session.commitTransaction();
        return res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        return res.error(error, 'Could not register account.');
    }
});

AccountController.post('/auth/verify', async (req, res) => {
    const { password, repeat, token } = req.body;
    
    try {
        if (!token) throw new ServerError(400, 'error.auth.no_token', 'Token required');
        if (!password) throw new ServerError(400, 'error.validation.password', 'Password required', { field: 'password' });
        if (password !== repeat) throw new ServerError(400, 'error.validation.password_mismatch', 'Password mismatch', { field: 'repeat' });

        const { data } = jwt.verify(token, 'secret');
        const user = await Account.User.findOne({ /*idnum: data.userID,*/ email: data.email });
        if (!user) throw new ServerError(401, 'error.auth.verify_not_present', 'User does not exist');

        user.password = password;
        user.activated = true;
        await user.save();
        return res.sendStatus(204);
    } catch (error) {
        return res.error(error, 'Could not complete account registration.');
    }
});

module.exports = AccountController;
