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
let roundsInfo = {
    roundsWinner: {
        'round_1': null,
        'round_2': null,
        'round_3': null
    },
    current_round: 1,
    is_ending: false,
    winner: null
};

// choose a random card from player board
let chooseRandomCard = player => {
    let playerInfo = players[player];
    let row = Math.floor(Math.random() * 4);

    if (row === 0) { // goalkeeper
        if (playerInfo.board.goalkeeper.card) {
            return {
                position: 'GOALKEEPER',
                index: null,
                card: playerInfo.board.goalkeeper.card
            };
        } else {
            return chooseRandomCard(player);
        }
    } else if (row === 1) { // defence
        if (playerInfo.board.defence.cards.length) {
            let index = Math.floor(Math.random() * playerInfo.board.defence.cards.length);

            return {
                position: 'DEFENCE',
                index: index,
                card: playerInfo.board.defence.cards[index]
            };
        } else {
            return chooseRandomCard(player);
        }
    } else if (row === 2) { // mid
        if (playerInfo.board.mid.cards.length) {
            let index = Math.floor(Math.random() * playerInfo.board.mid.cards.length);

            return {
                position: 'MID',
                index: index,
                card: playerInfo.board.mid.cards[index]
            };
        } else {
            return chooseRandomCard(player);
        }
    } else { // attack
        if (playerInfo.board.attack.cards.length) {
            let index = Math.floor(Math.random() * playerInfo.board.attack.cards.length);

            return {
                position: 'ATTACK',
                index: index,
                card: playerInfo.board.attack.cards[index]
            };
        } else {
            return chooseRandomCard(player);
        }
    }
};

