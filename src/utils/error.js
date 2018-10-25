'use strict';

const errors = require('./../config/errors');

module.exports = (socket, eventName, type, data) => {
    let error = errors[type] || errors['unknown_error'];

    socket.emit('exception', {
        event: eventName,
        code: error.code,
        message: error.message,
        data: data || null
    });
};