const Account = require('../models/Account');

module.exports.initialize = async function() {
    const admin = await Account.Administrator.findOne({ idnum: 'admin' });
    if (!admin) {
        const superad = await Account.Administrator.create({
            idnum: 'admin',
            lastName: 'Admin',
            firstName: 'Admin',
            email: 'admin@example.com',
            password: 'thesis!',
            activated: true,
        });
        const facu = await Account.Faculty.create({
            lastName: 'Faculty',
            firstName: 'Faculty',
            email: 'faculty@example.com',
            password: 'thesis!',
            activated: true,
        });
        const stud = await Account.Student.create({
            lastName: 'Student',
            firstName: 'Student',
            email: 'student@example.com',
            password: 'thesis!',
            activated: true,
        });

        if (!process.env.NODE_ENV || process.env.NODE_ENV.trim() !== 'development') return;

        const users = [
            {
                lastName: 'Chair',
                firstName: 'Admin',
                email: 'chair@example.com',
                type: 'Administrator',
            },
            {
                lastName: 'Secretary',
                firstName: 'Admin',
                email: 'secretary@example.com',
                type: 'Administrator',
            },
            {
                lastName: 'Doe',
                firstName: 'John',
                email: 'john.doe@example.com',
                type: 'Faculty',
            },
            {
                lastName: 'Doe',
                firstName: 'Jane',
                email: 'jane.doe@example.com',
                type: 'Faculty',
            },
            {
                lastName: 'Smith',
                firstName: 'John',
                email: 'john.smith@example.com',
                type: 'Faculty',
            },
            {
                lastName: 'Smith',
                firstName: 'Jane',
                email: 'jane.smith@example.com',
                type: 'Faculty',
            },
            { lastName: 'Graham', firstName: 'Leanne', email: 'student1@example.com' },
            { lastName: 'Howell', firstName: 'Ervin', email: 'student2@example.com' },
            { lastName: 'Bauch', firstName: 'Clementine', email: 'student3@example.com' },
            { lastName: 'Lebsack', firstName: 'Patricia', email: 'student4@example.com' },
            { lastName: 'Dietrich', firstName: 'Chelsey', email: 'student5@example.com' },
            { lastName: 'Schulist', firstName: 'Dennis', email: 'student6@example.com' },
            { lastName: 'Weissnat', firstName: 'Kurtis', email: 'student7@example.com' },
            { lastName: 'Runolfsson', firstName: 'Nicholas V', email: 'student8@example.com' },
            { lastName: 'Reichert', firstName: 'Glenna', email: 'student9@example.com' },
            { lastName: 'DuBuque', firstName: 'Clementina', email: 'student10@example.com' },
        ];

        const userObjs = await Promise.all(users.map(e => {
            let schema = Account.Student;
            if (e.type === 'Administrator') schema = Account.Administrator;
            if (e.type === 'Faculty') schema = Account.Faculty;

            return schema.create({
                idnum: e.idnum,
                lastName: e.lastName,
                firstName: e.firstName,
                email: e.email
            });
        }));
    }
}
