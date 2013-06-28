var siteinfo = {};
var catNo, unitNo, unitName, assessName, assessId, assessTypeNo, token, url; // variables for currently selected
var courseinfo = {}; //array of objects id,shortname,fullname
var assignmentinfo = {}; //array of objects
var assignmentids = new Array();
var gradeinfo = {}; //array of objects

var assessmentUrl = ["","01_workdiary","02_createprocess","03_jsa","04_demonstrationchecklist","","","","","",""];
var assessmentType = ["","Work Diary","Create Process/Procedure","Job Safety Analysis","Demonstration Checklist","","","","","",""];
var readyToArrangePages = false;
var helpScreenNo = 1;

$(document).ready(function(){
	$("#screenloading .content .loading, #curtain .loading").center();
	
	$(window).resize(function() {
		resizeViewport()
	});


	$(".btnhelp").click(function(){
		var thisBtn = $(this);
		$(".screencontent.current .shadow").toggle();
		$(".screencontent.current .btnhelp").toggleClass("btnhelpon");
		if($(".screencontent.current .shadow").css("display")!="none"){
			// turn on help
			helpScreenNo = 1;
			$(".screencontent.current .helper").each(function(index){
				var thisHelper = $(this);
				// get name of element to help
				$($(this).attr('class').split(' ')).each(function() { 
					if (this.substr(0,6) == 'tohelp') {
						var elementToHelp = (".screencontent.current ."+this.split("tohelp")[1]+":first");
						var helpScreen = $("<div class='helpScreen' title='"+$(thisHelper).attr('title')+"'></div>");
						
						$(elementToHelp).clone().appendTo($(helpScreen)).show();
						$(elementToHelp).css('position','relative')
						$(helpScreen).append("<p>"+$(thisHelper).text()+"</p>");
						//$(thisHelper).clone().appendTo($(helpScreen));
						
						$(helpScreen).dialog({
						  dialogClass: "viewhelp",
						  position: { my: "center center", at: "center center", of: $(".screencontent.current") },
						  closeOnEscape: true,
						  width:'auto',

						  resizable: false,
						  modal: true,
						  open: function( event, ui ){
							  $(".footerbar button").css("z-index","0");
			 				  $(thisBtn).css("z-index","2");
							  $(".screencontent.current .shadow").show();
						  },
						  close: function( event, ui ){
							  closeDialog();
						  },
						  buttons: [ { text: "Back", 'class': "btnback", click: function() { helpBtnBack($(thisHelper), index);} },
									{ text: "Next", 'class': "btnnext", click: function() { helpBtnNext($(thisHelper), index); } }]
						});
					}    
				});
			});
			$(".screencontent .content").addClass("noScroll");
			$(".viewhelp").hide();
			$(".viewhelp:first").show();
			$(".viewhelp .btnback").addClass("disabled");
		}
		else {
			$(".viewhelp").remove();
			$(".screencontent .content").removeClass("noScroll");
		}
	});
	
	$(".btnreset").click(function(){
		var r=confirm("Are you sure you want to reset? This will delete all your text and media for this attempt.");
	});
	
	$("body").on("click", ".shadow", function(){
		closeDialog();
	});
	
	$(".btnpreview").click(function(){
		var previewHtml = "";
		$(".screencontent:not(#screenpreview) .activity").children().not("button, .description, .helper").each(function(){
			if ($(this).attr("class")!=undefined){
				previewHtml+= "<div class='"+$(this).attr("class")+"'>";				
			}
			else {
				previewHtml+= "<div>";
			}
			previewHtml+= $(this).val()!="" ? $(this).val():$(this).html();
			previewHtml+= "</div>";
		});
		$("#screenpreview .activity").children().not(".helper, .btnsubmit").remove();
		$(previewHtml).insertBefore("#screenpreview .activity .btnsubmit");
		$("#screenpreview .activity textarea, #screenpreview .activity input").each(function(){
			var newHtml = "";
			if ($(this).attr("class")!=undefined){
				newHtml+= "<div class='"+$(this).attr("class")+"'>";				
			}
			else {
				newHtml+= "<div>";
			}
			newHtml+= $(this).val()+"</div>";
			$(this).after(newHtml);
			$(this).remove();
		});
		moveScreens("screenpreview");
		
	});
	
	 
	$(".btnsubmit").click(function(){
		if (navigator.onLine){
			mobas.upload();
		}
		else {
			alert("You are not currently online. Your response has been saved. Please return and submit when you are online.")	
		}
	});
	
	$(".activity").on('change', ".btnmedia", function(){
		var btnMedia = $(this)[0];
		if (btnMedia.files && btnMedia.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {				
				var uploadedMedia = $(btnMedia).nextAll(".uploadedmedia");
				if($(uploadedMedia).children().length == 0){
					$(uploadedMedia).append("<div class='uploadedimg'><img src='"+e.target.result+"'/></div>");
					$("img", uploadedMedia).load(function(){
						$(this).resizeImg({
							maxWidth: 1200,
							maxHeight: 1200
						});
						var activityWidth = $(".screencontent.current .activity").width();
						var activityHeight = $(".screencontent.current .activity").css("min-height").replace("px","")-$(".screencontent.current .activity-before").height()-$(".screencontent.current .activity-after").height();
						var imgSize = viewImageSize(activityWidth, activityHeight, $(this).width(), $(this).height());
						$(this).width(imgSize.finalWidth);
						$(this).height(imgSize.finalHeight);
						$(btnMedia).hide();
						$(uploadedMedia).show();
					});
					
					if ($(this).hasClass("btnmediathumb")){
						$(".uploadedimg", uploadedMedia).addClass("uploadedimgthumb");
					 }
				}
            };

            reader.readAsDataURL(btnMedia.files[0]);
        }
	});	

	$(".activity").on("click", ".uploadedmedia", function(){
		viewMediaFullScreen($(this));										
	});
	
	$(".btnhome").click(function(){
		var homeScreen = $("#screens .screenhome:first").attr("id");
		assessId=null;
		$.indexedDB("mobas").objectStore("settings").delete("currentassessment").then(function(){
			if (homeScreen==undefined){
				linkLocation = "index.html"
				$("body").fadeOut(200, function(){window.location = linkLocation;});
			}
			else {
				moveScreens(homeScreen);
			}
		});
	});
	
	$(".btnnotifications").click(function(){
		getNotifications();
		var thisBtn = $(this);
		$(".notificationsScreen").dialog({
		  dialogClass: "viewnotifications",
		  position: { my: "center center", at: "center center", of: $(".screencontent.current") },
		  closeOnEscape: true,
		  width:'auto',
		  width:$(".screencontent.current").width()*.8,
		  height:$(".screencontent.current").height()*.8,
		  resizable: false,
		  modal: true,
		  open: function( event, ui ){
			  $(".footerbar button").css("z-index","0");
			  $(thisBtn).css("z-index","2");
			  $(".screencontent.current .shadow").show();
		  },
		  close: function( event, ui ){
			  closeDialog();
		  }
		});
	});
	
	$(".btninfo").click(function(){
		var thisBtn = $(this);
		$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(item){
			if (item!= undefined){
				
				var helpScreen = $("<div class='helpScreen' title='"+item.name+"'><p class='assessmentType'>"+assessmentType[item.assessTypeNo]+"</p>"+item.assessDescription+"</div>");
				$(helpScreen).dialog({
				  dialogClass: "viewinfo",
				  position: { my: "center center", at: "center center", of: $(".screencontent.current") },
				  closeOnEscape: true,
				  width:'auto',
		
				  resizable: false,
				  modal: true,
				  open: function( event, ui ){
					  $(".footerbar button").css("z-index","0");
					  $(thisBtn).css("z-index","2");
					  $(".screencontent.current .shadow").show();
				  },
				  close: function( event, ui ){
					  closeDialog();
				  }
				});
				
				$(".screencontent.current .screentitle").html(item.name);
			}
		});
	});	
	
	$(".btnsettings").click(function(){
		$("#screensettings .user").text("Logged in as "+siteinfo.fullname+" ("+siteinfo.username+")");
		if (navigator.onLine) {
			connectionStatus = "online";
		}
		else {
			connectionStatus = "offline";	
		}
		$("#screensettings .connection").text("Connection status: "+connectionStatus);
		
		var thisBtn = $(this);
		$(".settingsScreen").dialog({
		  dialogClass: "viewsettings",
		  position: { my: "center center", at: "center center", of: $(".screencontent.current") },
		  closeOnEscape: true,
		  width:'auto',
		  width:$(".screencontent.current").width()*.8,
		  height:$(".screencontent.current").height()*.8,
		  resizable: false,
		  modal: true,
		  open: function( event, ui ){
			  $(".footerbar button").css("z-index","0");
			  $(thisBtn).css("z-index","2");
			  $(".screencontent.current .shadow").show();
		  },
		  close: function( event, ui ){
			  closeDialog();
		  }
		});
	});
	
	$(".btnnext").click(function(){
		var nextScreen = $("#screens .current").next().attr("id");
		moveScreens(nextScreen);
	});
	$(".btnlogout").click(function(){
		var r=confirm("Are you sure you want to logout?\nAll cached data will be deleted.")
		if (r==true){
			$(".screencontent.current .shadow").hide();
			closeDialog();
			
			$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){	
				if (item!= undefined){
					$.each(item.assignmentids, function (index, value) {
						deleteDB("MobasAssessment"+value.id);
					});
				}
			});
			
			mobas.resetVars();
			$(".current .statusbox").html("Logout successful.");
			$("#screenlogin .statusbox").hide();
			$("#moodlepassword").val("")
			moveScreens("screenlogin");
			$("#login").show();
	
			emptyDB("mobas", "settings");
			_($.indexedDB("mobas").objectStore("settings").add({"settingName":"url", "url": url}));
			
			isLoggedOut = setInterval(checkLogout, 100);
		}		
	});
	
	$(".btnback").click(function(event){
			event.preventDefault();
		if ($("#screens .current").attr("id")=="screenmain"){
			// window.location = "00_index_presentation.html"; // for presentation only
			//linkLocation = "index.html#screenstudentassessmentstatus";
			linkLocation = "index.html"
			
			$("body").fadeOut(200, function(){window.location = linkLocation;});
		}
		else {
			var prevLevel = 0;
			$($(".screencontent.current").attr('class').split(' ')).each(function() {  
				if (this.substr(0,1) == 'l') {
					prevLevel = Number(this.substr(1)-1);
				}
			});
			var backScreen = $("#screens .current").prevUntil("#screens",".l"+prevLevel).attr("id");
			if (backScreen == "screenstudentassessments"){
				$(".current .statusbox").fadeOut(200).html("");
				_($.indexedDB("mobas").objectStore("settings").delete("currentassessment"));
				assessId = null;
			}
			moveScreens(backScreen);
		}
	});
	 
	$(".content").on("click", ".jumpto", function(){
		$($(this).attr('class').split(' ')).each(function() { 
			if (this.substr(0,6) == 'jumpto' && this.length > 6) {
				var screenToJumpTo = ("#"+this.split("jumpto")[1]);
				if($(screenToJumpTo).length != 0 && $(screenToJumpTo).attr("id") != $(".screencontent.current").attr("id")){
					moveScreens($(screenToJumpTo).attr("id"));
				}
			}    
		});
	});
	
	$(".date").each(function(){
		$(this).html(displayDate());
	 });
	 
	$(".time").each(function(){
		$(this).html(displayTime());
	 });

	 
	addActivityWrapperDivs();
	addItemBtns();
	textfieldFocus();
	revealBlinds();	
	
	mouseWheel();
	resizeViewport();
	
});

