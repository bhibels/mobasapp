// JavaScript Document
$("#screens").appendTo("body");
$(".iphone").remove();
$(document).ready(function(){

	
	var activityH = $(".activityviewer", this).height()-$(".activity-before", this).height()-$(".activity-after", this).height();
	$(".activity", this).css("min-height",activityH);

	$(".date").each(function(){
		$(this).append(displayDate());
	 });
	 
	$(".time").each(function(){
		$(this).append(displayTime());
	 });

});

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

