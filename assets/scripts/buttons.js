$(function(){
  $("#waiting").hide();
  $("#voting").hide();
  $("#results").hide();
  $("#submit_signon").on("click", function(){
    let scroll_num = parseInt($("#scroll_num_input").val());
    if(valid_scroll.has(scroll_num)){
      console.log("Signing on...");
      let scroll_num = $("#scroll_num_input").val();
      let name = $("#name_input").val();
      $("#scroll_num").val(scroll_num);
      $("#name").val(name);
      $("#signon_page").hide();
      if(already_started){
        $("#voting").show();
      }
      else {
        $("#waiting").show();
        already_started = false;
      }
      signed_in=true;
    }
    else{
      alert("Invalid scroll number. Try again.");
    }
  });
});