function checkLogout(){
	$.indexedDB("mobas").objectStore("settings").get(0).then(function (item) {
		if (item==undefined){
			clearInterval(isLoggedOut);
			var url = window.location.pathname;
			var filename = url.substring(url.lastIndexOf('/')+1);
			if (filename != "index.html"){
				linkLocation = "index.html"
				$("body").fadeOut(200, function(){window.location = linkLocation;});
			}
		}
	})
	
}

function addActivityWrapperDivs(){
		
	$(".screencontent").each(function(){
		var viewerDiv = $("<div></div>");
		$(viewerDiv).attr("class", $(".activity", this).attr("class"));
		$(viewerDiv).addClass('activityviewer').removeClass('activity');
		$(".activity", this).removeClass().addClass("activity");
		$(".activity", this).wrap($(viewerDiv));
		$(".activity", this).prepend("<div class='activity-before'></div>");
		$(".activity", this).append("<div class='activity-after'></div>");
		
		var navbarDiv = $("<div></div>");
		$(navbarDiv).addClass('activitynavbarviewer');
		$(".activitynavbar", this).wrap($(navbarDiv));		
	});
}

function textfieldFocus(){
	$(".activity").on("focusin", "textarea, input:text", function() {

		var $this = $(this);
		$this.select();
	
		// Work around Chrome's little problem
		$this.mouseup(function() {
			// Prevent further mouseup intervention
			$this.unbind("mouseup");
			return false;
		});
	});
}

