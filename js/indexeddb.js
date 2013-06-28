function openTheDatabase(databaseName, osName, keypath, autoinc, postOpenDB){
	// Simply open the database once so that it is created with the required activities
	$.indexedDB(databaseName, {
		"schema": {
			"1": function(versionTransaction){
				var os = versionTransaction.createObjectStore(osName, {
					"keyPath": keypath,
					"autoIncrement": autoinc
				});

			},
			// This was added in the next version of the site
			"2": function(versionTransaction){

			}
		}
	}).done(function(){
		// Once the DB is opened with the object stores set up, show data from all activities
		window.setTimeout(function(){
			postOpenDB();
		}, 200);
	});
}

function deleteDB(databaseName){
	// Delete the database 
	$.indexedDB(databaseName).deleteDatabase();
}

function emptyDB(databaseName, osName){
	$.indexedDB(databaseName).objectStore(osName).clear();
}

// Iterate over each record in a table and display it
function loadFromDB(element){
	//emptyElement(element);
	_($.indexedDB(databaseName).objectStore("activity").each(function(elem){
		addHTML(element, elem.key, elem.value);
		readyToArrangePages = true;
	}));
}

function updateRecord(page){
	var pageid = $(page).index();
	var newitem = createNewItem(page);
	$.indexedDB(databaseName).objectStore("activity").get(pageid).then(function(item){
		_($.indexedDB(databaseName).objectStore("activity").put(newitem));
	}, function(err, e){
		alert("Could not add to cache");
	});	
}

function rebuildDB(){
	emptyDB(databaseName, "activity");
	var activity = $.indexedDB(databaseName).objectStore("activity");
	$(".page, .task").each(function(){
		var newItem = createNewItem($(this))
		_(activity.add(newItem));
	});
}

function _(promise){
	promise.then(function(a, e){
		console.log("Action completed", e.type, a, e);
		if(readyToArrangePages !== null){
			if(readyToArrangePages == true){
			postJSONsuccess();
			}
		}
	}, function(a, e){
		console.log("Action completed", a, e);
	}, function(a, e){
		console.log("Action completed", a, e);
	})
}