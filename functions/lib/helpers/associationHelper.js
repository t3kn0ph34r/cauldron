'use strict';
const Config = require('../config.js');
const Model = require('../models/Model.js');
const BluebirdPromise = require('../util/promise.js').BluebirdPromise;
const CauldronError = require('../util/error.js').CauldronError;

/**
 * @typedef {Object} ModelData
 * @property {string} class
 * @property {string} id
 */

/** 
 * @typedef {Object} AssociationErrors
 * @property {string} missingSourceId
 * @property {string} missingTargetId
 * @property {string} invalidSourceId
 * @property {string} invalidTargetId
 */

/**
 * @typedef {Object} AssociateErrors
 * @property {string} missingSourceId
 * @property {string} missingTargetId
 * @property {string} invalidSourceId
 * @property {string} invalidTargetId
 * @property {string} duplicateAssociation
 */

/**
 * @typedef {Object} DisassociateErrors
 * @property {string} missingSourceId
 * @property {string} missingTargetId
 * @property {string} invalidSourceId
 * @property {string} invalidTargetId
 * @property {string} invalidAssociation
 */


/**
 * @typedef {Object} AssociationOptions
 * @property {ModelData} sourceModel
 * @property {ModelData} targetModel
 * @property {string} associationMethod
 * @property {AssociationErrors} errors
 */

/**
 * @typedef {AssociationOptions} AssociateOptions
 * @property {ModelData} sourceModel
 * @property {ModelData} targetModel
 * @property {string} associationMethod
 * @property {AssociateErrors} errors
 * @property {string} message
 */


/**
 * @typedef {AssociationOptions} DisassociateOptions
 * @property {ModelData} sourceModel
 * @property {ModelData} targetModel
 * @property {string} associationMethod
 * @property {DisassociateErrors} errors
 * @property {string} message
 */


/**

/**
 * Validate an association between two models
 *
 * @param {Env} env
 * @param {AssociationOptions} options
 */
function checkAssociation(env, options) {
    const sourceModelData = options.sourceModel;
    const targetModelData = options.targetModel;
    const associationMethod = options.associationMethod;
    const errors = options.errors;

    const sourceModelClassName = sourceModelData.class;
    const targetModelClassName = targetModelData.class;

    const config = Config.withEnv(env);

    const sourceId = sourceModelData.id;
    const targetId = targetModelData.id;

    let sourceTableName;
    let sourcePrimaryKey;

    let targetTableName;
    let targetPrimaryKey;

    return BluebirdPromise.all([
        Model.withEnv(env).getClass(sourceModelClassName),
        Model.withEnv(env).getClass(targetModelClassName)
    ]).spread((SourceModel, TargetModel) => {

        let sourcePromise;
        let targetPromise;

        let sourceModel = new SourceModel();
        let targetModel = new TargetModel();

        sourceTableName = sourceModel.tableName;
        sourcePrimaryKey = sourceModel.idAttribute;

        targetTableName = targetModel.tableName;
        targetPrimaryKey = targetModel.idAttribute;


        // Validate that sourceId was provided in the request, and try to fetch the record, if it was.
        if (sourceId) {
            sourcePromise = new SourceModel({[sourcePrimaryKey]: sourceId}).fetch();
        } else {
            throw new CauldronError(config.get(errors.missingSourceId));
        }

        // Validate that targetId was provided in the request, and fetch the record, if it was.
        if (targetId) {
            targetPromise = new TargetModel({[targetPrimaryKey]: targetId}).fetch();
        } else {
            throw new CauldronError(config.get(errors.missingTargetId));
        }

        return Promise.all([
            sourcePromise,
            targetPromise
        ]);
    }).spread((sourceModel, targetModel) => {
        // Ensure that the Source and Target records exist,
        // and fetch the Target if it's related to the Source.
        if (!sourceModel) {
            throw new CauldronError(config.get(errors.invalidSourceId));
        }

        if (!targetModel) {
            throw new CauldronError(config.get(errors.invalidTargetId));
        }

        return [
            sourceModel,
            sourceModel[associationMethod]()
                .query({
                    where: {
                        [`${targetTableName}.${targetPrimaryKey}`]: targetId
                    }
                })
                .fetchOne()
        ];
    });
}


/**
 * Associate a target model to a source model
 *
 * @param {Env} env
 * @param {AssociateOptions} options
 */
function associate(env, options) {
    const targetModelData = options.targetModel;
    const associationMethod = options.associationMethod;
    const errors = options.errors;
    const message = options.message;

    const config = Config.withEnv(env);

    return checkAssociation(env, options)

        .spread((sourceModel, targetModel) => {
            if (targetModel === null) {
                return sourceModel[associationMethod]().attach(targetModelData.id);
            }

            throw new CauldronError(config.get(errors.duplicateAssociation));
        }).then(() => {
            return message;
        });
}

/**
 * Disassociate a target model from a source model
 *
 * @param {Env} env
 * @param {DisassociateOptions} options
 */
function disassociate(env, options) {
    let config = Config.withEnv(env);
    const targetModelData = options.targetModel;
    const associationMethod = options.associationMethod;
    const errors = options.errors;
    const message = options.message;
    
    return checkAssociation(env, options)
        .spread((sourceModel, targetModel) => {
            if (targetModel === null) {
                throw new CauldronError(config.get(errors.invalidAssociation));
            }

            return sourceModel[associationMethod]().detach(targetModelData.id);
        }).then(() => {
            return message;
        });
}

module.exports = {
    associate,
    disassociate
};