function moveScreens(screenName, animated){
	if (screenName == "screenlogin" && $(".screencontent.current").attr("id")=="screenloading"){
		$("#screenloading").hide();
		$("#screenlogin").fadeIn(200);
	}
	else {
		animated = typeof animated !== "undefined" ? animated : true;
	
		$("#screens").width($(window).width()*2);
		if (screenName != $(".screencontent.current").attr("id")){
			$(".screencontent").hide();
			$(".screencontent.current, #"+screenName).show();
			
			var oldCurrentScreen = $(".screencontent.current");
			//move right
			if (animated == false){
				moveScreenPost(oldCurrentScreen);
			}
			else if($(".screencontent.current").index()<$("#"+screenName).index()){
				$("#screens").css("margin-left",0);
				$("#screens").animate({ marginLeft: -$(".screencontent.current").width()}, 500, function(){
					moveScreenPost(oldCurrentScreen);
				});
			}
			//move left
			else {
				$("#screens").css("margin-left",-$(".screencontent.current").width());
				$("#screens").animate({marginLeft: 0}, 500, function(){
					moveScreenPost(oldCurrentScreen);
				});
			}
			$(oldCurrentScreen).removeClass("current");
			$("#"+screenName).addClass("current");
		}
	}
}

function moveScreenPost(oldCurrentScreen){
	$("#screens").width($(window).width());
	$(oldCurrentScreen).hide();
	$("#screens").css("margin-left",0);
	$(".screencontent.current").css("margin-left",0);
	
	//enable signature
	if ($(".screencontent.current .signature").length > 0){
		$(".screencontent.current .signature").html("").jSignature();
	}
	
/*		$(".time").each(function(){
		$(this).html(displayTime());
	 });*/
	//mouseWheel();
	$(".screencontent.current .activity").css('top', 0);
}

