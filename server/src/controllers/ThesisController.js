const ExcelJS = require('exceljs');
const express = require('express');
const multer = require('multer');
const requirePass = require('../middleware/requirePass');
const requireToken = require('../middleware/requireToken');
const Comment = require('../models/Comment');
const Submission = require('../models/Submission');
const SubmissionDate = require('../models/SubmissionDate');
const Account = require('../models/Account');
const Thesis = require('../models/Thesis');
const ServerError = require('../utility/error');
const isQueryTrue = require('../utility/isQueryTrue');
const transacted = require('../middleware/transacted');

const ThesisController = express.Router();

const upload = multer();

ThesisController.get('/thesis', requireToken, async (req, res) => {
    const { all, q, status, phase, showPending } = req.query;
    const { accountID, kind } = req.token;
    
    try {
        const $and = [];
        if (!((all === undefined && kind === 'administrator') || isQueryTrue(all)))
            $and.push({ $or: [ { authors: accountID }, { advisers: accountID }, { panelists: accountID } ] });
        
        let query = {};

        if (q) query.title = { $regex: q, $options: 'i' };
        if (status) query.status = status;
        if (phase && Number.parseInt(phase)) query.phase = Number.parseInt(phase);
        switch (showPending) {
            case 'show': query.approved = false; break;
            case 'all': break;
            
            default: $and.push({ $or: [ { approved: true }, { approved: null } ] }); break;
        }

        if ($and.length > 0) query.$and = $and;

        let results = await Thesis.find(query).sort({ title: 1 }).populate('authors').populate('advisers').populate('panelists');

        const thesisIDs = results.map(e => e._id);
        const submissions = await Submission.find({ thesis: { $in: thesisIDs } }).select('-attachments.data');
        results = results.filter(thesis => {
            const thesisSubmissions = submissions.filter(sub => sub.thesis.toString() === thesis._id.toString());
            const submissionsByDate = [ ...thesisSubmissions ].sort((a, b) => b.submitted.getTime() - a.submitted.getTime());
            const latest = submissionsByDate[0];

            if (thesisSubmissions.length > 0) {
                thesis.submission = {
                    latest: latest._id.toString(),
                    when: latest.submitted
                };
            }

            if (isQueryTrue(req.query.getSubmissions)) {
                thesis.submissions = submissionsByDate.map(e => ({
                    _id: e._id.toString(),
                    submitted: e.submitted,
                    submitter: e.submitter,
                    phase: e.phase,
                    attachments: e.attachments.map(e2 => ({
                        _id: e2._id,
                        originalName: e2.originalName,
                        size: e2.size
                    }))
                }))
            }

            const grades = thesis.grades || [];
            grades.sort((a, b) => -(a.date.getTime() - b.date.getTime()));
            thesis._grades = grades;

            return true;
        });

        return res.json(results.map(e => ({
            _id: e._id,
            title: e.title,
            description: e.description,
            authors: e.authors.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName,
                grade: e2.grade,
                remarks: e2.remarks
            })),
            advisers: e.advisers.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName
            })),
            panelists: e.panelists.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName
            })),
            phase: e.phase,
            status: e.status,
            grades: e._grades,
            submission: e.submission,
            submissions: e.submissions,
            approved: e.approved !== false
        })));
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/export', /*requireToken,*/ async (req, res) => {
    //const { kind } = req.token;

    try {
        //if (kind !== 'administrator') throw new ServerError(403, 'Only administrators can export thesis projects');

        const theses = (await Thesis.find({ locked: false, status: { $not: /^final$/ } }).sort('title'))
            .map(e => ({
                _id: e._id,
                title: e.title,
                phase: e.phase,
                authors: e.authors,
                advisers: e.advisers,
                panelists: e.panelists,
            }));
        const accountIDs = theses.map(e => [...e.authors, ...e.advisers, ...e.panelists]).flat();

        const getThesis = (account) => {
            return theses.find(e => e.authors.some(e2 => e2.toString() === account.toString()));
        };

        const accounts = (await Account.User.find({ _id: { $in: accountIDs }}).select('-photo'))
            .map(e => ({
                _id: e._id,
                lastName: e.lastName,
                firstName: e.firstName,
                middleName: e.middleName,
                thesis: e.kind.toLowerCase() === 'student' ? getThesis(e._id) : null
            }));

        const getAccount = (id) => {
            return accounts.find(e => e._id.toString() === id.toString());
        };
        
        //console.log(theses);
        //console.log(accounts);
        const workbook = new ExcelJS.Workbook();

        const sheet1 = workbook.addWorksheet('THSST1');
        // TODO: course, section, id
        sheet1.addRow(['Name', 'Group', 'Grade']);
        for (const account of accounts.filter(e => e.thesis && e.thesis.phase === 1)) {
            sheet1.addRow([`${account.lastName}, ${account.firstName}`, '', '0.0']);
        }

        const sheet2 = workbook.addWorksheet('THSST2');
        sheet2.addRow(['Name', 'Group', 'Grade']);
        for (const account of accounts.filter(e => e.thesis && e.thesis.phase === 2)) {
            sheet2.addRow([`${account.lastName}, ${account.firstName}`, '', '0.0']);
        }

        const sheet3 = workbook.addWorksheet('THSST3');
        sheet3.addRow(['Name', 'Group', 'Grade']);
        for (const account of accounts.filter(e => e.thesis && e.thesis.phase === 3)) {
            sheet3.addRow([`${account.lastName}, ${account.firstName}`, '', '0.0']);
        }

        const thesesList = workbook.addWorksheet('Thesis Groups');
        const thesesRow1 = [];
        thesesRow1[1] = 'Thesis Information';
        thesesRow1[4] = 'Member Information';
        thesesRow1[9] = 'Adviser / Panel Information';
        thesesList.addRow(thesesRow1);
        thesesList.mergeCells('A1:C1');
        thesesList.mergeCells('D1:H1');
        thesesList.mergeCells('I1:M1');
        thesesList.addRow(['Group ID', 'Title', 'Thesis Stage', 'Member 1', 'Member 2', 'Member 3', 'Member 4', 'Total Count', 'Thesis Adviser', 'Panel Member 1', 'Panel Member 2', 'Panel Member 3', 'Panel Member 4']);
        for (const thesis of theses) {
            const members = thesis.authors.map(e => getAccount(e)).filter(e => !!e).map(e => `${e.lastName}, ${e.firstName}`);
            const count = members.length;
            while (members.length < 4) members.push('');
            const adviser1 = getAccount(thesis.advisers[0]);
            const panel = thesis.panelists.map(e => getAccount(e)).filter(e => !!e).map(e => `${e.lastName}, ${e.firstName}`);
            while (panel.length < 4) panel.push('');
            thesesList.addRow(['', thesis.title, thesis.phase, ...members, count, `${adviser1.lastName}, ${adviser1.firstName}`, ...panel]);
        }

        const xlsxBuffer = await workbook.xlsx.writeBuffer();
        
        return res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .end(xlsxBuffer);
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/deadline', requireToken, async (req, res) => {
    try {
        const deadlines = await SubmissionDate.find().sort({ 'subphase': 'asc' });
        const o = {};

        for (const deadline of deadlines) {
            if (o[deadline.phase]) {
                o[deadline.phase].push(deadline.date);
            } else {
                o[deadline.phase] = [deadline.date];
            }
        }

        return res.json(o);
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.post('/thesis/deadline', requireToken, transacted, async (req, res) => {
    const { session } = req;
    const { kind } = req.token;
    const entries = req.body;
    
    try {
        session.startTransaction();
        if (kind.toLowerCase() !== 'administrator') throw new ServerError(403, 'Only administrators can adjust the thesis submission deadlines.');

        for (const [phase, date] of Object.entries(entries)) {
            const deadline = await SubmissionDate.findOne({ phase }).session(session);
            if (deadline) {
                deadline.date = date;
                await deadline.save();
            } else {
                await SubmissionDate.create([{ phase, date }], { session });
            }
        }

        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        return res.error(error);
    }
});

ThesisController.get('/thesis/:id', requireToken, async (req, res) => {
    const { id } = req.params;
    
    try {
        let result = await Thesis.findById(id).populate('authors').populate('advisers').populate('panelists');

        if (!!req.query.getSubmissions) {
            const submissions = await Submission.find({ thesis: result }).select('-attachments.data');
            submissions.sort((a, b) => b.submitted.getTime() - a.submitted.getTime());

            result.submissions = submissions.map(e => ({
                _id: e._id.toString(),
                submitted: e.submitted,
                submitter: e.submitter,
                phase: e.phase,
                attachments: e.attachments.map(e2 => ({
                    _id: e2._id,
                    originalName: e2.originalName,
                    size: e2.size
                }))
            }));
        }

        const grades = result.grades || [];
        grades.sort((a, b) => -(a.date.getTime() - b.date.getTime()));

        return res.json({
            _id: result._id,
            title: result.title,
            description: result.description,
            authors: result.authors.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName,
                grade: e2.grade,
                remarks: e2.remarks
            })),
            advisers: result.advisers.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName
            })),
            panelists: result.panelists.map(e2 => ({
                _id: e2._id,
                lastName: e2.lastName,
                firstName: e2.firstName,
                middleName: e2.middleName
            })),
            phase: result.phase,
            grade: grades[0] ? grades[0].value : undefined,
            grades,
            status: result.status,
            remarks: grades[0] ? grades[0].remarks : undefined,
            submissions: result.submissions,
            approved: result.approved !== false
        });
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.put('/thesis/:id', requireToken, async (req, res) => {
    const { id } = req.params;
    const { accountID, kind } = req.token;
    const { title, description, authors, advisers, panelists, status, phase } = req.body;
    
    try {
        const thesis = await Thesis.findById(id);

        if (kind.toLowerCase() === 'student') throw new ServerError(403, 'Students cannot edit thesis projects and must ask for assistance from admin.');
        if (!thesis) throw new ServerError(404, 'Thesis not found.');
        if (title) thesis.title = title;
        if (description) thesis.description = description;
        if (authors) {
            if (Array.isArray(authors) && (authors.length < 1 || authors.length > 4)) throw new ServerError(400, 'Only 1-4 authors can be added.');
            thesis.authors = authors;
        }
        if (advisers) {
            if (Array.isArray(advisers) && (advisers.length < 1 || advisers.length > 2)) throw new ServerError(400, 'Only 1-2 advisers can be added.');
            thesis.advisers = advisers;
        }
        if (panelists) {
            if (Array.isArray(panelists) && panelists.length > 4) throw new ServerError(400, 'Only 0-4 panelists can be added.');
            thesis.panelists = panelists;
        }
        if (status && kind.toLowerCase() !== 'student') thesis.status = status;
        if (phase && Number.parseInt(phase) && kind.toLowerCase() !== 'student') thesis.phase = Number.parseInt(phase);

        await thesis.save();

        return res.sendStatus(204);
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/:id/comment', requireToken, async (req, res) => {
    const { id } = req.params;
    const { accountID, kind } = req.token;
    const { all, phase } = req.query;

    try {
        const thesis = await Thesis.findById(id);
        const query = { thesis: id };
        /*if (!all) {
            if (phase) query.phase = Number.parseInt(phase);
            else if (phase === undefined || phase === null) query.phase = thesis.phase;
        }*/

        if (!thesis) throw new ServerError(404, 'Thesis not found.');
        if (kind === 'student' && !thesis.authors.find(e => e.toString() === accountID))
            throw new ServerError(403, 'You must be an author to be able to read comments.');
        
        const comments = await Comment.find(query).sort({ sent: 'desc' }).populate('author');

        return res.json(comments.map(e => ({
            _id: e._id,
            phase: e.phase,
            author: {
                _id: e.author._id,
                lastName: e.author.lastName,
                firstName: e.author.firstName,
                middleName: e.author.middleName
            },
            text: e.text,
            sent: e.sent
        })));
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.post('/thesis/:id/comment', requireToken, async (req, res) => {
    const { id } = req.params;
    const { accountID, kind, lastName, firstName, middleName } = req.token;
    const { text } = req.body;
    
    try {
        const thesis = await Thesis.findById(id);

        if (!thesis) throw new ServerError(404, 'Thesis not found.');
        if (kind === 'student' && !thesis.authors.find(e => e.toString() === accountID))
            throw new ServerError(403, 'You must be an author to comment.');
        
        const comment = await Comment.create({
            thesis: id,
            author: accountID,
            text,
            phase: thesis.phase
        });

        return res.status(201).location(`/thesis/${id}/comment/${comment._id}`).json({
            _id: comment._id,
            thesis: id,
            phase: thesis.phase,
            author: {
                _id: accountID,
                lastName,
                firstName,
                middleName
            },
            text,
            sent: comment.sent
        });
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.delete('/thesis/:id/comment/:cid', requireToken, async (req, res) => {
    const { id, cid } = req.params;
    const { accountID } = req.token;
    
    try {
        await Comment.deleteOne({ _id: cid, thesis: id, author: accountID });
        return res.sendStatus(204);
    } catch (error) {
        return res.error(error);
    }
});

const transitions = [
    [ 'new', 'for_checking' ],
    [ 'new', 'endorsed' ],
    [ 'for_checking', 'for_checking' ],
    [ 'for_checking', 'checked' ],
    [ 'for_checking', 'endorsed' ],
    [ 'checked', 'for_checking' ],
    [ 'checked', 'endorsed' ],
    [ 'endorsed', 'pass' ],
    [ 'endorsed', 'fail' ],
    [ 'endorsed', 'redefense' ],
    [ 'redefense', 'endorsed' ],
    [ 'pass', 'new' ],
    [ 'fail', 'new' ],
    [ 'pass', 'for_checking' ],
    [ 'fail', 'for_checking' ],
    [ 'pass', 'final' ]
];

const isValidTransition = (prev, next) => {
    for (const [p, n] of transitions) {
        if (p === prev && n === next) return true;
    }

    return false;
};

ThesisController.post('/thesis/:tid/status', requireToken, requirePass, transacted, async (req, res) => {
    const { session } = req;
    const { tid } = req.params;
    const { accountID, kind } = req.token;
    const { type, status, grade, remarks, phase, approved } = req.body;

    try {
        session.startTransaction();
        if (kind === 'student') throw new ServerError(403, 'Cannot change status.');
        
        const thesis = await Thesis.findById(tid);
        if (!thesis) throw new ServerError(404, 'Thesis not found.');

        if (thesis.locked) throw new ServerError(403, 'Thesis is locked and cannot be edited.');

        if (type === 'approve' && kind === 'administrator') {
            thesis.approved = true;
        } else if (type === 'status') {
            if (!status) throw new ServerError(400, 'Status required.');

            /*const initialStatus = thesis.status;
            const nextStatus = status;
            if (!isValidTransition(initialStatus, nextStatus)) throw new ServerError(400, 'Invalid status.');*/

            thesis.status = status;
            if (status === 'final') {
                thesis.locked = true;
            }
        } else if (type === 'grade') {
            const { grades } = req.body;
            if (grades) {
                for (const [id, info] of Object.entries(grades)) {
                    const student = await Account.Student.findById(id);
                    if (!student) continue;

                    student.grade = info.grade;
                    student.remarks = info.remarks;
                    await student.save();
                }
            }
        }

        await thesis.save();
        await session.commitTransaction();
        return res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        return res.error(error);
    }
});

ThesisController.post('/thesis/:tid/submission', requireToken, upload.array('files'), async (req, res) => {
    // TODO: limit the number of uploads per day
    const { tid, sid } = req.params;
    const { accountID, kind } = req.token;

    try {
        const thesis = await Thesis.findById(tid);
        
        if (kind.toLowerCase() !== 'student') throw new ServerError(403, 'Only students can submit new files.');
        if (!thesis) throw new ServerError(404, 'Thesis not found');
        if (thesis.locked) throw new ServerError(403, 'Thesis is locked and cannot be edited.');
        if (!thesis.authors.find(e => e.toString() === accountID)) throw new ServerError(403, 'You cannot submit to a thesis in which you are not the author.');
        
        const deadline = await SubmissionDate.findOne({ phase: thesis.phase });
        if (!deadline) throw new ServerError(403, 'Cannot submit thesis without deadline');
        if (deadline.date.getTime() < Date.now()) throw new ServerError(403, 'Cannot submit thesis beyond deadline');

        let submission = null;
        if (req.files) {
            const attachments = req.files.map(e => ({
                originalName: e.originalname,
                data: e.buffer,
                mime: e.mimetype
            }));

            submission = await Submission.create({
                thesis,
                submitter: accountID,
                attachments,
                phase: thesis.phase
            });
        }

        if (submission) {
            thesis.status = 'for_checking';
            await thesis.save();
            return res.status(201).location(`/thesis/${tid}/submission/${thesis._id}`).json({
                _id: submission._id,
                submitter: accountID,
                submitted: submission.submitted,
                phase: submission.phase
            })
        } else {
            throw new ServerError(500, 'Could not add submission for a reason');
        }
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/:tid/submission/latest', requireToken, async (req, res) => {
    const { tid } = req.params;
    
    try {
        const submission = await Submission.findOne({ thesis: tid }, {}, { submitted: -1 })
            .populate('submitter').populate('thesis').select('-attachments.data');

        return res.json({
            thesis: {
                _id: submission.thesis._id,
                title: submission.thesis.title
            },
            submitter: {
                _id: submission.submitter._id,
                lastName: submission.submitter.lastName,
                firstName: submission.submitter.firstName,
                middleName: submission.submitter.middleName
            },
            submitted: submission.submitted,
            phase: submission.phase,
            attachments: submission.attachments
        });
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/:tid/submission/:sid', requireToken, async (req, res) => {
    const { tid, sid } = req.params;
    
    try {
        const submission = await Submission.findOne({ thesis: tid, _id: sid }).populate('submitter').populate('thesis').select('-attachments.data');

        return res.json({
            thesis: {
                _id: submission.thesis._id,
                title: submission.thesis.title
            },
            submitter: {
                _id: submission.submitter._id,
                lastName: submission.submitter.lastName,
                firstName: submission.submitter.firstName,
                middleName: submission.submitter.middleName
            },
            submitted: submission.submitted,
            phase: submission.phase,
            attachments: submission.attachments
        });
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.get('/thesis/:tid/submission/:sid/attachment/:aid', requireToken, async (req, res) => {
    const { tid, sid, aid } = req.params;
    
    try {
        const submission = await Submission.findOne({ thesis: tid, _id: sid });
        if (!submission) throw new ServerError(404, 'Submission not found');

        const attachment = submission.attachments.id(aid);
        if (!attachment) throw new ServerError(404, 'Attachment not found');
        return res.contentType(attachment.mime).send(attachment.data);
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.post('/thesis', requireToken, upload.array('files'), async (req, res) => {
    const { title, description, authors, advisers, panelists, phase } = req.body;
    const { accountID, kind } = req.token;

    try {
        const approved = kind === 'administrator';
        if (!title) throw new ServerError(400, 'Title is required');
        if (!authors) throw new ServerError(400, 'Author list is required');
        if (!advisers) throw new ServerError(400, 'Adviser list is required');
        if (kind.toLowerCase() !== 'administrator' && 
            ((kind === 'student' && !authors.includes(accountID)) ||
             (kind === 'faculty' && !advisers.includes(accountID))))
            throw new ServerError(400, 'Current user must be part of the group');

        if (!advisers || (Array.isArray(advisers) && advisers.length > 2)) throw new ServerError(400, 'Only 1-2 advisers can be added.');
        if (panelists && (Array.isArray(panelists) && panelists.length > 4)) throw new ServerError(400, 'Only 0-4 panelists can be added.');
        
        const thesis = await Thesis.create({
            title,
            description,
            authors,
            advisers,
            phase: phase,
            panelists: panelists || [],
            approved
        });

        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(e => ({
                originalName: e.originalname,
                data: e.buffer,
                mime: e.mimetype
            }));

            const submission = await Submission.create({
                thesis,
                submitter: accountID,
                attachments,
                phase
            });
        }

        return res.status(201).location(`/thesis/${thesis._id}`).json({
            _id: thesis._id,
            title,
            description
        })
    } catch (error) {
        return res.error(error);
    }
});

ThesisController.delete('/thesis/:id', requireToken, async (req, res) => {
    const { accountID, kind } = req.token;
    const { id } = req.params;

    try {
        if (kind !== 'administrator') throw new ServerError(403, 'You cannot delete theses');

        const thesis = await Thesis.findById(id);
        if (!thesis) throw new ServerError(404, 'Cannot find thesis');

        if (!thesis.approved) {
            await Thesis.updateOne({ _id: id }, { inactive: true });
        } else {
            thesis.locked = true;
            await thesis.save();
        }

        return res.sendStatus(204);
    } catch (error) {
        return res.error(error);
    }
});

module.exports = ThesisController;
