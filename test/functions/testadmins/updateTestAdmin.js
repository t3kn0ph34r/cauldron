'use strict';
const expect = require('chai').expect;
const chai = require('chai');
const chaiDateTime = require('chai-datetime');
chai.use(chaiDateTime);
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

const util = {
    object: require('../../../functions/lib/util/object.js'),
    testing: require('../../../functions/lib/util/testing.js')
};

// used to set initial value of CreatedAt/UpdatedAt so their values after an update can be easily checked
const initialTimestamp = (env.getEnv() === 'devlocal') ? '2016-06-29 07:00' : '2016-06-29T07:00';

let testAdmin = {
    AdministrationName: "Hello",
    AdministrationStartDate: '2016-07-22',
    AdministrationEndDate: '2016-07-29',
    Secured: 0,
    Active: 1
};

function testAdminWithoutDates(testAdmin) {
    return {
        AdministrationName: testAdmin.AdministrationName,
        Secured: Number(testAdmin.Secured),
        Active: Number(testAdmin.Active)
    };
}

let testAdminId;

let timestamps = {
    CreatedAt: initialTimestamp,
    UpdatedAt: initialTimestamp
};

let testAdminWithTimestamps = util.object.deepMerge(util.object.deepCopy(testAdmin), timestamps);

const additionalFields = [
    'Active',
    'CreatedAt',
    'UpdatedAt',
    'AdministrationStartDate',
    'AdministrationEndDate'
];

describe('updateTestAdministration', function () {
    beforeEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').insert(testAdminWithTimestamps).then(ids => {
                testAdminId = ids[0];
            });
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').del();
        });
    });

    it('should return a 404 if the testAdministrationId specified in the path does not exist', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationName: "Goodbye"
        }, {
            path: {
                id: '00000'
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: "Invalid TestAdministrationID"
        }));
    });

    it('should not allow changes to TestAdministrationID', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            TestAdministrationID: "66666"
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "Cannot update TestAdministrationID"
        }));
    });

    it('should not allow badly-named fields', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            TestAdministrationZZZZ: "66666"
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "Invalid field: TestAdministrationZZZZ"
        }));
    });

    it('if AdministrationName is specified, it cannot be empty', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationName: null
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationName'
        }));
    });

    it('should not allow TestAdministration Name of length > 50 characters', function () {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationName: 'a'.repeat(51)
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationName exceeds maximum length of 50 characters'
        }));
    });

    it('should allow TestAdministration Name of length <= 50 characters', function () {

        let updates = {
            AdministrationName: 'a'.repeat(50)
        };
        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates, {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', testAdminCopy.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', testAdminCopy.AdministrationEndDate)
        ]);
    });

    it('if AdministrationStartDate is specified, it cannot be empty', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationStartDate: null
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationStartDate'
        }));
    });

    it('should throw correct error message when AdministrationStartDate is false', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationStartDate: false
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationStartDate does not match required datatype'
        }));
    });

    it('should throw correct error message when AdministrationEndDate is false', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationEndDate: false
        }, {
            path: {
                id: testAdminId
            }
        });
        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationEndDate does not match required datatype'
        }));
    });

    it('if AdministrationEndDate is specified, it cannot be empty', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationEndDate: null
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationEndDate'
        }));
    });

    it('if Secured is specified, it cannot be empty', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            Secured: null
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: Secured'
        }));
    });

    it('should not allow non-boolean Secured', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            Secured: 'foo'
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Secured does not match required datatype'
        }));
    });

    it('should not allow invalid AdministrationStartDate value', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationStartDate: "Last Thursday"
        }, {
            path: {
                id: testAdminId
            }
        });
        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationStartDate does not match required datatype'
        }));
    });

    it('should not allow invalid AdministrationEndDate value', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            AdministrationEndDate: "Last Thursday"
        }, {
            path: {
                id: testAdminId
            }
        });
        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationEndDate does not match required datatype'
        }));
    });

    it('should allow Secured to be false', function() {
        let updates = {
            Secured: false
        };

        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates, {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', testAdminCopy.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', testAdminCopy.AdministrationEndDate)
        ]);
    });

    it('should allow Secured to be true', function() {
        let updates = {
            Secured: true
        };

        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates, {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', testAdminCopy.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', testAdminCopy.AdministrationEndDate)
        ]);
    });


    it('should allow Active to be false', function() {
        let updates = {
            Active: false
        };

        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates, {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', testAdminCopy.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', testAdminCopy.AdministrationEndDate)
        ]);
    });

    it('should allow Active to be true', function() {
        let updates = {
            Active: true
        };

        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates, {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', testAdminCopy.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', testAdminCopy.AdministrationEndDate)
        ]);
    });


    it('should not allow non-boolean Active', function() {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {
            Active: 'foo'
        }, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Active does not match required datatype'
        }));
    });

    it('should not allow an object without any fields', function () {
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', {}, {
            path: {
                id: testAdminId
            }
        });

        return expect(updateTestAdmin).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'No valid fields provided'
        }));
    });

    it('should allow multiple, well-formed updates', function () {
        let updates = {
            AdministrationName: "different name",
            AdministrationStartDate: '2016-08-22',
            AdministrationEndDate: '2016-08-29',
            Secured: true,
            Active: true
        };

        let testAdminCopy = util.object.deepCopy(testAdmin);
        let results = testAdminWithoutDates(util.object.deepMerge(testAdminCopy, updates));

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates , {
            path: {
                id: testAdminId
            }
        });

        return Promise.all([
            expect(updateTestAdmin).to.be.fulfilled,
            util.testing.expect(expect, updateTestAdmin).toHaveProperties(results, additionalFields),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationStartDate', updates.AdministrationStartDate),
            util.testing.expect(expect, updateTestAdmin).propertyToMatchDateString('AdministrationEndDate', updates.AdministrationEndDate)
        ]);
    });

    it('should not update CreatedAt', function () {
        let updates = {
            AdministrationName: 'XXXXXX'
        };

        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates , {
            path: {
                id: testAdminId
            }
        });

        return updateTestAdmin.then(updatedTestAdmin => {
                return expect(new Date(updatedTestAdmin.CreatedAt)).to.equalTime(new Date(initialTimestamp));
            });
    });

    it('should update UpdatedAt', function () {
        let updates = {
            AdministrationName: 'XXXXXX'
        };
        const updateTestAdmin = functionRunner.runFunction('updateTestAdministration', updates , {
            path: {
                id: testAdminId
            }
        });

        return updateTestAdmin.then(updatedTestAdmin => {
                return expect(new Date(updatedTestAdmin.UpdatedAt)).to.afterTime(new Date(initialTimestamp));
            });
    });
});