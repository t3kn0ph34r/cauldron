'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');
const Model = require('../../lib/models/Model.js');
const Config = require('../../lib/config.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;

module.exports.handler = function(event, context, cb) {
    const body = event.bodyJson;
    const studentId = event.params.path.studentId;
    let config;

    appBootstrap(event, context).then(env => {
        config = Config.withEnv(env);

        if (Object.keys(body).length === 0) {
            throw new CauldronError(config.get('errors.generic.noFields'));
        }

        return Model.withEnv(env).getClass('Student');
    }).then(Student => {
        return (new Student({
            UserID: studentId
        })).fetch();
    }).then(student => {
        if (!student) {
            throw new CauldronError(config.get('errors.student.studentNotFound'));
        }

        return student.save(body, {patch: true}).then(() => student.refresh());
    }).then(student => {

        context.succeed(student.toJSON());
    }).catch(err => {

        context.fail(err);
    });
};
