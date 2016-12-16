'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');

var studentOrganization = require('../../lib/students/studentOrganization.js');

module.exports.handler = function(event, context) {
    let studentId = event.params.path.studentId;
    let organizationId = event.params.path.organizationId;

    appBootstrap(event, context).then(env => {
        return studentOrganization.disassociate(studentId, organizationId, env);
    }).then(result => {
        context.succeed(result);
    }).catch(err => {
        context.fail(err);
    });
};