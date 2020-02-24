var socketio = io.connect();
socketio.emit("admin_reload");
socketio.on("vote_to_admin", function(data){
  console.log(data);
  renderVotes(data);
});
socketio.on("voting_in_progress_admin", function(data){
  console.log(data);
  renderVotes(data);
});
function renderVotes(data){
  $("#yes_count").text("Yes: " + data.vote_count.yes);
  $("#no_count").text("No: " + data.vote_count.no);
  $("#abstain_count").text("Abstain: " + data.vote_count.abstain);
  $("#percent_count").text("Percent yes: " + (data.vote_count.yes/(data.vote_count.no+data.vote_count.yes)));
  $("#total_votes").text("Total votes: " + data.vote_count.vote_count);

  $("#history").html(data.history);
}
