var socketio = io.connect();
socketio.emit("admin_reload");
socketio.on("vote_to_admin", function(data){
  console.log(data);
  renderVotes(data);
});
socketio.on("voting_in_progress_admin", function(data){
  console.log(data);
  $("#name_voting").text("Voting for: " + data.name);
  $("#new_vote").hide();
  $("#voting_in_progress").show();
  renderVotes(data);
});
function renderVotes(data){
  if(data.vote_count.vote_count){
    $("#yes_count").text("Yes: " + data.vote_count.yes);
    $("#no_count").text("No: " + data.vote_count.no);
    $("#percent_count").text("Percent yes: " + 100*(data.vote_count.yes/(data.vote_count.no+data.vote_count.yes)) + "%");
    $("#total_votes").text("Total votes: " + data.vote_count.vote_count);
  }
  else{
    $("#yes_count").text("Yes: 0");
    $("#no_count").text("No: 0");
    $("#percent_count").text("Percent yes: 0");
    $("#total_votes").text("Total votes: 0");
  }


  $("#history").html(data.history);
}
