var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

users = [];
messages = [];
messagesHeadInd = 0;
ctr = 1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('user join', function() {
    socket.username = 'user' + ctr;
    socket.color = '#000000'
    ctr++;
    users.push(socket.username);
    console.log(socket.username + ' has joined the chat');

    // display all the past messages
    for (let i = messagesHeadInd; i < messages.length; i++) {
      if (messages[i] == undefined) {
        break;
      }
      socket.emit('chat message', messages[i].time + ' ' + messages[i].user + ': ' + messages[i].message);
    }

    // display all the later messages before the head
    if (messagesHeadInd > 0) {
      for (let i = 0; i < messagesHeadInd; i++) {
        socket.broadcast.emit('chat message', messages[i].time + ' ' + messages[i].user + ': ' + messages[i].message);
      }
    }

    socket.emit('user join', socket.username);
    io.emit('update online users', users);
  });

  socket.on('disconnect', function(data) {
    users.splice(users.indexOf(socket.username), 1);
    console.log(socket.username + ' has left the chat');
    io.emit('update online users', users);
  });

  socket.on('chat message', function(msg){
    let d = new Date();
    let hour = (d.getHours() < 10 ? '0' : '') + d.getHours();
    let minute = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (messages.length === 200) {
      messages.shift();
    }
    let newMsg = {message: msg, user: socket.username, time: hour + ':' + minute, color: socket.color};
    messages.push(newMsg);
    io.emit('chat message', newMsg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
