'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const User = require('../models/users');

const { users, folders } = require('../db/seed/data');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;
chai.use(chaiHttp);

// API tests

describe('Folders API resource', function() {
  // Define a token and user so it is accessible in the tests
  let token;
  let user;

  //hooks
  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    console.log('resetting test DB folders');
    return Promise.all([
      User.insertMany(users),
      Folder.insertMany(folders),
      Folder.createIndexes()
    ]).then(([users]) => {
      user = users[0];
      token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
    });
  });

  afterEach(function() {
    console.log('dropping DB');
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoints', function() {
    describe('GET all - api/folders', function() {
      //EXAMPLE OF: Parallel Request - Call both DB and API, then compare
      it('should return all folders', function() {
        return (
          Promise.all([Folder.find(), chai.request(app).get('/api/folders')])
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
      it('should return folders with right fields', function() {
        //setting up empty variable resFolder to hold results in this scope
        let resFolder;
        //1. First, call the API
        return (
          chai
            .request(app)
            .get('/api/folders')
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.a('array');
              expect(res.body).to.have.a.lengthOf.at.least(1);

              res.body.forEach(folder => {
                expect(folder).to.be.a('object');
                expect(folder).to.include.keys('name');
              });

              resFolder = res.body[0];
              //2. then call the database to retrieve the new document
              return Folder.findById(resFolder.id);
            })
            //3. then compare the API response to the database results
            .then(folder => {
              expect(resFolder.id).to.equal(folder.id);
              expect(resFolder.name).to.equal(folder.name);
              expect(new Date(resFolder.createdAt)).to.eql(folder.createdAt);
              expect(new Date(resFolder.updatedAt)).to.eql(folder.createdAt);
            })
        );
      });
    });

    describe('GET by id - api/folders/:id', function() {
      //EXAMPLE OF: Serial Request - Call DB then call API then compare
      it('should return correct folder', function() {
        //setting up empty variable data to hold results in this scope
        let data;
        //1. First, call the database
        return Folder.findOne()
          .then(result => {
            data = result;
            //2. Then call the API with the ID
            return chai.request(app).get(`/api/folders/${data.id}`);
          })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;

            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys(
              'id',
              'name',
              'createdAt',
              'updatedAt'
            );
            //3. Then compare database results to API response
            expect(res.body.id).to.equal(data.id);
            expect(res.body.name).to.equal(data.name);
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
      const newFolder = {
        name: 'The best folder ever!'
      };

      //create empty variable res to store our result in this scope
      let res;
      //1. First, call the API to insert the document
      return (
        chai
          .request(app)
          .post('/api/folders')
          .send(newFolder)
          //set the result we get back from sending newNote to see if it passes our expects
          .then(result => {
            res = result;
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.keys(
              'id',
              'name',
              'createdAt',
              'updatedAt'
            );
            //2. then call the database to retrieve the new document
            return Folder.findById(res.body.id);
          })
          //3. then compare the API response to the database results
          .then(noteData => {
            expect(res.body.id).to.equal(noteData.id);
            expect(res.body.name).to.equal(noteData.name);
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
        name: 'My new Folder is so awesome'
      };
      //1. First, call the database
      return (
        Folder.findOne()
          .then(folder => {
            //push the DB note id up into my updateData id
            updateData.id = folder.id;

            return chai
              .request(app)
              .put(`/api/folders/${folder.id}`)
              .send(updateData);
          })
          .then(res => {
            expect(res).to.have.status(200);
            //2. Then call the API with the ID
            return Folder.findById(updateData.id);
          })
          //3. Then compare database results to API response
          .then(folder => {
            expect(folder.name).to.equal(updateData.name);
          })
      );
    });
  });
  describe('DELETE endpoints', function() {
    it('should delete a folder by id', function() {
      //create empty variable note to store our result in this scope
      let folder;

      //find a note and pass it into response
      return (
        Folder.findOne()
          .then(foundFolder => {
            //set note variable to note object in response
            folder = foundFolder;
            return chai.request(app).delete(`/api/folders/${folder.id}`);
          })
          .then(response => {
            expect(response).to.have.status(204);
            return Folder.findById(folder.id);
          })
          //look in DB and make sure the passed in note is gone.
          .then(response => {
            expect(response).to.be.null;
          })
      );
    });
  });
});
