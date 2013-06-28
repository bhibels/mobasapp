$(document).ready(function (e) {
		
	// http://blog.nparashuram.com/2012/10/indexeddb-example-on-cordova-phonegap_12.html
	// add a delay to IndexedDB operations so that the IndexedDB polyfill can be done with its housekeeping database activities.
	window.setTimeout(function(){
		openTheDatabase("mobas", "settings", "settingName", false, cacheSettings);
	}, 100);
	
	$("#screenlogin .statusbox").hide();
	
	// list assessments
	$("#screenstudenthome").on("click", ".jumptounit", function () {
		unitName = $(".unitname", this).text();
		
		if (assessId==null){
			moveScreens("screenstudentassessments");
		}
		
		unitId = getNumberFromClass($(this), "unit");
		$("#screenstudentassessments .screentitle").text(unitName);
		
		$('#screenstudentassessments .listcontainer').remove();
		var assessments = '<div class="listcontainer">';
		$.each(assignmentinfo, function (key, val) {
				if(this.course == unitId){
				var assessId = val.id;
				assessments += '<a class="jumptoassess assess'+assessId+'">'+val.name+'<span class="arrowfwd"></span></a>';
			}
		});
		assessments += "</div>";
		$('<div/>', {
			'class': 'assessments',
			html: assessments
		}).insertAfter('#screenstudentassessments .intro');

	});
	
	// assessment status
	$("#screenstudentassessments, #screennotifications").on("click", ".jumptoassess", function () {
		closeDialog();
		if (assessId==null){
			moveScreens("screenstudentassessmentstatus");
		}
		else {
			moveScreens("screenstudentassessmentstatus", false);
		}
		
		assessId = getNumberFromClass($(this), "assess")

		$.each(assignmentinfo, function (key, val) {
			if(val.id == assessId){
				assessName = val.name;
				databaseName = "MobasAssessment"+assessId;
				assessTypeNo = val.mtype;
				assessDescription = val.intro;
				content = val.content;
			}
		});

		$("#screenstudentassessmentstatus .screentitle").text(assessName);
		$("#screenstudentassessmentstatus .activity .assessmentType").html(assessmentType[assessTypeNo]);
		$("#screenstudentassessmentstatus .activity .description").html(assessDescription);

		// save current assessment selected to cache
		// add assessment type (ie 1 = work diary) when this has been created
		var thisAssessment = [{"settingName":"currentassessment","name":assessName,"id":assessId, "unitId":unitId,"assessTypeNo":assessTypeNo,"assessDescription":assessDescription, "content":content}]; 

		$.indexedDB("mobas").objectStore("settings").get(0).then(function(item){
			$.indexedDB("mobas").transaction("settings").then(function(){
	
			}, function(err, e){
				console.log("Transaction NOT completed", err, e);
			}, function(transaction){
				var activity = transaction.objectStore("settings");
				$.each(thisAssessment, function(index, value) {
					activity.put(this);
				});
			})
		});
		openTheDatabase(databaseName, "activity", "pageid", false, checkStatus);	
		
		// get previous attempts to display
	});
	
	$("#screenstudentassessmentstatus").on("click", ".btnstartassessment", function () {
		// move to new assessment page
		event.preventDefault();
		linkLocation = $(this).attr("href");
		$("body").fadeOut(200, function(){window.location = linkLocation;});	
	});
	
	$("#btnlogin").click(function(event){
		event.preventDefault();
		$("#screenlogin .statusbox").html("<img src='css/images/ajax-loader_nationalvet.gif' /><br/>Connecting to Moodle...").show();
		//$("#login").hide();
		mobas.init();
	});
});

function checkStatus(){
	var dateNow = Date.parse(new Date());
	dateNow = dateNow.toString().substr(0,10);
	$.each(assignmentinfo, function (key, val) {
		if(val.id == assessId){
			// if we have a valid date range
			if ((dateNow >= val.allowsubmissionsfromdate || val.allowsubmissionsfromdate == 0) && (dateNow <= val.duedate || val.duedate == 0)){
				// check to see if database exists
				$.indexedDB(databaseName).objectStore("activity").get(0).then(function(item){
					// get assessment type, status, apply correct status note and link available
					if(item != undefined){
						$("#screenstudentassessmentstatus .statusbox a").text("Continue assessment");
					}
				});	
				$(".current .statusbox").html("<a href='"+assessmentUrl[assessTypeNo]+"_index.html' class='btnstartassessment' rel='external'>Start assessment</a>").fadeIn(200);
			}
			// not yet available
			else if(dateNow < val.allowsubmissionsfromdate && val.allowsubmissionsfromdate != 0){
				var days = compareDates(val.allowsubmissionsfromdate, dateNow);
				$(".current .statusbox").html("<p>Assignment is not available for "+days+"<br/>Due date: "+new Date(val.duedate*1000).toLocaleString()+"</p>").fadeIn(200);
			}
			// overdue and unavailable for submission
			else {
				var days = compareDates(dateNow, val.duedate);
				$(".current .statusbox").html("<p>Assignment is overdue by "+days+"<br/>Due date: "+new Date(val.duedate*1000).toLocaleString()+"</p>").fadeIn(200);
			}
		}
	});
}

