const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Defense schedule
const DefenseSchema = new Schema({
    description: String,                                                        // Not really required
    thesis: { type: Schema.Types.ObjectId, ref: 'Thesis', required: true },     // Which thesis will be defended
    phase: { type: Number, required: true },                                    // Which phase of the thesis
    start: { type: Date, required: true },                                      // Start time
    end: { type: Date, required: true },                                        // End time
    
    // TODO: will be changed in the automation update
    // Which panelists are invited to the defense
    panelists: [
        /* This includes the adviser */
        {
            faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },   // Faculty concerned
            approved: { type: Boolean, required: true, default: false },                // Has said faculty approved the schedule
            declined: Boolean                                                           // Has said faculty declined the schedule
        }
    ],

    // Status of the thesis
    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'declined',
            'approved',
            'confirmed'
        ],
        default: 'pending'
    },
    term: String    // May be overhauled
});

const Defense = mongoose.model('Defense', DefenseSchema);

module.exports = Defense;
