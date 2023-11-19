const express = require('express');
const requireToken = require('../middleware/requireToken');
const transacted = require('../middleware/transacted');
const Account = require('../models/Account');
const Defense = require('../models/Defense');
const Thesis = require('../models/Thesis');
const ServerError = require('../utility/error');
const DefenseWeek = require('../models/DefenseWeek');
const dayjs = require('dayjs');
const Scheduler = require('../utility/scheduler');
const ical = require('node-ical');
const mongoose = require('mongoose');

const DefenseController = express.Router();
const CURRENT_TERM = '2023-2024';

DefenseController.get('/defense', requireToken, async (req, res) => {
    const { accountID, kind } = req.token;
    const { thesis, phase, status } = req.query;

    try {
        const query = { term: CURRENT_TERM };
        if (thesis) query.thesis = thesis;
        if (Number.parseInt(phase)) query.phase = Number.parseInt(phase);
        if (status) {
            const statuses = status.split(',');
            if (statuses.length === 1) {
                query.status = statuses[0];
            } else if (statuses.length > 1) {
                query.status = { $in: statuses };
            }
        }

        const thesisPopulate = { path: 'thesis', populate: [ { path: 'advisers' }, { path: 'authors' } ] };
        const schedules = await Defense.find(query)
            .populate(thesisPopulate)
            .populate('panelists.faculty');

        return res.json(schedules.filter(e => e.thesis && e.thesis.status !== 'final').map(e => ({
            _id: e._id,
            start: e.start,
            end: e.end,
            description: e.description,
            thesis: {
                _id: e.thesis._id,
                title: e.thesis.title,
                advisers: e.thesis.advisers.map(e2 => ({
                    _id: e2._id,
                    lastName: e2.lastName,
                    firstName: e2.firstName,
                    middleName: e2.middleName
                })),
                authors: e.thesis.authors.map(e2 => ({
                    _id: e2._id,
                    lastName: e2.lastName,
                    firstName: e2.firstName,
                    middleName: e2.middleName
                }))
            },
            panelists: e.panelists.map(e2 => ({
                faculty: {
                    _id: e2.faculty._id,
                    lastName: e2.faculty.lastName,
                    firstName: e2.faculty.firstName,
                    middleName: e2.faculty.middleName
                },
                approved: e2.approved,
                declined: e2.declined
            })),
            status: e.status,
            phase: e.phase
        })));
    } catch (error) {
        return res.error(error, 'Could not get defense schedule.');
    }
});

DefenseController.post('/defense/schedule/:tid', requireToken, async (req, res) => {
    const { tid } = req.params;
    const { accountID, kind } = req.token;
    const { panelists } = req.body || {}
    
    try {
        const thesis = await Thesis.findById(tid);
        if (!thesis) throw new ServerError(404, 'Thesis not found');

        if (kind === 'student') {
            if (!thesis.authors.some(e => e.toString() === accountID)) {
                throw new ServerError(403, 'Cannot view other group\'s defense schedule');
            }
        } else if (kind === 'faculty') {
            if (!thesis.advisers.some(e => e.toString() === accountID) &&
                !thesis.panelists.some(e => e.toString() === accountID)) {
                throw new ServerError(403, 'Cannot view other group\'s defense schedule');
            }
        }

        const others = panelists ? panelists.map(e => new mongoose.Types.ObjectId(e)) : [ ...thesis.advisers, ...thesis.panelists ];
        const members = [...thesis.authors, ...others ];

        const accounts = await Account.User.find({ _id: { $in: members } });
        //console.log(accounts);

        const frees = await DefenseWeek.find({ phase: thesis.phase });
        if (frees.length < 1) return res.json([]);

        // TODO: dates are in local time zone; map them to UTC first
        //console.log(frees[0].dates)
        const freeSorted = frees[0].dates.map(e => new Date(e.getTime() - 8 * 3600 * 1000));
        //console.log(freeSorted)

        // TODO: fix this
        const freeRanges = freeSorted.map(e => ({ start: new Date(e.getTime() + 8 * 3600 * 1000), end: new Date(e.getTime() + 22 * 3600 * 1000) }));
        const freeRange = Scheduler.GetScheduleRange(freeRanges);

        const schedulesRaw = accounts.map(e => e.schedule);

        const schedules = schedulesRaw.map(e => e.map(e2 => {
            const schedule = [];
            if (e2.format === 'ics') {
                const events = ical.sync.parseICS(e2.value);
                for (const event of Object.values(events)) {
                    if (event.type !== 'VEVENT') continue;

                    const tdiff = event.end.getTime() - event.start.getTime();
                    if (event.rrule) {
                        const recurrences = event.rrule.between(freeRange.start, freeRange.end);
                        for (const recurrence of recurrences) {
                            schedule.push({
                                start: recurrence,
                                end: new Date(recurrence.getTime() + tdiff)
                            })
                        }
                    } else {
                        schedule.push({
                            start: new Date(event.start.getTime()),
                            end: new Date(event.end.getTime())
                        });
                    }
                }
            } else if (e2.format === 'custom') {
                const events = e2.value;
                for (const event of events) {
                    schedule.push({
                        start: new Date(event.start),
                        end: new Date(event.end)
                    });
                }
            }
            
            return schedule;
        }));
        //console.dir(schedules, { depth: 4 });

        const tentative = Scheduler.AutoSchedule(freeRanges, schedules);

        return res.json(tentative.filter(e => e.end > Date.now()));

    } catch (error) {
        return res.error(error, 'Could not generate defense schedule.');
    }
});

