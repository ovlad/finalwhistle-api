# finalwhistle-api

#### API/Sockets Endpoint
https://finalwhistle-api.herokuapp.com/

#### Exposed API
* #### `GET /minions_cards`

  _description_
  
  The method retrieves 24 random minion cards. 
  
  _response body example_
  ```
  {
    "result": [
        {
            ...card details...
        },
        {
            ...card details...
        },
        ...
    ] 
  }
   ```

* #### `GET /functional_cards`

  _description_
  
  The method retrieves 10 random functional cards. 
  
  _response body example_
  ```
  {
    "result": [
        {
            ...card details...
        },
        {
            ...card details...
        },
        ...
    ] 
  }
   ```

* #### `GET /heroes_cards`

  _description_
  
  The method retrieves 40 random hero cards. 
  
  _response body example_
  ```
  {
    "result": [
        {
            ...card details...
        },
        {
            ...card details...
        },
        ...
    ] 
  }
   ```

* #### `POST /minions_cards_selector`

  _description_
  
  The method set the player chosen minions cards. 
  
  _request body params_

  | Parameter | Type              | Description                    | Mandatory |
  |-----------|-------------------|--------------------------------|-----------|
  | username  | string            | the username                   | YES       |
  | cards     | array of integers | 11 indexes of the chosen cards | YES       |
  
  _request body example_
  ```json
  {
    "username": "john",
    "cards": [1, 15, 22, 4, 7, 2, 3, 10, 23, 30, 9]
  }
  ```
  
  _response body example_
    ```json
    {
      "result": true
    }
     ```
  
* #### `POST /functional_cards_selector`

  _description_
  
  The method set the player chosen functional cards. 
  
  _request body params_

  | Parameter | Type              | Description                   | Mandatory |
  |-----------|-------------------|-------------------------------|-----------|
  | username  | string            | the username                  | YES       |
  | cards     | array of integers | 5 indexes of the chosen cards | YES       |
  
  _request body example_
  ```json
  {
    "username": "john",
    "cards": [1, 15, 22, 4, 7]
  }
  ```
  
  _response body example_
    ```json
    {
      "result": true
    }
     ```
  
* #### `POST /hero_card_selector`

  _description_
  
  The method set the player chosen hero card. 
  
  _request body params_

  | Parameter | Type    | Description         | Mandatory |
  |-----------|---------|---------------------|-----------|
  | username  | string  | the username        | YES       |
  | card      | integer | the hero card index | YES       |
  
  _request body example_
  ```json
  {
    "username": "john",
    "card": 4
  }
  ```
  
  _response body example_
    ```json
    {
      "result": true
    }
     ```

* #### `POST /play_card`

  _description_
  
  With this method the user can play a card. 
  
  _request body params_

  | Parameter | Type    | Description         | Mandatory |
  |-----------|---------|---------------------|-----------|
  | username  | string  | the username        | YES       |
  | card_type      | string | the card type (possible values: **M** for minion card, **F** for functional card)| YES       |
  | card_id      | integer | the card id | YES       |
  | position      | string | the card play position (possible values: **GAOLKEEPER**, **DEFENCE**, **MID** and **ATTACK**) | NO if card_type is **F**, YES otherwise       |
  
  _request body example_
  ```json
  {
    "username": "john",
    "card_type": "M",
    "card_id": 4,
    "position": "MID"
  }
  ```
  
  _response body example_
    ```json
    {
     "result": true
    }
    ```

* #### `POST /end_turn`

  _description_
  
  With this method the user can end his turn. The next player username will be emitted via the `turn` event.
  
  _request body params_

  | Parameter | Type    | Description         | Mandatory |
  |-----------|---------|---------------------|-----------|
  | username  | string  | the username        | YES       |
  
  _request body example_
  ```json
  {
    "username": "john",
  }
  ```
  
  _response body example_
    ```json
    {
     "result": true
    }
    ```
  
#### Exposed Events
* #### `hello`
    
    _usage example_
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
    
    // any time the server sends data through the 'hello' event,
    // the client prints it
    socket.on('hello', data => {
      console.log(data);
    });
    ```

* #### `exception`

    _description_
     
    This event is used to listen for any errors that come from the server. The `error` object received has the following format:
    ```
    {
        "event": <string>
        "code": <integer>,
        "message": <string> 
        "data": <any|null>
    }
    ``` 
    Possible errors:
    
    | Code   | Message                                                                  |
    |--------|--------------------------------------------------------------------------|
    | -30000 | Unknown error                                                            |
    | -32700 | Params error                                                             |
    | -32601 | Invalid params                                                           |
    | -20000 | No room left in the game. The maximum number of players has been reached |
    | -11000 | Invalid username                                                         |                                                      |

    _usage example_
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
    
    // any time the server announces an error by sending it through the 'exception' event,
    // handle the error
    socket.on('exception', error => {
        // handle error
    });
    ```

