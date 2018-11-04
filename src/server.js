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

const PORT = process.env.PORT || 4321;
const MAX_NR_PLAYERS = 2;

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
let currentPlayerUsername;
let currentPlayerIndex;

// change current player turn based on player index
let turn = (usernameIndex) => {
    currentPlayerUsername = Object.keys(players)[usernameIndex];
    currentPlayerIndex = usernameIndex;
    Object.keys(players).forEach(name => {players[name].myTurn = false;});
    players[currentPlayerUsername].myTurn = true;
    io.emit('turn', currentPlayerUsername);
    io.emit('gameplay', players);
};

// check current player status
let checkCurrentPlayerStatus = username => {
    if (players[username].isReady === false) {
        if (players[username].cards.minions && players[username].cards.functional && players[username].cards.hero) {
            players[username].isReady = true;

            let allReady = true;

            // check players status
            if (Object.keys(players).length === MAX_NR_PLAYERS) {
                Object.keys(players).forEach(username => {
                    if (players[username].isReady === false) {
                        allReady = false;
                    }
                });
            }

            if (allReady) {
                io.emit('all_players_ready');
                turn(0);
            }
        }
    }
};

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
    players[username].cards.minions = cards.map(cardId => allCards.minions[cardId]);

    // respond
    res.json(response.success(true));

    // check current player status
    checkCurrentPlayerStatus(username);
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
    players[username].cards.functional = cards.map(cardId => allCards.functional[cardId]);

    // respond
    res.json(response.success(true));

    // check current player status
    checkCurrentPlayerStatus(username);
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

    if (!_.isInteger(card) || card >= allCards.heroes.length || card < 0) {
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
    players[username].cards.hero = allCards.heroes[card];

    // respond
    res.json(response.success(true));

    // check current player status
    checkCurrentPlayerStatus(username);
});

app.post('/play_card', (req, res) => {
    let body = req.body || {};

    // params
    let username = body.username;
    let cardType = body.card_type;
    let cardId = body.card_id;
    let position = body.position;

    if (_.isUndefined(username)) {
        res.json(response.error('invalid_params', 'Missing `username` param'));
        return;
    }

    if (_.isUndefined(cardType)) {
        res.json(response.error('invalid_params', 'Missing `card_type` param'));
        return;
    }

    if (_.isUndefined(cardId)) {
        res.json(response.error('invalid_params', 'Missing `card_id` param'));
        return;
    }

    if (_.isUndefined(cardId)) {
        res.json(response.error('invalid_params', 'Missing `position` param'));
        return;
    }

    if (!_.isString(username) || _.isUndefined(players[username])) {
        res.json(response.error('invalid_params', 'Invalid `username` param'));
        return;
    }

    if (username !== currentPlayerUsername) {
        res.json(response.error('invalid_params', 'Invalid `username` param. It is not `' + username + '` turn'));
        return;
    }

    if (!_.isString(cardType) || !['M', 'F'].includes(cardType.toUpperCase())) {
        res.json(response.error('invalid_params', 'Invalid `card_type` param'));
        return;
    }

    cardType = cardType.toUpperCase();

    if (!_.isInteger(cardId)) {
        res.json(response.error('invalid_params', 'Invalid `card_id` param'));
        return;
    }

    if (cardType === 'M') {
        if (players[username].cards.minions.findIndex(c => c.id === cardId) === -1) {
            res.json(response.error('invalid_params', 'Invalid `card_id` param'));
            return;
        }


        if (!_.isString(position) || !['GOALKEEPER', 'DEFENCE', 'MID', 'ATTACK'].includes(position.toUpperCase())) {
            res.json(response.error('invalid_params', 'Invalid `position` param'));
            return;
        }

        position = position.toLowerCase();
    } else if (cardType === 'F') {
        if (players[username].cards.functional.findIndex(c => c.id === cardId) === -1) {
            res.json(response.error('invalid_params', 'Invalid `card_id` param'));
            return;
        }
    }


    if (cardType === 'M') {
        console.log(players[username].cards.minions.findIndex(c => c.id === cardId));

        // remove card from player's hand
        players[username].cards.minions.splice(players[username].cards.minions.findIndex(c => c.id === cardId), 1);



        // add card to the board
        if (position === 'goalkeeper') {
            players[username].board.goalkeeper.card = allCards.minions[cardId];
        } else {
            players[username].board[position].cards.push(allCards.minions[cardId]);
        }
    } else if (cardType === 'F') {
        // remove card from player's hand
        players[username].cards.functional.splice(players[username].cards.minions.findIndex(c => c.id === cardId), 1);

        // do something
        // ...
    }


    // respond
    res.json(response.success(true));

    io.emit('gameplay', players);
});

app.post('/end_turn', (req, res) => {
    let body = req.body || {};

    // params
    let username = body.username;

    if (_.isUndefined(username)) {
        res.json(response.error('invalid_params', 'Missing `username` param'));
        return;
    }

    if (!_.isString(username) || _.isUndefined(players[username])) {
        res.json(response.error('invalid_params', 'Invalid `username` param'));
        return;
    }

    turn(currentPlayerIndex === 1 ? 0 : 1);

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
            board: {
                goalkeeper: {
                    score: 0,
                    card: null
                },
                defence: {
                    score: 0,
                    cards: []
                },
                mid: {
                    score: 0,
                    cards: []
                },
                attack: {
                    score: 0,
                    cards: []
                }
            },
            totalPoints: 0,
            isReady: false,
            myTurn: false
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
