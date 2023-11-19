const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Announcements made by the administrators are broadcast to every user concerned
const AnnouncementSchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'Administrator', required: true },  // Only admins can post announcements
    title: { type: String, required: true },                                        // Title of the announcement
    text: { type: String, required: true },                                         // Main body of the announcement
    sent: { type: Date, required: true, default: Date.now },                        // Upload date
    from: Date,
    to: Date,
    filterTypes: [String],                                                          // Which user types can see the announcement
    filterPhase: Number                                                             // Which phase can see the announcement
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);
module.exports = Announcement;
