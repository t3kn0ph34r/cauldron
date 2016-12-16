'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const testingUtil = require('../../../functions/lib/util/testing.js');
const functionRunner = require('../../functionRunner.js');
const testDataHelper = require('../../../functions/lib/helpers/testDataHelper.js');

function testSort(promise, field, ascending, caseSensitive) {
    let models = promise.then(pagination => pagination.models);

    return Promise.all([
        expect(promise).to.be.fulfilled,
        testingUtil.expect(expect, models).toBeSortedByField(field, ascending, caseSensitive)
    ]);
}

describe('getAssessments', function () {

    let testData = testDataHelper.createTestData(250, {
        AssessmentName: 'string:50',
        GradeLevel: '12',
        Subject: 'Math'
    });

    let sortedTestData = testData.sort((assessmentA, assessmentB) => {
        let nameA = assessmentA.AssessmentName.toLowerCase();
        let nameB = assessmentB.AssessmentName.toLowerCase();

        return nameA <= nameB ? nameA < nameB ? -1 : 0 : 1;
    });

    before(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('assessment').insert(testData);
        });
    });

    after(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('assessment').del();
        });
    });

    it('should return 50 valid models by default', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {});
        return Promise.all([
            expect(getAssessments).to.be.fulfilled,
            expect(getAssessments).to.eventually.have.property('models'),
            expect(getAssessments).to.eventually.have.deep.property('models[49].AssessmentID'),
            expect(getAssessments).to.eventually.have.deep.property('models[49].AssessmentName', sortedTestData[49].AssessmentName),
            expect(getAssessments).to.eventually.have.deep.property('models[49].GradeLevel', sortedTestData[49].GradeLevel),
            expect(getAssessments).to.eventually.have.deep.property('models[49].Subject', sortedTestData[49].Subject),
            expect(getAssessments).to.eventually.have.deep.property('models[49].CreatedAt'),
            expect(getAssessments).to.eventually.have.deep.property('models[49].UpdatedAt'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].AssessmentID'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].AssessmentName'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].GradeLevel'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].Subject'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].CreatedAt'),
            expect(getAssessments).to.not.eventually.have.deep.property('models[50].UpdatedAt')
        ]);
    });

    it('should return models sorted by AssessmentName, ascending, by default', function() {
        let getAssessments = functionRunner.runFunction('getAssessments');
        return testSort(getAssessments, 'AssessmentName', true, false);
    });

    it('should return models 51 through 100 when offset is 50', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                offset: 50
            }
        });

        return Promise.all([
            expect(getAssessments).to.be.fulfilled,
            expect(getAssessments).to.eventually.have.deep.property('models[0].AssessmentName', sortedTestData[50].AssessmentName),
            expect(getAssessments).to.eventually.have.deep.property('models[49].AssessmentName', sortedTestData[99].AssessmentName)
        ]);
    });

    it('should return 10 models when limit is 10', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                limit: 10
            }
        });

        return Promise.all([
            expect(getAssessments).to.be.fulfilled,
            expect(getAssessments).to.eventually.have.deep.property('models[0].AssessmentName', sortedTestData[0].AssessmentName),
            expect(getAssessments).to.eventually.have.deep.property('models[9].AssessmentName', sortedTestData[9].AssessmentName),
            expect(getAssessments).to.not.eventually.have.deep.property('models[10].AssessmentName')
        ]);
    });

    it('should return models 10 through 20 when limit is 10 and offset is 10', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                limit: 10,
                offset: 10
            }
        });

        return Promise.all([
            expect(getAssessments).to.be.fulfilled,
            expect(getAssessments).to.eventually.have.deep.property('models[0].AssessmentName', sortedTestData[10].AssessmentName),
            expect(getAssessments).to.eventually.have.deep.property('models[9].AssessmentName', sortedTestData[19].AssessmentName),
            expect(getAssessments).to.not.eventually.have.deep.property('models[10].AssessmentName')
        ]);
    });

    it('should return correct pagination details for a default request', function() {
        let getAssessments = functionRunner.runFunction('getAssessments');
        return Promise.all([
            expect(getAssessments).to.eventually.have.property('pagination'),
            expect(getAssessments).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getAssessments).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getAssessments).to.eventually.have.deep.property('pagination.pageCount', 5),
            expect(getAssessments).to.eventually.have.deep.property('pagination.rowCount', 250)
        ]);
    });

    it('should return correct pagination details for a request with limit and offset of 10', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                limit: 10,
                offset: 10
            }
        });
        return Promise.all([
            expect(getAssessments).to.eventually.have.property('pagination'),
            expect(getAssessments).to.eventually.have.deep.property('pagination.limit', 10),
            expect(getAssessments).to.eventually.have.deep.property('pagination.offset', 10),
            expect(getAssessments).to.eventually.have.deep.property('pagination.pageCount', 25),
            expect(getAssessments).to.eventually.have.deep.property('pagination.rowCount', 250)
        ]);
    });

    it('should throw an error when offset is greater than the size of the dataset', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                offset: 251
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Page not found'
        }));
    });

    it('should throw an error when limit is negative', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                limit: -50
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Limit parameter must not be negative'
        }));
    });

    it('should throw an error when offset is negative', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                offset: -50
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Offset parameter must not be negative'
        }));
    });

    it('should throw an error when limit is non-numeric', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                limit: 'abc'
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Limit parameter must be numeric'
        }));
    });

    it('should throw an error when offset is non-numeric', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                offset: 'abc'
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Offset parameter must be numeric'
        }));
    });

    it('should throw an error when invalid query string is provided', function() {
        let getAssessments = functionRunner.runFunction('getAssessments', null, {
            querystring: {
                badFilter: 'abc'
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Invalid filter: badFilter'
        }));
    });
});