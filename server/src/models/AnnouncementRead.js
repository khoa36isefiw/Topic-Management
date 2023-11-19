const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Indicates the read status of an announcement by a user and whether it will be shown in the dashboard.
const AnnouncementReadSchema = new Schema({
    announcement: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true }, // Announcement concerned
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },           // Who read the announcement
    time: { type: Date, default: Date.now }                                             // When it was read
});

const AnnouncementRead = mongoose.model('AnnouncementRead', AnnouncementReadSchema);
module.exports = AnnouncementRead;
