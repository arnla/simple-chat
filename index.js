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
    users.push(socket.username);
    console.log(socket.username + ' has joined the chat');


    // display all the past messages
    for (let i = 0; i < messages.length; i++) {
      if (messages[i] == undefined) {
        break;
      }
      socket.emit('chat message', messages[i]);
    }

    socket.emit('user join', socket.username);
    io.emit('update online users', users);
  });

  // a user leaves the chat
  socket.on('disconnect', function(data) {
    users.splice(users.indexOf(socket.username), 1);
    console.log(socket.username + ' has left the chat');
    io.emit('update online users', users);
  });

  // a user has sent a message to the chat
  socket.on('chat message', function(msg){
    let d = new Date();
    let hour = (d.getHours() < 10 ? '0' : '') + d.getHours();
    let minute = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

    // user wants to change color
    if (msg.startsWith('/nickcolor')) {
      socket.color = '#' + msg.substring(11, 17);
      io.emit('chat message', {message: socket.username + ' has changed their nickname color to ' + socket.color, user: socket.username, time: hour + ':' + minute, color: socket.color});
    } else if (msg.startsWith('/nick')) { // user wants to change nickname
      let newNick = msg.substring(6, msg.length);
      if (users.includes(newNick)) { // nickname is already taken
        socket.emit('chat message', {message: 'That username is already taken!', user: 'admin', time: hour + ':' + minute, color: '#ff0000'});
      } else { // change user's nickname
        io.emit('chat message', {message: socket.username + ' has changed their nickname to ' + newNick, user: newNick, time: hour + ':' + minute, color: '#000000'});
        let i = users.indexOf(socket.username);
        users.splice(i, 1);
        socket.username = newNick;
        users.push(socket.username);
        socket.emit('user join', socket.username);
        io.emit('update online users', users);
      }
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
