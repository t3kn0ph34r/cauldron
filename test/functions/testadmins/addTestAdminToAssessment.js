'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const BluebirdPromise = require('bluebird');

var testAdminObject = {
    AdministrationName: 'A Test Administration',
    AdministrationStartDate: '2016-07-05',
    AdministrationEndDate: '2016-07-15',
    Secured: true,
    Active: true
};

let testAdminId;

var secondTestAdminObject = {
    AdministrationName: 'Another Test Administration',
    AdministrationStartDate: '2016-07-05',
    AdministrationEndDate: '2016-07-15',
    Secured: true,
    Active: true
};

let secondTestAdminId;

var assessmentObject = {
    AssessmentName: 'Another Assessment',
    GradeLevel: '8',
    Subject: 'Math'
};

let assessmentId;

var secondAssessmentObject = {
    AssessmentName: 'Another Assessment',
    GradeLevel: '8',
    Subject: 'Math'
};

let secondAssessmentId;

var secondAssessmentAssociationObject = {};
var secondTestAdminAssociationObject = {};

describe('addTestAdminToAssessment', function () {
    beforeEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return BluebirdPromise.all([
                knex('test_administration').insert(testAdminObject).then(ids => ids[0]),
                knex('assessment').insert(assessmentObject).then(ids => ids[0])
            ]).spread((_testAdminId, _assessmentId)=> {
                testAdminId = _testAdminId;
                secondAssessmentAssociationObject.TestAdministrationId = testAdminId;
                
                assessmentId = _assessmentId;
                secondTestAdminAssociationObject.AssessmentID = assessmentId;
            });
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration_assessment').del().then(() => knex);
        }).then(knex => {
            return Promise.all([
                knex('test_administration').del(),
                knex('assessment').del()
            ]).then(() => knex);
        });
    });

    it('should succeed with valid TestAdministrationID and AssessmentID', function() {
        let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
            path: {
                id: testAdminId,
                assessmentId: assessmentId
            }
        });

        return expect(addTestAdminToAssessment).to.be.fulfilled.and.eventually.equal('Test administration added to assessment');
    });

    it('should succeed even if other Assessments are associated with Test administration', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Assessment into database.
            return knex('assessment').insert(secondAssessmentObject).then(ids => {
                secondAssessmentId = ids[0];
                secondAssessmentAssociationObject.AssessmentID = secondAssessmentId;
            }).then(() => knex);
        }).then(knex => {
            // Insert Test administration association to second Assessment.
            return knex('test_administration_assessment').insert(secondAssessmentAssociationObject);
        }).then(() => {
            let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
                path: {
                    id: testAdminId,
                    assessmentId: assessmentId
                }
            });

            return expect(addTestAdminToAssessment).to.be.fulfilled.and.eventually.equal('Test administration added to assessment');
        });
    });

    it('should succeed even if other Test administrations are associated with Assessment', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Test administration into database.
            return knex('test_administration').insert(secondTestAdminObject).then(ids => {
                secondTestAdminId = ids[0];
                secondTestAdminAssociationObject.TestAdministrationId = secondTestAdminId;
            }).then(() => knex);
        }).then(knex => {
            // Insert Assessment association to second Test administration.
            return knex('test_administration_assessment').insert(secondTestAdminAssociationObject);
        }).then(() => {
            let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
                path: {
                    id: testAdminId,
                    assessmentId: assessmentId
                }
            });

            return expect(addTestAdminToAssessment).to.be.fulfilled.and.eventually.equal('Test administration added to assessment');
        });
    });

    it('should not allow empty TestAdministrationID', function() {
        let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
            path: {
                id: '',
                assessmentId: assessmentId
            }
        });

        return expect(addTestAdminToAssessment).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: TestAdministrationID'
        }));
    });

    it('should not allow invalid TestAdministrationID', function() {
        let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
            path: {
                id: '3323333223',
                assessmentId: assessmentId
            }
        });

        return expect(addTestAdminToAssessment).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid TestAdministrationID'
        }));
    });

    it('should not allow invalid AssessmentID', function() {
        let addTestAdminToAssessment = functionRunner.runFunction('addTestAdminToAssessment', null, {
            path: {
                id: testAdminId,
                assessmentId: '43948237429387'
            }
        });

        return expect(addTestAdminToAssessment).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid AssessmentID'
        }));
    });

    it('should not allow duplicate TestAdministrationID and AssessmentID combination', function() {

        let addTestAdminToAssessment = databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration_assessment').insert({
                TestAdministrationID: testAdminId,
                AssessmentID: assessmentId
            });
        }).then(() => {
            return functionRunner.runFunction('addTestAdminToAssessment', null, {
                path: {
                    id: testAdminId,
                    assessmentId: assessmentId
                }
            });
        });

        return expect(addTestAdminToAssessment).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Association between test administration and assessment already exists'
        }));
    });
});
