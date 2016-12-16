'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

describe('createOrganizations', function () {
    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').del();
        });
    });

    it('should not allow empty OrganizationID', function() {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationName: 'foo',
            ParentOrganizationID: '56789',
            ExternalID: '99999',
            OrganizationType: 'school'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: OrganizationID'
        }));
    });

    it('should not allow badly-named fields', function() {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '55555',
            OrganizationName: 'foo',
            ExternalID: '99999',
            OrganizationType: 'school',
            OrganizationZZZZ: 'whoops'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Invalid field: OrganizationZZZZ"
        }));
    });

    it('should not allow empty OrganizationType', function() {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '55555',
            OrganizationName: 'foo',
            ParentOrganizationID: '56789',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: OrganizationType'
        }));
    });

    it('should not allow empty OrganizationName', function() {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '55555',
            ParentOrganizationID: '56789',
            ExternalID: '99999',
            OrganizationType: 'school'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: OrganizationName'
        }));
    });

    it('should not allow empty ExternalID', function() {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '55555',
            ParentOrganizationID: '56789',
            OrganizationName: 'foo',
            OrganizationType: 'school'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: ExternalID'
        }));
    });

    it('should not allow Organization ID of length > 36 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: 'a'.repeat(37),
            OrganizationName: 'bar',
            OrganizationType: 'school',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'OrganizationID exceeds maximum length of 36 characters'
        }));
    });

    it('should allow Organization ID of length <= 36 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: 'a'.repeat(36),
            OrganizationName: 'bar',
            OrganizationType: 'school',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.fulfilled;
    });

    it('should not allow Organization Name of length > 80 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'a'.repeat(81),
            OrganizationType: 'school',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'OrganizationName exceeds maximum length of 80 characters'
        }));
    });

    it('should allow Organization Name of length <= 80 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'a'.repeat(80),
            OrganizationType: 'school',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.fulfilled;
    });

    it('should not allow Organization Type of length > 35 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'foo',
            OrganizationType: 'a'.repeat(36),
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'OrganizationType exceeds maximum length of 35 characters'
        }));
    });

    it('should allow Organization Name of length <= 35 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'a'.repeat(35),
            OrganizationType: 'school',
            ExternalID: '99999'
        }, null, null, null, true);

        return expect(createOrg).to.be.fulfilled;
    });

    it('should not allow External ID of length > 30 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'bar',
            OrganizationType: 'school',
            ExternalID: 'a'.repeat(31)
        }, null, null, null, true);

        return expect(createOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'ExternalID exceeds maximum length of 30 characters'
        }));
    });

    it('should allow External ID of length <= 30 characters', function () {
        let createOrg = functionRunner.runFunction('createOrganization', {
            OrganizationID: '12345',
            OrganizationName: 'bar',
            OrganizationType: 'school',
            ExternalID: 'a'.repeat(30)
        }, null, null, null, true);

        return expect(createOrg).to.be.fulfilled;
    });

    describe('Without root org', function () {
        beforeEach(function() {
            return databaseHelper.getOrm().then(bookshelf => {
                return bookshelf.knex('organization').del();
            });
        });

        it('should return a full model if given valid input', function() {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '12345',
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ExternalID: '99999'
            }, null, null, null, true);

            return Promise.all([
                expect(createOrg).to.be.fulfilled,
                expect(createOrg).to.eventually.have.property('OrganizationID', '12345'),
                expect(createOrg).to.eventually.have.property('OrganizationName', 'foo'),
                expect(createOrg).to.eventually.have.property('OrganizationType', 'school'),
                expect(createOrg).to.eventually.have.property('ParentOrganizationID', null),
                expect(createOrg).to.eventually.have.property('ExternalID', '99999'),
                expect(createOrg).to.eventually.have.property('Active', 1),
                expect(createOrg).to.eventually.have.property('CreatedAt'),
                expect(createOrg).to.eventually.have.property('UpdatedAt')
            ]);
        });

        it('should allow empty ParentOrganizationID', function () {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '12345',
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createOrg).to.be.fulfilled;
        });

        it('should not allow ParentOrganizationID', function () {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '12345',
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ParentOrganizationID: '56789',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: "Invalid ParentOrganizationID"
            }));
        });
    });

    describe('With root org', function () {
        function createRootOrg() {
            return Model.getClass('Organization').then(Organization => {
                return (new Organization()).save({
                    OrganizationID: '12345',
                    OrganizationName: 'foo',
                    OrganizationType: 'school',
                    ExternalID: '99999'
                });
            });
        }

        beforeEach(function () {
            return databaseHelper.getQueryBuilder().then(knex => {
                return knex('organization').del();
            }).then(() => {
                return createRootOrg();
            });
        });

        it('should return a full model if given valid input', function() {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '56789',
                OrganizationName: 'foo',
                ParentOrganizationID: '12345',
                OrganizationType: 'school',
                ExternalID: '99999'
            }, null, null, null, true);

            return Promise.all([
                expect(createOrg).to.be.fulfilled,
                expect(createOrg).to.eventually.have.property('OrganizationID', '56789'),
                expect(createOrg).to.eventually.have.property('OrganizationName', 'foo'),
                expect(createOrg).to.eventually.have.property('OrganizationType', 'school'),
                expect(createOrg).to.eventually.have.property('ParentOrganizationID', '12345'),
                expect(createOrg).to.eventually.have.property('ExternalID', '99999'),
                expect(createOrg).to.eventually.have.property('Active', 1),
                expect(createOrg).to.eventually.have.property('CreatedAt'),
                expect(createOrg).to.eventually.have.property('UpdatedAt')
            ]);
        });

        it('should not allow the ParentOrganizationID to be set to its own OrganizaitonID', function() {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '56789',
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ParentOrganizationID: '56789',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: 'Organization must not be a parent of itself'
            }));
        });

        it('should not allow Parent Organization ID of length > 36 characters', function () {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '12345',
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ParentOrganizationID: 'a'.repeat(37),
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: 'ParentOrganizationID exceeds maximum length of 36 characters'
            }));
        });

        it('should allow Parent Organization ID of length <= 36 characters', function () {
            let createOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: 'a'.repeat(36),
                OrganizationName: 'foo',
                OrganizationType: 'school',
                ExternalID: '99999',
                ParentOrganizationID: '12345'
            }, null, null, null, true).then(() => {
                return functionRunner.runFunction('createOrganization', {
                    OrganizationID: '56789',
                    OrganizationName: 'foo',
                    OrganizationType: 'school',
                    ExternalID: '99999',
                    ParentOrganizationID: 'a'.repeat(36)
                }, null, null, null, true);
            });

            return expect(createOrg).to.be.fulfilled;
        });

        it('should not allow empty ParentOrganizationID', function () {
            let createSecondOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '56789',
                OrganizationName: 'bar',
                OrganizationType: 'school',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createSecondOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: "Missing required value: ParentOrganizationID"
            }));
        });

        it('should not allow invalid ParentOrganizationID', function () {
            let createSecondOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '56789',
                OrganizationName: 'bar',
                OrganizationType: 'school',
                ParentOrganizationID: '00000',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createSecondOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: "Invalid ParentOrganizationID"
            }));
        });

        it('should allow valid ParentOrganizationID', function () {
            let createSecondOrg = functionRunner.runFunction('createOrganization', {
                OrganizationID: '56789',
                OrganizationName: 'bar',
                OrganizationType: 'school',
                ParentOrganizationID: '12345',
                ExternalID: '99999'
            }, null, null, null, true);

            return expect(createSecondOrg).to.be.fulfilled;
        });

        it('should not allow duplicate OrganizationID', function () {
            let orgDefinition = {
                OrganizationID: '56789',
                OrganizationName: 'bar',
                OrganizationType: 'school',
                ParentOrganizationID: '12345',
                ExternalID: '99999'
            };

            let createSecondOrg = Model.getClass('Organization').then(Organization => {
                return (new Organization()).save(orgDefinition);
            });


            let createThirdOrg = createSecondOrg.then(() => {
                return functionRunner.runFunction('createOrganization', orgDefinition, null, null, null, true);
            });

            return expect(createThirdOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: "There already exists an organization with the same OrganizationID"
            }));
        });
    });
});