function getNotifications(){
	var notifications = new Array();
	var dateNow = Date.parse(new Date());
	dateNow = dateNow.toString().substr(0,10);
	var badgeNo = 0;
	
	$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){	
		if (item!= undefined){
			var updateAssignments = item.assignmentids;
			$.each(item.assignmentids, function (index, value) {
				var thisAssign = new Object();
				thisAssign.started = "Start now."
				
				// if we have a valid date range
				if ((dateNow >= assignmentinfo[index].allowsubmissionsfromdate || assignmentinfo[index].allowsubmissionsfromdate == 0) && dateNow <= assignmentinfo[index].duedate && assignmentinfo[index].submitted == undefined){
					// check to see if database exists
					if (this.started == "true"){
						thisAssign.started = "Continue now."
					}
					
					// get time remaining
					thisAssign.id = assignmentinfo[index].id;
					thisAssign.name = assignmentinfo[index].name;
					thisAssign.timeRemaining = compareDates(assignmentinfo[index].duedate, dateNow)
					thisAssign.daysRemaining = parseInt(thisAssign.timeRemaining.split(" ")[0]);
					thisAssign.hoursRemaining = parseInt(thisAssign.timeRemaining.split(" ")[2]);
					thisAssign.totalHoursRemaining = thisAssign.daysRemaining * 7 + thisAssign.hoursRemaining;
					
					// add to array if due within a week
					if (thisAssign.daysRemaining<8){
						thisAssign.flag = 7;
						
						if (thisAssign.daysRemaining<2){
							thisAssign.flag = 1;
						}
						else if (thisAssign.daysRemaining<4){
							thisAssign.flag = 3;
						}
						
						// flag for 7/3/1 days remaining
						if (assignmentinfo[index].flag != thisAssign.flag){
							updateAssignments[index].flag = thisAssign.flag;
							_($.indexedDB("mobas").objectStore("settings").put({"settingName":"assignmentids", "assignmentids": updateAssignments}));
							badgeNo++;
						}
						notifications.push(thisAssign);
					}						
				}
			});
			// sort into most recent order
			notifications.sort(function (a, b) {
				return a.totalHoursRemaining - b.totalHoursRemaining;
			});
			// print
			var notices = '<div class="listcontainer">';
			$.each(notifications, function(index,value){
				notices+= '<a class="jumptoassess assess'+value.id+' flag'+value.flag+'"><b>'+value.name+'</b> is due in '+value.timeRemaining+'. '+value.started+'<span class="arrowfwd"></span></a>';
			});

			notices += "</div>";
			$(".notificationsScreen").html(notices);
		}
	});	
		// display badges
		
		// switch unread to read
}

function compareDates(firstDate, secondDate){
	var delta = firstDate - secondDate;
	var days = Math.floor(delta / 86400);
	var finalDate = days;
	if (days == 1){
		finalDate += " day ";
	}
	else {
		finalDate += " days ";
	}
	var hours = Math.floor(delta / 3600) % 24;
	finalDate += hours;
	if (hours == 1){
		finalDate += " hour";
	}
	else {
		finalDate += " hours";
	}
	return finalDate;
}

function cacheSettings(){
	$.indexedDB("mobas").objectStore("settings").get("url").then(function(moodleurl){
		if(moodleurl!=undefined){
			$("#moodleurl").val(moodleurl.url);
		}
	});
	$.indexedDB("mobas").objectStore("settings").get("token").then(function(item){
		if (item!=undefined){
			token = item.token;
			//console.log("token defined")
			$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(assessment){
				//alert(JSON.stringify(assessment))
				if (assessment!=undefined){
					// get courses & assessments
					getObjectsFromIndexeddb()		
					// go to status screen	
				}
				else {
					getCacheSiteInfo();
					$.indexedDB("mobas").objectStore("settings").get("username").then(function(uname){
						if(uname!=undefined){
							$("#moodleusername").val(uname.username);
						}
						$.indexedDB("mobas").objectStore("settings").get("password").then(function(pword){
							if(pword!=undefined){
								$("#moodlepassword").val(pword.password);
							}
							// login with token
							if (navigator.onLine) {
								moveScreens("screenlogin");
								$("#btnlogin").click();
							}
							else {
								moveScreens("screenstudenthome");
							}
						});
					});
				}
			});
		}
		else {
			//console.log("token not defined")	
			moveScreens("screenlogin");
		}
	}, function(err, e){
		token = "";
		//alert("Could not get from cache");
	});


}

function getObjectsFromIndexeddb(){
	$('#screenstudenthome .units').remove();
	// siteinfo
	getCacheSiteInfo();
	
	$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){
		assignmentids = item.assignmentids;
	});
	
	$.indexedDB("mobas").objectStore("settings").get("assignmentinfo").then(function(item){
		assignmentinfo = item.assignmentinfo;
	});
	
	$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(item){
		assessId = item.id;
		unitId = item.unitId;
		$.indexedDB("mobas").objectStore("settings").get("units").then(function(item){
			courseinfo = item;
			var catCount = 0;
			var units = '<div class="listcontainer titleunits cat' + catCount + '">';
			$.each(courseinfo.units, function (key, val) {
				var badgeNo = val.assignmentLength || 0;
				var jumpToUnit = "jumptounit";
				var arrowFwd = "arrowfwd";
				var badgeInfo = "badge-info";
				if (badgeNo == 0) {
					jumpToUnit = "inactive";
					badgeInfo = "";
					arrowFwd = "arrowfwd hidden";
				}
				units += '<a class="cat' + catCount + ' unit' + val.id + ' '+jumpToUnit+'"><span class="unitname">' + val.name + '</span><span class="'+arrowFwd+'"></span><span class="badge '+badgeInfo+'">'+badgeNo+'</span></a>';
			});
			units += "</div>";
			$('<div/>', {
				'class': 'units',
				html: units
			}).insertAfter('#screenstudenthome .intro');
			
			if (assessId != undefined){
				$("#screenstudenthome .unit"+unitId).click();
				$("#screenstudentassessments .assess"+assessId).click();
			}
			else {
				moveScreens("screenstudenthome");
			}
		});
	});
}