let applyFunctionalCard = (username, functionalCard) => {
    if (functionalCard.for_total_attack || functionalCard.for_total_defence) {
        // choose a random card from the enemy
        let playerCardInfo = chooseRandomCard(username);

        if (functionalCard.for_total_attack) {
            if (playerCardInfo.card.bonus_attack) {
                playerCardInfo.card.bonus_attack += functionalCard.attack;
            } else {
                playerCardInfo.card.bonus_attack = functionalCard.attack;
            }
            playerCardInfo.card.attack += functionalCard.attack;
        }

        if (functionalCard.for_total_defence) {
            if (playerCardInfo.card.bonus_defence) {
                playerCardInfo.card.bonus_defence += functionalCard.defence;
            } else {
                playerCardInfo.card.bonus_defence = functionalCard.defence;
            }
            playerCardInfo.card.defense += functionalCard.defence;
        }

        if (playerCardInfo.position === 'GOALKEEPER') {
            players[username].board.goalkeeper.card = playerCardInfo.card;
            players[username].board.goalkeeper.score = playerCardInfo.card.attack + playerCardInfo.card.defense;
        } else {
            players[username].board[playerCardInfo.position.toLowerCase()].cards[playerCardInfo.index] = playerCardInfo.card;
            players[username].board[playerCardInfo.position.toLowerCase()].score += ((functionalCard.attack || 0) + (functionalCard.defence || 0));
        }

        players[username].totalPoints += ((functionalCard.attack || 0) + (functionalCard.defence || 0));
    } else {
        if (functionalCard.attack) {
            if (functionalCard.attack_special_trait_1) {
                let specialTraits = [];

                if (functionalCard.attack_special_trait_1 === "not null") {
                    // apply the attack on every enemy card that has a special trait

                    if (players[username].board.goalkeeper.card && players[username].board.goalkeeper.card.special_trait) {
                        if (players[username].board.goalkeeper.card.bonus_attack) {
                            players[username].board.goalkeeper.card.bonus_attack += functionalCard.attack;
                        } else {
                            players[username].board.goalkeeper.card.bonus_attack = functionalCard.attack;
                        }
                        players[username].board.goalkeeper.card.attack += functionalCard.attack;

                        // update goalkeeper score
                        players[username].board.goalkeeper.score = players[username].board.goalkeeper.card.attack + players[username].board.goalkeeper.card.defense;
                        players[username].totalPoints += functionalCard.attack;
                    }

                    players[username].board.defence.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.defence.score += functionalCard.attack;
                            players[username].board.defence.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });

                    players[username].board.mid.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.mid.score += functionalCard.attack;
                            players[username].board.mid.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });

                    players[username].board.attack.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.attack.score += functionalCard.attack;
                            players[username].board.attack.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });
                } else {
                    specialTraits.push(functionalCard.attack_special_trait_1);

                    if (functionalCard.attack_special_trait_2) {
                        specialTraits.push(functionalCard.attack_special_trait_2);
                    }
                }

                if (specialTraits.length) {
                    // apply the attack only on the enemy cards that have one of the attack special traits specified by the functional card

                    if (specialTraits.includes(players[username].board.goalkeeper.card ? players[username].board.goalkeeper.card.special_trait : null)) {
                        if (players[username].board.goalkeeper.card.bonus_attack) {
                            players[username].board.goalkeeper.card.bonus_attack += functionalCard.attack;
                        } else {
                            players[username].board.goalkeeper.card.bonus_attack = functionalCard.attack;
                        }
                        players[username].board.goalkeeper.card.attack += functionalCard.attack;

                        // update goalkeeper score
                        players[username].board.goalkeeper.score = players[username].board.goalkeeper.card.attack + players[username].board.goalkeeper.card.defense;
                        players[username].totalPoints += functionalCard.attack;
                    }

                    players[username].board.defence.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.defence.score += functionalCard.attack;
                            players[username].board.defence.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });

                    players[username].board.mid.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.mid.score += functionalCard.attack;
                            players[username].board.mid.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });

                    players[username].board.attack.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_attack) {
                                card.bonus_attack += functionalCard.attack;
                            } else {
                                card.bonus_attack = functionalCard.attack;
                            }
                            card.attack += functionalCard.attack;
                            players[username].board.attack.score += functionalCard.attack;
                            players[username].board.attack.cards[index] = card;
                            players[username].totalPoints += functionalCard.attack;
                        }
                    });
                }
            }
        }

        if (functionalCard.defence) {
            if (functionalCard.defence_special_trait_1) {
                let specialTraits = [];

                if (functionalCard.defence_special_trait_1 === "not null") {
                    // apply the defence on every enemy card that has a special trait

                    if (players[username].board.goalkeeper.card && players[username].board.goalkeeper.card.special_trait) {
                        if (players[username].board.goalkeeper.card.bonus_defence) {
                            players[username].board.goalkeeper.card.bonus_defence += functionalCard.defence;
                        } else {
                            players[username].board.goalkeeper.card.bonus_defence = functionalCard.defence;
                        }
                        players[username].board.goalkeeper.card.defense += functionalCard.defence;

                        // update goalkeeper score
                        players[username].board.goalkeeper.score = players[username].board.goalkeeper.card.attack + players[username].board.goalkeeper.card.defense;
                        players[username].totalPoints += functionalCard.defence;
                    }

                    players[username].board.defence.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.defence.score += functionalCard.defence;
                            players[username].board.defence.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });

                    players[username].board.mid.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.mid.score += functionalCard.defence;
                            players[username].board.mid.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });

                    players[username].board.attack.cards.forEach((card, index) => {
                        if (card.special_trait) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.attack.score += functionalCard.defence;
                            players[username].board.attack.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });
                } else {
                    specialTraits.push(functionalCard.defence_special_trait_1);

                    if (functionalCard.defence_special_trait_2) {
                        specialTraits.push(functionalCard.defence_special_trait_2);
                    }
                }

                if (specialTraits.length) {
                    // apply the defence only on the enemy cards that have one of the defence special traits specified by the functional card

                    if (specialTraits.includes(players[username].board.goalkeeper.card ? players[username].board.goalkeeper.card.special_trait : null)) {
                        if (players[username].board.goalkeeper.card.bonus_defence) {
                            players[username].board.goalkeeper.card.bonus_defence += functionalCard.defence;
                        } else {
                            players[username].board.goalkeeper.card.bonus_defence = functionalCard.defence;
                        }
                        players[username].board.goalkeeper.card.defense += functionalCard.defence;

                        // update goalkeeper score
                        players[username].board.goalkeeper.score = players[username].board.goalkeeper.card.attack + players[username].board.goalkeeper.card.defense;
                        players[username].totalPoints += functionalCard.defence;
                    }

                    players[username].board.defence.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.defence.score += functionalCard.defence;
                            players[username].board.defence.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });

                    players[username].board.mid.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.mid.score += functionalCard.defence;
                            players[username].board.mid.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });

                    players[username].board.attack.cards.forEach((card, index) => {
                        if (specialTraits.includes(card.special_trait)) {
                            if (card.bonus_defence) {
                                card.bonus_defence += functionalCard.defence;
                            } else {
                                card.bonus_defence = functionalCard.defence;
                            }
                            card.defense += functionalCard.defence;
                            players[username].board.attack.score += functionalCard.defence;
                            players[username].board.attack.cards[index] = card;
                            players[username].totalPoints += functionalCard.defence;
                        }
                    });
                }
            }
        }
    }
};

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
            } else {
                allReady = false;
            }

            if (allReady) {
                io.emit('all_players_ready');
                io.emit('round', roundsInfo);
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
        // remove card from player's hand
        players[username].cards.minions.splice(players[username].cards.minions.findIndex(c => c.id === cardId), 1);

        let card = allCards.minions[cardId];

        // according to the players' heroes/leaders cards, the played minion gets more bonus
        let playersUsername = Object.keys(players);

        if (players[playersUsername[0]].cards.hero.country) {
            if (card.country === players[playersUsername[0]].cards.hero.country) {
                card.attack += (players[playersUsername[0]].cards.hero.attack || 0);
                card.defense += (players[playersUsername[0]].cards.hero.defence || 0);
            }
        }

        if (players[playersUsername[1]].cards.hero.country) {
            if (card.country === players[playersUsername[1]].cards.hero.country) {
                card.attack += (players[playersUsername[1]].cards.hero.attack || 0);
                card.defense += (players[playersUsername[1]].cards.hero.defence || 0);
            }
        }

        if (players[playersUsername[0]].cards.hero.club) {
            if (card.club === players[playersUsername[0]].cards.hero.club) {
                card.attack += (players[playersUsername[0]].cards.hero.club_attack || 0);
                card.defense += (players[playersUsername[0]].cards.hero.club_defence || 0);
            }
        }

        if (players[playersUsername[1]].cards.hero.club) {
            if (card.club === players[playersUsername[1]].cards.hero.club) {
                card.attack += (players[playersUsername[1]].cards.hero.club_attack || 0);
                card.defense += (players[playersUsername[1]].cards.hero.club_defence || 0);
            }
        }

        // add card to the board
        if (position === 'goalkeeper') {
            players[username].board.goalkeeper.card = card;
            players[username].board.goalkeeper.score = ((card.attack || 0) + (card.defense || 0));
        } else {
            players[username].board[position].cards.push(allCards.minions[cardId]);
            players[username].board[position].score += ((card.attack || 0) + (card.defense || 0));
        }

        // add tot total points
        players[username].totalPoints += ((card.attack || 0) + (card.defense || 0));
    } else if (cardType === 'F') {
        // remove card from player's hand
        players[username].cards.functional.splice(players[username].cards.functional.findIndex(c => c.id === cardId), 1);

        let functionalCard = allCards.functional[cardId];
        let enemyUsername = Object.keys(players).filter(username => username !== currentPlayerUsername)[0];

        if (functionalCard.who_applies_to === 'Opposition') {
            applyFunctionalCard(enemyUsername, functionalCard);
        } else if (functionalCard.who_applies_to === 'My team') {
            applyFunctionalCard(currentPlayerUsername, functionalCard);
        } else { // All
            applyFunctionalCard(enemyUsername, functionalCard);
            applyFunctionalCard(currentPlayerUsername, functionalCard);
        }
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

app.post('/end_round', (req, res) => {
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

    if (!roundsInfo.is_ending) {
        roundsInfo.is_ending = true;

        // respond
        res.json(response.success(true));

        // emit the new 'roundsInfo' object state
        io.emit('round', roundsInfo);
    } else {
        roundsInfo.is_ending = false;

        // find current round winner;
        let playersUsername = Object.keys(players);
        let winnerUsername;

        if (players[playersUsername[0]].totalPoints > players[playersUsername[1]].totalPoints) {
            winnerUsername = playersUsername[0];
        } else if (players[playersUsername[0]].totalPoints < players[playersUsername[1]].totalPoints){
            winnerUsername = playersUsername[1];
        } else {
            winnerUsername = Object.keys(players)[Math.floor(Math.random() * 2)];
        }

        // set current round winner;
        if (roundsInfo.current_round === 1) {
            roundsInfo.roundsWinner.round_1 = winnerUsername;
        } else if (roundsInfo.current_round === 2) {
            roundsInfo.roundsWinner.round_2 = winnerUsername;
        } else {
            roundsInfo.roundsWinner.round_3 = winnerUsername;
        }
        players[winnerUsername].noWins++;

        // if this was the last round => end game (set the winner)
        if (roundsInfo.current_round === 3) {
            // set winner
            if (players[playersUsername[0]].noWins > players[playersUsername[1]].noWins) { // first player won
                roundsInfo.winner = playersUsername[0];
            } else { // second player won
                roundsInfo.winner = playersUsername[1];
            }
        } else {
            roundsInfo.current_round++;
        }

        // clean first player board
        players[playersUsername[0]].totalPoints = 0;
        players[playersUsername[0]].board = {
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
        };

        // clean second player board
        players[playersUsername[1]].totalPoints = 0;
        players[playersUsername[1]].board = {
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
        };

        // respond
        res.json(response.success(true));

        // emit the new 'players' object state
        io.emit('gameplay', players);

        // emit the new 'rountsInfo' object state
        io.emit('round', roundsInfo);
    }
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
            myTurn: false,
            noWins: 0
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
