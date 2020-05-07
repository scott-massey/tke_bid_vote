let valid_name = false;
let username = $("#username").val();
//console.log("username: " + username);
$("#voting_in_progress").hide();
$("#reset_vote").hide();
$("#start_vote").on("click", function(){
  if(valid_name){
    let vote_name = $("#vote_name").val();
    $("#vote_name").val("");
    socketio.emit("start_vote", {name: vote_name});
    $("#name_voting").text("Voting for: " + vote_name);
    $("#new_vote").hide();
    $("#voting_in_progress").show();
    renderBans();
  }
  else{
    alert("Please use a name within 3-20 characters, using only letters and numbers.");
  }
});
$("#ban_submit").on("click", function(){
  let id_num = $("#banned_voter_id").val();
  $("#banned_voter_id").val(0);
  if(id_num < 1250 || id_num > 5000){
    alert("Invalid number. Please try again.");
  }
  else{
    socketio.emit('ban_user', {id: id_num});
    alert("Voter " + id_num + " has been banned from voting.");
  }
});
$("#reset_vote").on("click", function(){
  socketio.emit('reset_vote');
  clearVotedUsers();
  $("#yes_count").text("Yes: ");
  $("#no_count").text("No: ");
  $("#percent_count").text("Percent yes: ");
  $("#total_votes").text("Total votes:");

  $("#voting_in_progress").hide();
  $("#new_vote").show();
  $("#reset_vote").hide();
  $("#end_vote").show();
});
$("#end_vote").on("click", function(){
  alert("Voting has ended. No one can submit votes now.");
  $("#end_vote").hide();
  $("#reset_vote").show();
  socketio.emit('end_vote');
});
$("#vote_name").on("change", function(){
  let name = $("#vote_name").val();
  const regex = /^[ a-z1-9]{3,20}$/i;
  if(!regex.exec(name)){
    $("#start_vote_invalid").show();
    valid_name = false;
    $("#start_vote").addClass("disabled");
  }
  else{
    $("#start_vote_invalid").hide();
    valid_name = true;
    $("#start_vote").removeClass("disabled");
  }
});
