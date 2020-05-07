var socketio = io.connect();
voter_count = 0;
let registered_voters = new Set();
let voted_users = new Set();
let socketID;
socketio.on('connect', function(){
  socketio.emit("admin_acknolodgement");
  socketID = socketio.id;
});
socketio.on("vote_to_admin", function(data){
  renderVotes(data.vote_count);
  voted_users = new Set(JSON.parse(data.voted_users));
  console.log("Printing voted user ids...");
  renderVotedUsers(voted_users);
});
socketio.on("voting_in_progress_admin", function(data){
  console.log(data);
  $("#name_voting").text("Voting for: " + data.name);
  $("#new_vote").hide();
  $("#voting_in_progress").show();
  renderVotes(data.vote_count);
  renderBans();
  renderVotedUsers(new Set(JSON.parse(data.voted_users)));
});
socketio.on('send_registered_voters', function(rv){
  registered_voters = new Set(JSON.parse(rv));
  voter_count = registered_voters.size;
  renderRegisteredUsers();
});
socketio.on('reset_admin_page', () => {
  registered_voters = new Set();
  renderRegisteredUsers();
  $("#waiting_list").empty();
  $("#voting_in_progress").hide();
  $("#new_vote").show();
});

socketio.on("registration_request_admin", (data, cb) => {
  //console.log("Registration request received.");
  $("#waiting_list").append("<li class= \"list-group-item p-1 w-50\" id=voter_"+data.id+"_request_item>" + data.name + "<a class=\"btn btn-success btn-sm m-1\" id=voter_"+data.id+"_request_yes>Admit</a>"+ "<a class=\"btn btn-primary btn-sm m-1\" id=voter_"+data.id+"_request_no>Deny</a></li>")
  $("#voter_"+data.id+"_request_yes").on("click", () => {
    //Admit
    socketio.emit("registration_response_admin", {admitted:true, id:data.id, name:data.name, socket: data.socket});
    voter_count++;
    $("#voter_"+data.id+"_request_yes").remove();
    $("#voter_"+data.id+"_request_no").remove();
    $("#voter_"+data.id+"_request_item").remove();
    registered_voters.add({id:data.id, name:data.name});
    renderRegisteredUsers();
  });
  $("#voter_"+data.id+"_request_no").on("click", () => {
    voter_count++;
    socketio.emit("registration_response_admin", {admitted:false, id:data.id, socket: data.socket});
    $("#voter_"+data.id+"_request_yes").remove();
    $("#voter_"+data.id+"_request_no").remove();
    $("#voter_"+data.id+"_request_item").remove();
  });
});
function renderVotes(data){
  if(data.vote_count){
    $("#yes_count").text("Yes: " + data.yes);
    $("#no_count").text("No: " + data.no);
    $("#percent_count").text("Percent yes: " + 100*(data.yes/(data.no+data.yes)) + "%");
    $("#total_votes").text("Total votes: " + data.vote_count);
  }
  else{
    $("#yes_count").text("Yes: 0");
    $("#no_count").text("No: 0");
    $("#percent_count").text("Percent yes: 0");
    $("#total_votes").text("Total votes: 0");
  }
}
function renderRegisteredUsers(){
  $("#registered_voters_list").empty();
  for(let user of registered_voters){
    $("#registered_voters_list").append("<li class= \"list-group-item\" id=voter_"+user.id+">" + user.name + "<button type=\"button\" id=\"close"+user.id+"\" class=\"close\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button></li>");
    $("#close"+user.id).on("click", function(){
      $("#voter_"+user.id).remove();
      socketio.emit("remove_voter", user.id);
    });
  }
}
function renderVotedUsers(voted_users){
  $("#registered_voters_list").children('li').each(function() {
    let element_id = $(this).attr('id');
    let voter_id = element_id.substring(6);
    console.log("voted_users.has(voter_id): " + voted_users.has(voter_id));
    if(voted_users.has(voter_id)){
      $(this).addClass("list-group-item-success");
    }
    else{
      $(this).removeClass("list-group-item-success");
    }
  });
}
function clearVotedUsers(){
  $("#registered_voters_list").children('li').each(function() {
    $(this).removeClass("list-group-item-success");
  });
}
function renderBans(){
  $("#registered_voters_list").children('li').each(function(){
    //$(this).empty();
    $(this).append("<a id=ban"+$(this).attr("id")+" class=\"btn btn-primary float-right btn-sm\">Ban From Voting</a>");
    let element_id = $(this).attr("id");
    let voter_id = element_id.substring(6);
    $("#ban"+element_id).on("click", function(){
      socketio.emit('ban_user', {id: voter_id});
      alert("Voter " + voter_id + " has been banned from voting.");
    });
  });
}
