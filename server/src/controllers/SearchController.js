const express = require('express');
const requireToken = require('../middleware/requireToken');
const Account = require('../models/Account');
const Thesis = require('../models/Thesis');
const ServerError = require('../utility/error');

const SearchController = express.Router();

SearchController.get('/', requireToken, async (req, res) => {
    const { q } = req.query;

    try {
        if (!q) throw new ServerError(400, 'Search query is required');

        const results = [];

        {
            const query = {};
            query.title = { $regex: q, $options: 'i' };
    
            const theses = (await Thesis.find(query).populate('authors').populate('advisers'))
                .map(e => ({
                    type: 'thesis',
                    key: e.title,
                    value: {
                        _id: e._id,
                        title: e.title,
                        description: e.description,
                        authors: e.authors.map(e2 => ({
                            _id: e2._id,
                            lastName: e2.lastName,
                            firstName: e2.firstName,
                            middleName: e2.middleName
                        })),
                        advisers: e.advisers.map(e2 => ({
                            _id: e2._id,
                            lastName: e2.lastName,
                            firstName: e2.firstName,
                            middleName: e2.middleName
                        })),
                        status: e.status
                    }
                }));
            
            results.push(...theses);
        }

        {
            const query = {};
            query.$or = [
                { lastName:  { $regex: q, $options: 'i' } },
                { firstName: { $regex: q, $options: 'i' } },
            ];
    
            const accounts = (await Account.User.find(query))
                .map(e => ({
                    type: 'account',
                    key: `${e.lastName}, ${e.firstName}`,
                    value: {
                        _id: e._id,
                        lastName: e.lastName,
                        firstName: e.firstName,
                        middleName: e.middleName
                    }
                }));
            
            results.push(...accounts);
        }

        return res.json(results);
    } catch (error) {
        return res.error(error);
    }
});

module.exports = SearchController;
