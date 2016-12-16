'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');
const paginationHelper = require('../../lib/helpers/paginationHelper.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;
const Config = require('../../lib/config.js');
const objectUtil = require('../../lib/util/object.js');
const databaseHelper = require('../../lib/helpers/databaseHelper.js');
const eventUtil = require('../../lib/util/event.js');

module.exports.handler = function (event, context) {
    let offset = eventUtil.getQueryStringParam(event, 'offset');
    let limit = eventUtil.getQueryStringParam(event, 'limit');
    let sort = eventUtil.getQueryStringParam(event, 'sort');

    appBootstrap(event, context).then(env => {
        let config = Config.withEnv(env);

        // only allow offset and limit
        for (let prop in eventUtil.getQueryString(event)) {
            if (['offset', 'limit', 'sort'].indexOf(prop) === -1) {
                let error = objectUtil.deepCopy(config.get('errors.generic.pagination.badFilter'));
                error.errorMessage = error.errorMessage.replace('%FIELDNAME%', prop);

                throw new CauldronError(error);
            }
        }

        if (sort) {
            if (!['AssessmentName', 'GradeLevel', 'Subject', 'CreatedAt', 'UpdatedAt'].some(field => sort === field || sort === '-' + field)) {
                let error = objectUtil.deepCopy(config.get('errors.generic.pagination.badSort'));
                error.errorMessage = error.errorMessage.replace('%FIELDNAME%', sort);

                throw new CauldronError(error);
            }
        }

        let orderBy = [];
        if (!sort) {
            // if there's no sort, default to AssessmentName
            orderBy = ['AssessmentName'];
        } else if (sort.indexOf('AssessmentName') !== -1) {
            //if the sort is on Assessment name (asc or desc), then just sort by that column
            orderBy = [sort];
        } else {
            //otherwise, sort by the specified column, with Assessment name as a secondary sort
            orderBy = [sort, 'AssessmentName'];
        }

        return databaseHelper.withEnv(env).getQueryBuilder().then(knex => {
            return paginationHelper.fetchModelsPaginated(env, 'Assessment', {
                limit,
                offset,
                orderBy
            });
        });
    }).then(data => {
        context.succeed(data);
    }).catch(err => {
        context.fail(err);
    });
};
