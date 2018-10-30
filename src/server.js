'use strict';

const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const _ = require('lodash');
const bodyParser = require('body-parser');
const suffleArray = require('shuffle-array');
const cors = require('cors');

const error = require('./utils/error');
const response = require('./utils/response');
const allCards = require('./config/cards');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
    bodyParser.json({limit: '50mb'})(req, res, error => {
        if (error) {
            res.status(400).json(response.error('parse_error', error));
        } else {
            next();
        }
    });
});

// stores data about each connected player
let players = {};

/* ------------------- GET METHODS ------------------- */
app.get('/minions_cards', (req, res) => {
    res.json(response.success(suffleArray.pick(allCards.minions, { picks: 24 })));
});

app.get('/functional_cards', (req, res) => {
    res.json(response.success(suffleArray.pick(allCards.functional, { picks: 10 })));
});

app.get('/heroes_cards', (req, res) => {
    res.json(response.success(suffleArray.pick(allCards.heroes, { picks: 6 })));
});

app.get('*', (req, res) => {
    res.send('Hello world!');
});

/* ------------------- POST METHODS ------------------- */
app.post('/minions_cards_selector', (req, res) => {
    let body = req.body || {};

    // params
    let cards = body.cards;
    let username = body.username;

    if (_.isUndefined(cards)) {
        res.json(response.error('invalid_params', 'Missing `cards` param'));
        return;
    }

    if (!_.isArray(cards) || cards.length !== 11) {
        res.json(response.error('invalid_params', 'Invalid `cards` param'));
        return;
    }

    for (let cardIndex of cards) {
        if (!_.isInteger(cardIndex) || cardIndex >= allCards.minions.length || cardIndex < 0) {
            res.json(response.error('invalid_params', 'Invalid `cards` param'));
            return;
        }
    }

    if (_.isUndefined(username)) {
        res.json(response.error('invalid_params', 'Missing `username` param'));
        return;
    }

    if (!_.isString(username) || _.isUndefined(players[username])) {
        res.json(response.error('invalid_params', 'Invalid `username` param'));
        return;
    }

    // store the user selected cards
    players[username].cards.minions = cards;

    // check current player status
    if (players[username].isReady === false) {
        if (players[username].cards.minions && players[username].cards.functional && players[username].cards.hero) {
            players[username].isReady = true;

            let allReady = true;

            // check players status
            if (players.length === MAX_NR_PLAYERS) {
                for (let username in players) {
                    if (!players.hasOwnProperty(username) || players[username].isReady === false) {
                        allReady = false;
                        break;
                    }
                }
            }

            if (allReady) {
                io.emit('all_players_ready');
            }
        }
    }

    // respond
    res.json(response.success(true));
});

app.post('/functional_cards_selector', (req, res) => {
    let body = req.body || {};

    // params
    let cards = body.cards;
    let username = body.username;

    if (_.isUndefined(cards)) {
        res.json(response.error('invalid_params', 'Missing `cards` param'));
        return;
    }

    if (!_.isArray(cards) || cards.length !== 5) {
        res.json(response.error('invalid_params', 'Invalid `cards` param'));
        return;
    }

    for (let cardIndex of cards) {
        if (!_.isInteger(cardIndex) || cardIndex >= allCards.functional.length || cardIndex < 0) {
            res.json(response.error('invalid_params', 'Invalid `cards` param'));
            return;
        }
    }

    if (_.isUndefined(username)) {
        res.json(response.error('invalid_params', 'Missing `username` param'));
        return;
    }

    if (!_.isString(username) || _.isUndefined(players[username])) {
        res.json(response.error('invalid_params', 'Invalid `username` param'));
        return;
    }

    // store the user selected cards
    players[username].cards.functional = cards;

    // check current player status
    if (players[username].isReady === false) {
        if (players[username].cards.minions && players[username].cards.functional && players[username].cards.hero) {
            players[username].isReady = true;

            let allReady = true;

            // check players status
            if (players.length === MAX_NR_PLAYERS) {
                for (let username in players) {
                    if (!players.hasOwnProperty(username) || players[username].isReady === false) {
                        allReady = false;
                        break;
                    }
                }
            }

            if (allReady) {
                io.emit('all_players_ready');
            }
        }
    }

    // respond
    res.json(response.success(true));
});

app.post('/hero_card_selector', (req, res) => {
    let body = req.body || {};

    // params
    let card = body.card;
    let username = body.username;

    if (_.isUndefined(card)) {
        res.json(response.error('invalid_params', 'Missing `card` param'));
        return;
    }

    if (!_.isInteger(card) || card >= allCards.functional.length || card < 0) {
        res.json(response.error('invalid_params', 'Invalid `card` param'));
        return;
    }

    if (_.isUndefined(username)) {
        res.json(response.error('invalid_params', 'Missing `username` param'));
        return;
    }

    if (!_.isString(username) || _.isUndefined(players[username])) {
        res.json(response.error('invalid_params', 'Invalid `username` param'));
        return;
    }

    // store the user selected card
    players[username].cards.hero = card;

    // check current player status
    if (players[username].isReady === false) {
        if (players[username].cards.minions && players[username].cards.functional && players[username].cards.hero) {
            players[username].isReady = true;

            let allReady = true;

            // check players status
            if (players.length === MAX_NR_PLAYERS) {
                for (let username in players) {
                    if (!players.hasOwnProperty(username) || players[username].isReady === false) {
                        allReady = false;
                        break;
                    }
                }
            }

            if (allReady) {
                io.emit('all_players_ready');
            }
        }
    }

    // respond
    res.json(response.success(true));
});

app.post('*', (req, res) => {
    res.sendStatus(405);
});

/* ------------------- PUT METHODS ------------------- */
app.put('*', (req, res) => {
    res.sendStatus(405);
});

/* ------------------- PATCH METHODS ------------------- */
app.patch('*', (req, res) => {
    res.sendStatus(405);
});

/* ------------------- DELETE METHODS ------------------- */
app.delete('*', (req, res) => {
    res.sendStatus(405);
});

const PORT = process.env.PORT || 4321;
const MAX_NR_PLAYERS = 2;

// when a new connection with a client is established
// => a new player is connected
io.on('connection', socket => {
    console.log('Player ' + socket.id + ' connected');

    socket.on('join', username => {
        console.log('Player ' + socket.id + ' wants to join the game');

        if (Object.keys(players).length === MAX_NR_PLAYERS) {
            error(socket, 'join', 'no_room');
            console.log('Player ' + socket.id + ' disconnected');
            socket.disconnect();
            return;
        }

        if (!_.isString(username)) {
            error(socket, 'join', 'invalid_username', 'Username must by a string');
            return;
        }

        if (!_.isUndefined(players[username])) {
            error(socket, 'join', 'invalid_username', 'Username already exists');
            return;
        }

        console.log('Player ' + socket.id + ' (' + username + ') has joined the game');

        // add player information to the current players information
        players[username] = {
            socketId: socket.id,
            username: username,
            cards: {},
            isReady: false
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