const path = require('path')
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeaves, getRoomUsers} = require('./utils/users');

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'Chatcord Bot';

//Run when a client connects
io.on('connection', socket => {
    console.log('New WS Connection...');

    socket.on('joinRoom', ({ username, room }) => {
        console.log('socketid: ' + socket.id)
        const user = userJoin(socket.id, username, room)
        
        socket.join(user.room);
        socket.emit('message',formatMessage(botName,'Welcome to ChatCord!'))

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${username} has joined the chat`));
        
        //Send users and room info
        io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
    });
    })

    //Runs when client disconnects
    socket.on('disconnect', ()=>{
        const user = userLeaves(socket.id);
        console.log(user)
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
        }

    //Send users and room info
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
    });
    })

    //Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        console.log('socketid: ' + socket.id)

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })



    //to all the clients
    //io.emit();
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})