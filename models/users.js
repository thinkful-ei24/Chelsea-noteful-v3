'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String },
  userName: { type: String, require: true, unique: true },
  password: { type: String, require: true }
});

//expose virtuals and remove _id and __v
userSchema.set('toObject', {
  virtuals: true,
  transform: (doc, res) => {
    delete res._id;
    delete res.__v;
    delete res.password;
  }
});

module.exports = mongoose.model('User', userSchema);
