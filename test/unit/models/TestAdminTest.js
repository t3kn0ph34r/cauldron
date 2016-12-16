'use strict';
const sinon = require('sinon');
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

describe('Test Administration Unit Tests', function () {

    describe('dateRegex', function() {

        it('should return true if pattern matches given value (all zeroes)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('0000-00-00')).to.equal(true);
            });
        });

        it('should return true if pattern matches given value (current date)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016-07-20')).to.equal(true);
            });
        });

        it('should return true if pattern matches given value (current date)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016-07-20')).to.equal(true);
            });
        });

        it('should return true if pattern matches given value (illegal date)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016-02-99')).to.equal(true);
            });
        });

        it('should return false if value is invalid (contains a letter)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016-07-2O')).to.equal(false);
            });
        });

        it('should return false if value is invalid (year too long)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('20160-07-20')).to.equal(false);
            });
        });

        it('should return false if value is invalid (uses slashes)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016/07/20')).to.equal(false);
            });
        });

        it('should return false if value is invalid (missing days)', function() {
            return Model.getClass('TestAdministration').then(TestAdministration => {
                let testAdministration = new TestAdministration();

                return expect(testAdministration.dateRegex('2016-07')).to.equal(false);
            });
        });
    });
});