DefenseController.post('/defense', requireToken, transacted, async (req, res) => {
    const { session } = req;
    const { accountID, kind } = req.token;
    const slots = Array.isArray(req.body) ? req.body : [req.body];

    try {
        session.startTransaction();
        if (kind === 'student') {
            let thesisQuery = { authors: accountID, locked: false };
            const thesis = await Thesis.findOne(thesisQuery);
            if (!thesis) throw new ServerError(403, 'Only students with a thesis can requesting defense slots.');
            if (thesis.status !== 'endorsed') throw new ServerError(403, 'The thesis must be endorsed before requesting defense slots.');

            const slotObjs = slots.map(e => {
                if (!e.action || e.action === 'create') {
                    return {
                        start: e.start,
                        end: e.end,
                        thesis: thesis._id,
                        description: e.description || thesis.title,
                        phase: thesis.phase,
                        term: CURRENT_TERM,
                        panelists: e.panelists ? e.panelists.map(e2 => ({ faculty: e2 })) : thesis.panelists.map(e2 => ({ faculty: e2 }))
                    };
                } else if (e.action === 'update') {
                    return {
                        _id: e._id,
                        description: e.description,
                        panelists: e.panelists || [],
                        action: 'update'
                    };
                } else if (e.action === 'delete') {
                    return {
                        _id: e._id,
                        action: 'delete'
                    };
                } else {
                    return { action: 'none' };
                }
            });

            const slotsToCreate = slotObjs.filter(e => !e.action);
            const slotsToUpdate = slotObjs.filter(e => e.action === 'update');
            const slotsToDelete = slotObjs.filter(e => e.action === 'delete');

            const added = await Defense.create(slotsToCreate);
            for (const slotToUpdate of slotsToUpdate) {
                await Defense.updateOne({
                    _id: slotToUpdate._id,
                    description: slotToUpdate.description,
                    panelists: slotToUpdate.panelists || []
                });
            }
            await Defense.deleteMany({ _id: { $in: slotsToDelete.map(e => e._id) }});

            return res.json([
                ...(added),
                ...(slotsToDelete.map(e => ({ _id: e._id, status: 'deleted' })))
            ]);
        } else if (kind === 'faculty') {
            const allIDs = slots.map(e => e._id);
            const defenseSlots = await Defense.find({ _id: { $in: allIDs }, status: { $not: /^confirmed$/ } });

            const updateSlots = {};
            const errors = [];

            slots.forEach((e, index) => {
                const defenseSlot = defenseSlots.find(e2 => e2._id.toString() === e._id.toString());
                if (!defenseSlot) return;

                const panelists = defenseSlot.panelists;
                const entryIndex = panelists.findIndex(e2 => e2.faculty.toString() === accountID);
                if (entryIndex === -1) {
                    errors.push({ index, message: 'You cannot approve or decline a slot that you are not a panel member of.' });
                }

                if (e.action === 'approve') {
                    panelists[entryIndex] = { faculty: accountID, approved: true };
                    if (panelists.every(e2 => e2.approved)) {
                        updateSlots[defenseSlot._id] = { panelists, status: 'approved' };
                    } else {
                        updateSlots[defenseSlot._id] = { panelists };
                    }
                } else if (e.action === 'decline') {
                    panelists[entryIndex] = { faculty: accountID, declined: true };
                    updateSlots[defenseSlot._id] = { panelists, status: 'declined' };
                }
            });

            for (const [key, value] of Object.entries(updateSlots)) {
                await Defense.updateOne({ _id: key }, value);
            }

            return res.json([]);
        } else if (kind === 'administrator') {
            const allIDs = slots.filter(e => !!e.action && e.action !== 'create').map(e => e._id);
            const allThesisIDs = slots
                .filter(e => !e.action || e.action === 'create')
                .map(e => e.thesis)
                .reduce((p, e) => ({ ...p, [e]: true }), {});
            const allTheses = await Thesis.find({ _id: { $in: Object.keys(allThesisIDs) }});
            for (const nthesis of allTheses) {
                allThesisIDs[nthesis._id.toString()] = { phase: nthesis.phase };
            }

            const defenseSlots = await Defense.find({ _id: { $in: allIDs }, status: 'approved' });

            const slotObjs = slots.map(e => {
                if (!e.action || e.action === 'create') {
                    return {
                        start: e.start,
                        end: e.end,
                        thesis: e.thesis,
                        phase: allThesisIDs[e.thesis].phase,
                        term: CURRENT_TERM,
                        panelists: e.panelists ? e.panelists.map(e2 => ({ faculty: e2 })) : [],
                        status: 'confirmed'
                    };
                } else if (e.action === 'update') {
                    return {
                        _id: e._id,
                        description: e.description,
                        panelists: e.panelists || [],
                        action: 'update'
                    };
                } else {
                    return {
                        _id: e._id,
                        action: e.action
                    };
                }
            });

            const idsToConfirm = slotObjs.filter(e => {
                if (!e._id) return false;
                const defenseSlot = defenseSlots.find(e2 => e2._id.toString() === e._id);
                if (!defenseSlot) return false;

                return e.action === 'confirm';
            });

            const idsToDecline = slotObjs.filter(e => {
                if (!e._id) return false;
                const defenseSlot = defenseSlots.find(e2 => e2._id.toString() === e._id);
                if (!defenseSlot) return false;

                return e.action === 'decline';
            });

            const idsToDelete = slotObjs.filter(e => {
                if (!e._id) return false;
                const defenseSlot = defenseSlots.find(e2 => e2._id.toString() === e._id);
                if (!defenseSlot) return false;

                return e.action === 'decline';
            });

            const slotsToCreate = slotObjs.filter(e => {
                if (e._id) return false;
                return (!e.action || e.action === 'create') && !!e.thesis;
            });
            const slotsToUpdate = slotObjs.filter(e => e.action === 'update');

            for (const slotToUpdate of slotsToUpdate) {
                await Defense.updateOne({
                    _id: slotToUpdate._id,
                    description: slotToUpdate.description,
                    panelists: slotToUpdate.panelists || []
                });
            }
            const slotsToDelete = slotObjs.filter(e => e.action === 'delete');

            const results = await Defense.create(slotsToCreate);
            await Defense.updateMany({ _id: { $in: idsToConfirm }}, { status: 'confirmed' });
            await Defense.updateMany({ _id: { $in: idsToDecline }}, { status: 'declined' });
            await Defense.deleteMany({ _id: { $in: slotsToDelete.map(e => e._id) }});

            await session.commitTransaction();

            return res.json([
                ...(results),
                ...(idsToConfirm.map(e => ({ _id: e, status: 'confirmed' }))),
                ...(idsToDecline.map(e => ({ _id: e, status: 'declined' })))
            ]);
        } else {
            throw new ServerError(403, 'No permission to create defense schedules');
        }
    } catch (error) {
        await session.abortTransaction();
        return res.error(error, 'Could not update defense schedule.')
    }
});

DefenseController.get('/defenseweek', requireToken, async (req, res) => {
    try {
        const week = await DefenseWeek.find();
        return res.json(week.map(e => ({
            dates: e.dates.map(e2 => dayjs(e2).format('YYYY-MM-DD')),
            phase: e.phase
        })));
    } catch (error) {
        return res.error(error, 'Could not get defense schedule.')
    }
});

DefenseController.post('/defenseweek', requireToken, transacted, async (req, res) => {
    const { body, token, session } = req;
    const { accountID, kind } = token;
    const entries = Array.isArray(body) ? body : [body];

    try {
        if (kind !== 'administrator') throw new ServerError(403, 'You cannot modify the defense schedule');
        
        session.startTransaction();
        
        for (const entry of entries) {
            const { phase, dates } = entry;
            const defenseWeek = await DefenseWeek.findOne({ phase }).session(session);
            if (defenseWeek) {
                defenseWeek.dates = dates;
                await defenseWeek.save();
            } else {
                await DefenseWeek.create([{ phase, dates }], { session });
            }
        }

        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        return res.error(error, 'Could not post defense schedule.')
    }
});

module.exports = DefenseController;