// for scrolling on PC
function mouseWheel(){
	$('.screencontent.current .activity').bind('mousewheel', function(event, delta) {
		var scrollToY = parseInt($(this).css('top'));
		if (delta > 0) {
			scrollToY += 40;
		} else {
			scrollToY -= 40;
		}
		var finalY = scrollingTo($(this).parent().outerHeight(), $(this).outerHeight()+$(this).siblings(".activity-before").height()+$(this).siblings(".activity-after").height(), scrollToY);
		$(this).css('top', finalY);
		$(this).siblings().css('top', finalY);
	});	
	
	$(".screencontent.current .activitynavbarviewer").mousewheel(function(event, delta) {
		var scrollToX = parseInt($(".screencontent.current .activitynavbar").css('left'));
		if (delta > 0) {
			scrollToX += 30;
		} else {
			scrollToX -= 30;
		}
		$(".screencontent.current .activitynavbar").css('left', scrollingTo($(this).outerWidth(), $(".screencontent.current .activitynavbar").outerWidth(), scrollToX));
   });
}

function scrollingTo(outerX, innerX, scrollingto){
	console.log("outerX:"+outerX+" innerX:"+ innerX+" scrollingto:"+scrollingto);
	var scrollToXorY = 0;
	// not hitting top or bottom / left or right (scrolling in the middle)
	if (scrollingto <= 0 && scrollingto >= outerX-innerX && innerX > outerX ){
		scrollToXorY = scrollingto;	
		console.log("1");
	}
	// hitting the top / left
	else if (scrollingto > 0){
		scrollToXorY = 0;
		console.log("2");
	}
	// hitting the bottom / right
	else if (scrollingto < innerX-outerX && innerX > outerX){
		scrollToXorY = Number(outerX-innerX);
				console.log("3");
	}
	return scrollToXorY;
}

