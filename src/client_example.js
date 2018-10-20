const socketIO = require('socket.io-client');
const socket = socketIO('https://finalwhistle-api.herokuapp.com');

// any time the server sends data through the 'hello' event,
// the client prints it
socket.on('hello', data => {
    console.log(data);
});