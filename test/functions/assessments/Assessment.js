'use strict';
const expect = require('chai').expect;
const paginationHelper = require('../../../functions/lib/helpers/paginationHelper.js');
const stringUtil = require('../../../functions/lib/util/string.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

describe('Assessment Model - Assessment Forms Count', function() {

    let assessments = new Array(20).fill(0).map((e, i) => {
        return {
            AssessmentName: 'Assessment ' + stringUtil.padLeft(i, 2),
            GradeLevel: '8',
            Subject: 'Math'
        };
    });


    before(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return Promise.all([
                knex('test_administration_assessment').del(),
                knex('assessment_form').del(),
                knex('test_administration').del()
            ]).then(() => {
                return knex('assessment').del();
            }).then(() => {
                return knex('assessment').insert(assessments);
            }).then(() => {
                return knex.select('assessmentId').from('assessment');
            }).then(assessments => {
                return knex('assessment_form').insert(assessments.reduce((assessmentForms, assessment) => {
                    let assessmentId = assessment.assessmentId;
                    return assessmentForms.concat([
                        {
                            assessmentId,
                            napAssessmentId: '12345',
                            formName: 'Test ' + assessmentId + ' Form 1',
                            version: 1,
                            versionDate: '2012-01-01'
                        },
                        {
                            assessmentId,
                            napAssessmentId: '12345',
                            formName: 'Test ' + assessmentId + ' Form 2',
                            version: 1,
                            versionDate: '2012-01-01'
                        }
                    ]);
                }, []));
            });
        });
    });

    after(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return Promise.all([
                knex('assessment').del(),
                knex('assessment_form').del()
            ]);
        });
    });

    it('should automatically get the assessment form count', function () {
        return Model.getClass('Assessment').then(Assessment => {
            return Assessment.forge().fetchAll();
        }).then(assessments => {
            return expect(assessments.every(assessment => assessment.get('AssessmentFormCount') === 2)).to.be.true;
        });
    });

    it('should automatically get the assessment form count on fetchPage', function () {
        return Model.getClass('Assessment').then(Assessment => {
            return Assessment.forge().fetchPage({limit: 10});
        }).then(assessments => {
            return expect(assessments.every(assessment => assessment.get('AssessmentFormCount') === 2)).to.be.true;
        });
    });

    describe('relations', function () {
        before(function () {
            return databaseHelper.getQueryBuilder().then(knex => {
                return Promise.all([
                    knex('test_administration').insert({
                        TestAdministrationID: 999,
                        AdministrationName: 'Test Administration',
                        AdministrationStartDate: '2016-02-18',
                        AdministrationEndDate: '2016-02-28',
                        Secured: true,
                        Active: true
                    }),
                    knex('assessment').insert({
                        AssessmentID: 888,
                        AssessmentName: 'Another Assessment',
                        GradeLevel: '8',
                        Subject: 'Math'
                    })

                ]).then(() => {
                    return Promise.all([
                        knex('assessment_form').insert({
                            assessmentFormId: 777,
                            assessmentId: 888,
                            napAssessmentId: 888,
                            formName: 'Test 888 Form 1',
                            version: 1,
                            versionDate: '2012-01-01'
                        }),
                        knex('test_administration_assessment').insert({
                            TestAdministrationID: 999,
                            AssessmentID: 888
                        })
                    ]);
                });
            });
         });

        after(function () {
            return databaseHelper.getQueryBuilder().then(knex => {
                return Promise.all([
                    knex('assessment_form').where('assessmentFormId', 777).del(),
                    knex('test_administration_assessment').where({
                        TestAdministrationID: 999,
                        AssessmentID: 888
                    }).del()
                ]).then(() => {
                    return Promise.all([
                        knex('test_administration').where('TestAdministrationID', 999).del(),
                        knex('assessment').where('AssessmentID', 888).del()
                    ]);
                });
            });
        });

        it('should automatically get the assessment form count when called as a relation', function () {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                return new TestAdministration({TestAdministrationID: 999}).assessments().fetch();
            }).then(assessments => {
                return expect(assessments.every(assessment => assessment.get('AssessmentFormCount') === 1)).to.be.true;
            });
        });

        it('should automatically get the assessment form count when called with withRelated', function () {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                return new TestAdministration({TestAdministrationID: 999}).fetch({withRelated: 'assessments'});
            }).then(testAdmin => {
                return Promise.all([
                    expect(testAdmin.related('assessments')).to.have.lengthOf(1),
                    expect(testAdmin.related('assessments').models[0].get('AssessmentFormCount')).to.equal(1)
                ]);
            });
        });
    });
});