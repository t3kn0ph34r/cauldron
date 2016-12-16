'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');
const paginationHelper = require('../../lib/helpers/paginationHelper.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;
const Config = require('../../lib/config.js');
const objectUtil = require('../../lib/util/object.js');
const databaseHelper = require('../../lib/helpers/databaseHelper.js');
const eventUtil = require('../../lib/util/event.js');

module.exports.handler = function(event, context) {
    let offset = eventUtil.getQueryStringParam(event, 'offset');
    let limit = eventUtil.getQueryStringParam(event, 'limit');

    appBootstrap(event, context).then(env => {
        let config = Config.withEnv(env);

        // only allow offset and limit
        for (let prop in eventUtil.getQueryString(event)) {
            if (['offset', 'limit'].indexOf(prop) === -1) {
                let error = objectUtil.deepCopy(config.get('errors.generic.pagination.badFilter'));
                error.errorMessage = error.errorMessage.replace('%FIELDNAME%', prop);

                throw new CauldronError(error);
            }
        }

        return databaseHelper.withEnv(env).getQueryBuilder().then(() => {
            return paginationHelper.fetchModelsPaginated(env, 'TestAdministration', {
                limit,
                offset,
                orderBy: 'AdministrationName'
            });
        });
    }).then(data => {
        context.succeed(data);
    }).catch(err => {
        context.fail(err);
    });
};