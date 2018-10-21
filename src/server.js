'use strict';

const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const _ = require('lodash');

const error = require('./utils/error');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.get('*', (res, req) => {
    req.send('Hello world!');
});

const PORT = process.env.PORT || 4321;
const MAX_NR_PLAYERS = 2;

// stores data about each connected player
let players = {};

// when a new connection with a client is established
// => a new player is connected
io.on('connection', socket => {
    console.log('Player ' + socket.id + ' connected');

    socket.on('join', username => {
        console.log('Player ' + socket.id + ' wants to join the game');

        if (Object.keys(players).length === MAX_NR_PLAYERS) {
            error(socket, 'no_room');
            console.log('Player ' + socket.id + ' disconnected');
            socket.disconnect();
            return;
        }

        if (!_.isString(username)) {
            error(socket, 'invalid_username', 'Username must by a string');
            return;
        }

        if (!_.isUndefined(players[username])) {
            error(socket, 'invalid_username', 'Username already exists');
            return;
        }

        console.log('Player ' + socket.id + ' (' + username + ') has joined the game');

        // add player information to the current players information
        players[username] = {
            socketId: socket.id,
            username: username
        };

        // send to the player all the current players information the server knows
        socket.emit('players', players);

        // announce all the players about the new player
        socket.broadcast.emit('new_player', players[username]);

        // when the player disconnects
        socket.on('disconnect', () => {
            console.log('Player ' + socket.id + ' (' + username + ') disconnected');

            // remove player information to the current players information
            delete players[username];

            // announce all connected players about the player that left the game
            io.emit('player_has_disconnected', username);
        });
    });

    // sends to the client a message through the 'hello' event
    socket.emit('hello', 'Hello, client! I\'am the server! Your\'re now connected to me!');
});

server.listen(PORT, () => {
    console.log('Server is up and is listening to port ' + PORT);
});