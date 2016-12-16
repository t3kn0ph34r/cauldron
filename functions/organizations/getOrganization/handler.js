'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');
const Config = require('../../lib/config.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;

module.exports.handler = function(event, context) {
    const orgId = event.params.path.id;
    let config;
    
    appBootstrap(event, context).then(env => {
        config = Config.withEnv(env);

        if (!orgId) {
            return Promise.reject(config.get('errors.organization.emptyOrgID'));
        }

        return Model.withEnv(env).getClass('Organization');
    }).then(Organization => {
        return new Organization({
            OrganizationID: orgId
        }).fetch();
    }).then(organization => {
        if (organization) {
            return organization;
        }

        throw new CauldronError(config.get('errors.organization.invalidOrgID'));
    }).then(organizaton => {
        return context.succeed(organizaton.toJSON());
    }).catch(err => {
        return context.fail(err);
    });
};
