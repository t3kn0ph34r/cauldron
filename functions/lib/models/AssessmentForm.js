'use strict';
const Model = require('./Model.js');

module.exports = Model.define('AssessmentForm', {
    tableName: 'assessment_form',
    idAttribute: 'assessmentFormId',

    assessment: function () {
        return this.belongsTo('Assessment', 'assessmentId');
    }
});