const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Comments made to a thesis
const CommentSchema = new Schema({
    thesis: { type: Schema.Types.ObjectId, ref: 'Thesis', required: true },     // Which thesis the comment was made
    author: { type: Schema.Types.ObjectId, ref: 'Account', required: true },    // Who wrote the comment
    text: { type: String, required: true },                                     // Main body of the comment
    sent: { type: Date, required: true, default: Date.now },                    // When the comment was made
    phase: { type: Number }                                                     // Which phase the thesis was when the comment was posted
});

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
