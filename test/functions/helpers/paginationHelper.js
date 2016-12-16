'use strict';
const expect = require('chai').expect;
const paginationHelper = require('../../../functions/lib/helpers/paginationHelper.js');
const CauldronError = require('../../../functions/lib/util/error.js').CauldronError;
const env = require('../../../functions/lib/env.js').withMockContext();


describe('paginationHelper', function () {
    it('should thow an error on non-numeric limits', function () {
        let getPagination = paginationHelper.getPagination.bind(null, env, 'foo', 0);

        return expect(getPagination).to.throw(CauldronError, JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Limit parameter must be numeric"
        }));

    });
    
    it('should throw an error on non-numeric offsets', function () {
        let getPagination = paginationHelper.getPagination.bind(null, env, 0, 'foo');

        return expect(getPagination).to.throw(CauldronError, JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Offset parameter must be numeric"
        }));
    });
    
    it('should throw an error on negative limits', function () {
        let getPagination = paginationHelper.getPagination.bind(null, env, -1, 0);

        return expect(getPagination).to.throw(CauldronError, JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Limit parameter must not be negative"
        }));
    });
    
    it('should throw an error on negative offsets', function () {
        let getPagination = paginationHelper.getPagination.bind(null, env, 0, -1);

        return expect(getPagination).to.throw(CauldronError, JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Offset parameter must not be negative"
        }));
    });
});