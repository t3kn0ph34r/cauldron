'use strict';

const Config = require('../config.js');
const BlueBirdPromise = require('../util/promise.js').BluebirdPromise;
const CauldronError = require('../util/error.js').CauldronError;
const Checkit = require('checkit');

module.exports = function(bookshelf) {
    return bookshelf.model('BaseModel', {
        initialize: function () {
            this.on('saving', this.validate.bind(this));
            this.onSaveError(this.handleSaveError);
        },

        validate: function() {
            if (this.customRules && Array.isArray(this.customRules)) {
                this.customRules.forEach(customRule => {
                    Checkit.Validator.prototype[customRule.name] = this[customRule.ruleMethod].bind(this);
                });
            }
            if (this.validations) {
                let checkit = new Checkit(this.validations);

                if (this.maybeValidations && Array.isArray(this.maybeValidations)) {
                    this.maybeValidations.forEach(validationSettings=> {
                        let method = validationSettings.conditionMethod;
                        let validations = validationSettings.validations;

                        checkit.maybe(validations, this[method].bind(this));
                    });
                }

                return checkit.run(this.toJSON());
            }

            return BlueBirdPromise.resolve();
        },

        /**
         * Extends model's "save" function to handle save errors. Useful for intercepting errors that come back from the database.
         *
         * @param {Function} errorHandler
         */
        onSaveError: function (errorHandler) {
            // allow errors to be intercepted by an error handler
            //noinspection JSDuplicatedDeclaration
            const save = this.save;
            this.save = function () {
                return new BlueBirdPromise((resolve, reject) => {
                    save.apply(this, arguments).then(resolve).catch(err => {

                        // intercept the error by passing it into the handler
                        return errorHandler.call(this, err).then(resolve).catch(reject);
                    });
                });
            };
        },

        /**
         * Handles an error on save
         *
         * @param error
         * @return {Promise}
         */
        handleSaveError: function (error) {
            const config = Config.withEnv(this.env);

            if (error.errors) {
                let firstFieldError = error.errors[error.keys()[0]];
                let message = firstFieldError.errors[0].message;

                try {
                    message = JSON.parse(message);
                    return Promise.reject(new CauldronError(message));
                } catch (e) {}

                if (config.get('errors.' + message)) {
                    return Promise.reject(new CauldronError(config.get('errors.' + message)));
                }

                return Promise.reject(message);
            }

            return Promise.reject(error);
        },

        callSuper: function (method) {
            return Object.getPrototypeOf(Object.getPrototypeOf(this))[method].apply(this, [].slice.call(arguments, 1));
        }

    });
};
