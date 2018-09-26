'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Folder = require('../models/folder');
const Note = require('../models/note');

const router = express.Router();

/* ========== Protect endpoints using JWT Strategy ========== */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL FOLDERS ========== */

router.get('/', (req, res, next) => {
  const userId = req.user.id;

  Folder.find({ userId })
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
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findOne({ _id: id, userId })
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
  const userId = req.user.id;

  //has name
  if (!name) {
    const err = new Error('The `name` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.create({ name: name, userId })
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
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE FOLDER ========== */

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

  Folder.findOneAndUpdate({ _id: id, userId }, { name }, { new: true })
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
  const userId = req.user.id;

  // has valid id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const folderRemovePromise = Folder.findOneAndRemove({ _id: id, userId });

  // this promise deletes all appropriate notes
  //const noteRemovePromise = Note.deleteMany({ folderId: id });

  //this promise removes the folderId from note but keeps the note
  const noteRemovePromise = Note.updateMany(
    { folderId: id, userId },
    { $unset: { folderId: '' } }
  );

  Promise.all([folderRemovePromise, noteRemovePromise])
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
