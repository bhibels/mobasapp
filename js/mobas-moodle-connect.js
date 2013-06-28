/* Mobas client
 *
 * establish connection with server
 * settings -- server, username, password
 * get list of relevant assignments from enrolled courses
 * on choose assignment
 *  look if local copy exists
 *      load
 *  else get assignment from server
 *  make assignment available
 * allow saving assignment
 * allow posting to server
 * allow multiple saved to be posted when online
 * 
 * could just send init info for particular type, client
 * would need to know how to create/init that type, and 
 * would agree on standardised format for response
 *
 * JSON structure for a mobas
 * {name:"","type":,
 *  userid:,course:,
 *  content:[
 *          {name:"",type:"",valuelist:[],value:""}
 *              type is file,text,valuelist
 *
 */
var blob;
var mobas = function () {
	/*web services framework for testing moodle*/
	//var url = "http://moodledevt.bhtafe.edu.au/bhidevt"; // FOR local version: var url = "http://bels.local/moodle";
	var service = "Mobas"; // FOR local version:  var service = "mobas";
	//var token = '';
/*	var siteinfo = {
		"userid": 0
	};*/
	//raw data from moodle web services
	var usercourseinfo = {}; //array of objects id,shortname,fullname
	var courseinfo = {}; //array of objects 
	//var assignmentinfo = {}; //array of objects
	var categoryinfo = {}; //array of objects
	var gradeinfo = {}; //array of objects
	var courseids = [];
	var assignmentids = [];
	var events = [];
	//testing
	//var username="bhi1054614";
	//var password="19801129";
	var username, password;

	function gettoken() {
		if($("#moodleurl").val().indexOf("http://")==-1){
			$("#moodleurl").val("http://"+$("#moodleurl").val());
		}
		url = $("#moodleurl").val();
		username = $("#moodleusername").val();
		password = $("#moodlepassword").val();
		var params = {
			"username": username,
			"password": password,
			"service": service
		};
							
		$.getJSON(url + '/login/token.php', params, function (data) {
				token = data.token;				
				if (token != undefined) {	
					$("#screenlogin .statusbox").html("<img src='css/images/ajax-loader_nationalvet.gif' /><br/>Login successful. Retrieving your data. Please wait...");
					getsiteinfo();
				} else {
					$("#screenlogin .statusbox").html("Incorrect username/password. Try again.");
					$("#login").show();
				}
			})
			.fail(function () {
				alert("fail")
				$("#screenlogin .statusbox").html("Unable to connect to Moodle. Please try again later.");
			});
	}

	function getsiteinfo() {
		//on init get info needed for later calls
		wscall({
				"wsfunction": "core_webservice_get_site_info"
			}, function (data) {
				siteinfo.userid = data.userid;
				siteinfo.firstname = data.firstname;
				siteinfo.fullname = data.fullname;
				siteinfo.username = data.username;
				var tempString = [{
						"settingName": "token",
						"token": token
					}, {
						"settingName": "userid",
						"userid": siteinfo.userid
					}, {
						"settingName": "firstname",
						"firstname": siteinfo.firstname
					}, {
						"settingName": "fullname",
						"fullname": siteinfo.fullname
					}, {
						"settingName": "username",
						"username": siteinfo.username
					}, {
						"settingName": "password",
						"password": password
					}, {
						"settingName": "url",
						"url": url
					}
				];

				$.indexedDB("mobas").objectStore("settings").get("token").then(function (item) {
					if (item == undefined){
						$.indexedDB("mobas").transaction("settings").then(function () {

						}, function (err, e) {
							console.log("Transaction NOT completed", err, e);
						}, function (transaction) {
							var activity = transaction.objectStore("settings");
							$.each(tempString, function (index, value) {
								//console.log(JSON.stringify(value))
								//alert((JSON.stringify(value)))
								activity.put(this);
							});
						})
					}
				});
				getusercourseinfo();
			});
	}

	function getusercourseinfo() {
		wscall({
				"wsfunction": "core_enrol_get_users_courses",
				"userid": siteinfo.userid
			}, function (data) {
				usercourseinfo = data; //all of this is in assignments too
				//console.log(JSON.stringify(usercourseinfo))
				courseids = usercourseinfo.map(function (course, b, c) {
						return course.id;
					});
				//getassignmentinfo(courseids);
				getmobasinfo();
			});
	}

	function getcategoryinfo(categoryids) {
		wscall({
				"wsfunction": "core_course_get_categories",
				"criteria": categoryids
			}, function (data) {
				categoryinfo = data;
			});
	}

	function getmobasinfo() {
		wscall({
				"wsfunction": "mod_assign_submission_mobas_get_mobas"
			}, function (data) {
				assignmentinfo = data;
				console.log("assignment info: "+JSON.stringify(assignmentinfo));
				
				var tempString = [{
						"settingName": "assignmentinfo",
						"assignmentinfo": assignmentinfo
					}
				];
				$.indexedDB("mobas").objectStore("settings").get(0).then(function (item) {
						$.indexedDB("mobas").transaction("settings").then(function () {

							}, function (err, e) {
								console.log("Transaction NOT completed", err, e);
							}, function (transaction) {
								var activity = transaction.objectStore("settings");
								$.each(tempString, function (index, value) {
										activity.put(this);
									});
							})
					});


				//console.log(JSON.stringify(assignmentinfo));
				jQuery.each(assignmentinfo, function () {
					//console.log(JSON.stringify(this.id + " "+ b));
					var tempObj = new Object;
					tempObj.id = this.id;
					assignmentids.push(tempObj);
				});
				// check if assignmentids exists in cache, then merge the two
				$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){
					// merge if it exists
					if (item != undefined){
						// each id in cache
						$.each(item.assignmentids, function (index, value) {
							// compare to latest from server
							var found = false;
							jQuery.each(assignmentids, function () {
								if (this.id == value.id){
									assignmentids[index] = value;
									found = true;
								}
							});
							
							if(found==false){
								// delete data from cache if it no longer exists to reduce memory
								deleteDB("MobasAssessment"+value.id);
							}
						});
					}
				});	
				
				//console.log(JSON.stringify(assignmentids));
				getgradeinfo();
			});

	}

	function getgradeinfo() {
		//this seems to get for all? perhaps depends on user perms
		//check by adding and marking another student
		wscall({
				"wsfunction": "mod_assign_get_grades",
				"assignmentids": assignmentids
			}, function (data) {
				//console.log(JSON.stringify(assignmentids));
				gradeinfo = data;
				//console.log(JSON.stringify(gradeinfo));
				printObjects();
			});

	}

	function log(mesg) {
		$('#console').prepend('<p>' + mesg + '</p>');
	}

	function init() {
		log('loaded');
		// if online, pull latest data from server
		if (navigator.onLine){
			gettoken();
		}
		// get data from indexeddb if it exists, or else fail
		else {
			$.indexedDB("mobas").objectStore("settings").get("token").then(function (item) {
				if (item != undefined){
					getCacheSiteInfo();
					$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){
						if (item != undefined){
							assignmentids = item;
							$.indexedDB("mobas").objectStore("settings").get("units").then(function(item){
								if (item != undefined){
									usercourseinfo = item;
									$.indexedDB("mobas").objectStore("settings").get("assignmentinfo").then(function(item){
										if (item != undefined){
											assignmentinfo = item;
										}
									});
								}
							});
						}	
					});	
				}
				else {
					$("#screenlogin .statusbox").html("You are not online. Please try logging in later.");
				}
			});
		}
	}

	function printObjects() {
		$("#screenlogin .statusbox").html("Login and retrieving data successful...");
		$('#screenstudenthome .units').remove();
		// siteinfo
		$.each(siteinfo, function (key, val) {
				$("." + key).html(val);
			});

		// courseinfo
		var catCount = 0;
		var unitCount = 0;
		var tempUnits = new Array;
		var units = '<div class="listcontainer titleunits cat' + catCount + '">';
		$.each(usercourseinfo, function (key, val) {
				// get category
				//units +='<p class="categoryname">' + key+'</p>';
				// get visible units
				if (val.visible == 1) {
					tempUnits.push({
						"name": val.shortname,
						"id" : val.id,
						"catcount": catCount,
						"unitcount": unitCount,
						"visible": val.visible
					});
					units += '<a class="cat' + catCount + ' unit' + val.id + ' jumptounit"><span class="unitname">' + val.shortname + '</span><span class="arrowfwd"></span><span class="badge badge-info">0</span></a>';
					unitCount++;
				}
			});
		units += "</div>";
		$('<div/>', {
				'class': 'units',
				html: units
			}).insertAfter('#screenstudenthome .intro');
		// get badge number
		$.each(assignmentinfo, function (key, val) {
			//console.log(JSON.stringify(assignmentinfo))
			$.each($("#screenstudenthome .titleunits a.jumptounit"), function (index) {
				var unitId = getNumberFromClass($(this), "unit");
				if (unitId == val.course) {
					var noOfAssessments = parseInt($(".badge-info", this).text())+1;
					$(".badge-info", this).text(noOfAssessments);
					tempUnits[index].assignmentLength = noOfAssessments;
				}
			});			
		});
		$.each($("#screenstudenthome .titleunits a.jumptounit"), function (index) {
			if ($(".badge", this).text() == "0") {
				$(this).removeClass("jumptounit").addClass("inactive");
				$(".badge-info", this).removeClass("badge-info");
				$(".arrowfwd", this).addClass("hidden");
			}
		});	
		// indexeddb for student's units and assignmentids 
		var tempString = [{
				"settingName": "units",
				"units": tempUnits
			}, {
				"settingName": "assignmentids",
				"assignmentids": assignmentids
			}
		];
		$.indexedDB("mobas").objectStore("settings").get(0).then(function (item) {
				$.indexedDB("mobas").transaction("settings").then(function () {

					}, function (err, e) {
						console.log("Transaction NOT completed", err, e);
					}, function (transaction) {
						var activity = transaction.objectStore("settings");
						$.each(tempString, function (index, value) {
							activity.put(this);
						});
					})
			});
		moveScreens("screenstudenthome");
	}

	function resetVars() {
		token = '';
		password = '';
		username = '';
		siteinfo = {
			"userid": 0
		};
		//raw data from moodle web services
		usercourseinfo = {}; //array of objects id,shortname,fullname
		courseinfo = {}; //array of objects 
		assignmentinfo = {}; //array of objects
		categoryinfo = {}; //array of objects
		gradeinfo = {}; //array of objects
		courseids = [];
		assignmentids = [];
		events = [];
	}

	function upload() {
		var submitcode = null;
		if (assessTypeNo == 4){
			submitcode = $(".assessorcode").val();		
		}
		
		var content = "";
		var htmltemplate = '<div class="page"><h2>{{title}}</h2><p>{{content}}</p></div>';
		var imgtemplate = '<img src="{{image}}" width="{{imgwidth}}" height="{{imgheight}}"/>';
		var jsatemplate = '<div class="page"><h2>{{title}}</h2><p>Location: {{location}}</p><p>Associate hazard or risk: {{associatedHazard}}</p><p>Factors increasing hazard or risk: {{factorsIncreasing}}</p><p>Likelihood of risk: {{likelihoodRisk}}</p><p>Likelihood of harm: {{likelihoodHarm}}</p><p>Control measure: {{controlMeasure}}</p></div>';
		var demotemplate = '<h2>{{title}}</h2><p>Date &amp; time: {{datestamp}}</p><p>Location: {{location}}</p><p>Assessor: {{assessorname}}</p>';
		var html, img, jsa;

		var iterationPromise = $.indexedDB(databaseName).objectStore("activity").each(function (e) {
			elem = e.value;
			if (elem) {
				html = htmltemplate;

				// for Work Diary & Create Process
				if (assessTypeNo == 1 || assessTypeNo == 2){
					if (elem.content){
						html = html.replace("{{title}}", elem.title);
						html = html.replace("{{content}}", elem.content);
					}
				}
				// for JSA
				else if (assessTypeNo == 3){
					if (elem.associatedHazard!= undefined){
						jsa = jsatemplate;
						jsa = jsa.replace("{{title}}", elem.title);
						jsa = jsa.replace("{{location}}", elem.location);
						jsa = jsa.replace("{{associatedHazard}}", elem.associatedHazard);
						jsa = jsa.replace("{{factorsIncreasing}}", elem.factorsIncreasing);
						jsa = jsa.replace("{{likelihoodRisk}}", riskHarmTerms[elem.likelihoodRisk]);
						jsa = jsa.replace("{{likelihoodHarm}}", riskHarmTerms[elem.likelihoodHarm]);
						jsa = jsa.replace("{{controlMeasure}}", controlmeasureTerms[elem.controlMeasure]);
						content += jsa;	
					}	
				}
				// for Demonstration Checklist
				else if (assessTypeNo == 4){
					if (elem.complete!= undefined){
						html = html.replace("{{title}}", elem.title);
						html = html.replace("{{content}}", "Completed: " + elem.complete);					
					}
					else if (elem.assessorname!= undefined){
						demotemplate = demotemplate.replace("{{title}}", elem.topicname);
						demotemplate = demotemplate.replace("{{location}}", elem.location);
						demotemplate = demotemplate.replace("{{assessorname}}", elem.assessorname);
						content = demotemplate+content;	
					}
					else if (elem.datestamp!= undefined){
						demotemplate = demotemplate.replace("{{datestamp}}", elem.datestamp);
					}
				}
				
				if (elem.image) {
					img = imgtemplate;
					img = img.replace("{{image}}", elem.image);
					img = img.replace("{{imgwidth}}", elem.imgwidth);
					img = img.replace("{{imgheight}}", elem.imgheight);
					html += img;
				}
				if (html!= htmltemplate){
					content += html;
				}
			}
		});
		iterationPromise.done(function () {
			console.log(content);
			
			var data = {};
			data.wsfunction = "mod_assign_submission_mobas_uploadhtml";
			data.assignmentid = databaseName.replace("MobasAssessment", ""); //get from mobasinfo for current assignment
			data.content = content;
			data.submitcode = submitcode;
			wsput(data, function (data) {
				console.log(data);
				
				if (data.error == ""){
					alert("Your assessment has submitted successfully.")
					$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){	
						if (item!= undefined){
							var updateAssignments = item.assignmentids;
							$.each(item.assignmentids, function (index, value) {
								if(this.id == assessId){
									updateAssignments[index].submitted = "true";
									_($.indexedDB("mobas").objectStore("settings").put({"settingName":"assignmentids", "assignmentids": updateAssignments}));
								}
							});
						}
					});
					
					$(".btnback").click();
				}
				else {
					alert(data.error);
					//alert("The assessor code is incorrect. Assessment not submitted.")
				}
			});
		});

	}

	function response(obj) {
		console.log(obj);
	}

	function wsput(params, fncallback) {
		//params must include wsfunction;
		var wsurl = url + '/webservice/rest/server.php';
		$.indexedDB("mobas").objectStore("settings").get("token").then(function (item) {
			params.wstoken = item.token;
			params.moodlewsrestformat = 'json';
			console.log(wsurl);
			$.post(wsurl, params, fncallback);			
				
		}, function (err, e) {
			console.log(err);
		});

		//params.wstoken=token;

	}

	function wsupload(file, fncallback) {
		var wsurl = url + '/webservice/upload.php';
		var params = {};
		params.token = token;
		params.filepath = 'index.html';
		blob = new Blob(file, {
				"type": 'text\/html'
			});

		$.post(wsurl, params, fncallback);


	}

	function wscall(params, fncallback) {
		//params must include wsfunction;
		var wsurl = url + '/webservice/rest/server.php';
		params.wstoken = token;
		params.moodlewsrestformat = 'json';
		$.get(wsurl, params, fncallback);

	}

	function niceDate(epochdate) {
		var date = new Date(epochdate * 1000); //js dates in ms, moodle in s, also moodle in UMT
		return date.toLocaleString();
		//issue here; looks like moodle is saving date in local time, need to get it offset so are translating from UTC to current.



	}

	function showAssignments() {
		//sample to show info received.
		var c, i, j, a;
		for (i = 0; i < assignmentinfo.courses.length; i++) {
			c = assignmentinfo.courses[i];
			$("#output").append('<h2>' + c.fullname + '</h2>');
			$("#output").append('<dl>');

			for (j = 0; j < c.assignments.length; j++) {
				a = c.assignments[j];
				$("#output").append('<dt>' + a.name + '</dt>');
				$("#output").append('<dd>due: ' + niceDate(a.duedate) + '</dd>');
				console.log(a.duedate);
			}
			$("#output").append('</dl>');
		}
	}

	function debug() {
		console.log('siteinfo', siteinfo);
		console.log('usercourseinfo', usercourseinfo);
		console.log('courseinfo', courseinfo);
		console.log('assignmentinfo', assignmentinfo);
		console.log('gradeinfo', gradeinfo);
	}


	return {
		init: init,
		debug: debug,
		showAssignments: showAssignments,
		getsiteinfo: getsiteinfo,
		resetVars: resetVars,
		upload: upload,
		getmobasinfo: getmobasinfo
	};
}();