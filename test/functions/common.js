"use strict";
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const functionRunner = require('../functionRunner.js');
const Serverless = require('serverless');
chai.use(chaiAsPromised);

describe('serverless', function() {
    it('should be initialized', function () {
        return expect(functionRunner.getServerless()).to.eventually.be.an.instanceof(Serverless);
    });
});
