const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const ServerError = require('../utility/error');
const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;

const options = { discriminatorKey: 'kind' };

// Represents a user of the system
const AccountSchema = new Schema({
    // Name of the user
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: String,

    email: { type: String, required: true, unique: true },          // Email address used to log in
    password: String,                                               // bcrypt-encoded password
    photo: Buffer,                                                  // Profile image (Image blob)
    photoType: String,                                              // MIME type of image blob stored in `photo`
    joined: { type: Date, required: true, default: Date.now },      // Join date
    activated: { type: Boolean, required: false, default: false },  // Account is activated upon registration and confirmation
    inactive: { type: Boolean, required: true, default: false },    // Whether account can log in
    accessCode: String,                                             // Access code given stuff
    locked: { type: Boolean, default: false },                      // Unknown purpose
    status: String,                                                 // Unknown purpose
    grade: String,
    remarks: String,

    schedule: [{ format: String, name: String, value: SchemaTypes.Mixed, uploaded: { type: Date, default: Date.now} }]
}, options);

AccountSchema.pre('save', function(next) {
    const account = this;
    if (account.password && (this.isModified('password') || this.isNew)) {
        bcrypt.hash(account.password, 10, function(err, hash) {
            if (err) return next(err);
            account.password = hash;
            next();
        });
    } else {
        return next();
    }
});

AccountSchema.statics.hashPassword = async function(rawPassword) {
    return await bcrypt.hash(rawPassword, 10)
}

AccountSchema.statics.verifyPassword = async function(inputPassword, encodedPassword) {
    return await bcrypt.compare(inputPassword, encodedPassword)
}

AccountSchema.statics.authenticate = async function(email, password) {
    const query = { email };

    try {
        const account = await User.findOne(query);
        console.log(account);
        if (!account) throw new ServerError(401, 'error.auth.invalid_credentials', 'Invalid email/password');
        
        if (await bcrypt.compare(password, account.password)) {
            if (!account.activated) throw new ServerError(401, 'error.auth.not_activated', 'Account is not activated');
            return account;
        }
        
        throw new ServerError(401, 'error.auth.invalid_credentials', 'Invalid email/password');
    } catch (error) {
        throw error;
    }
}

const User = mongoose.model('Account', AccountSchema);

const Student = User.discriminator('Student', AccountSchema);
const Faculty = User.discriminator('Faculty', AccountSchema);
const Administrator = User.discriminator('Administrator', AccountSchema);

module.exports = {
    User,
    Student,
    Faculty,
    Administrator
};
