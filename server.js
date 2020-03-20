var http = require('http');
var fs = require('fs');
var path = require('path');
var socketio = require('socket.io');

const PORT = process.env.PORT || 3000;

var app = http.createServer(function (request, response) {
    //console.log('request starting...');
    var filePath = 'assets' + request.url;
    //console.log(filePath);
    if (filePath == 'assets/')
        filePath = 'assets/index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(PORT);
console.log('Server running');

//Socketio stuff
var io = socketio.listen(app);
let vote_name = "";
let voting_in_progress = false;
let votes = {
  yes: 0,
  no: 0,
  name: "",
  vote_count: 0
}
let banned_voters = new Set();
let voted_users = new Set();
let history = "";
let vote_history = new Map();
let valid_scroll_arr = [
  1287, 1296, 1298, 1303, 1309, 1314, 1315,
  1316, 1317, 1318, 1320, 1321, 1322, 1323,
  1324, 1325, 1326, 1327, 1328, 1329, 1330,
  1331, 1332, 1333, 1334, 1335, 1336, 1337,
  1338, 1339, 1340, 1341, 1342, 1343, 1344,
  1345, 1346, 1347, 1348, 1349, 1350, 1351,
  1352, 1353, 1354, 1355, 1356, 1357, 1358,
  1359, 1360, 1361, 1362, 1363, 1364, 1365,
  1366, 1367, 1368, 1369, 1370, 1371, 1372,
  1373, 1374, 1375
];
let valid_scroll = new Set(valid_scroll_arr);
let valid_scroll_JSON = JSON.stringify([...valid_scroll]);
io.sockets.on('connection', function (socket) {
  if(voting_in_progress){
    socket.emit('start_vote_to_client', {name:vote_name, already_started:true});
  }
  socket.on('admin_reload', function(){
    if(voting_in_progress){
      socket.emit('voting_in_progress_admin', {history: history, vote_count: votes});
    }
    else{
      resetVote();
    }
  });
  socket.emit('valid_users', valid_scroll_JSON);
  socket.on('ban_user', function(data){
    banned_voters.add(data.scroll);
  });
  socket.on('submit_vote', function (data, cb) {
    if(voted_users.has(data.scroll)){
      cb(1);
    }
    else if(banned_voters.has(data.scroll)){
      cb(2);
    }
    else if(!voting_in_progress){
      cb(3);
    }
    else{
      voted_users.add(data.scroll);
      vote_history.set(data.name, data.vote);
      if(data.vote == 1){
        votes.yes = votes.yes + 1;
      }
      else if(data.vote == 0){
        votes.no = votes.no + 1;
      }
      let recent_vote_string = "";
      if(data.vote == 1){
        recent_vote_string = "yes";
      }
      else if(data.vote == 0){
        recent_vote_string = "no";
      }
      votes.vote_count = votes.vote_count + 1;
      history = history + data.name + " (" + data.scroll + "): " + recent_vote_string + "<br>";
      vote_history.set(data.name, data.vote);
      socket.broadcast.emit('vote_to_admin', {history: history, vote_count: votes});
      cb(0);
    }
    console.log(data);
  });
  function mapToJson(map) {
    return JSON.stringify([...map]);
  }
  socket.on("end_vote", function(){
    voting_in_progress = false;
    let threshold = 0.8;
    let result = false;
    if((votes.yes/votes.vote_count) >= threshold){
      result = true;
    }
    socket.broadcast.emit('display_results', {votes: votes, history: mapToJson(vote_history), results: result});
  });
  socket.on('start_vote', function(data){
    socket.broadcast.emit('start_vote_to_client', {name:data.name, already_started:false});
    vote_name = data.name;
    votes.name = data.name;
    votes.yes = 0;
    votes.no = 0;
    votes.vote_count = 0;
    banned_voters.clear();
    voted_users.clear();
    voting_in_progress = true;
    console.log("Voting for " + data.name + " has begun.");
  });
  socket.on('reset_vote', resetVote);
  function resetVote(){
    votes.yes = 0;
    votes.no = 0;
    votes.vote_count = 0;
    votes.name = "";
    banned_voters.clear();
    voted_users.clear();
    vote_history.clear();
    voting_in_progress = false;
    history = "";
    vote_name = "";
    socket.broadcast.emit('reset_vote_user');
  }
});
