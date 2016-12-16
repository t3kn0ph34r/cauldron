'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');

module.exports.handler = function (event, context) {
    let body = event.bodyJson;
    appBootstrap(event, context).then(env => {

        return Model.withEnv(env).getClass('TestAdministration');

    }).then(TestAdmin => {

        return (new TestAdmin()).save(body);

    }).then(testAdmin => {

        context.succeed(testAdmin.toJSON());

    }).catch(err => {

        context.fail(err);
    });
};
