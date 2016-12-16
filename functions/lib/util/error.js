'use strict';

class CauldronError extends Error {
    constructor(errorData) {
        const message = JSON.stringify(errorData);
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(this.message)).stack;
        }
    }
}

module.exports = {
    CauldronError
};