function revealBlinds() {
	$('div.reveal').each(function (i){
		// add reveal functionality
		$('h4:first', this).click(function(e) {
			$(this).next().slideToggle();
			$(this).parent().toggleClass('closed');	
		});
	});
	
	$(".revealbody:not(:first)").hide();
}

function displayTime() {
	var myDate = new Date();
	var mins = myDate.getMinutes();
	if (mins < 10){
		mins = "0" + mins;
	}
	var hrs = myDate.getHours() > 12 ? myDate.getHours()-12 : myDate.getHours();
	var ampm = myDate.getHours() >= 12 ? 'PM' : 'AM';
	var myTime = hrs+':'+mins+''+ampm;
	return myTime;
}

function displayDate() {
	var myDate = new Date();
	var myTime = myDate.getDate()+'/'+Number(myDate.getMonth()+1)+'/'+myDate.getFullYear();
	return myTime;
}

function addItemBtns(){
/*	$(".btnitemyes").click(function(){
		$(this).addClass('selected');
		$(this).next().removeClass('selected');
	 });
	$(".btnitemno").click(function(){
		$(this).addClass('selected');
		$(this).prev().removeClass('selected');
	 });*/
}

function getWidth(parentDiv){
	 var parentWidth = 0;
	 $(parentDiv).children().each(function(){
		 parentWidth += $(this).outerWidth(true);
	 });
	 $(parentDiv).width(parentWidth);	
}

function viewMediaFullScreen(media){
	var saveWidth, saveHeight;
	saveWidth = $("img", media).width();
	saveHeight = $("img", media).height();
	var imgSize = viewImageSize($(window).width(), $(window).height(), $("img", media).attr("width"), $("img", media).attr("height"));
	$("img", media).width(imgSize.finalWidth);
	$("img", media).height(imgSize.finalHeight);
	$(".screencontent.current .shadow").show().addClass("fullscreen");
	$(".screencontent.current .btnhelp").hide();
	
    $(media).dialog({
	  dialogClass: "viewmedia",
	  position: { my: "center center", at: "center center", offset: "50 -50", of: $(".current .shadow") },
	  closeOnEscape: true,
      width:$(".screencontent").width(),
	  resizable: false,
      modal: true,
	  open: function( event, ui ){

	  },
	  close: function( event, ui ){
		  $("img", this).width(saveWidth);
		  $("img", this).height(saveHeight);
		  closeDialog();
	  },
	  buttons: [ { text: "Delete", 'class': "btndelete", click: function() { closeDialog();$(media).parent().children(".btnmedia").show(); $(media).html(""); updateRecord($(this).closest(".page, .task"));} },
				{ text: "Close", 'class': "btnback", click: function() { $("img", this).width(saveWidth); $("img", this).height(saveHeight);closeDialog(); } }]
    });
}

function closeDialog() {
	$(".ui-dialog-content").dialog("destroy");
	$(".screencontent.current .footerbar button").not(".btnedit").show();
	$(".screencontent.current .shadow").removeClass("fullscreen").hide();
	$(".btnhelpon").removeClass("btnhelpon");
}

function getNumberFromClass(theItem, word){
	var numberFromClass;
	$($(theItem).attr('class').split(' ')).each(function() {
		if (this.substr(0,word.length) == word && this.length > word.length) {
			if (isNaN(Number(this.split(word)[1])) == false){
			numberFromClass = Number(this.split(word)[1]);
		  }
		}    
	});
	return numberFromClass;
}

function getUnitName(unitNo){
	var unitName = "";
	$.indexedDB("mobas").objectStore("settings").get("units").then(function (item) {
		unitName = item.units[unitNo].unit.name;
		alert(unitName)
		return unitName;
	});
}

