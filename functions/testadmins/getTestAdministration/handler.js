'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');
const Config = require('../../lib/config.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;

module.exports.handler = function (event, context) {
    const testAdminId = event.params.path.id;
    let config;

    appBootstrap(event, context).then(env => {
        config = Config.withEnv(env);

        if (!testAdminId) {
            return Promise.reject(config.get('errors.testAdmin.emptyTestAdminID'));
        }

        return Model.withEnv(env).getClass('TestAdministration');
    }).then(TestAdministration => {
        return new TestAdministration({
            TestAdministrationID: testAdminId
        }).fetch();
    }).then(testAdmin => {
        if (testAdmin) {
            return testAdmin;
        }

        throw new CauldronError(config.get('errors.testAdmin.invalidTestAdminID'));
    }).then(testAdmin => {
        return context.succeed(testAdmin.toJSON());
    }).catch(err => {
        return context.fail(err);
    });
};