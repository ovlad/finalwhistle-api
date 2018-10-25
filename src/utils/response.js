'use strict';

let errors = require('./../config/errors');

class Response {
    static success(data = null) {
        return {
            result: data
        };
    }

    static error(type = null, data = null) {
        let error = errors[type || 'unknown_error'];

        return {
            error: {
                code: error.code,
                message: error.message,
                data: data
            }
        }
    }
}

module.exports = Response;