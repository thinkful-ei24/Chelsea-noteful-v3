'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Add 'createdAt' and 'updatedAt' fields
noteSchema.set('timestamps', true);

//expose virtuals and remove _id and __v
noteSchema.set('toObject', {
  virtuals: true,
  transform: (doc, results) => {
    delete results._id; // delete '_id'
    delete results.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);
