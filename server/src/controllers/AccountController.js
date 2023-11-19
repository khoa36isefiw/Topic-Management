const express = require('express');
const Account = require('../models/Account');
const requireToken = require('../middleware/requireToken');
const transacted = require('../middleware/transacted');
const ServerError = require('../utility/error');
const multer = require('multer');
const sharp = require('sharp');
const randomjs = require('random-js');
const crypto = require('crypto');
const isQueryTrue = require('../utility/isQueryTrue');
const mongoose = require('mongoose');

const AccountController = express.Router();
const upload = multer();

AccountController.get('/account', async (req, res) => {
    const { type, q, all, findDuplicates, showActive } = req.query;
    const token = req.token;
   
    try {
        let schema = Account.User;
        switch (type) {
            case 'administrator': schema = Account.Administrator; break;
            case 'faculty': schema = Account.Faculty; break;
            case 'student': schema = Account.Student; break;
        }
        const isAdmin = 'administrator';
        // if (findDuplicates) {
        //     if (!isAdmin) throw new ServerError(403, 'Only administrators can use this query parameter');

        //     const emails = Buffer.from(findDuplicates, 'base64url').toString().split(/;/);
        //     const duplicates = await Account.User.find({ email: { $in: emails } });
        //     return res.json(duplicates.map(e => ({
        //         _id: e._id,
        //         email: e.email,
        //         lastName: e.lastName,
        //         firstName: e.firstName,
        //     })));
        // }

        const $and = [];
        const $or = [];

        let query = {};
        if (q) {
            $or.push({ lastName:  { $regex: q, $options: 'i' } });
            $or.push({ firstName:  { $regex: q, $options: 'i' } });
        }

        /*if (!isQueryTrue(all)) {
            $and.push({ $or: [{ inactive: false }, { inactive: null }] });
        }*/

        if (showActive) {
            if (showActive === 'inactive') {
                $and.push({ inactive: true });
            }
        } else {
            $and.push({ $or: [{ inactive: false }, { inactive: null }] });
        }

        if ($or.length > 0) $and.push({ $or });
        if ($and.length > 0) query.$and = $and;

        const results = await schema.find(query).sort('lastName firstName');
        return res.json(results.map(e => ({
            _id: e._id,
            /*idnum: isAdmin ? e.idnum : undefined,*/
            lastName: e.lastName,
            firstName: e.firstName,
            middleName: e.middleName,
            kind: e.kind.toLowerCase(),
            accessCode: isAdmin ? e.accessCode : undefined,
            inactive: e.inactive || false
        })));
    } catch (error) {
        return res.error(error, 'Cannot get accounts');
    }
});

AccountController.get('/account/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.token;
    
    try {
        const isAdmin =  'administrator';
        const canSeePrivate = isAdmin;

        const result = await Account.User.findById(id);
        return res.json({
            _id: result._id,
            /*idnum: isAdmin ? result.idnum : undefined,*/
            lastName: result.lastName,
            firstName: result.firstName,
            middleName: result.middleName,
            kind: result.kind.toLowerCase(),
            email: canSeePrivate ? result.email : undefined,
            accessCode: isAdmin ? result.accessCode : undefined,
            joined: result.joined,
            schedule: canSeePrivate ? (result.schedule || []) : undefined
        });
    } catch (error) {
        return res.error(error, 'Cannot get account');
    }
});

AccountController.delete('/account/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.token;
    
    try {
        const isAdmin ='administrator';
        if (!isAdmin) throw new ServerError(403, 'Only administrators can delete accounts');

        const account = await Account.User.findById(id);
        if (!account) throw new ServerError(404, 'Account not found');

        if (account.kind.toLowerCase() === 'administrator') throw new ServerError(403, 'Cannot remove administrator account');
        await Account.User.updateOne({ _id: id }, { inactive: true });
        return res.sendStatus(204);
    } catch (error) {
        return res.error(error, 'Cannot get account');
    }
});

