'use strict';
const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const options = { session: false, failWithError: true };

const passport = require('passport');
const localAuth = passport.authenticate('local', options);

// ===== Generate JWT ===========

function createAuthToken(user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

// ===== Protected endpoint =====
router.post('/', localAuth, function(req, res) {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;
