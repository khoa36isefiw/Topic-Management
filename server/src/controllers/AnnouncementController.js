const express = require('express');
const requirePass = require('../middleware/requirePass');
const requireToken = require('../middleware/requireToken');
const transacted = require('../middleware/transacted');
const Announcement = require('../models/Announcement');
const Thesis = require('../models/Thesis');
const AnnouncementRead = require('../models/AnnouncementRead');
const ServerError = require('../utility/error');
const isQueryTrue = require('../utility/isQueryTrue');

const AnnouncementController = express.Router();

AnnouncementController.get('/announcement', async (req, res) => {
    const { accountID, kind } = req.token;
    const { all, items, page } = req.query;

    try {
        const query = {};
        const $and = [];
        if (!isQueryTrue(all)) {
            const allRead = await AnnouncementRead.find({ account: accountID });
            $and.push({ _id: { $nin: allRead.map(e => e.announcement.toString()) } });

            const now = Date.now();
            $and.push({ $or: [ { from: null }, { from: { $lt: now } } ] });
            $and.push({ $or: [ { to: null }, { to: { $gt: now } } ] });
        }

        if (!isQueryTrue(all) || kind !== 'administrator') {
            if (kind === 'student') {
                const thesis = await Thesis.findOne({ authors: accountID });
                if (thesis) {
                    $and.push({ $or: [{ filterPhase: null }, { filterPhase: thesis.phase }] });
                } else {
                    $and.push({ filterPhase: null });
                }
            }
            //$and.push({ filterTypes: kind });
        }

        if ($and.length > 0) query.$and = $and;
        
        const count = await Announcement.countDocuments(query);
        let isPaginated = false;
        let nItems = 10;
        let nPage = 1;
        let nTotalPages = 1;
        if (items || page) {
            isPaginated = true;
            nItems = Number.parseInt(items) || nItems;
            nPage = Number.parseInt(page) || nPage;

            nTotalPages = Math.floor((count - 1) / nItems) + 1;
            if (nPage > nTotalPages) {
                nPage = nTotalPages;
            } else if (nPage < 1) {
                nPage = 1;
            }
        }

        if (count === 0) {
            let empty = { items: [] };
            if (isPaginated) {
                empty = {
                    page: 1,
                    maxPages: 1,
                    items: [],
                    total: 0
                };
            }

            return res.json(empty);
        }

        let announcementsQuery = Announcement.find(query).sort({ sent: 'desc' }).populate('author').select('-author.photo');
        if (isPaginated) {
            announcementsQuery = announcementsQuery.skip((nPage - 1) * nItems).limit(nItems);
        }

        const announcements = await announcementsQuery;

        const results = {
            items: announcements.map(e => ({
                _id: e._id,
                author: {
                    _id: e.author._id,
                    lastName: e.author.lastName,
                    firstName: e.author.firstName,
                    middleName: e.author.middleName
                },
                title: e.title,
                text: e.text,
                from: e.from,
                to: e.to,
                phase: e.filterPhase,
                sent: e.sent
            }))
        };

        if (isPaginated) {
            results.page = nPage;
            results.totalPages = nTotalPages;
            results.total = count;
        }

        return res.json(results);
    } catch (error) {
        return res.error(error);
    }
});

AnnouncementController.post('/announcement', async (req, res) => {
    const { session } = req;
    const { accountID, kind, lastName, firstName, middleName } = req.token;
    const { title, text, from, to, phase } = req.body;

    try {
        session.startTransaction();
        if (kind !== 'administrator') throw new ServerError(403, 'You must be an administrator to create announcements');

        const announcement = await Announcement.create({
            author: accountID,
            title,
            text,
            from,
            to,
            filterPhase: phase
        });

        await session.commitTransaction();

        return res.status(201).location(`/announcement/${announcement._id}`).json({
            _id: announcement._id,
            author: {
                _id: accountID,
                lastName,
                firstName,
                middleName
            },
            text,
            sent: announcement.sent
        })
    } catch (error) {
        await session.abortTransaction();
        return res.error(error);
    }
});

AnnouncementController.post('/announcement/:id/read',  async (req, res) => {
    const { session } = req;
    const { id } = req.params;
    const { accountID } = req.token;

    try {
        session.startTransaction();

        await AnnouncementRead.create({ announcement: id, account: accountID });
        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        return res.sendStatus(204); // It is not an error if this happens
    }
});

AnnouncementController.put('/announcement/:id',  async (req, res) => {
    const { session } = req;
    const { id } = req.params;
    const { kind } = req.token;
    const { title, text, from, to, phase } = req.body;

    try {
        if (kind !== 'administrator') throw new ServerError(403, 'You must be an administrator to delete announcements');

        const announcement = await Announcement.findById(id);
        if (!announcement) throw new ServerError(404, 'Announcement not found');

        announcement.title = title;
        announcement.text = text;
        announcement.from = from;
        announcement.to = to;
        announcement.filterPhase = phase;
        await announcement.save();

        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (error) {
        return res.error(error);
    }
});

AnnouncementController.delete('/announcement/:id', async (req, res) => {
    const { id } = req.params;
    const { kind } = req.token;

    try {
        if (kind !== 'administrator') throw new ServerError(403, 'You must be an administrator to delete announcements');
        await Announcement.deleteOne({ _id: id });
        return res.sendStatus(204);
    } catch (error) {
        return res.error(error);
    }
});

module.exports = AnnouncementController;
