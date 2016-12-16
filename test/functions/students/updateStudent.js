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
    string: require('../../../functions/lib/util/string.js')
};

// used to set initial value of CreatedAt/UpdatedAt so their values after an update can be easily checked
const initialTimestamp = (env.getEnv() === 'devlocal') ? '2016-06-29 07:00' : '2016-06-29T07:00';

const studentObject = {
    UserID: '99999',
    StuGrade: '08',
    FirstName: 'First',
    LastName: 'Last',
    Birthdate: '2002-03-01',
    ExternalID: '99999',
    TestDeliveryAccessCode: 'ABC123',
    CreatedAt: initialTimestamp,
    UpdatedAt: initialTimestamp
};

const modifications = {
    StuGrade: '09',
    FirstName: 'First-changed',
    LastName: 'Last-changed',
    Birthdate: '2002-03-02',
    ExternalID: '99990',
    TestDeliveryAccessCode: 'DEF234',
    Active: 0
};

const params = {
    path: {
        studentId: '99999'
    }
};

for (let i = 1; i <= 30; i++) {
    let name = 'Accom' + util.string.padLeft(i, 2);

    studentObject[name] = true;
    modifications[name] = 0;
}

describe('updateStudent', function() {
    beforeEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student').insert(studentObject);
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student').del();
        });
    });

    // tests the existence of a field. This field cannot be empty
    function testEmpty(fieldName) {
        it('should not allow empty ' + fieldName, function() {
            // Make a deep copy of the default studentObject and then remove the 'UserID' property.
            let update = {
                [fieldName]: null
            };

            let updateStudent = functionRunner.runFunction('updateStudent', update, params);

            return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: 'Missing required value: ' + fieldName
            }));
        });
    }

    // tests the length of a field. Make sure that correct input is not valid past maximum length
    function testLength(fieldName, length) {
        it(`should not allow ${fieldName} of length > ${length} characters`, function() {
            let update = {
                [fieldName]: 'a'.repeat(length + 1)
            };
            let updateStudent = functionRunner.runFunction('updateStudent', update, params);

            return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: `${fieldName} exceeds maximum length of ${length} characters`
            }));
        });

        it(`should allow ${fieldName} of length <= ${length} characters`, function() {
            let update = {
                [fieldName]: 'a'.repeat(length)
            };
            let updateStudent = functionRunner.runFunction('updateStudent', update, params);

            return expect(updateStudent).to.be.fulfilled;
        });
    }

    // Pads a number so it is returned as a string of given length, with leading zeros.
    function padNumber(number, length) {
        return ('0'.repeat(length) + number).substr(-length);
    }

    // Runs Accom tests that assert existence of the property for all values from "from" to "to", inclusive.
    function runEmptyAccomTests(from, to) {
        function runEmptyTest(name) {
            it('should not allow empty ' + name, function() {
                let update = {
                    [name]: null
                };
                let updateStudent = functionRunner.runFunction('updateStudent', update, params);

                return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
                    responseCode: 400,
                    errorMessage: 'Missing required value: ' + name
                }));
            });
        }
        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);
            runEmptyTest(name);
        }
    }

    // Runs Accom tests that assert the value is not a string for all values from "from" to "to", inclusive.
    function runStringAccomTests(from, to) {
        function runStringTest(name) {
            it('should not allow ' + name + ' to be a String', function() {
                let update = {
                    [name]: 'true'
                };

                let updateStudent = functionRunner.runFunction('updateStudent', update, params);

                return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
                    responseCode: 400,
                    errorMessage: name + ' is not a boolean'
                }));
            });
        }
        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);
            runStringTest(name);
        }
    }

    // Runs Accom tests that assert the value is true or false for all values from "from" to "to", inclusive.
    function runTrueFalseAccomTests(from, to) {
        function runTrueTest(name) {
            it('should allow ' + name + ' when True', function() {
                let student = {
                    [name]: true
                };

                let updateStudent = functionRunner.runFunction('updateStudent', student, params);

                return Promise.all([
                    expect(updateStudent).to.be.fulfilled,
                    expect(updateStudent).to.eventually.have.property(name, 1)
                ]);
            });
        }

        function runFalseTest(name) {
            it('should allow ' + name + ' when False', function() {
                let student = {
                    [name]: false
                };

                let updateStudent = functionRunner.runFunction('updateStudent', student, params);

                return Promise.all([
                    expect(updateStudent).to.be.fulfilled,
                    expect(updateStudent).to.eventually.have.property(name, 0)
                ]);
            });
        }

        for(var x = from; x <= to; x++) {
            let name = 'Accom' + padNumber(x, 2);
            runTrueTest(name);
            runFalseTest(name);
        }
    }

    // Runs ALL Accom tests for all values from "from" to "to", inclusive.
    function runAllAccomTests(from, to) {
        runEmptyAccomTests(from, to);
        runStringAccomTests(from, to);
        runTrueFalseAccomTests(from, to);
    }

    // tests fields for length requirements
    function testFieldLengths(fieldLengths) {
        Object.keys(fieldLengths).forEach(fieldName => {
            testLength(fieldName, fieldLengths[fieldName]);
        });
    }

    // tests fields for existence
    function testRequiredFields(requiredFields) {
        requiredFields.forEach(fieldName => {
            testEmpty(fieldName);
        });

    }

    testFieldLengths({
        'StuGrade': 2,
        'FirstName': 35,
        'MiddleName': 35,
        'LastName': 35,
        'Birthdate': 10,
        'ExternalID': 30,
        'TestDeliveryAccessCode': 20
    });

    testRequiredFields([
        'StuGrade',
        'LastName',
        'Birthdate',
        'ExternalID',
        'TestDeliveryAccessCode'
    ]);

    runAllAccomTests(1, 30);


    it('should not allow an object without any fields', function () {
        const updateStudent = functionRunner.runFunction('updateStudent', {}, params);

        return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'No valid fields provided'
        }));
    });

    it('should not allow UserID to be updated', function () {
        let update = {
            'UserID': '77777'
        };

        let updateStudent = functionRunner.runFunction('updateStudent', update, params);

        return expect(updateStudent).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Cannot update UserID'
        }));
    });

    it('should return a full model with updated values if given valid input', function() {
        let updateStudent = functionRunner.runFunction('updateStudent', modifications, params);

        return Promise.all(Object.keys(modifications).map(field => {
            return expect(updateStudent).to.eventually.have.property(field, modifications[field]);
        }).concat([
            expect(updateStudent).to.be.fulfilled,
            expect(updateStudent).to.eventually.have.property('CreatedAt'),
            expect(updateStudent).to.eventually.have.property('UpdatedAt')
        ])).then(() => {
            return Promise.resolve(updateStudent);
        }).then(updatedStudent => {
            return Promise.all([
                expect(new Date(updatedStudent.CreatedAt)).to.equalTime(new Date(initialTimestamp)), // CreatedAt should not change
                expect(new Date(updatedStudent.UpdatedAt)).to.afterTime(new Date(initialTimestamp)) // UpdatedAt should change
            ]);
        });
    });
});