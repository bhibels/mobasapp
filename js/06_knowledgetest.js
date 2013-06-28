$(document).ready(function(){
	var jsonQuiz = {
	  "quiz": {
		"question": [
		  {
			"type": "category",
			"category": { "text": "$module$/Default for Quiz name" }
		  },
		  {
			"type": "multichoice",
			"name": { "text": "S2000 Q01" },
			"questiontext": {
			  "format": "html",
			  "text": "<p>Who is the current PM of Australia?</p>"
			},
			"generalfeedback": { "format": "html" },
			"defaultgrade": "1.0000000",
			"penalty": ".3333333",
			"hidden": "0",
			"single": "true",
			"shuffleanswers": "true",
			"answernumbering": "abc",
			"correctfeedback": {
			  "format": "html",
			  "text": "<p>Correct</p>"
			},
			"partiallycorrectfeedback": { "format": "html" },
			"incorrectfeedback": {
			  "format": "html",
			  "text": "<p>Incorrect</p>"
			},
			"answer": [
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>John Howard</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>Kevin Rudd</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "100",
				"format": "html",
				"text": "<p>Julia Gillard</p>",
				"feedback": { "format": "html" }
			  }
			]
		  },
		  {
			"type": "multichoice",
			"name": { "text": "S2000 Q02" },
			"questiontext": {
			  "format": "html",
			  "text": "<p>What time is school out?</p>"
			},
			"generalfeedback": { "format": "html" },
			"defaultgrade": "1.0000000",
			"penalty": ".3333333",
			"hidden": "0",
			"single": "true",
			"shuffleanswers": "true",
			"answernumbering": "abc",
			"correctfeedback": {
			  "format": "html",
			  "text": "<p>Correct</p>"
			},
			"partiallycorrectfeedback": { "format": "html" },
			"incorrectfeedback": {
			  "format": "html",
			  "text": "<p>Incorrect</p>"
			},
			"answer": [
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>10:00am</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>1:15pm</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "100",
				"format": "html",
				"text": "<p>3:30pm</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>5:30pm</p>",
				"feedback": { "format": "html" }
			  }
			]
		  },
		  {
			"type": "multichoice",
			"name": { "text": "S2000 Q03" },
			"questiontext": {
			  "format": "html",
			  "text": "<p>What belongs in a fruit salad?</p>"
			},
			"generalfeedback": { "format": "html" },
			"defaultgrade": "1.0000000",
			"penalty": ".3333333",
			"hidden": "0",
			"single": "false",
			"shuffleanswers": "true",
			"answernumbering": "abc",
			"correctfeedback": {
			  "format": "html",
			  "text": "<p>Correct</p>"
			},
			"partiallycorrectfeedback": { "format": "html", "text": "<p>Some answers are correct.</p>" },
			"incorrectfeedback": {
			  "format": "html",
			  "text": "<p>Incorrect</p>"
			},
			"answer": [
			  {
				"fraction": "33.333333333333336",
				"format": "html",
				"text": "<p>Banana</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>Cucumber</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "33.333333333333336",
				"format": "html",
				"text": "<p>Orange</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "0",
				"format": "html",
				"text": "<p>Bread</p>",
				"feedback": { "format": "html" }
			  },
			  {
				"fraction": "33.333333333333336",
				"format": "html",
				"text": "<p>Watermelon</p>",
				"feedback": { "format": "html", "text": "Test feedback for watermelon" }
			  }
			]
		  }
		]
	  }
	}
	
	// setup review table
	var table = $('<table></table>').addClass('tablereview');
	table.append('<tr><th>Question</th><th>Status</th><th>Marks</th></tr>');
	
	$(jsonQuiz.quiz.question).each(function(qNo){
		if (this.questiontext){
			// add row to table
			var row = $('<tr><td>'+qNo+'</td><td>Not complete</td><td></td></tr>');
			table.append(row);
			
			// setup quiz questions
			var thisQ = this;
			var optType = "radio";
			if (this.single == "false"){
				optType = "checkbox";
			}
			var qOptions = '<div class="options">';
			$(this.answer).each(function(optNo){
				qOptions += '<p><input class="opt" type="'+optType+'" name="q'+qNo+'" id="q'+qNo+'opt'+optNo+'" value="'+optNo+'"><label for="q'+qNo+'opt'+optNo+'">'+$(this.text).text()+'</label></p>';
			});
			qOptions += "</div>";
			
			var newQ = $('<div class="q q'+qNo+'"><p class="qtitle">Question '+qNo+'</p><p>'+this.questiontext.text+'</p>'+qOptions+'</div>');
			var qs = $("#screenqs .qs");
			$(qs).append(newQ);
			
			var btncheck = $('<button data-role="none" class="btncheck">Check</button>');
			$(btncheck).attr("disabled","disabled");
			$(btncheck).click(function(){
				// get checked options, add option scores & get option specific feedback
				var qScore = 0;
				var incorrectAnswer = 0;
				var optFeedback = "";
				$(".currentQ input").attr("disabled","disabled");
				$(".currentQ input:checked").each(function(){
					var thisOpt = thisQ.answer[$(this).val()];
					if (thisOpt.fraction == "0"){
						incorrectAnswer++;
						// add cross
						$(this).parent().append("<span class='incorrect'>Incorrect</span");
					}
					else {
						// add tick
						$(this).parent().append("<span class='correct'>Correct</span");	
					}
					qScore += Number(thisOpt.fraction);
					optFeedback += thisOpt.feedback.text ? thisOpt.feedback.text : "";
				});
				// get general feedback, incorrect/correct/partial feedback
				var qFeedback = thisQ.generalfeedback.text ? thisQ.generalfeedback.text : "";
				if (Math.round(qScore) == 100 && incorrectAnswer == 0){
					qFeedback += thisQ.correctfeedback.text ? thisQ.correctfeedback.text : "";
					$("tr:nth-child("+(qNo+1)+") td:nth-child(2)",table).html("Correct");
					$(".current .btnq"+qNo).addClass("btnCorrect");
				}
				else if (Math.round(qScore) == 0) {
					qFeedback += thisQ.incorrectfeedback.text ? thisQ.incorrectfeedback.text : "";
					$("tr:nth-child("+(qNo+1)+") td:nth-child(2)",table).html("Incorrect");
					$(".current .btnq"+qNo).addClass("btnIncorrect");
				}
				else {
					qFeedback += thisQ.partiallycorrectfeedback.text ? thisQ.partiallycorrectfeedback.text : "";
					$("tr:nth-child("+(qNo+1)+") td:nth-child(2)",table).html("Partially correct");
					$(".current .btnq"+qNo).addClass("btnPartiallyCorrect");
				}
				var mark = Number(thisQ.defaultgrade*qScore/100)-Number(incorrectAnswer*thisQ.penalty);
				mark = mark < 0 ? Number(0).toFixed(2) : mark.toFixed(2);
				$("tr:nth-child("+(qNo+1)+") td:nth-child(3)",table).html(mark);
				
				// display feedback
				qFeedback += optFeedback;
				 $(".currentQ .qFeedback").html(qFeedback);
				// hide check button
				 $(".currentQ .btncheck").attr("disabled","disabled");

			});
			
			$(newQ).append(btncheck);
			$(newQ).append("<div class='qFeedback'></div>");
			
			$(table).insertBefore('#screenreview .activity .btnsubmit');
			
		}
		
		
   });
   $("#screenqs input").change(function(){
		$(".currentQ .btncheck").removeAttr("disabled");
		$("#screenqs .currentQ input").off('click');     
   });
	buildQBtns();
});

function buildQBtns(){
	$(".q").each(function(index){
		$(".activitynavbar").append("<button data-role='none' class='btnq btnq"+Number(index+1)+"'>Q "+Number(index+1)+"</button>");
		$(".btnq"+Number(index+1)).click(function(){
			 gotoPg($(".qs .q:nth-child("+Number(index+1)+")"));
		 });
	  });
	  $("#screenqs").show();
	getWidth($('.activitynavbar'));
	  $("#screenqs").hide();
	gotoPg($(".qs .q:nth-child(1)"));
}

function gotoPg(q){
	$(".qs .q").hide().removeClass("currentQ");
	$(q, ".qs").show().addClass("currentQ");
	$(".activity.activitywithnavbar").css("top",0);
}