'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');
const Config = require('../../lib/config.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;

module.exports.handler = function(event, context) {
    const body = event.bodyJson;
    const orgId = event.params.path.id;
    let config;

    appBootstrap(event, context).then(env => {
        config = Config.withEnv(env);

        if (Object.keys(body).length === 0) {
            throw new CauldronError(config.get('errors.generic.noFields'));
        }

        // an org cannot change its ID
        if ('OrganizationID' in body) {
            throw new CauldronError(config.get('errors.organization.changeOrgID'));
        }

        return Model.withEnv(env).getClass('Organization');

    }).then(Organization => {

        return new Organization({
            OrganizationID: orgId
        }).fetch();

    }).then(organization => {
        if (!organization) {
            throw new CauldronError(config.get('errors.organization.invalidOrgID'));
        }

        // a root org cannot change its parent
        if (!organization.get('ParentOrganizationID') && 'ParentOrganizationID' in body) {
            throw new CauldronError(config.get('errors.organization.rootChangeParent'));
        }

        return organization.save(body, {patch: true}).then(() => organization.refresh());
    }).then(organization => {

        context.succeed(organization.toJSON());

    }).catch(err => {
        context.fail(err);
    });
};
