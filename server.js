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
let vote_record = new Map();
let banned_voters = new Set();
let voted_users = new Set();
let registered_voters = new Set();
let voter_id_count = 0;
let already_started = false;
let admin_id = "";
let threshold = 0.8;
io.sockets.on('connection', (socket) => {
  if(voting_in_progress){
    socket.emit('start_vote_to_client', {name:vote_name, already_started:true});
  }
  socket.on("check_id", (id) => {
    let found = false;
    for(let user of registered_voters){
      if(user.id == id){
        found=true;
      }
    }
    if(!found){
      console.log("Unregistered voter attempting to connect, sending reset cookies command.");
      socket.emit('reset_cookies');
    }
  });
  if(voter_id_count == 0){
    socket.emit('reset_cookies');
  }
  if(registered_voters.size != 0){
    console.log(JSON.stringify(Array.from(registered_voters)));
    socket.emit('send_registered_voters', JSON.stringify([...registered_voters]));
  }
  else{
    socket.emit('reset_admin_page');
  }
  if(voting_in_progress){
    console.log("Admin reloaded, voting still in progress.");
    //socket.emit('voting_in_progress_admin', {history: history, vote_count: votes, name: vote_name});
    voted_users_JSON = JSON.stringify([...voted_users]);
    socket.emit('voting_in_progress_admin', {vote_count: votes, name: vote_name, voted_users: voted_users_JSON});
  }
  socket.on("admin_acknolodgement", function(){
    console.log("admin_id: " + socket.id);
    admin_id = socket.id;
  });

  socket.on('registration_request', (data, voterCB) => {
    console.log("Registration request from " + data.name + ", id " + voter_id_count + " submitted.");
    socket.broadcast.to(admin_id).emit('registration_request_admin', {name:data.name, id:voter_id_count, socket: socket.id});
    voterCB(voter_id_count);
    voter_id_count++;
  });
  socket.on('registration_response_admin', (res) => {
    if(res.admitted){
      let voter = {id:res.id, name:res.name};
      registered_voters.add(voter);
      voter_id_count = registered_voters.size;
    }
    socket.broadcast.to(res.socket).emit('registration_response_voter', res);
  });
  socket.on('ban_user', (data) => {
    banned_voters.add(data.id);
    if(voted_users.has(data.id)){
      let vote = vote_record.get(data.id);
      if(vote){
        votes.yes--;
      }
      else{
        votes.no--;
      }
      votes.vote_count--;
      voted_users.delete(data.id);
      voted_users_JSON = JSON.stringify([...voted_users]);
      socket.emit('vote_to_admin', {vote_count: votes, voted_users: voted_users_JSON});
    }
  });
  socket.on('submit_vote', (data, cb) => {
    let found = false;
    for(let user of registered_voters){
      if(user.id == data.id){
        found=true;
      }
    }
    if(voted_users.has(data.id)){
      cb(1);
    }
    else if(banned_voters.has(data.id)){
      cb(2);
    }
    else if(!voting_in_progress){
      cb(3);
    }
    else if(!found){
      cb(4);
    }
    else{
      voted_users.add(data.id);
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
      vote_record.set(data.id, data.vote);
      votes.vote_count = votes.vote_count + 1;
      voted_users_JSON = JSON.stringify([...voted_users]);
      socket.broadcast.to(admin_id).emit('vote_to_admin', {vote_count: votes, voted_users: voted_users_JSON});
      cb(0);
    }
    console.log(data);
  });
  function mapToJson(map) {
    return JSON.stringify([...map]);
  }
  socket.on("end_vote", () => {
    voting_in_progress = false;
    let result = false;
    if((votes.yes/votes.vote_count) >= threshold){
      result = true;
    }
    socket.broadcast.emit('display_results', {votes: votes, results: result});
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
  socket.on('remove_voter', (voter_id) =>{
    for(let user of registered_voters){
      if(user.id == voter_id){
        registered_voters.delete(user);
      }
    }
  });
  function resetVote(){
    votes.yes = 0;
    votes.no = 0;
    votes.vote_count = 0;
    votes.name = "";
    banned_voters.clear();
    voted_users.clear();
    vote_record.clear();
    voting_in_progress = false;
    vote_name = "";
    socket.broadcast.emit('reset_vote_user');
  }
});
