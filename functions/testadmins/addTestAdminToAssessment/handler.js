'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');

var testAdminAssessment = require('../../lib/testadmins/testAdminAssessment.js');

module.exports.handler = function(event, context) {
    let testAdminId = event.params.path.id;
    let assessmentId = event.params.path.assessmentId;

    appBootstrap(event, context).then(env => {
        return testAdminAssessment.associate(testAdminId, assessmentId, env);
    }).then(result => {
        context.succeed(result);
    }).catch(err => {
        context.fail(err);
    });
};