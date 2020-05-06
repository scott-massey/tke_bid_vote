$(function(){
  $("#waiting").hide();
  $("#voting").hide();
  $("#results").hide();
  $("#submit_signon").on("click", function(){
    let id_num = parseInt($("#id_num_input").val());
    if(valid_ids.has(id_num)){
      console.log("Signing on...");
      let name = $("#name_input").val();
      $("#id_num").val(id_num);
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
