const socketIO = require('socket.io-client');
const socket = socketIO('http://localhost:4321');

// prints whatever data the server sends through the 'hello' event
socket.on('hello', data => {
    console.log(data);
});