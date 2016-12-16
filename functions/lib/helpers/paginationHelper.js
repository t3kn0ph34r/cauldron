'use strict';
const Config = require('../config.js');
const Model = require('../models/Model.js');
const CauldronError = require('../../lib/util/error.js').CauldronError;

const VALIDATION_ERROR = {
    NON_NUMERIC_LIMIT: 'nonNumericLimit',
    NON_NUMERIC_OFFSET: 'nonNumericOffset',
    NEGATIVE_OFFSET: 'negativeOffset',
    NEGATIVE_LIMIT: 'negativeLimit'
};

const DEFAULTS = {
    LIMIT: 50,
    OFFSET: 0
};

function getPagination(env, limit, offset) {
    let config = Config.withEnv(env);
    if (!limit) {
        limit = DEFAULTS.LIMIT;
    }

    if (!offset) {
        offset = DEFAULTS.OFFSET;
    }

    let paginationError = getPaginationError(limit, offset);
    if (paginationError) {
        throw new CauldronError(config.get('errors.generic.pagination.' + paginationError));
    }
        
    return {
        limit, offset
    };
}


/**
 * @param {number} limit
 * @param {number} offset
 */
function getPaginationError(limit, offset) {
    limit = parseInt(limit);
    offset = parseInt(offset);

    if (!isFinite(limit)) {
        return VALIDATION_ERROR.NON_NUMERIC_LIMIT;
    }
    
    if (!isFinite(offset)) {
        return VALIDATION_ERROR.NON_NUMERIC_OFFSET;
    }
    
    if (limit < 0) {
        return VALIDATION_ERROR.NEGATIVE_LIMIT;
    }
    
    if (offset < 0) {
        return VALIDATION_ERROR.NEGATIVE_OFFSET;
    }
}

/**
 * @callback FilterCallback
 * @param {BookshelfModel} model
 */

/**
 * Fetch a list of paginated models
 *
 * @param {Env} env - the current environment
 * @param {string} modelClassName - the class name of the model to paginate
 * @param {Object} options - the pagination options
 * @param {number} [options.limit] - the max number of models to return
 * @param {number} [options.offset] - the offset of the pagination
 * @param {string|string[]} [options.orderBy] - a column name (or columns) to order the results by
 * @param {*} [options.query] - a query that allows filtering the data
 * @return {*}
 */
function fetchModelsPaginated(env, modelClassName, options) {
    let config = Config.withEnv(env);

    if (! options) {
        options = {};
    }

    let pagination = getPagination(env, options.limit, options.offset);

    return Model.withEnv(env).getClass(modelClassName).then(ModelClass => {
        let model;

        if (options.query) {
            model = ModelClass.query(options.query);
        } else {
            model = ModelClass.forge();
        }

        if (options.orderBy) {
            if (Array.isArray(options.orderBy) ) {
                if (options.orderBy.length) {
                    options.orderBy.forEach(orderBy => {
                        model = model.orderBy(orderBy);
                    });
                }
            } else {
                model = model.orderBy(options.orderBy);
            }
        }

        return model.fetchPage(pagination);

    }).then(data => {
        if (data.length) {
            return {
                length: data.length,
                models: data.toJSON(),
                pagination: data.pagination
            };
        }

        throw new CauldronError(config.get('errors.generic.pagination.pageNotFound'));
    });
}

module.exports = {
    VALIDATION_ERROR,
    getPagination,
    fetchModelsPaginated
};