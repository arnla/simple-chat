var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

users = [];
messages = [];
ctr = 1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  // a new user joins the chat
  socket.on('user join', function() {
    socket.username = 'user' + ctr;
    socket.color = '#000000'
    ctr++;
    users.push({user: socket.username, color: socket.color});
    socket.emit('user join', {user: socket.username, color: socket.color});
    console.log(socket.username + ' has joined the chat');

    // display all the past messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i] == undefined) {
        break;
      }
      socket.emit('chat message', messages[i]);
    }
    io.emit('update online users', users);
  });

  // a user leaves the chat
  socket.on('disconnect', function(data) {
    users.splice(users.findIndex(u => u.user === socket.username), 1);
    console.log(socket.username + ' has left the chat');
    io.emit('update online users', users);
  });

  // a user has sent a message to the chat
  socket.on('chat message', function(msg){
    let d = new Date();
    let hour = (d.getHours() < 10 ? '0' : '') + d.getHours();
    let minute = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

    if (msg.startsWith('/nickcolor')) { // user wants to change color
      changeColor(io, socket, msg, hour, minute);
    } else if (msg.startsWith('/nick')) { // user wants to change nickname
      changeNickname(io, socket, msg, hour, minute);
    } else { // user sent a regular message
      if (messages.length === 200) {
        messages.shift();
      }
      let newMsg = {message: msg, user: socket.username, time: hour + ':' + minute, color: socket.color};
      messages.push(newMsg);
      io.emit('chat message', newMsg);
    }
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function changeColor(io, socket, msg, hour, minute) {
  socket.color = '#' + msg.substring(11, 17);
  io.emit('color message', {message: socket.username + ' has changed their nickname color to ', color: socket.color});
  users.find(u => u.user === socket.username).color = socket.color;
  io.emit('update online users', users);
  socket.emit('user join', {user: socket.username, color: socket.color});
}

function changeNickname(io, socket, msg, hour, minute) {
  let newNick = msg.substring(6, msg.length);
  if (users.some( u => u.user === newNick)) { // nickname is already taken
    socket.emit('nick message', {message: 'That username is already taken!', time: hour + ':' + minute, color: '#ff0000'});
  } else { // change user's nickname
    io.emit('nick message', {message: socket.username + ' has changed their nickname to ' + newNick, time: hour + ':' + minute, color: '#000000'});
    let i = users.findIndex(u => u.user === socket.username);
    users.splice(i, 1);
    socket.username = newNick;
    users.push({user: socket.username, color: socket.color});
    socket.emit('user join', {user: socket.username, color: socket.color});
    io.emit('update online users', users);
  }
}
