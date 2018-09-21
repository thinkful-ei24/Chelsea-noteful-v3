'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');

const { tags } = require('../db/seed/data');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;
chai.use(chaiHttp);

// API tests
describe('Tags API resource', function() {
  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    console.log('resetting test DB folders');
    return Tag.insertMany(tags);
  });

  afterEach(function() {
    console.log('dropping DB');
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoints', function() {
    describe('GET all - api/tags', function() {
      //EXAMPLE OF: Parallel Request - Call both DB and API, then compare
      it('should return all tags', function() {
        return (
          Promise.all([Tag.find(), chai.request(app).get('/api/tags')])
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
      it('should return tags with right fields', function() {
        //setting up empty variable resFolder to hold results in this scope
        let resTag;
        //1. First, call the API
        return (
          chai
            .request(app)
            .get('/api/tags')
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.a('array');
              expect(res.body).to.have.a.lengthOf.at.least(1);

              res.body.forEach(tag => {
                expect(tag).to.be.a('object');
                expect(tag).to.include.keys('name');
              });

              resTag = res.body[0];
              //2. then call the database to retrieve the new document
              return Tag.findById(resTag.id);
            })
            //3. then compare the API response to the database results
            .then(tag => {
              expect(resTag.id).to.equal(tag.id);
              expect(resTag.name).to.equal(tag.name);
              expect(new Date(resTag.createdAt)).to.eql(tag.createdAt);
              expect(new Date(resTag.updatedAt)).to.eql(tag.createdAt);
            })
        );
      });
    });

    describe('GET by id - api/tags/:id', function() {
      //EXAMPLE OF: Serial Request - Call DB then call API then compare
      it('should return correct tag', function() {
        //setting up empty variable data to hold results in this scope
        let data;
        //1. First, call the database
        return Tag.findOne()
          .then(result => {
            data = result;
            //2. Then call the API with the ID
            return chai.request(app).get(`/api/tags/${data.id}`);
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
      //set up new tag to test post with
      const newTag = {
        name: 'The best tag ever!'
      };

      //create empty variable res to store our result in this scope
      let res;
      //1. First, call the API to insert the document
      return (
        chai
          .request(app)
          .post('/api/tags')
          .send(newTag)
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
            return Tag.findById(res.body.id);
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
        name: 'My new tag is so awesome'
      };
      //1. First, call the database
      return (
        Tag.findOne()
          .then(tag => {
            //push the DB note id up into my updateData id
            updateData.id = tag.id;

            return chai
              .request(app)
              .put(`/api/tags/${tag.id}`)
              .send(updateData);
          })
          .then(res => {
            expect(res).to.have.status(200);
            //2. Then call the API with the ID
            return Tag.findById(updateData.id);
          })
          //3. Then compare database results to API response
          .then(tag => {
            expect(tag.name).to.equal(updateData.name);
          })
      );
    });
  });
  describe('DELETE endpoints', function() {
    //EXAMPLE OF: Serial Request - Call DB then call API then compare
    it('should delete a tag by id', function() {
      //create empty variable note to store our result in this scope
      let tag;

      //find a note and pass it into response
      return (
        Tag.findOne()
          .then(foundTag => {
            //set note variable to note object in response
            tag = foundTag;
            return chai.request(app).delete(`/api/tags/${tag.id}`);
          })
          .then(response => {
            expect(response).to.have.status(204);
            return Tag.findById(tag.id);
          })
          //look in DB and make sure the passed in note is gone.
          .then(response => {
            expect(response).to.be.null;
          })
      );
    });
  });
});
