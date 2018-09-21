'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL FOLDERS ========== */
router.get('/', (req, res, next) => {
  Tag.find()
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

/* ========== GET/READ A SINGLE FOLDER ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(id)
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

/* ========== POST/CREATE A FOLDER ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;

  //has name
  if (!name) {
    const err = new Error('The `name` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.create({ name: name })
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

/* ========== PUT/UPDATE A SINGLE FOLDER ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

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

  Tag.findByIdAndUpdate(id, { name }, { new: true })
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

/* ========== DELETE/REMOVE A SINGLE FOLDER ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  // has valid id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const tagRemovePromise = Tag.findByIdAndRemove(id);
  const noteRemovePromise = Note.updateMany(
    { tags: id },
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
