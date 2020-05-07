let valid_name = false;
$(function(){
  $("#signin_invalid").hide();
  if(getCookie("name") == ""){
    console.log("No cookies found.");
    $("#waiting_in_session").hide();
    $("#voting").hide();
    $("#results").hide();
    $("#waiting_registration").hide();
  }
  else{
    $("#signon_page").hide();
    $("#voting").hide();
    $("#results").hide();
    $("#waiting_registration").hide();
  }
});
$("#submit_signon").on("click", function(){
  if(valid_name){
    let name = $("#name_input").val();
    alert("Please wait for the admin to let you in.");
    $("#waiting_registration").show();
    $("#signon_page").hide();
    socketio.emit("registration_request", {name:name}, (id) => {
      $("#id_num").val(id);
    });
  }
  else{
    alert("Please use a name within 3-20 characters, using only letters and numbers.");
  }
});
$("#name_input").on("change", function(){
  let name = $("#name_input").val();
  const regex = /^[ a-z1-9]{3,20}$/i;
  if(!regex.exec(name)){
    $("#signin_invalid").show();
    valid_name = false;
    $("#submit_signon").addClass("disabled");
  }
  else{
    $("#signin_invalid").hide();
    valid_name = true;
    $("#submit_signon").removeClass("disabled");
  }
});
