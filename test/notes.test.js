'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const { folders, tags, notes } = require('../db/seed/data');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;
chai.use(chaiHttp);

// API tests

describe('Notes API resource', function() {
  //
  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    console.log('resetting test DB notes');
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  });

  afterEach(function() {
    console.log('dropping DB');
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoints', function() {
    describe('GET all - api/notes', function() {
      //EXAMPLE OF: Parallel Request - Call both DB and API, then compare
      it('should return all notes', function() {
        return (
          Promise.all([Note.find(), chai.request(app).get('/api/notes')])
            // 3. then compare database results to API response
            .then(([data, res]) => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.a('array');
              expect(res.body).to.have.length(data.length);
            })
        );
      });

      //EXAMPLE OF: Serial Request - Call API then call DB then compare
      it('should return notes with right fields', function() {
        //setting up empty variable resNote to hold results in this scope
        let resNote;
        //1. First, call the API
        return (
          chai
            .request(app)
            .get('/api/notes')
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.a('array');
              expect(res.body).to.have.a.lengthOf.at.least(1);

              res.body.forEach(note => {
                expect(note).to.be.a('object');
                expect(note).to.include.keys('title', 'content');
              });

              resNote = res.body[0];
              //2. then call the database to retrieve the new document
              return Note.findById(resNote.id);
            })
            //3. then compare the API response to the database results
            .then(note => {
              expect(resNote.id).to.equal(note.id);
              expect(resNote.title).to.equal(note.title);
              expect(resNote.content).to.equal(note.content);
              expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
              expect(new Date(resNote.updatedAt)).to.eql(note.createdAt);
            })
        );
      });

      it('should return filtered result if searchTerm is valid', function() {
        //set up query searchTerm variable
        const query = 'lady gaga';
        let re = new RegExp(query, 'gi');

        //1. First, call the API
        return chai
          .request(app)
          .get(`/api/notes?searchTerm=${query}`)
          .then(res => {
            return Note.find({ $or: [{ title: re }, { content: re }] });
          })
          .then(res => {
            expect(res).to.be.a('array');
            expect(res).to.have.lengthOf(1);
          });

        //2. then call the database to retrieve the new document
        //3. then compare the API response to the database results
      });
    });

    describe('GET by id - api/notes/:id', function() {
      //EXAMPLE OF: Serial Request - Call DB then call API then compare
      it('should return correct note', function() {
        //setting up empty variable data to hold results in this scope
        let data;
        //1. First, call the database
        return Note.findOne()
          .then(result => {
            data = result;
            //2. Then call the API with the ID
            return chai.request(app).get(`/api/notes/${data.id}`);
          })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;

            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys(
              'id',
              'title',
              'content',
              'folderId',
              'tags',
              'createdAt',
              'updatedAt'
            );
            //3. Then compare database results to API response
            expect(res.body.id).to.equal(data.id);
            expect(res.body.title).to.equal(data.title);
            expect(res.body.content).to.equal(data.content);
            expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
            expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          });
      });
    });
  });
  describe('POST endpoints', function() {
    //EXAMPLE OF: Serial Request - Call API then call DB then compare
    it('should create and return a new item when provided valid data', function() {
      //set up new note to test post with
      const newNote = {
        title: 'The best article about cats ever!',
        content: 'Lorem ipsum dolor sit amet, conseceture adipiscing elit',
        folderId: '111111111111111111111102',
        tags: ['222222222222222222222200', '222222222222222222222201']
      };

      //create empty variable res to store our result in this scope
      let res;
      //1. First, call the API to insert the document
      return (
        chai
          .request(app)
          .post('/api/notes')
          .send(newNote)
          //set the result we get back from sending newNote to see if it passes our expects
          .then(result => {
            res = result;
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.keys(
              'id',
              'title',
              'content',
              'folderId',
              'tags',
              'createdAt',
              'updatedAt'
            );
            //2. then call the database to retrieve the new document
            return Note.findById(res.body.id);
          })
          //3. then compare the API response to the database results
          .then(noteData => {
            expect(res.body.id).to.equal(noteData.id);
            expect(res.body.title).to.equal(noteData.title);
            expect(res.body.content).to.equal(noteData.content);
            expect(new Date(res.body.createdAt)).to.eql(noteData.createdAt);
            expect(new Date(res.body.updatedAt)).to.eql(noteData.updatedAt);
          })
      );
    });
  });
  describe('PUT endpoints', function() {
    //EXAMPLE OF: Serial Request - Call DB then call API then compare
    it('should updated fields sent over', function() {
      //setting up test data to update with
      const updateData = {
        title: 'My new note is so awesome',
        content:
          'This is some content for my new awesome note. Incredible right?',
        folderId: '111111111111111111111102'
      };
      //1. First, call the database
      return (
        Note.findOne()
          .then(note => {
            //push the DB note id up into my updateData id
            updateData.id = note.id;

            return chai
              .request(app)
              .put(`/api/notes/${note.id}`)
              .send(updateData);
          })
          .then(res => {
            expect(res).to.have.status(200);
            //2. Then call the API with the ID
            return Note.findById(updateData.id);
          })
          //3. Then compare database results to API response
          .then(note => {
            expect(note.title).to.equal(updateData.title);
            expect(note.content).to.equal(updateData.content);
          })
      );
    });
  });
  describe('DELETE endpoints', function() {
    it('should delete a note by id', function() {
      //create empty variable note to store our result in this scope
      let note;

      //find a note and pass it into response
      return (
        Note.findOne()
          .then(foundNote => {
            //set note variable to note object in response
            note = foundNote;
            return chai.request(app).delete(`/api/notes/${note.id}`);
          })
          .then(response => {
            expect(response).to.have.status(204);
            return Note.findById(note.id);
          })
          //look in DB and make sure the passed in note is gone.
          .then(response => {
            expect(response).to.be.null;
          })
      );
    });
  });
});
