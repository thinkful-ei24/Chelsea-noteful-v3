'use strict';

const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, require: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

//unique by user
tagSchema.index({ name: 1, userId: 1 }, { unique: true });

// Add 'createdAt' and 'updatedAt' fields
tagSchema.set('timestamps', true);

//expose virtuals and remove _id and __v
tagSchema.set('toObject', {
  virtuals: true,
  transform: (doc, res) => {
    delete res._id;
    delete res.__v;
  }
});

module.exports = mongoose.model('Tag', tagSchema);
