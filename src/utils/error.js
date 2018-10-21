'use strict';

const errors = require('./../config/errors');

module.exports = (socket, type, data) => {
    let error = errors[type] || errors['unknown_error'];

    socket.emit('exception', {
        code: error.code,
        message: error.message,
        data: data || null
    });
};