var socketio = io.connect();
let already_started = false;
let signed_in = false;
let valid_scroll = new Set();
$("#submit_vote").on("click", function (){
  value = parseInt($("input[name='vote']:checked").val());
  socketio.emit("submit_vote", {vote:value, scroll:$("#scroll_num").val(), name:$("#name").val()}, (code) => {
    if(code == 0){
      alert("Thank you for submitting your vote. Please wait while everyone else does the same.");
    }
    //already voted
    else if(code == 1){
      alert("The server has indicated that you have already voted. Your vote has not been counted. Please let us know if this is inaccurate.");
    }
    //banned from voting.
    else if(code == 2){
      alert("The server has indicated that you were banned from voting. Please let us know if this is inaccurate.");

    }
    //voting ended, code == 3
    else{
      alert("Voting has ended. Guess you were too late :(");
    }
    $("#voting").hide();
    $("#waiting").show();
  });
});
socketio.on("valid_users", function(valid_scroll_JSON){
  console.log("Connected.");
  valid_scroll = new Set(JSON.parse(valid_scroll_JSON));
});
socketio.on('start_vote_to_client', function(data){
  console.log("Starting new vote");
  $("#vote_name").text("Voting on: " + data.name);
  if(!data.already_started && signed_in){
    $("#waiting").hide();
    $("#voting").show();
  }
  else {
    console.log("But we already started.");
    already_started = true;
  }
});
function jsonToMap(jsonStr) {
  return new Map(JSON.parse(jsonStr));
}
socketio.on("display_results", function(data){
  already_started = false;
  if(data.results){
    alert("Vote has passed!");
  }
  else{
    alert("Vote has failed!");
  }
  $("#yes_count").text("Yes: " + data.votes.yes);
  $("#no_count").text("No: " + data.votes.no);
  $("#percent_count").text("Percent: " + (data.votes.yes/(data.votes.yes+data.votes.no)));
  $("#total_votes").text("Total Votes: " + data.votes.vote_count);
  $("#history_yes").html("<h4>Yes:</h4>");
  $("#history_no").html("<h4>No:</h4>");
  let vote_history = jsonToMap(data.history);
  vote_history.forEach(renderHistory);
  $("#results").show();
});
function renderHistory(value, key, map){
  if(value == 1){
    $("#history_yes").append("<p>" + key + "</p>");
  }
  else{
    $("#history_no").append("<p>" + key + "</p>");
  }
}
/*socketio.on('already_voted', function(){
  alert("The server has indicated that you have already voted. Your vote has not been counted. Please let us know if this is inaccurate.");
});
socketio.on('banned_voter', function(){
  alert("The server has indicated that you were banned from voting on this PNM. Please let us know if this is inaccurate.");
});
socketio.on('voting_ended', function(){
  alert("Voting has ended. Guess you were too late :(");
});
*/
socketio.on('reset_vote_user', function(){
  if(signed_in){
    $("#voting").hide();
    $("#results").hide();
    $("#waiting").show();
  }
  already_started = false;
});
$("#yes").on("click", function(){
  submitVote(1);
});
$("#no").on("click", function(){
  submitVote(0);
});
