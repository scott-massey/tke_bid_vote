$("#voting_in_progress").hide();
$("#start_vote").on("click", function(){
  let vote_name = $("#vote_name").val();
  $("#vote_name").val("");
  if(vote_name == ""){
    alert("\"Vote Name\" field is blank. Please enter a name.");
  }
  else{
    socketio.emit("start_vote", {name: vote_name});
    $("#name_voting").text("Voting for: " + vote_name);
    $("#new_vote").hide();
    $("#voting_in_progress").show();
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
  $("#yes_count").text("Yes: ");
  $("#no_count").text("No: ");
  $("#percent_count").text("Percent yes: ");
  $("#total_votes").text("Total votes:");
  $("#history").html("");

  $("#voting_in_progress").hide();
  $("#new_vote").show();
});
$("#end_vote").on("click", function(){
  alert("Voting has ended. No one can submit votes now.");
  socketio.emit('end_vote');
});
