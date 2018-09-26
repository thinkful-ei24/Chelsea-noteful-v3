'use strict';

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Add 'createdAt' and 'updatedAt' fields
folderSchema.set('timestamps', true);

//expose virtuals and remove _id and __v
folderSchema.set('toObject', {
  virtuals: true,
  transform: (doc, res) => {
    delete res._id;
    delete res.__v;
  }
});

module.exports = mongoose.model('Folder', folderSchema);
