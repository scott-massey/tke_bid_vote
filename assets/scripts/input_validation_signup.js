valid_name = false;

$("#name_input").on("change", function(){
  let name = $("#name_input").val();
  const regex = /^[ a-z1-9\-]{3,20}$/i;
  if(!regex.exec(name)){
    $("#signin_invalid").show();
    valid_name = false;
    $("#submit_signup").addClass("disabled");
  }
  else{
    $("#signin_invalid").hide();
    valid_name = true;
    $("#submit_signup").removeClass("disabled");
  }
});

$("#name_input").on("change", function(){
  let name = $("#name_input").val();
  const regex = /^[ a-z1-9\-]{3,20}$/i;
  if(!regex.exec(name)){
    $("#signin_invalid").show();
    valid_name = false;
    $("#submit_signup").addClass("disabled");
  }
  else{
    $("#signin_invalid").hide();
    valid_name = true;
    $("#submit_signup").removeClass("disabled");
  }
});
