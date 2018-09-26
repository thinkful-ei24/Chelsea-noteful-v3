'use strict';

const express = require('express');

const User = require('../models/users');

const router = express.Router();

/* ========== POST USER ========== */

router.post('/', (req, res, next) => {
  const { fullName, username, password } = req.body;

  // check that required fields are there
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing ${missingField}!`);
    err.status = 422;
    err.reason = 'ValidationError';
    err.message = 'Missing field';
    return next(err);
  }

  // check to make sure fields are strings
  const stringFields = ['username', 'password', 'fullName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error('Incorrect field type: expected string');
    err.status = 422;
    err.reason = 'ValidationError';
    err.message = 'Incorrect field type: expected string';
    return next(err);
  }

  //check to make sure username and pw don't have any leading/trailing whitespace.
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error('Cannot start or end with whitespace');
    err.status = 422;
    err.reason = 'ValidationError';
    err.message = 'Cannot start or end with whitespace';
    return next(err);
  }

  //username length should be a min of 1 and pw a min of 8 and max of 72
  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };

  //'min' in sizedFields[field] insures we don't look at 'id' etc and only look at username and password
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField) {
    const err = new Error(
      `Must be at least ${sizedFields[tooSmallField].min} characters long`
    );
    err.reason = 'ValidationError';
    err.message = `Must be at least ${
      sizedFields[tooSmallField].min
    } characters long`;
    err.status = 422;
    return next(err);
  }

  if (tooLargeField) {
    const err = new Error(
      `Must be at most ${sizedFields[tooLargeField].max} characters long`
    );
    err.reason = 'ValidationError';
    err.message = `Must be at most ${
      sizedFields[tooLargeField].max
    } characters long`;
    err.status = 422;
    return next(err);
  }

  // User hash  & then create!

  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullName: fullName.trim()
      };
      return User.create(newUser);
    })
    .then(result => {
      return res
        .status(201)
        .location(`/api/users/${result.id}`)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;
