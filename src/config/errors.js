'use strict';

module.exports = {
    unknown_error: {
        code: -30000,
        message: 'Unknown error'
    },

    parse_error: {
        code: -32700,
        message: 'Parse error'
    },

    invalid_params: {
        code: -32601,
        message: 'Invalid params'
    },

    no_room: {
        code: -20000,
        message: 'No room left in the game. The maximum number of players has been reached'
    },

    invalid_username: {
        code: -11000,
        message: 'Invalid username'
    }
};