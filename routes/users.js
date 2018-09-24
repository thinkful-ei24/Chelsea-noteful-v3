'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/users');

const router = express.Router();

/* ========== POST USER ========== */

router.post('/', (req, res, next) => {
  const { fullName, username, password } = req.body;

  User.create({ fullName, username, password })
    .then(result => {
      if (result) {
        const { id } = result;
        res
          .location(`/api/users/${id}`)
          .status(201)
          .json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
