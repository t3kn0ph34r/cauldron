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

        return Model.withEnv(env).getClass('TestAdministration');

    }).then(TestAdministration => {

        return new TestAdministration({
            TestAdministrationID: orgId
        }).fetch();

    }).then(testAdmin => {
        if (!testAdmin) {
            throw new CauldronError(config.get('errors.testAdmin.invalidTestAdminID'));
        }

        // convert dates to pass validation
        testAdmin.set('AdministrationStartDate', testAdmin.get('AdministrationStartDate').toISOString().substr(0, 10));
        testAdmin.set('AdministrationEndDate', testAdmin.get('AdministrationEndDate').toISOString().substr(0, 10));

        // convert to boolean to pass validation
        testAdmin.set('Secured', Boolean(testAdmin.get('Secured')));
        testAdmin.set('Active', Boolean(testAdmin.get('Active')));

        // cannot update testAdminId
        if ('TestAdministrationID' in body) {
            throw new CauldronError(config.get('errors.testAdmin.changeTestAdminID'));
        }

        return testAdmin.save(body, {patch: true}).then(() => testAdmin.refresh());
    }).then(testAdmin => {

        context.succeed(testAdmin.toJSON());

    }).catch(err => {

        context.fail(err);
    });
};
