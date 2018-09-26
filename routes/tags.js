'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();

/* ========== Protect endpoints using JWT Strategy ========== */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL TAGS ========== */
router.get('/', (req, res, next) => {
  const userId = req.user.id;

  Tag.find({ userId })
    .sort('name')
    .then(results => {
      if (results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== GET/READ A SINGLE TAG ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findOne({ _id: id, userId })
    .then(result => {
      if (result) {
        res.status(200).json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== POST/CREATE A TAG ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;

  //has name
  if (!name) {
    const err = new Error('The `name` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.create({ name: name, userId })
    .then(result => {
      if (result) {
        const { id } = result;

        // has valid id
        if (!mongoose.Types.ObjectId.isValid(id)) {
          const err = new Error('The `id` is not valid');
          err.status = 400;
          return next(err);
        }

        res
          .location(`${req.originalUrl}/${id}`)
          .status(201)
          .json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      //duplicate key error code 11000
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE TAG ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  //has name
  if (!name) {
    const err = new Error('The `name` is not valid');
    err.status = 400;
    return next(err);
  }

  // has valid id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findOneAndUpdate({ _id: id, userId }, { name }, { new: true })
    .then(result => {
      if (result) {
        res.status(200).json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      //duplicate key error code 11000
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE TAG ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // has valid id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const tagRemovePromise = Tag.findOneAndRemove({ _id: id, userId });
  const noteRemovePromise = Note.updateMany(
    { tags: id, userId },
    { $pull: { tags: id } }
  );

  Promise.all([tagRemovePromise, noteRemovePromise])
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
