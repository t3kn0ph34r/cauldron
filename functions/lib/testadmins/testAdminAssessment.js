'use strict';

const Config = require('../config.js');
const associationHelper = require('../helpers/associationHelper.js');
const objectUtil = require('../util/object.js');

/**
 * Get the default options for this association
 *
 * @param {string} testAdminId
 * @param {string} assessmentId
 * @return {AssociationOptions}
 */
function getOptions(testAdminId, assessmentId) {
    return {
        sourceModel: {
            class: 'TestAdministration',
            id: testAdminId
        },
        targetModel: {
            class: 'Assessment',
            id: assessmentId
        },
        associationMethod: 'assessments',
        errors: {
            missingSourceId: 'errors.testAdmin.missingTestAdminID',
            missingTargetId: 'errors.assessment.missingAssessmentID',

            invalidSourceId: 'errors.testAdmin.invalidTestAdminID',
            invalidTargetId: 'errors.assessment.invalidAssessmentID'
        }
    };
}

/**
 * Associate an assessment to a test administration
 *
 * @param testAdminId
 * @param assessmentId
 * @param env
 * @return {*}
 */
function associate(testAdminId, assessmentId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(testAdminId, assessmentId), {
        errors: {
            duplicateAssociation: 'errors.testAdmin.duplicateAssessmentAssociation'
        },
        message: config.get('messages.testAdmin.addedToAssessment.message')
    });

    return associationHelper.associate(env, options);
}

/**
 * Disassociate an assessment from a test administration
 *
 * @param testAdminId
 * @param assessmentId
 * @param env
 * @return {*}
 */
function disassociate(testAdminId, assessmentId, env) {
    let config = Config.withEnv(env);

    let options = objectUtil.deepMerge(getOptions(testAdminId, assessmentId), {
        errors: {
            invalidAssociation: 'errors.testAdmin.invalidAssessmentAssociation'
        },
        message: config.get('messages.testAdmin.removedFromAssessment.message')
    });

    return associationHelper.disassociate(env, options);
}

module.exports = {
    associate, disassociate
};
