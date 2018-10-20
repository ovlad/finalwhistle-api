const socketIO = require('socket.io-client');
const socket = socketIO('https://finalwhistle-api.herokuapp.com');

// prints whatever data the server sends through the 'hello' event
socket.on('hello', data => {
    console.log(data);
});