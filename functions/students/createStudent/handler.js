'use strict';
const Model = require('../../lib/models/Model.js');
const appBootstrap = require('../../lib/appBootstrap.js');

module.exports.handler = function(event, context) {
    let body = event.bodyJson;
    appBootstrap(event, context).then(env => {

        return Model.withEnv(env).getClass('Student');

    }).then(Student => {

        return (new Student()).save(body).return(Student);

    }).then(Student => {

        return new Student({
            UserID: body.UserID
        }).fetch();

    }).then(student => {

        context.succeed(student.toJSON());

    }).catch(err => {

        context.fail(err);
    });
};
