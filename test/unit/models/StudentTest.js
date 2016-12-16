'use strict';
const sinon = require('sinon');
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

describe('Student Unit Tests', function () {

    describe('updating', function() {

        it('should return true if UserID exists', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(student, 'previous').throws('Wrong parameter passed')
                    .withArgs('UserID')
                    .returns(true);

                return expect(student.updating()).to.equal(true);
            });
        });

        it('should return false if UserID doesn\'t exist', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(student, 'previous').throws('Wrong parameter passed')
                    .withArgs('UserID')
                    .returns(false);

                return expect(student.updating()).to.equal(false);
            });
        });
    });

    describe('notChangedUserId', function() {

        it('should return false if changed UserID is defined', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                student.changed.UserID = true;

                return expect(student.notChangedUserId()).to.equal(false);
            });
        });

        it('should return true if changed UserID is undefined', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                student.changed.UserID = undefined;

                return expect(student.notChangedUserId()).to.equal(true);
            });
        });
    });

    describe('requiredMultipleAccomXX', function() {

        it('should return true if accomCount is zero', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                student.accomCount = 0;

                return expect(student.requiredMultipleAccomXX()).to.equal(true);
            });
        });

        it('should return true if all accom names exist', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                student.accomCount = 2;
                sandbox.stub(student, 'has').throws('Wrong parameter passed')
                    .withArgs('Accom01')
                    .returns(true)
                    .withArgs('Accom02')
                    .returns(true);

                return expect(student.requiredMultipleAccomXX()).to.equal(true);
            });
        });

        it('should throw error if accom name doesn\'t exist', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                student.accomCount = 1;
                sandbox.stub(student, 'has').throws('Wrong parameter passed')
                    .withArgs('Accom01')
                    .returns(false);

                return expect(function() {
                    student.requiredMultipleAccomXX();
                }).to.throw(JSON.stringify({
                    responseCode: 400,
                    errorMessage: 'Missing required value: Accom01'
                }));
            });
        });
    });

    describe('booleanMultipleAccomXX', function() {

        it('should return true if accomCount is zero', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                student.accomCount = 0;

                return expect(student.booleanMultipleAccomXX()).to.equal(true);
            });
        });

        it('should return true if all accom names are zero, one, or boolean', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                student.accomCount = 4;
                sandbox.stub(student, 'get').throws('Wrong parameter passed')
                    .withArgs('Accom01')
                    .returns(0)
                    .withArgs('Accom02')
                    .returns(1)
                    .withArgs('Accom03')
                    .returns(true)
                    .withArgs('Accom04')
                    .returns(false);

                return expect(student.booleanMultipleAccomXX()).to.equal(true);
            });
        });

        it('should throw error if accom name is a string', function() {
            return Model.getClass('Student').then(Student => {
                let student = new Student();
                let sandbox = sinon.sandbox.create();

                student.accomCount = 1;
                sandbox.stub(student, 'has').throws('Wrong parameter passed')
                    .withArgs('Accom01')
                    .returns('true');

                return expect(function() {
                    student.booleanMultipleAccomXX();
                }).to.throw(JSON.stringify({
                    responseCode: 400,
                    errorMessage: 'Accom01 is not a boolean'
                }));
            });
        });
    });
});