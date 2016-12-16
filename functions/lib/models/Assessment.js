'use strict';
const Model = require('./Model.js');
const DatabaseHelper = require('../helpers/databaseHelper.js');
const BlueBirdPromise = require('../util/promise.js').BluebirdPromise;
const TABLE_NAME = 'assessment';
const ID_ATTRIBUTE = 'AssessmentID';

module.exports = Model.define('Assessment', {
    tableName: TABLE_NAME,
    idAttribute: ID_ATTRIBUTE,

    testAdmins: function () {
        return this.belongsToMany('TestAdministration', 'test_administration_assessment', 'AssessmentID', 'TestAdministrationID');
    },
    assessmentForms: function () {
        return this.hasMany('AssessmentForm', 'assessmentId');
    }
}, function onRegistered(env, Assessment) {

    // adds AssessmentFormCount as a column in the query, which aggregates the number of assessment_forms for each entry
    function addAssessmentFormCountColumn(env, columns, query) {
        let databaseHelper = DatabaseHelper.withEnv(env);

        // if this is a count instead of a table query, return early. This is necessary for pagination, as it does a count behind the scenes
        if (query._statements.length === 1 && query._statements[0].method === 'count') {
            return BlueBirdPromise.resolve();
        }

        return BlueBirdPromise.all([
            databaseHelper.getQueryBuilder(),
            Model.withEnv(env).getClass('AssessmentForm')
        ]).spread((knex, AssessmentForm) => {

            let assessmentForm = AssessmentForm.forge();
            let assessmentFormIdColumn = assessmentForm.idAttribute;
            let assessmentFormTableName = assessmentForm.tableName;

            columns = columns || [];

            let countColumn = knex.raw('count(??.??) as ??', [assessmentFormTableName, assessmentFormIdColumn, 'AssessmentFormCount']);
            let allColumns = columns.concat(countColumn);


            /*
             results in a query that looks like the following:

             SELECT COUNT(`assessment_form`.`assessmentFormId) as AssessmentFormCount
             FROM `assessment`
             JOIN `assessment_form` ON `assessment`.`AssessmentID` = `assessment_form`.`assessmentId`
             GROUP BY `assessment`.`AssessmentID`

             in addition to other columns, sorting, and filtering
             */

            query
                .column(allColumns)
                .leftJoin(assessmentFormTableName, `${TABLE_NAME}.${ID_ATTRIBUTE}`, `${assessmentFormTableName}.assessmentId`)
                .groupBy(`${TABLE_NAME}.${ID_ATTRIBUTE}`);
        });
    }


    return Model.withEnv(env).getEventEmitter().then(events => {

        // whenever assessments are fetched, get the AssessmentFormCount column
        events.on('fetching', (target, columns, options) => {
            if (target.model === Assessment || target instanceof Assessment) {
                return addAssessmentFormCountColumn(env, columns, options.query);
            }
        });



        // whenever assessments are saved, don't save the AssessmentFormCount
        events.on('saving', target => {
            function removeAssessmentFormCountColumn(model) {
                if (model.has('AssessmentFormCount')) {
                    model.unset('AssessmentFormCount');
                }
            }

            if (target.model === Assessment || target instanceof Assessment) {
                if (Array.isArray(target.models)) {
                    target.models.forEach(removeAssessmentFormCountColumn);
                } else {
                    removeAssessmentFormCountColumn(target);
                }
            }
        });
    });
});