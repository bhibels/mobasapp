var databaseName = "03_jsa"; // fake name if there is no context
var riskHarmTerms = new Array("Rare", "Unlikely", "Possible", "Likely", "Almost certain");
var controlmeasureTerms = new Array("Eliminate", "Substitute", "Isolate", "Control", "PPE");
var sliderVals = new Array();

$(document).ready(function () {
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

	buildPgBtns();
	
	gotoPg($(".page1"));
	addSliders();
	
	$("#pages").on("focusout", ".pgtitle", function(){
		defaultVal($(this), "Task title "+Number($(this).parent().index()+1));
	})
	$("#pages").on("focusout", ".location", function(){
		defaultVal($(this), "Location");
	})
	$("#pages").on("focusout", ".associatedhazard", function(){
		defaultVal($(this), "Associated hazard or risk");
	})
	$("#pages").on("focusout", ".factors", function(){
		defaultVal($(this), "Factors increasing hazard or risk");
	})
	
	 $(".pgtitle, .location, .associatedhazard, .factors").on("focusout", function(){
		 updateRecord($(this).closest(".page"));
	 });
	 
 	 readyToArrangePages = false;
	
	$('.activitynavbar').each(function () {
		var thisNavBar = $(this);

		$(".btnaddpg", this).click(function () {
			var newPgNo = Number($(".btnpg", thisNavBar).length + 1);

			$("#pages .pagemiddle:last").after('<div class="page page' + newPgNo + ' pagemiddle"><p class="buttontitle">Task ' + newPgNo + '</p><input type="text" class="pgtitle" value="Task title ' + newPgNo + '"/><input type="text" class="location" value="Location"/><textarea class="associatedhazard">Associated hazard or risk</textarea><textarea class="factors">Factors increasing hazard or risk</textarea><div class="sliders notactivated"><p class="slidertitle">Likelihood of risk: <span class="riskTerm"></span></p><div class="sliderbox riskbox"><div class="risk slider"></div></div><p class="slidertitle">Likelihood of harm: <span class="harmTerm"></span></p><div class="sliderbox harmbox"><div class="harm slider"></div></div><p class="slidertitle">Control measure: <span class="controlTerm"></span></p><div class="sliderbox controlbox"><div class="controlmeasure slider"></div></div></div>');
			sliderVals.push(new Array(0,0,0));
			addSliders();
			var newpg = createNewItem($('.page'+newPgNo+":first"));
			_($.indexedDB(databaseName).objectStore("activity").add(newpg));

			gotoPg($("#pages .page"+newPgNo));

			buildPgBtns();
		});
	});
	
	$(".btnedit").click(function () {
		if ($("#screens .current .activityviewer").hasClass("editmode")) {
			closeEditMode();
		} else {
			moveScreens("screenedit");
			$(".activitynavbarviewer").hide();
			$("#screens .current .items").html("");
			$(".pagemiddle").each(function (index) {
				$("#screens .current .items").append("<li class='item item" + Number(index + 1) + "'><p class='itemsort'>" + $(".pgtitle", this).val() + "</p><div class='btnitem btnitemdelete'></div></li>");
			});
			$("#screens .current .items").sortable({
				tolerance: "pointer",
				axis: "y",
				containment: "parent"
			});
			$(".btnitemdelete").click(function () {
				var itemToDel = getNumberFromClass($(this).parent(), "item");
				$(this).parent().remove();
				$(".pagemiddle.page" + itemToDel).remove();
				$(".activitynavbar .btnpg.btnpg" + itemToDel).remove();

				if ($("#screens .current .items").children().length == 1) {
					closeEditMode();
				}
			});
			$("#screens .current .activityviewer").addClass("editmode");
		}
	});
	$("#curtain").fadeOut(200);
}

function createNewItem(item){
	var newitem = new Object;
	newitem.pageid = $(item).index();
	newitem.title = $(".pgtitle", item).val();
	newitem.location = $(".location", item).val();
	newitem.associatedHazard = $(".associatedhazard", item).val();
	newitem.factorsIncreasing = $(".factors", item).val();
	//alert(sliderVals[$(item).index()][0]);
	newitem.likelihoodRisk = sliderVals[newitem.pageid][0];
	newitem.likelihoodHarm = sliderVals[newitem.pageid][1];
	newitem.controlMeasure = sliderVals[newitem.pageid][2];
	return newitem;
}

function buildPgBtns() {
	if ($(".btnpg").length > 0) {
		$(".btnpg").off('click').remove();
	}
	$(".btnedit").hide();
	$("#pages .pagemiddle").each(function (index) {
		$(".activitynavbar .btnaddpg").before("<button data-role='none' class='btnpg btnpg" + Number(index + 1) + "'>Task " + Number(index + 1) + "</button>");
		$(".btnpg" + Number(index + 1)).click(function () {
			gotoPg($("#pages .pagemiddle:nth-child(" + Number(index + 1) + ")"));
		});
	});
	if ($("#pages .pagemiddle").length > 1) {
		$(".btnedit").show();
	}
	getWidth($('.activitynavbar'));
}

function gotoPg(pg) {
	$("#pages .page").hide();
	$(pg, "#pages").show();
	$(".activityviewer.activitywithnavbar").children().css("top", 0);
}

function addSliders() {
	$(".sliders.notactivated").each(function (index) {
		var sliderIndex = $(this).closest(".page").index();
		var thisSliders = $(this);
		//alert(sliderVals[sliderIndex][0])

		$(".risk", thisSliders).slider({
			value: sliderVals[sliderIndex][0],
			min: 0,
			max: 4,
			step: 1,
			slide: function (event, ui) {
				$(".riskTerm", thisSliders).text(riskHarmTerms[ui.value]);
				sliderVals[sliderIndex][0] = ui.value;
				updateRecord($(this).closest(".page"));
			}
		});
		$(".riskTerm", thisSliders).text(riskHarmTerms[$(".risk", thisSliders).slider("value")]);

		$(".harm", thisSliders).slider({
			value:sliderVals[sliderIndex][1],
			min: 0,
			max: 4,
			step: 1,
			slide: function (event, ui) {
				$(".harmTerm", thisSliders).text(riskHarmTerms[ui.value]);
				sliderVals[sliderIndex][1] = ui.value;
				updateRecord($(this).closest(".page"));
			}
		});
		$(".harmTerm", thisSliders).text(riskHarmTerms[$(".harm", thisSliders).slider("value")]);

		$(".controlmeasure", thisSliders).slider({
			value: sliderVals[sliderIndex][2],
			min: 0,
			max: 4,
			step: 1,
			slide: function (event, ui) {
				$(".controlTerm", thisSliders).text(controlmeasureTerms[ui.value]);
				sliderVals[sliderIndex][2] = ui.value;
				updateRecord($(this).closest(".page"));
			}
		});
		$(".controlTerm", thisSliders).text(controlmeasureTerms[$(".controlmeasure", thisSliders).slider("value")]);
		$(thisSliders).removeClass("notactivated");
	});
}

// Download an activity from the server and save it to the DB
function downloadactivity(){
	// if the objectstore is empty, use JSON
	$.indexedDB(databaseName).objectStore("activity").get(0).then(function(item){
		// no indexeddb data, get JSON
		if (item == undefined){
			var tempString = [{"pageid":0,"title":"Task title 1","location":"Location","associatedHazard":"Associated hazard or risk","factorsIncreasing":"Factors increasing hazard or risk","likelihoodRisk":0,"likelihoodHarm":0,"controlMeasure":0}]; 
		
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
	var newPgNo = $(".current .page").length;
	sliderVals[$(".current .page").length] = new Array();
	sliderVals[$(".current .page").length][0]=value.likelihoodRisk || 0;
	sliderVals[$(".current .page").length][1]=value.likelihoodHarm || 0;
	sliderVals[$(".current .page").length][2]=value.controlMeasure || 0;

	newPgNo++;
	var div = $('<div class="page page' + newPgNo + ' pagemiddle"><p class="buttontitle">Task ' + newPgNo + '</p><input type="text" class="pgtitle" value="'+value.title+'"/><input type="text" class="location" value="'+value.location+'"/><textarea class="associatedhazard">'+value.associatedHazard+'</textarea><textarea class="factors">'+value.factorsIncreasing+'</textarea><div class="sliders notactivated"><p class="slidertitle">Likelihood of risk: <span class="riskTerm"></span></p><div class="sliderbox riskbox"><div class="risk slider"></div></div><p class="slidertitle">Likelihood of harm: <span class="harmTerm"></span></p><div class="sliderbox harmbox"><div class="harm slider"></div></div><p class="slidertitle">Control measure: <span class="controlTerm"></span></p><div class="sliderbox controlbox"><div class="controlmeasure slider"></div></div></div>');
	$("#pages").append(div);
}


function closeEditMode() {
	$("#screens .current .items").sortable("destroy");
	$("#screens .current .activityviewer").removeClass("editmode");
	$(".activitynavbarviewer").show();
	sliderVals= new Array();

	$("#screens .current .items .item").each(function (index) {
		var origPgNo = getNumberFromClass($(this), "item");
		$(".pagemiddle:last").after($(".pagemiddle.page" + origPgNo));
		$(".pagemiddle.page" + origPgNo + " .buttontitle").html("Task " + Number(index + 1));
	});
	$(".pagemiddle").each(function (index) {
		sliderVals[index]= new Array();
		sliderVals[index][0]= $(".risk", this).slider("option","value");
		sliderVals[index][1]= $(".harm", this).slider("option","value");
		sliderVals[index][2]= $(".controlmeasure", this).slider("option","value");
		var origPgNo = getNumberFromClass($(this), "page");
		$(this).removeClass("page" + origPgNo).addClass("page" + Number(index + 1));
	});
	$(".risk, .harm, .controlmeasure").slider("destroy");
	$(".sliders").addClass("notactivated")
	addSliders();
	rebuildDB();
	moveScreens("screenmain");
	buildPgBtns();
	gotoPg($(".page1"));
}