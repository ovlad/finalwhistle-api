const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();

app.get('/', (res, req) => {
    req.send('Hello world!');
});

const PORT = process.env.PORT || 4321;
const server = http.Server(app);
server.listen(PORT);

const io = socketIO(server);

// when a new connection with a client is established
io.on('connection', socket => {
    console.log('Client connected');

    // when the client disconnects
    // print a message
    socket.on('disconnect', () => {
        console.log('Client disconnected')
    });

    // sends to the client a message through the 'hello' event
    socket.emit('hello', 'Hello, client! I\'am the server! Your\'re now connected to me!');
});

