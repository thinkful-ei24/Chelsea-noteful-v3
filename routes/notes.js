'use strict';
const mongoose = require('mongoose');
const express = require('express');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { folderId, tagId } = req.query;
  const searchTerm = req.query.searchTerm;
  let filter = {};
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findById(id)
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

  // has valid folderId
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `id` is not valid');
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
  });

  Note.create({
    title: title,
    content: content,
    folderId: folderId,
    tags: tags
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
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  // const { title, content } = req.body;

  // const updateNote = {};

  // if (title) {
  //   updateNote.title = title;
  // }

  // if (content) {
  //   updateNote.content = content;
  // }

  Note.findByIdAndUpdate(id, req.body, { new: true })
    .then(results => {
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
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  Note.findByIdAndRemove(id).then(res.status(204).end());
});

module.exports = router;
