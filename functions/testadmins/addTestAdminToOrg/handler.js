'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');

var testAdminOrganization = require('../../lib/testadmins/testAdminOrganization.js');

module.exports.handler = function(event, context) {
    let testAdminId = event.params.path.id;
    let organizationId = event.params.path.organizationId;

    appBootstrap(event, context).then(env => {
        return testAdminOrganization.associate(testAdminId, organizationId, env);
    }).then(result => {
        context.succeed(result);
    }).catch(err => {
        context.fail(err);
    });
};