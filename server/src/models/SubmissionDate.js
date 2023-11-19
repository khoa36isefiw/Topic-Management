const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionDateSchema = new Schema({
    date: Date,         // Deadline date
    phase: Number,      // Which phase
});

const SubmissionDate = mongoose.model('SubmissionDate', SubmissionDateSchema);

module.exports = SubmissionDate;
