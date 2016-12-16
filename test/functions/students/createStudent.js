'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

var studentObject = {
    UserID: '99999',
    StuGrade: '08',
    FirstName: 'First',
    LastName: 'Last',
    Birthdate: '2002-03-01',
    ExternalID: '99999',
    TestDeliveryAccessCode: 'ABC123',
    Accom01: true,
    Accom02: true,
    Accom03: true,
    Accom04: true,
    Accom05: true,
    Accom06: true,
    Accom07: true,
    Accom08: true,
    Accom09: true,
    Accom10: true,
    Accom11: true,
    Accom12: true,
    Accom13: true,
    Accom14: true,
    Accom15: true,
    Accom16: true,
    Accom17: true,
    Accom18: true,
    Accom19: true,
    Accom20: true,
    Accom21: true,
    Accom22: true,
    Accom23: true,
    Accom24: true,
    Accom25: true,
    Accom26: true,
    Accom27: true,
    Accom28: true,
    Accom29: true,
    Accom30: true,

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

describe('createStudent', function () {
    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student').del();
        });
    });

    it('should not allow badly-named fields', function() {
        let student = studentObject.copy().add('StuZZZZZ', 'hello');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Invalid field: StuZZZZZ'
        }));
    });

    it('should not allow empty UserID', function() {
        // Make a deep copy of the default studentObject and then remove the 'UserID' property.
        let student = studentObject.copy().remove('UserID');

        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: UserID'
        }));
    });

    it('should not allow empty StuGrade', function() {
        let student = studentObject.copy().remove('StuGrade');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: StuGrade'
        }));
    });

    it('should not allow empty FirstName', function() {
        let student = studentObject.copy().remove('FirstName');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: FirstName'
        }));
    });

    it('should not allow empty LastName', function() {
        let student = studentObject.copy().remove('LastName');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: LastName'
        }));
    });

    // Pads a number so it is returned as a string of given length, with leading zeros.
    function padNumber(number, length) {
        return ('0'.repeat(length) + number).substr(-length);
    }

    // Runs Accom tests that assert existence of the property for all values from "from" to "to", inclusive.
    function runEmptyAccomTests(from, to) {
        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);

            it('should not allow empty ' + name, function() {
                let student = studentObject.copy().remove(name);
                let createStudent = functionRunner.runFunction('createStudent', student);

                return expect(createStudent).to.be.rejectedWith(JSON.stringify({
                    responseCode: 400,
                    errorMessage: 'Missing required value: ' + name
                }));
            });
        }
    }

    // Runs Accom tests that assert the value is not a string for all values from "from" to "to", inclusive.
    function runStringAccomTests(from, to) {
        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);

            it('should not allow ' + name + ' to be a String', function() {
                let student = studentObject.copy().replace(name, 'true');
                let createStudent = functionRunner.runFunction('createStudent', student);

                return expect(createStudent).to.be.rejectedWith(JSON.stringify({
                    responseCode: 400,
                    errorMessage: name + ' is not a boolean'
                }));
            });
        }
    }

    // Runs Accom tests that assert the value is true or false for all values from "from" to "to", inclusive.
    function runTrueFalseAccomTests(from, to) {
        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);

            it('should allow ' + name + ' when True', function() {
                let student = studentObject.copy().replace(name, true);
                let createStudent = functionRunner.runFunction('createStudent', student);

                return Promise.all([
                    expect(createStudent).to.be.fulfilled,
                    expect(createStudent).to.eventually.have.property(name, 1)
                ]);
            });

            it('should allow ' + name + ' when False', function() {
                let student = studentObject.copy().replace(name, false);
                let createStudent = functionRunner.runFunction('createStudent', student);

                return Promise.all([
                    expect(createStudent).to.be.fulfilled,
                    expect(createStudent).to.eventually.have.property(name, 0)
                ]);
            });
        }
    }

    // Runs ALL Accom tests for all values from "from" to "to", inclusive.
    function runAllAccomTests(from, to) {
        runEmptyAccomTests(from, to);
        runStringAccomTests(from, to);
        runTrueFalseAccomTests(from, to);
    }


    it('should not allow empty Birthdate', function() {
        let student = studentObject.copy().remove('Birthdate');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: Birthdate'
        }));
    });

    it('should not allow empty ExternalID', function() {
        let student = studentObject.copy().remove('ExternalID');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: ExternalID'
        }));
    });

    it('should not allow empty TestDeliveryAccessCode', function() {
        let student = studentObject.copy().remove('TestDeliveryAccessCode');
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: TestDeliveryAccessCode'
        }));
    });

    it('should not allow UserID of length > 36 characters', function() {
        let student = studentObject.copy().replace('UserID', 'a'.repeat(37));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'UserID exceeds maximum length of 36 characters'
        }));
    });

    it('should allow UserID of length <= 36 characters', function() {
        let student = studentObject.copy().replace('UserID', 'a'.repeat(36));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow StuGrade of length > 2 characters', function() {
        let student = studentObject.copy().replace('StuGrade', 'a'.repeat(3));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'StuGrade exceeds maximum length of 2 characters'
        }));
    });

    it('should allow StuGrade of length <= 2 characters', function() {
        let student = studentObject.copy().replace('StuGrade', 'a'.repeat(2));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow FirstName of length > 35 characters', function() {
        let student = studentObject.copy().replace('FirstName', 'a'.repeat(36));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'FirstName exceeds maximum length of 35 characters'
        }));
    });

    it('should allow FirstName of length <= 35 characters', function() {
        let student = studentObject.copy().replace('FirstName', 'a'.repeat(35));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow MiddleName of length > 35 characters', function() {
        let student = studentObject.copy().replace('MiddleName', 'a'.repeat(36));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'MiddleName exceeds maximum length of 35 characters'
        }));
    });

    it('should allow MiddleName of length <= 35 characters', function() {
        let student = studentObject.copy().replace('MiddleName', 'a'.repeat(35));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow LastName of length > 35 characters', function() {
        let student = studentObject.copy().replace('LastName', 'a'.repeat(36));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'LastName exceeds maximum length of 35 characters'
        }));
    });

    it('should allow LastName of length <= 35 characters', function() {
        let student = studentObject.copy().replace('LastName', 'a'.repeat(35));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow Birthdate of length > 10 characters', function() {
        let student = studentObject.copy().replace('Birthdate', 'a'.repeat(11));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Birthdate exceeds maximum length of 10 characters'
        }));
    });

    it('should allow Birthdate of length <= 10 characters', function() {
        let student = studentObject.copy().replace('Birthdate', 'a'.repeat(10));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow ExternalID of length > 30 characters', function() {
        let student = studentObject.copy().replace('ExternalID', 'a'.repeat(31));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'ExternalID exceeds maximum length of 30 characters'
        }));
    });

    it('should allow ExternalID of length <= 30 characters', function() {
        let student = studentObject.copy().replace('ExternalID', 'a'.repeat(30));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    it('should not allow TestDeliveryAccessCode of length > 20 characters', function() {
        let student = studentObject.copy().replace('TestDeliveryAccessCode', 'a'.repeat(21));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'TestDeliveryAccessCode exceeds maximum length of 20 characters'
        }));
    });

    it('should allow TestDeliveryAccessCode of length <= 20 characters', function() {
        let student = studentObject.copy().replace('TestDeliveryAccessCode', 'a'.repeat(20));
        let createStudent = functionRunner.runFunction('createStudent', student);

        return expect(createStudent).to.be.fulfilled;
    });

    runAllAccomTests(1, 30);

    it('should return a full model if given valid input', function() {
        let student = studentObject.copy();
        let createStudent = functionRunner.runFunction('createStudent', student);

        return Promise.all([
            expect(createStudent).to.be.fulfilled,
            expect(createStudent).to.eventually.have.property('UserID', '99999'),
            expect(createStudent).to.eventually.have.property('StuGrade', '08'),
            expect(createStudent).to.eventually.have.property('FirstName', 'First'),
            expect(createStudent).to.eventually.have.property('LastName', 'Last'),
            expect(createStudent).to.eventually.have.property('MiddleName', null),
            expect(createStudent).to.eventually.have.property('Accom01', 1),
            expect(createStudent).to.eventually.have.property('Accom02', 1),
            expect(createStudent).to.eventually.have.property('Accom03', 1),
            expect(createStudent).to.eventually.have.property('Accom04', 1),
            expect(createStudent).to.eventually.have.property('Accom05', 1),
            expect(createStudent).to.eventually.have.property('Accom06', 1),
            expect(createStudent).to.eventually.have.property('Accom07', 1),
            expect(createStudent).to.eventually.have.property('Accom08', 1),
            expect(createStudent).to.eventually.have.property('Accom09', 1),
            expect(createStudent).to.eventually.have.property('Accom10', 1),
            expect(createStudent).to.eventually.have.property('Accom11', 1),
            expect(createStudent).to.eventually.have.property('Accom12', 1),
            expect(createStudent).to.eventually.have.property('Accom13', 1),
            expect(createStudent).to.eventually.have.property('Accom14', 1),
            expect(createStudent).to.eventually.have.property('Accom15', 1),
            expect(createStudent).to.eventually.have.property('Accom16', 1),
            expect(createStudent).to.eventually.have.property('Accom17', 1),
            expect(createStudent).to.eventually.have.property('Accom18', 1),
            expect(createStudent).to.eventually.have.property('Accom19', 1),
            expect(createStudent).to.eventually.have.property('Accom20', 1),
            expect(createStudent).to.eventually.have.property('Accom21', 1),
            expect(createStudent).to.eventually.have.property('Accom22', 1),
            expect(createStudent).to.eventually.have.property('Accom23', 1),
            expect(createStudent).to.eventually.have.property('Accom24', 1),
            expect(createStudent).to.eventually.have.property('Accom25', 1),
            expect(createStudent).to.eventually.have.property('Accom26', 1),
            expect(createStudent).to.eventually.have.property('Accom27', 1),
            expect(createStudent).to.eventually.have.property('Accom28', 1),
            expect(createStudent).to.eventually.have.property('Accom29', 1),
            expect(createStudent).to.eventually.have.property('Accom30', 1),
            expect(createStudent).to.eventually.have.property('ExternalID', '99999'),
            expect(createStudent).to.eventually.have.property('TestDeliveryAccessCode', 'ABC123'),
            expect(createStudent).to.eventually.have.property('Active', 1),
            expect(createStudent).to.eventually.have.property('CreatedAt'),
            expect(createStudent).to.eventually.have.property('UpdatedAt')
        ]);
    });

    it('should not allow duplicate UserID', function () {
        let student = studentObject.copy();
        let createStudent = functionRunner.runFunction('createStudent', student);

        let secondStudent = studentObject.copy();

        return expect(createStudent.then(() => {
            return functionRunner.runFunction('createStudent', secondStudent);
        })).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "There already exists a student with the same UserID"
        }));
    });
});

