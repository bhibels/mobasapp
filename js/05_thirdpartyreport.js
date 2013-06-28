$(document).ready(function(){
	$(".btnedit").click(function(){
		if ($("#screens .current .items").hasClass("editmode")){
			 $("#screens .current .items").sortable("destroy");
			$("#screens .current .items").removeClass("editmode");
			$(".btnitem, #screens .current .activity button").show();
			$("#screens .current .items .item").each(function(index){
				$(".itemsort, .btnitemdelete", this).remove();
				$("input", this).show();
			});
		}
		else {
			 $("#screens .current .activity button, .btnitem").hide();
			$("#screens .current .items").sortable({
			  tolerance: "intersect",
			  axis: "y",
			  containment: "parent"
			});
			$("#screens .current .items .item").each(function(){
				$(this).append("<p class='itemsort'>"+$("input",this).val()+"</p><div class='btnitem btnitemdelete'></div>");
				$("input", this).hide();
			});
			$(".btnitemdelete").click(function(){
				$(this).parent().remove();
			});
			$("#screens .current .items").addClass("editmode");
		}
	 });
	
	$(".btnadditem").click(function(){
		var valText = $("#screens .current .items").attr("title");
		valText = valText.replace("Xx",Number($("#screens .current .items .item").length+1));
		$("#screens .current .items").append('<li class="item"><input type="text" value="'+valText+'" /></li>');
		addItemBtns();
	});
	
	 $(".items").on("focusout", "input", function(){
		defaultVal($(this), "Task "+Number($(this).parent().index()+1)+": Name of task");
	 })
});