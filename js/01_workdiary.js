var databaseName = "01_workdiary"; // fake name if there is no context

$(document).ready(function(e) {	
	$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(item){
		if (item!= undefined){
			databaseName = "MobasAssessment"+item.id;
			assessId = item.id;
		}
		openTheDatabase(databaseName, "activity", "pageid", false, downloadactivity);
	}, function(err, e){
		openTheDatabase(databaseName, "activity", "pageid", false, downloadactivity);
	});
	getCacheSiteInfo();
});

function postJSONsuccess() {
	allTemplates();
	
	 $('.activitynavbar').each(function(){
		 postAddHTML();
		 buildPgBtns();
	 });
	 $(".btnaddpg").on('click', function(){
		var newPgNo = Number($(".activitynavbar .btnpg").length+1);
		 $("#pages .pagemiddle:last").after('<div class="page page'+newPgNo+' pagemiddle"><p class="buttontitle">Entry '+newPgNo+': '+$.datepicker.formatDate('d MM yy', new Date())+'</p><textarea class="pgcontent">Entry content</textarea><div class="option-bar"><input type="file" class="btnmedia" title="Add media" accept="image/gif, image/jpeg, image/png" /><div class="uploadedmedia"></div></div></div>'); 
		 var newpg = createNewItem($('.page'+newPgNo+":first"));
		 $.indexedDB(databaseName).objectStore("activity").get(newPgNo).then(function(item){
			//_($.indexedDB(databaseName).objectStore("activity").delete(newPgNo));
			_($.indexedDB(databaseName).objectStore("activity").put(newpg));
		}, function(err, e){
			alert("Could not add to cache");
		});
		 
		 gotoPg($("#pages .pagemiddle:nth-child("+Number(newPgNo)+")"));
		 buildPgBtns();
	 });
	 $(".pgcontent").on("focusout", function(){
		 updateRecord($(this).closest(".page"));
	 });

	gotoPg($(".page:last"));
	 
	 
	$(".btnedit").click(function(){
		if ($("#screens .current .activityviewer").hasClass("editmode")){
			closeEditMode();
		}
		else {
			moveScreens("screenedit");
			$(".activitynavbarviewer").hide();
			$("#screens .current .items").html("");
			$(".pagemiddle").each(function(index){
				$("#screens .current .items").append("<li class='item item"+Number(index+1)+"'><p class='itemdelete'>"+$(".buttontitle",this).text()+"</p><div class='btnitem btnitemdelete'></div></li>");
			});
			$(".btnitemdelete").click(function(){
				var itemToDel = getNumberFromClass($(this).parent(), "item");
				$(this).parent().remove();
				$(".pagemiddle.page"+itemToDel).remove();
				$(".activitynavbar .btnpg.btnpg"+itemToDel).remove();
				
				if($("#screens .current .items").children().length == 1){
					closeEditMode();
				}
			});
			$("#screens .current .activityviewer").addClass("editmode");
		}
	 });
	 $("#curtain").fadeOut(200);
	 readyToArrangePages = false;
}

function createNewItem(item){
	var newitem = new Object;
	newitem.pageid = $(item).index();
	newitem.title = $(".buttontitle", item).text();
	newitem.content = $(".pgcontent", item).val();	
	if ($("canvas", item).length>0){
		newitem.imgwidth = $("canvas:first",item).attr("width");
		newitem.imgheight = $("canvas:first",item).attr("height");
		newitem.image = $("canvas:first",item)[0].toDataURL('image/jpeg', 0.6);
		// alert(newitem.image.length)  // file size
	}
	return newitem;
}

function buildPgBtns(){
	if ($(".btnpg").length > 0){
		$(".btnpg").off('click').remove();
	}
	$(".btnedit").hide();
	$("#pages .pagemiddle").each(function(index){
		var title = shortenDate($(".buttontitle", this).text())
		$(".activitynavbar").prepend("<button data-role='none' class='btnpg btnpg"+Number(index+1)+"'>"+title+"</button>");
		$(".btnpg"+Number(index+1)).click(function(){
			 gotoPg($("#pages .pagemiddle:nth-child("+Number(index+1)+")"));
		});
	});
	if ($("#pages .pagemiddle").length > 1){
	  $(".btnedit").show();
	}
	getWidth($('.activitynavbar'));
}

