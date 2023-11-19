const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// The backbone of the thesis management system
const ThesisSchema = new Schema({
    title: { type: String, required: true },                                                    // Title of the thesis
    description: String,                                                                        // User-given description of the thesis
    authors: { type: [Schema.Types.ObjectId], ref: 'Student', required: true },                 // Authors of the thesis
    advisers: { type: [Schema.Types.ObjectId], ref: 'Faculty', required: true },                // Advisers or supervisors of the thesis
    panelists: { type: [Schema.Types.ObjectId], ref: 'Faculty', required: true, default: [] },  // Panelists assigned to the thesis
    locked: { type: Boolean, required: true, default: false },                                  // Whether further changes to the thesis are allowed
    phase: { type: Number, required: true, default: 1 },                                        // Phase number of the thesis
    
    // Grades given to the thesis group (deprecated in favor of individual grading)
    grades: [{
        value: { type: Number, required: true },                            // Grade given
        date: { type: Date, required: true, default: Date.now },            // Date graded
        phase: { type: Number, required: true },                            // Thesis phase grade
        remarks: String,                                                    // Notes about the grade
        by: { type: Schema.Types.ObjectId, ref: 'User', required: true }    // Who graded the thesis
    }],
    remarks: String,                                                        // Remarks for the thesis in general (could be replaced)

    // Status of the thesis
    status: {
        type: String,
        enum: [
            'new',
            'for_checking',
            'checked',
            'endorsed',
            'redefense',
            'pass',
            'fail',
            'final'
        ],
        default: 'new'
    },
    endorse_subphase: Number,
    
    adviser_approval: [
        {
            adviser: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
            status: {
                type: String,
                enum: [
                    'pending',
                    'approved',
                    'denied'
                ],
                default: 'pending'
            }
        }
    ],
    approved: { type: Boolean, required: true, default: true }              // For student-created theses, whether approved by an admin
});

const Thesis = mongoose.model('Thesis', ThesisSchema);
module.exports = Thesis;
