'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const testingUtil = require('../../../functions/lib/util/testing.js');
const dateUtil = require('../../../functions/lib/util/date.js');
const functionRunner = require('../../functionRunner.js');
const testDataHelper = require('../../../functions/lib/helpers/testDataHelper.js');

function testSort(promise, field, ascending, caseSensitive) {
    let models = promise.then(pagination => pagination.models);

    return Promise.all([
        expect(promise).to.be.fulfilled,
        testingUtil.expect(expect, models).toBeSortedByField(field, ascending, caseSensitive)
    ]);
}

describe('getAssessments - sorted', function () {

    let testData = testDataHelper.createTestData(250, {
        AssessmentName: 'string:50',
        GradeLevel: 'string:2',
        Subject: 'Math',
        CreatedAt: dateUtil.randomDate,
        UpdatedAt: dateUtil.randomDate
    });

    before(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('assessment').insert(testData);
        });
    });

    after(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('assessment').del();
        });
    });

    it('should allow sorting by GradeLevel, ascending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: 'GradeLevel'
            }
        });

        return testSort(getAssessments, 'GradeLevel', true, false);
    });

    it('should allow sorting by GradeLevel, descending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: '-GradeLevel'
            }
        });

        return testSort(getAssessments, 'GradeLevel', false, false);
    });

    it('should allow sorting by Subject, ascending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: 'Subject'
            }
        });

        return testSort(getAssessments, 'Subject', true, false);
    });

    it('should allow sorting by Subject, descending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: '-Subject'
            }
        });

        return testSort(getAssessments, 'Subject', false, false);
    });

    it('should allow sorting by CreatedAt, ascending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: 'CreatedAt'
            }
        });

        return testSort(getAssessments, 'CreatedAt', true, false);
    });

    it('should allow sorting by CreatedAt, descending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: '-CreatedAt'
            }
        });

        return testSort(getAssessments, 'CreatedAt', false, false);
    });

    it('should allow sorting by UpdatedAt, ascending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: 'UpdatedAt'
            }
        });

        return testSort(getAssessments, 'UpdatedAt', true, false);
    });

    it('should allow sorting by UpdatedAt, descending', function () {
        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: '-UpdatedAt'
            }
        });

        return testSort(getAssessments, 'UpdatedAt', false, false);
    });

    it('should throw error when non-sortable field name is given', function () {
        let badField = 'BadField';

        let getAssessments = functionRunner.runFunction('getAssessments', {}, {
            querystring: {
                sort: badField
            }
        });

        return expect(getAssessments).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Invalid sort: ' + badField
        }));
    });
});