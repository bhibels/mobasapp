var databaseName = "04_demonstrationchecklist"; // fake name if there is no context
var content, submitCode;

$(document).ready(function(e) {	
	$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(item){
		if (item!= undefined){
			databaseName = "MobasAssessment"+item.id;
			assessId = item.id;
			submitCode = item.submitCode;
			content = item.content;
		}
		openTheDatabase(databaseName, "activity", "pageid", false, downloadactivity);
	}, function(err, e){
		openTheDatabase(databaseName, "activity", "pageid", false, downloadactivity);
	});
	getCacheSiteInfo();
});

function postJSONsuccess() {
	allTemplates();
	
	$(".btnitemcomplete").click(function(){
		$(this).toggleClass('selected');
		updateRecord($(this).closest('.task'))
	 });
	 
	 $.indexedDB(databaseName).objectStore("activity").get("datestamp").then(function(item){
		 if(item.datestamp == undefined){
			var now = new Date();
			var strDateTime = [[AddZero(now.getDate()), AddZero(now.getMonth() + 1), now.getFullYear()].join("/"), [AddZero(now.getHours()), AddZero(now.getMinutes())].join(":"), now.getHours() >= 12 ? "PM" : "AM"].join(" ");
			 $('.datestamp').html(strDateTime);
			 var deets = new Object;
			 deets.datestamp = strDateTime;
			 deets.pageid = "datestamp";
			_($.indexedDB(databaseName).objectStore("activity").put(deets));
		 }
		 else {
			$(".datestamp").html(item.datestamp); 
		 }
	});	
	
	 $.indexedDB(databaseName).objectStore("activity").get("details").then(function(item){
		$.each(item, function (key, val) {
			if (key != undefined){
				$("." + key).val(val);
			}
		});
	});	

	 $(".topicname").on("focusout", function(){
		defaultVal($(this), "Topic/subject");
		updateDetails();
	 });
	 
	 $(".location").on("focusout", function(){
		defaultVal($(this), "Location");
		updateDetails();
	 });
	 
	 $(".assessorname, .assessorcode").on("focusout", function(){
		 updateDetails();
	 });
	 
	$("#curtain").fadeOut(200); 
	readyToArrangePages = false;
};

// Download an activity from the server and save it to the DB
function downloadactivity(){
	// if the objectstore is empty, use JSON
	$.indexedDB(databaseName).objectStore("activity").get(0).then(function(item){
		// no indexeddb data, get JSON
		if (item == undefined){
			var jsonTasks = new Array();
			var taskTitles;
			if (content == undefined || content == "0" || content == ""){
				taskTitles = ["Task 1","Task 2","Task 3","Task 4","Task 5","Task 6"];
			}
			else {
				taskTitles = content.split("\r\n");
			}
			for(i=0;i<taskTitles.length;i++){
				jsonTasks[i]=new Object();
				jsonTasks[i].pageid = i;
				jsonTasks[i].complete = "false";
				jsonTasks[i].image = "";
				jsonTasks[i].title = taskTitles[i];
			}			

			var detailsString = [{"pageid":"datestamp"},{"pageid":"details"}]; 
			$.indexedDB(databaseName).transaction("activity").then(function(){

			}, function(err, e){
				console.log("Transaction NOT completed", err, e);
			}, function(transaction){
				var activity = transaction.objectStore("activity");
				$.each(detailsString, function(index, value) {
					_(activity.add(this));
				});
				$.each(jsonTasks, function(index, value) {
					_(activity.add(this));
					addHTML("tasks", index, this);
					readyToArrangePages = true;
				});
				postJSONsuccess();
			});
		}
		else {
			loadFromDB("tasks");
		}
	});
}

function addHTML(elementName, key, value){	
	if(jQuery.isNumeric(key)==true){
		var newTask = $("<div class='task'><p class='taskname'>"+value.title+"</p><input type='file' class='btnmedia' title='Add media' accept='image/gif, image/jpeg, image/png' /><div class='btnitem btnitemcomplete'></div><div class='uploadedmedia'></div></div>");
		var tasks = $("#screenmain .tasks");
		$(tasks).append(newTask);
	
		if (value.complete == "true"){
			$(".btnitemcomplete", newTask).addClass("selected");
		}
	
		if (value.image){
			var activityWidth = $(".screencontent.current .activity").width();
			var activityHeight = $(".screencontent.current .activity").css("min-height").replace("px","")-$(".screencontent.current .activity-before").height()-$(".screencontent.current .activity-after").height();
			var imgSize = viewImageSize(activityWidth, activityHeight, value.imgwidth, value.imgheight);
			var img = "<div class='uploadedimg'><img src='"+value.image+"' width='"+value.imgwidth+"' height='"+value.imgheight+"' style='width:"+imgSize.finalWidth+"px; height:"+imgSize.finalHeight+"px;' /></div>";
			$(".uploadedmedia", newTask).append(img).show();
			$(".btnmedia", newTask).hide();
	
			var c = $("<canvas/>")
			c.attr('height', value.imgheight).attr('width', value.imgwidth);
			var ctx=c[0].getContext("2d");
			
			var image = new Image();
			image.src = value.image;
			image.onload = function() {
				ctx.drawImage(image,0,0,value.imgwidth, value.imgheight);
				$(".uploadedimg", newTask).append(c);
				$(c).hide();
			};
		}
	}
}

function createNewItem(item){
	var newitem = new Object;
	newitem.pageid = $(item).index();
	newitem.title = $(".taskname", item).text();
	newitem.complete = ''+$(".btnitemcomplete", item).hasClass("selected")+'';	
	if ($("canvas", item).length>0){
		newitem.imgwidth = $("canvas:first",item).attr("width");
		newitem.imgheight = $("canvas:first",item).attr("height");
		newitem.image = $("canvas:first",item)[0].toDataURL('image/jpeg', 0.6);
		// alert(newitem.image.length)  // file size
	}
	return newitem;
}

//Pad given value to the left with "0"
function AddZero(num) {
    return (num >= 0 && num < 10) ? "0" + num : num + "";
}

function updateDetails(){
	var newdetails = new Object;
	newdetails.pageid = "details";
	newdetails.location = $(".location").val();
	newdetails.topicname = $(".topicname").val();
	newdetails.assessorname = $(".assessorname").val();
	newdetails.assessorcode = $(".assessorcode").val();
	
	$.indexedDB(databaseName).objectStore("activity").get("details").then(function(item){
		_($.indexedDB(databaseName).objectStore("activity").put(newdetails));
	}, function(err, e){
		alert("Could not add to cache");
	});
}