* #### `join`
  
    _description_
    
    Through this event the client announces the server that he wants to play. If the server does not fire any error with code `-20000` or `-11000` via the `exception` event, the user can play.
    
    _usage example_
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
  
    // join the game using 'john' as username
    socket.emit('join', 'john');
    ```

* #### `players`
  
    _description_
    
    The event is used to listen for the current players server information. The players received data has the following format:
     ```
     {
          "username1": {
              "socketId": <string>,
              "username": "username1"
              "isReady": false
          },
          "username2": {
              "socketId": <string>,
              "username": "username2",
              "isReady": false 
          },
          ...
     }
     ``` 
     > the maximum number of players that can join the game at a time is **2**
    
    _usage example_
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
  
    let players = {};
  
    // any time the server sends the current players data through the 'players' event,
    // store the current players data into the 'players' object
    socket.on('players', _players => {
        players = _players;
    });
    ```
    
* #### `new_player`
    
    _description_
    
    The event is used to listen for new players that join the game.
    > the maximum number of players that can join the game at a time is **2**
     
     _usage example_
     
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
    
    let players = {};
    
    // any time the server announces a new player by sending its data through the 'new_player' event,
    // add the new player data to the 'players' object
    socket.on('new_player', player => {
        players[player.username] = player;
    });
    ```
    
* #### `player_has_disconnected`
    
    _description_
    
    The event is used to listen for any player that leaves the game. The event data received from the server is the username of the player who left the game. 
    
    _usage example_
     
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');
    
    let players = {};
    
    // any time the server announces a player leaving the game by sending its username through the 'player_has_disconnected' event,
    // remove the player data from the 'players' object
    socket.on('player_has_disconnected', username => {
        delete players[username];
    });
    ```
    
* #### `all_players_ready`
    
    _description_
    
    The event is used to listen when all the players are ready to play (they chose all the cards to play).  
    
    _usage example_
     
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');  
    
    // when server announces that all the players are ready to play, do something 
    socket.on('all_players_ready', () => {
        // do something
    });
    ```

* #### `turn`
    
    _description_
    
    The event is used to listen for the current player's turn. This event will be fired when the turn is changed and it will emit the username of current player.

    _usage example_
     
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');  
    
    // wait for the server to tell whose turn it is
    socket.on('turn', username => {
       console.log('now is `' + username + '` turn');
    });
    ```

* #### `gameplay`
    
    _description_
    
    The event is used to listen for the a change in any players game information. It is fire every time the players information has changed and it will emit the new state of all the players information. 

    _usage example_
     
    ```javascript
    const socketIO = require('socket.io-client');
    const socket = socketIO('https://finalwhistle-api.herokuapp.com');  
    
    // wait for the server to tell whose turn it is
    socket.on('gameplay', players => {
       // do something
    });
    ```
    
    _**players** params_
    
    | Parameter | Type    | Description         |
    |-----------|---------|---------------------|
    | players._username_ | object | the _username_ information |
    | players._username_.socketId | string | the player socket id |
    | players._username_.username | string | the player username |
    | players._username_.cards | object | the cards ids the player has in his hand |
    | players._username_.cards.minions | array of _integers_ | the array of the minions cards id the player has in his hand |
    | players._username_.cards.functional | array of _integers_ | the array of the functional cards id the player has in his hand |
    | players._username_.cards.hero | integer | the hero card id that the player has in his hand |
    | players._username_.board | object | the player board information |
    | players._username_.board.goalkeeper | integer | the minion card id that play as a goalkeeper |
    | players._username_.board.defence | array of _integers_ | the array of the minions cards id that play in the defence row |
    | players._username_.board.mid | array of _integers_ | the array of the minions cards id that play in the middle row |
    | players._username_.board.attack | array of _integers_ | the array of the minions cards id that play in the attack row |
    | players._username_.totalPoints | integer | ? |
    | players._username_.isReady | boolean | _**true**_ if it the _username_ is ready to play (has chosen all the cards), _**false**_ oterwises |
    | players._username_.myTurn | boolean | _**true**_ if it is the _username_ turn, _**false**_ oterwises |
   
    
    
    
    
    
    