function helpBtnBack(thishelper, index){
	if (index > 0){
		helpScreenNo--;
		$(".viewhelp").hide()
		$(".viewhelp").each(function(thisHelpNo){
			if (Number(thisHelpNo+1) != helpScreenNo){
				$(this).hide();	
			}
			else {
				$(this).show();	
			}
		});
		
		$(".viewhelp .ui-dialog-buttonset .btnnext").removeClass("disabled");
		if (helpScreenNo == 1){
			$(".viewhelp .ui-dialog-buttonset .btnback").addClass("disabled");
		}
	}
}
function helpBtnNext(thishelper, index){
	if (Number(index+1) < $(thishelper).parent().children().length){
		helpScreenNo++;
		$(".viewhelp").each(function(thisHelpNo){
			if (Number(thisHelpNo+1) != helpScreenNo){
				$(this).hide();	
			}
			else {
				$(this).show();	
			}
		});
		
		$(".viewhelp .ui-dialog-buttonset .btnback").removeClass("disabled");
		if (helpScreenNo == $(thishelper).parent().children().length){
			$(".viewhelp .ui-dialog-buttonset .btnnext").addClass("disabled");
		}

	}
}


function defaultVal(obj, val){
	if ($(obj).val()==""){
		$(obj).val(val)
	}
}

function allTemplates(){
	$.indexedDB("mobas").objectStore("settings").get("currentassessment").then(function(item){
		if (item!= undefined){
			$(".screencontent.current .screentitle").html(item.name);
			assessTypeNo = item.assessTypeNo;
		}
	});
	
	$.indexedDB("mobas").objectStore("settings").get("assignmentids").then(function(item){	
		if (item!= undefined){
			var updateAssignments = item.assignmentids;
			$.each(item.assignmentids, function (index, value) {
				if(this.id == assessId){
					updateAssignments[index].started = "true";
					_($.indexedDB("mobas").objectStore("settings").put({"settingName":"assignmentids", "assignmentids": updateAssignments}));
				}
			});
		}
	});	
}

function viewImageSize(containerWidth, containerHeight, imgWidth, imgHeight) {
	var imgSize = new Object();
	var containerRatio = containerWidth / containerHeight;
	var imgRatio = imgWidth / imgHeight;
	imgSize.finalWidth = imgWidth;
	imgSize.finalHeight = imgHeight;
	// resize img if it is larger than available screen space
	if (containerWidth < imgWidth || containerHeight < imgHeight ){
		// display landscape
		if (containerRatio < imgRatio){
			//alert("landscape")
			imgSize.finalWidth = containerWidth;
			imgSize.finalHeight = containerWidth / imgWidth * imgHeight;
		}
		// display portrait
		else if (containerRatio > imgRatio) {
			//alert("portrait")
			imgSize.finalWidth = containerHeight / imgHeight * imgWidth;
			imgSize.finalHeight = containerHeight;
		}			
	}
	return imgSize;
}

function resizeViewport(){
	$("#screens").width($(window).width());
	$(".screencontent").each(function(){
		$(this).width($(window).width()).height($(window).height());
		var titleFooterH = 0;
		$(".content", this).children().not(".activityviewer, .activity, .shadow, .helpers", this).each(function(){
			titleFooterH += $(this).height();
		});
		$(".activityviewer", this).height($(window).height()-titleFooterH -5);
		var activityH = $(".activityviewer", this).height() - 43;
		$(".activity", this).css("min-height",activityH);
	});
}

function emptyElement(elementName){
	var element = document.getElementById(elementName);
	element.innerHTML = "";
}

function getCacheSiteInfo(){
	$.indexedDB("mobas").objectStore("settings").each(function (item) {
		elem = item.value;
		if (elem) {	
			if (elem.firstname){
				siteinfo.firstname=elem.firstname;
				$(".firstname").text(siteinfo.firstname);
			}
			else if (elem.userid){
				siteinfo.userid=elem.userid;
			}
			else if (elem.fullname){
				siteinfo.fullname=elem.fullname;
			}
			else if (elem.username){
				siteinfo.username=elem.username;
			}
			else if (elem.token){
				token=elem.token;
			}
			else if (elem.url){
				url=elem.url;
				$(".moodleurl").val(url);
			}
		}
	});
}

jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
    return this;
}