function seedFromAccount(account, salt) {
    const hasher = crypto.createHash('sha256');
    hasher.update(account._id.toString());
    hasher.update(account.lastName);
    hasher.update(account.firstName);
    hasher.update(salt || '');
    const buffer = hasher.digest();
    const ibuf = new Int32Array(buffer, 0, 1);
    return ibuf[0];
}

function randomColor(seed) {
    const engine = randomjs.MersenneTwister19937.seed(seed);
    const distribution = randomjs.integer(75, 180);
    
    function randomNumber() {
        return distribution(engine);
    }

    function toHex(num) {
        const hex = num.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }

    const r = randomNumber();
    const g = randomNumber();
    const b = randomNumber();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

AccountController.get('/account/:id/image', async (req, res) => {
    const { id } = req.params;
    const { thumbnail, size, width, height } = req.query;
    
    try {
        const result = await Account.User.findById(id);
        if (!result) throw new ServerError(404, 'error.account.no_account', 'Account not found.');
        
        let nWidth = Number.parseInt(width);
        let nHeight = Number.parseInt(height);
        let nSize = Number.parseInt(size);
        
        if (!nSize) {
            nSize = isQueryTrue(thumbnail) ? 48 : 216;
        }
        
        if (!nWidth || !nHeight) {
            nWidth = nSize;
            nHeight = nSize;
        }

        const background = randomColor(seedFromAccount(result, ''));

        let photo = result.photo;
        let mime = 'image/jpeg';
        if (!photo) {
            const { lastName, firstName } = result;
            const lastInitial = lastName[0].toUpperCase();
            const firstInitial = firstName[0].toUpperCase();
            mime = 'image/png';

            const spacing = 36 / 72 * nHeight;

            const svg = `
            <svg width="${nWidth}" height="${nHeight}" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .title {
                        fill: white;
                        font-size: ${spacing}px;
                        font-family: sans-serif;
                    }
                </style>
                <text
                    x="50%"
                    y="50%"
                    dy="0.3125em"
                    text-anchor="middle"
                    class="title"
                >
                    ${firstInitial + lastInitial}
                </text>
            </svg>
            `;

            const svgBuffer = Buffer.from(svg);
            const avatar = sharp({
                create: {
                    width: nWidth,
                    height: nHeight,
                    channels: 3,
                    background
                }
            }).composite([
                { input: svgBuffer }
            ]);
        
            photo = await avatar.png().toBuffer();
        } else {
            if (nSize) {
                photo = await sharp(photo)
                    .resize(nWidth, nHeight)
                    .jpeg()
                    .toBuffer();
            } else if (nSize) {
                photo = await sharp(photo)
                    .jpeg()
                    .toBuffer();
            }
        }
        
        return res
            .header('Content-Type', mime)
            .header('Cache-Control', 'public, max-age=3600')
            .send(photo);
    } catch (error) {
        return res.error(error, 'Cannot get account');
    }
});

const TYPES = ['student', 'faculty', 'administrator'];

AccountController.post('/account', async (req, res) => {
    const { body, session } = req;

    // Always expect a 1-D array of account entries
    let entries = [body];
    if (Array.isArray(body)) entries = body;

    const token = req.token;
    const errors = [];
    
    try {
        const results = [];
    
        const distribution = randomjs.integer(1, 999999);

        for (let i = 0; i < entries.length; i++) {
            const { email, lastName, firstName, middleName, password, kind } = entries[i];
            if (!email) errors.push({ fieldName: 'email', index: i, message: 'Email address is required' });
            if (!lastName) errors.push({ fieldName: 'lastName', index: i, message: 'Last name is required' });
            if (!firstName) errors.push({ fieldName: 'firstName', index: i, message: 'First name is required' });
            if (!TYPES.includes(kind.toLowerCase())) errors.push({ fieldName: 'kind', index: i, message: 'Invalid account type' });
            if (errors.length > 0) throw new ServerError(400, 'Form error', errors);
    
            let schema = Account.User;
            switch (kind.toLowerCase()) {
                case 'administrator': schema = Account.Administrator; break;
                case 'faculty': schema = Account.Faculty; break;
                case 'student': schema = Account.Student; break;
            }

            const other = await schema.findOne({ email }) // This is the only way to detect duplicate emails
            if (other) {
                // we've found a duplicate
                results.push({
                    _id: other._id,
                    email: other.email,
                    lastName: other.lastName,
                    firstName: other.firstName,
                    middleName: other.middleName,
                    kind: other.kind,
                    accessCode: other.accessCode,
                    status: 'duplicate'
                });
            } else {
                const seed = seedFromAccount({
                    _id: '000000000000000000000000',
                    lastName,
                    firstName,
                }, '')
                const engine = randomjs.MersenneTwister19937.seed(seed);
    
                const result = await schema.create([{
                    email,
                    lastName,
                    firstName,
                    middleName,
                    password: password || (kind.toLowerCase() !== 'student' ? 'thesis!' : undefined),
                    activated: kind.toLowerCase() !== 'student',
                    accessCode: distribution(engine).toString().padStart(6, '0')
                }]);
    
                results.push({
                    _id: result._id,
                    email,
                    lastName,
                    firstName,
                    middleName,
                    kind,
                    accessCode: result.accessCode,
                    status: 'created'
                });
            }
        }

       

        if (results.length === 1) {
            const result = results[0];
            return res.status(201).location(`/account/${result._id}`).json(result);
        } else {
            return res.status(200).json(results);
        }
    } catch (error) {
        return res.error(error, 'Cannot create account');
    }
});

AccountController.patch('/account/:id', upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    const token = req.token;

    try {
        const isAdmin = 'administrator';
        const isCurrentUser = id;

        const account = await Account.User.findById(id);
        if (!account) throw new ServerError(404, 'Account not found');

        if (isAdmin) {
            const { lastName, firstName, middleName, newPassword } = req.body;
            if (lastName) account.lastName = lastName;
            if (firstName) account.firstName = firstName;
            if (middleName) account.middleName = middleName;
            account.password = newPassword;
        } else if (isCurrentUser) {
            const { currentPassword, newPassword, retypePassword } = req.body;
            if (newPassword) {
                if (!currentPassword) throw new ServerError(400, 'error.validation.current_password', 'Current password is required');
                if (!retypePassword) throw new ServerError(400, 'error.validation.retype_password', 'Password must be retyped');
                if (newPassword !== retypePassword) throw new ServerError(400, 'error.validation.password_mismatch', 'Password mismatch');
    
                if (!await Account.User.verifyPassword(currentPassword, account.password))
                    throw new ServerError(400, 'error.auth.invalid_password', 'Password is incorrect');
    
                account.password = newPassword;
            }

            if (req.file) {
                const photoFile = req.file;
                account.photo = photoFile.buffer;
                account.photoType = photoFile.mimetype;
            }
        }

        if (isAdmin) {

        }

        await account.save();


        return res.sendStatus(204);
    } catch (error) {
        return res.error(error, 'Cannot get account');
    }
});

AccountController.patch('/account/:id/schedule', async (req, res) => {
    const { body, session } = req;
    const { id } = req.params;
    const token = req.token;

    try {

        const account = await Account.User.findById(id);
        if (!account) throw new ServerError(404, 'Account not found');

        let schedules = [...account.schedule] || [];
        console.log(schedules);
        console.log(body);
        for (const entry of body) {
            if (entry.action === 'add') {
                schedules.push({
                    format: entry.format,
                    value: entry.value,
                    name: entry.name
                });
            } else if (entry.action === 'remove') {
                schedules = schedules.filter(e => e._id.toString() !== entry._id.toString());
            }
            // TODO: update
        }
        console.log(schedules);
        account.schedule = schedules;
        await account.save();

        return res.sendStatus(204);
    } catch (error) {
        return res.error(error, 'Cannot change account schedule');
    }
});

module.exports = AccountController;
