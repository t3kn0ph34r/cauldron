'use strict';
const appBootstrap = require('../../lib/appBootstrap.js');
const paginationHelper = require('../../lib/helpers/paginationHelper.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;
const Config = require('../../lib/config.js');
const objectUtil = require('../../lib/util/object.js');
const stringUtil = require('../../lib/util/string.js');
const databaseHelper = require('../../lib/helpers/databaseHelper.js');
const eventUtil = require('../../lib/util/event.js');

function isBoolean(value) {
    value = value.toString().toLowerCase();
    return ['0', '1', 'true', 'false'].indexOf(value) !== -1;
}

function makeBoolean(value) {
    switch(value.toString().toLowerCase()) {
        case '0':
        case 'false':
            return false;
        case '1':
        case 'true':
            return true;
        default:
            return Boolean(value);
    }
}

module.exports.handler = function(event, context) {
    let offset = eventUtil.getQueryStringParam(event, 'offset');
    let limit = eventUtil.getQueryStringParam(event, 'limit');
    let parentOrganizationId = eventUtil.getQueryStringParam(event, 'ParentOrganizationID');
    let organizationName = eventUtil.getQueryStringParam(event, 'OrganizationName');
    let active = eventUtil.getQueryStringParam(event, 'Active');
    let sort = eventUtil.getQueryStringParam(event, 'sort');

    appBootstrap(event, context).then(env => {
        let config = Config.withEnv(env);

        // only allow offset, limit, parent org id, org name, and active
        for (let prop in eventUtil.getQueryString(event)) {
            if (['offset', 'limit', 'ParentOrganizationID', 'OrganizationName', 'Active', 'sort'].indexOf(prop) === -1) {
                let error = objectUtil.deepCopy(config.get('errors.generic.pagination.badFilter'));
                error.errorMessage = error.errorMessage.replace('%FIELDNAME%', prop);

                throw new CauldronError(error);
            }
        }

        if (sort) {
            if (!['OrganizationName', 'OrganizationType', 'CreatedAt', 'UpdatedAt'].some(field => sort === field || sort === '-' + field)) {
                let error = objectUtil.deepCopy(config.get('errors.generic.pagination.badSort'));
                error.errorMessage = error.errorMessage.replace('%FIELDNAME%', sort);

                throw new CauldronError(error);
            }
        }

        let orderBy = [];
        if (!sort) {
            // if there's no sort, default to org name
            orderBy = ['OrganizationName'];
        } else if (sort.indexOf('OrganizationName') !== -1) {
            //if the sort is on Org name (asc or desc), then just sort by that column
            orderBy = [sort];
        } else {
            //otherwise, sort by the specified column, with org name as a secondary sort
            orderBy = [sort, 'OrganizationName'];
        }


        return databaseHelper.withEnv(env).getQueryBuilder().then(knex => {
            return paginationHelper.fetchModelsPaginated(env, 'Organization', {
                limit,
                offset,
                orderBy,
                query: function(query) {
                    if (parentOrganizationId) {
                        // case insensitive search
                        let parentOrgIdColumnLowerCase = knex.raw('LOWER(??)', 'ParentOrganizationID');
                        let parentOrgIdLowerCase = parentOrganizationId.toLowerCase();

                        query.where(parentOrgIdColumnLowerCase, parentOrgIdLowerCase);
                    }

                    if (organizationName) {
                        // case insensitive search
                        let orgNameColumnLowerCase = knex.raw('LOWER(??)', 'OrganizationName');
                        let orgNameLowerCase = organizationName.toLowerCase();

                        query.where(orgNameColumnLowerCase, 'like', `%${ stringUtil.escapeLike(orgNameLowerCase) }%`);
                    }

                    if (active !== null && active !== undefined) {
                        if (isBoolean(active)) {
                            active = makeBoolean(active);
                        } else {
                            throw new CauldronError(config.get('errors.organization.nonBooleanActive'));
                        }
                    } else {
                        active = true;
                    }

                    query.where('Active', active);
                }
            });
        });
    }).then(data => {
        context.succeed(data);
    }).catch(err => {
        context.fail(err);
    });
};
