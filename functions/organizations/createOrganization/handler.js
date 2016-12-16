'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');

module.exports.handler = function(event, context) {
    let body = event.bodyJson;
    appBootstrap(event, context).then(env => {

        return Model.withEnv(env).getClass('Organization');

    }).then(Organization => {

        return (new Organization()).save(body).return(Organization);

    }).then(Organization => {

        return new Organization({
            OrganizationID: body.OrganizationID
        }).fetch();

    }).then(organization => {

        context.succeed(organization.toJSON());

    }).catch(err => {

        context.fail(err);
    });
};
