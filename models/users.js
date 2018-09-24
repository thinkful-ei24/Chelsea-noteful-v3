'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String },
  username: { type: String, require: true, unique: true },
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

userSchema.methods.validatePassword = function(password) {
  return password === this.password;
};

module.exports = mongoose.model('User', userSchema);
