'use strict';

const Config = require('../config.js');
const associationHelper = require('../helpers/associationHelper.js');
const objectUtil = require('../util/object.js');

/**
 * Get the default options for this association
 *
 * @param {string} studentId
 * @param {string} organizationId
 * @return {AssociationOptions}
 */
function getOptions(studentId, organizationId) {
    return {
        sourceModel: {
            class: 'Student',
            id: studentId
        },
        targetModel: {
            class: 'Organization',
            id: organizationId
        },
        associationMethod: 'organizations',
        errors: {
            missingSourceId: 'errors.student.missingUserID',
            missingTargetId: 'errors.organization.missingOrgID',
            invalidSourceId: 'errors.student.invalidUserID',
            invalidTargetId: 'errors.organization.invalidOrgID'
        }
    };
}

/**
 * Associate an org to a student
 *
 * @param studentId
 * @param organizationId
 * @param env
 * @return {*}
 */
function associate(studentId, organizationId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(studentId, organizationId), {
        errors: {
            duplicateAssociation: 'errors.student.duplicateOrgAssociation'
        },
        message: config.get('messages.student.addedToOrg.message')
    });

    return associationHelper.associate(env, options);
}

/**
 * Disassociate an org from a student
 *
 * @param studentId
 * @param organizationId
 * @param env
 * @return {*}
 */
function disassociate(studentId, organizationId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(studentId, organizationId), {
        errors: {
            invalidAssociation: 'errors.student.invalidOrgAssociation'
        },
        message: config.get('messages.student.removedFromOrg.message')
    });
    
    return associationHelper.disassociate(env, options);
}

module.exports = {
    associate, disassociate
};
