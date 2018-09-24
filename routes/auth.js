'use strict';
const express = require('express');
const router = express.Router();

const options = { session: false, failWithError: true };

const passport = require('passport');
const localAuth = passport.authenticate('local', options);

// ===== Protected endpoint =====
router.post('/', localAuth, function(req, res) {
  return res.json(req.user);
});

module.exports = router;
