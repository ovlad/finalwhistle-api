'use strict';

const util = require('util');
const socketIO = require('socket.io-client');
// const socket = socketIO('https://finalwhistle-api.herokuapp.com');
const socket = socketIO('http://localhost:4321'); // for local testing

let players = {};

// any time the server sends data through the 'hello' event,
// the client prints it
socket.on('hello', data => {
    console.log(data);
});

// join the game with an username given as a script argument
socket.emit('join', process.argv[2]);

// any time the server sends the current players data through the 'players' event,
// store the current players data into the 'players' object
socket.on('players', _players => {
    console.log('players data: ', _players);
    players = _players;
});

// any time the server announces a new player by sending its data through the 'new_player' event,
// add the new player data to the 'players' object
socket.on('new_player', player => {
    console.log('New player data: ', player);
    players[player.username] = player;
});

// any time the server announces a player leaving the game by sending its username through the 'player_has_disconnected' event,
// remove the player data from the 'players' object
socket.on('player_has_disconnected', username => {
    console.log('Player ' + username + ' has disconnected');
    delete players[username];
});

// any time the server announces an error by sending it through the 'exception' event,
// print the error
socket.on('exception', error => {
    console.log('ERROR: ', error);
});

socket.on('all_players_ready', () => {
    console.log('All players are ready to play!');
});

// wait for the server to tell whose turn it is
socket.on('turn', username => {
   console.log('now is `' + username + '` turn');
});

socket.on('gameplay', players => {
    console.log('current game/players status is: ', util.inspect(players, false, null));
});

socket.on('round', roundsInfo => {
    console.log('ROUNDS INFO: ', util.inspect(roundsInfo, false, null));
});
