# finalwhistle-api

#### API/Sockets Endpoint
https://finalwhistle-api.herokuapp.com/

#### Exposed API
* #### `GET /minions_cards`

* #### `GET /functional_cards`

* #### `GET /hero_card`

* #### `POST /minions_cards_selector`

* #### `POST /functional_cards_selector`

* #### `POST /hero_cards_selector`

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
