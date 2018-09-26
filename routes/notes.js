'use strict';
const mongoose = require('mongoose');
const express = require('express');
const passport = require('passport');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const router = express.Router();

/* ========== Protect endpoints using JWT Strategy ========== */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { folderId, tagId } = req.query;
  const searchTerm = req.query.searchTerm;
  const userId = req.user.id;

  let filter = { userId: userId };
  let re = new RegExp(searchTerm, 'gi');

  if (searchTerm) {
    filter = { $or: [{ title: re }, { content: re }] };
  }

  if (folderId) {
    // filter = { folderId: folderId };
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort('-updatedAt')
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

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
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

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  //validate folderId and tags belong to current user
  if (folderId) {
    // has valid folderId
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    }

    Folder.findOne({ _id: folderId, userId }).then(result => {
      if (!result) {
        const err = new Error('You can not change another users info');
        err.status = 400;
        return next(err);
      }
    });
  }

  if (tags) {
    if (!Array.isArray(tags)) {
      const err = new Error('The tags property must be an array');
      err.status = 400;
      return next(err);
    }

    tags.forEach(tag => {
      // has valid tag id
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `tag` is not valid');
        err.status = 400;
        return next(err);
      }

      Tag.findOne({ _id: tag, userId }).then(result => {
        if (!result) {
          const err = new Error('The tags array contains an invalid id');
          err.status = 400;
          return next(err);
        }
      });
    });
  }

  Note.create({
    title: title,
    content: content,
    folderId: folderId,
    tags: tags,
    userId: userId
  })
    .then(results => {
      if (results) {
        res
          .location(`${req.originalUrl}/${results.id}`)
          .status(201)
          .json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
      // console.error(`ERROR: ${err.message}`);
      // console.error(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  // const { title, content } = req.body;

  // const updateNote = {};

  // if (title) {
  //   updateNote.title = title;
  // }

  // if (content) {
  //   updateNote.content = content;
  // }

  Note.findOneAndUpdate({ _id: id, userId }, req.body, { new: true })
    .then(results => {
      //no results
      if (!results) {
        const err = new Error('Not your note');
        err.status = 404;
        return next(err);
      }

      // has valid folderId
      if (!mongoose.Types.ObjectId.isValid(results.folderId)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }

      if (results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({ _id: id, userId }).then(res.status(204).end());
});

module.exports = router;
