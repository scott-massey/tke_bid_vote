var socketio = io.connect();
let already_started = false;
let signed_in = false;
if(getCookie("id") != ""){
  socketio.emit("check_id", getCookie("id"));
}
socketio.on('reset_cookies', () => {
  console.log("Resetting cookies...");
  document.cookie = "name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  $("#waiting_in_session").hide();
  $("#voting").hide();
  $("#results").hide();
  $("#waiting_registration").hide();
  $("#signon_page").show();
});
socketio.on('registration_response_voter', (res) => {
  if($("#id_num").val() == res.id){
    if(res.admitted){
      signIn(res.id);
    }
    else{
      alert("The admin did not let you into the room. Please let the admin know if this is was a mistake.");
      $("#waiting_registration").hide();
      $("#signon_page").show();
    }
  }
});
function signIn(id){
  console.log("Signing on...");
  let name = $("#name_input").val();
  if(getCookie("name") == ""){
    setCookie("name", name, 1);
    setCookie("id", id, 1);
  }
  $("#waiting_registration").hide();
  if(already_started){
    $("#voting").show();
  }
  else {
    $("#waiting_in_session").show();
    already_started = false;
  }
  signed_in=true;
}
$("#submit_vote").on("click", function (){
  value = parseInt($("input[name='vote']:checked").val());
  socketio.emit("submit_vote", {vote:value, id:getCookie("id"), name:getCookie("name")}, (exitcode) => {
    if(exitcode == 0){
      alert("Thank you for submitting your vote. Please wait while everyone else does the same.");
      $("#voting").hide();
      $("#waiting_in_session").show();
    }
    //already voted
    else if(exitcode == 1){
      alert("The server has indicated that you have already voted. Your vote has not been counted. Please let us know if this is inaccurate.");
      $("#voting").hide();
      $("#waiting_in_session").show();
    }
    //banned from voting.
    else if(exitcode == 2){
      alert("The server has indicated that you were banned from voting. Please let us know if this is inaccurate.");
      $("#voting").hide();
      $("#waiting_in_session").show();
    }
    //voting ended.
    else if(exitcode == 3){
      alert("Voting has ended. Guess you were too late :(");
      $("#voting").hide();
      $("#waiting_in_session").show();
    }
    else{
      alert("You have been removed from this voting session.");
      $("#voting").hide();
      $("#signon_page").show();
    }
  });
});
socketio.on('start_vote_to_client', function(data){
  console.log("Starting new vote");
  $("#vote_name").text("Voting on: " + data.name);
  if(!data.already_started && signed_in){
    $("#waiting_in_session").hide();
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
  $("#results").show();
});

socketio.on('reset_vote_user', function(){
  if(signed_in){
    $("#voting").hide();
    $("#results").hide();
    $("#waiting_in_session").show();
  }
  already_started = false;
});
$("#yes").on("click", function(){
  submitVote(1);
});
$("#no").on("click", function(){
  submitVote(0);
});
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