function gotoPg(pg){
	$("#pages .page").hide();
	$(pg, "#pages").show();
	$(".activity.activitywithnavbar").css("top",0);
}

function shortenDate(title){
	title = title.split(":")[1];
	title = title.substr(0, title.length - 5);
	gDate = title.split(" ")[1];
	gMonth = title.split(" ")[2];
	gMonth = gMonth.substr(0,3);
	title = gDate+" "+gMonth;
	return title;
}

function closeEditMode(){
	$("#screens .current .activityviewer").removeClass("editmode");
	$(".activitynavbarviewer").show();
	
	$("#screens .current .items .item").each(function(index){
		var origPgNo = getNumberFromClass($(this), "item");
		$(".pagemiddle:last").after($(".pagemiddle.page"+origPgNo));
	});
	$(".pagemiddle").each(function(index){
		var title = $(".buttontitle", this).text();
		var gDate = title.split(":")[1];
		var entry = "Entry "+Number(index+1)+":";
		title = entry+gDate;
		$(".buttontitle", this).text(title);
		var origPgNo = getNumberFromClass($(this), "page");
		$(this).removeClass("page"+origPgNo).addClass("page"+Number(index+1));	   
	});
	rebuildDB();
	
	moveScreens("screenmain");
	gotoPg($("#pages .page:last"));
	buildPgBtns();
}

function postAddHTML(){
	$(".page").each(function(index, element) {
		$(this).addClass("page"+Number(index+1)+" pagemiddle");			
	});
}

// Download an activity from the server and save it to the DB
function downloadactivity(){
	// if the objectstore is empty, use JSON
	$.indexedDB(databaseName).objectStore("activity").get(0).then(function(item){
		// no indexeddb data, get JSON
		if (item == undefined){
			var tempString = [{"pageid":0,"title":"Entry 1: "+$.datepicker.formatDate('d MM yy', new Date()),"content":"Some new content 1"}]; 
		
			$.indexedDB(databaseName).transaction("activity").then(function(){

			}, function(err, e){
				console.log("Transaction NOT completed", err, e);
			}, function(transaction){
				var activity = transaction.objectStore("activity");
				$.each(tempString, function(index, value) {
					//var activity = $.indexedDB(databaseName).objectStore("activity");
					//alert(JSON.stringify(this));
					_(activity.add(this));
					addHTML("pages", this, this);
					readyToArrangePages = true;
				});
				postJSONsuccess();
			})
		}
		else {
			loadFromDB("pages");
		}
	});
}

function addHTML(elementName, key, value){	
	 // replace input file with old button code
	 // <button data-role='none class="btnmedia" title="Add media">Add media</button>	
	var div = $('<div class="page"><p class="buttontitle">'+value.title+'</p><textarea class="pgcontent">'+value.content+'</textarea><div class="option-bar"><input type="file" class="btnmedia" title="Add media"  accept="image/gif, image/jpeg, image/png" /><div class="uploadedmedia"></div></div>');
	$("#pages").append(div);
	
	if (value.image){
		var activityWidth = $(".screencontent.current .activity").width();
		var activityHeight = $(".screencontent.current .activity").css("min-height").replace("px","")-$(".screencontent.current .activity-before").height()-$(".screencontent.current .activity-after").height();
		var imgSize = viewImageSize(activityWidth, activityHeight, value.imgwidth, value.imgheight);
		var img = "<div class='uploadedimg'><img src='"+value.image+"' width='"+value.imgwidth+"' height='"+value.imgheight+"' style='width:"+imgSize.finalWidth+"px; height:"+imgSize.finalHeight+"px;' /></div>";
		$(".uploadedmedia", div).append(img);
		$(".btnmedia", div).hide();

		var c = $("<canvas/>")
		c.attr('height', value.imgheight).attr('width', value.imgwidth);
		var ctx=c[0].getContext("2d");
		
		var image = new Image();
		image.src = value.image;
		image.onload = function() {
			ctx.drawImage(image,0,0,value.imgwidth, value.imgheight);
			$(".uploadedimg", div).append(c);
			$(c).hide();
		};
	}
}