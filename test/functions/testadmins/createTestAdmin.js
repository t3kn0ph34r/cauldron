'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

var testAdminObject = {
    AdministrationName: 'Test Administration',
    AdministrationStartDate: '2016-02-18',
    AdministrationEndDate: '2016-02-28',
    Secured: true,
    Active: true,

    copy: function() {
        return Object.assign({}, this);
    },

    remove: function(property) {
        delete this[property];
        return this;
    },

    replace: function(property, value) {
        this[property] = value;
        return this;
    },

    add: function(property, value) {
        this[property] = value;
        return this;
    }
};

describe('createTestAdmin', function () {
    afterEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').del();
        });
    });

    it('should not allow missing AdministrationName', function() {
        let testAdmin = testAdminObject.copy().remove('AdministrationName');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationName'
        }));
    });

    it('should not allow missing AdministrationStartDate', function() {
        let testAdmin = testAdminObject.copy().remove('AdministrationStartDate');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationStartDate'
        }));
    });

    it('should throw correct error message when AdministrationStartDate is false', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationStartDate', false);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationStartDate does not match required datatype'
        }));
    });

    it('should throw correct error message when AdministrationStartDate is true', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationStartDate', true);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationStartDate does not match required datatype'
        }));
    });

    it('should throw correct error message when AdministrationEndDate is false', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationEndDate', false);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationEndDate does not match required datatype'
        }));
    });

    it('should throw correct error message when AdministrationEndDate is true', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationEndDate', true);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationEndDate does not match required datatype'
        }));
    });

    it('should not allow missing AdministrationEndDate', function() {
        let testAdmin = testAdminObject.copy().remove('AdministrationEndDate');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: AdministrationEndDate'
        }));
    });

    it('should not allow missing Secured', function() {
        let testAdmin = testAdminObject.copy().remove('Secured');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required field: Secured'
        }));
    });

    it('should not allow non-boolean Secured', function() {
        let testAdmin = testAdminObject.copy().replace('Secured', 1);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Secured does not match required datatype'
        }));
    });

    it('should not allow AdministrationName to be longer than 50 characters', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationName', '123456789012345678901234567890123456789012345678901');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationName exceeds maximum length of 50 characters'
        }));
    });

    it('should not allow invalid AdministrationStartDate value', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationStartDate', '20160218');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationStartDate does not match required datatype'
        }));
    });

    it('should not allow invalid AdministrationEndDate value', function() {
        let testAdmin = testAdminObject.copy().replace('AdministrationEndDate', '2016-02-18 12:00:00');
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'AdministrationEndDate does not match required datatype'
        }));
    });

    it('should allow Secured to be false', function() {
        let testAdmin = testAdminObject.copy().replace('Secured', false);
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return expect(createTestAdministration).to.be.fulfilled;
    });

    it('should return a full model if given valid input', function() {
        let testAdmin = testAdminObject.copy();
        let createTestAdministration = functionRunner.runFunction('createTestAdministration', testAdmin);

        return Promise.all([
            expect(createTestAdministration).to.be.fulfilled,
            expect(createTestAdministration).to.eventually.have.property('AdministrationName', 'Test Administration'),
            expect(createTestAdministration).to.eventually.have.property('AdministrationStartDate', '2016-02-18'),
            expect(createTestAdministration).to.eventually.have.property('AdministrationEndDate', '2016-02-28'),
            expect(createTestAdministration).to.eventually.have.property('Secured', true),
            expect(createTestAdministration).to.eventually.have.property('Active', true)
        ]);
    });
});

