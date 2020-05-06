const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.Server(app);
const hbs = require('express-handlebars');
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'hbs');
app.engine('hbs', hbs({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs',
  defaultLayout: 'default_layout'
}));

app.get('/', (req, res) => {
  res.render('index')
});
app.get('/admin', (req, res) => {
  res.render('admin')
});
app.get('/voter', (req, res) => {
  res.render('voter')
});
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(express.static('assets'));

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

console.log('Server running');

//Socketio stuff
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
//let history = "";
//let vote_history = new Map();
let valid_ids_arr = [
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
let valid_ids_set = new Set(valid_ids_arr);
let valid_ids_JSON = JSON.stringify([...valid_ids_set]);
io.sockets.on('connection', (socket) => {
  if(voting_in_progress){
    socket.emit('start_vote_to_client', {name:vote_name, already_started:true});
  }
  socket.on('admin_reload', () => {
    if(voting_in_progress){
      console.log("Admin reloaded, voting still in progress.");
      //socket.emit('voting_in_progress_admin', {history: history, vote_count: votes, name: vote_name});
      socket.emit('voting_in_progress_admin', {vote_count: votes, name: vote_name});
    }
    else{
      resetVote();
    }
  });
  socket.emit('valid_users', valid_ids_JSON);
  socket.on('ban_user', (data) => {
    banned_voters.add(data.id);
  });
  socket.on('submit_vote', (data, cb) => {
    if(voted_users.has(data.id)){
      cb(1);
    }
    else if(banned_voters.has(data.id)){
      cb(2);
    }
    else if(!voting_in_progress){
      cb(3);
    }
    else{
      voted_users.add(data.id);
      //vote_history.set(data.name, data.vote);
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
      //history = history + data.name + " (" + data.id + "): " + recent_vote_string + "<br>";
      //vote_history.set(data.name, data.vote);
      //socket.broadcast.emit('vote_to_admin', {history: history, vote_count: votes});
      socket.broadcast.emit('vote_to_admin', {vote_count: votes});
      cb(0);
    }
    console.log(data);
  });
  function mapToJson(map) {
    return JSON.stringify([...map]);
  }
  socket.on("end_vote", () => {
    voting_in_progress = false;
    let threshold = 0.8;
    let result = false;
    if((votes.yes/votes.vote_count) >= threshold){
      result = true;
    }
    socket.broadcast.emit('display_results', {votes: votes, history: mapToJson(vote_history), results: result});
  });
  socket.on('start_vote', (data) =>{
    if(already_started){
      console.log("Start vote attempted, but previous vote has not finished!");
      socket.emit('voting_in_progress_admin', {vote_count: votes, name: vote_name});
    }
    else{
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
    }
  });
  socket.on('reset_vote', () => {
    resetVote();
  });
  function resetVote(){
    votes.yes = 0;
    votes.no = 0;
    votes.vote_count = 0;
    votes.name = "";
    banned_voters.clear();
    voted_users.clear();
    //vote_history.clear();
    voting_in_progress = false;
    //history = "";
    vote_name = "";
    socket.broadcast.emit('reset_vote_user');
  }
});
