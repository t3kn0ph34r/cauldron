'use strict';

const Config = require('../config.js');
const associationHelper = require('../helpers/associationHelper.js');
const objectUtil = require('../util/object.js');

/**
 * Get the default options for this association
 *
 * @param {string} testAdminId
 * @param {string} organizationId
 * @return {AssociationOptions}
 */
function getOptions(testAdminId, organizationId) {
    return {
        sourceModel: {
            class: 'TestAdministration',
            id: testAdminId
        },
        targetModel: {
            class: 'Organization',
            id: organizationId
        },
        associationMethod: 'organizations',
        errors: {
            missingSourceId: 'errors.testAdmin.missingTestAdminID',
            missingTargetId: 'errors.organization.missingOrgID',
            
            invalidSourceId: 'errors.testAdmin.invalidTestAdminID',
            invalidTargetId: 'errors.organization.invalidOrgID'
        }
    };
}

/**
 * Associate an org to a test administration
 *
 * @param testAdminId
 * @param organizationId
 * @param env
 * @return {*}
 */
function associate(testAdminId, organizationId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(testAdminId, organizationId), {
        errors: {
            duplicateAssociation: 'errors.testAdmin.duplicateOrgAssociation'
        },
        message: config.get('messages.testAdmin.addedToOrg.message')
    });

    return associationHelper.associate(env, options);
}

/**
 * Disassociate an org from a test administration
 *
 * @param testAdminId
 * @param organizationId
 * @param env
 * @return {*}
 */
function disassociate(testAdminId, organizationId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(testAdminId, organizationId), {
        errors: {
            invalidAssociation: 'errors.testAdmin.invalidOrgAssociation'
        },
        message: config.get('messages.testAdmin.removedFromOrg.message')
    });

    return associationHelper.disassociate(env, options);
}

module.exports = {
    associate, disassociate
};
