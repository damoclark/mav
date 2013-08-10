// ==UserScript==
// @name          Moodle Activity Viewer
// @namespace	    http://damosworld.wordpress.com
// @description	  Re-render Moodle pages to show student usage
// @version       0.3.3
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_getResourceText
// @grant         GM_info
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// @require       /htmllib/themelib/jquery-1.9.1.js
// @require       /htmllib/themelib/jquery-ui-1.10.2.custom.min.js
// @require       GM_XHR.js
// @require       GM_jQuery_AJAX_Busy.js
// @resource      jQueryCSS /htmllib/themelib/jquery-ui-1.10.2.custom.min.css
// @resource      settingsDialogDiv settingsDialogDiv.html
// @resource      mavCSS MAVStyles.css
// @include       http://moodle.cqu.edu.au/*
// ==/UserScript==

//don't run on frames or iframes
if (window.top != window.self)  
	exit ;

//If there is no course home page link in the breadcrumbs, then this is not
//a course site in moodle (probably home page)
if(getCoursePageLink() == null)
	exit ;

//Turn on/off debugging
var debug = true ;
	

////////////////////////////////////////////////////////////////////////////////
//Configure server paths
////////////////////////////////////////////////////////////////////////////////
var mavServer = 'https://oltdev.cqu.edu.au' ;
var mavServerHome = mavServer + '/mav' ;
var mavServerHtml = mavServer + '/htmllib/themelib' ;
var mavVersion = GM_info.script.version ;

////////////////////////////////////////////////////////////////////////////////
//Add jQuery and MAV CSS to page
////////////////////////////////////////////////////////////////////////////////
var jQueryCSS = GM_getResourceText("jQueryCSS") ;
//Make jQuery images load from mav server
jQueryCSS = jQueryCSS.replace(/url\((images\/ui-[^\.]+.png)\)/gm,"url(" + mavServerHtml + "/$1)") ;
GM_addStyle(jQueryCSS) ;

var mavCSS = GM_getResourceText("mavCSS") ;
GM_addStyle(mavCSS) ;


////////////////////////////////////////////////////////////////////////////////
//Adding the dialog to the page
////////////////////////////////////////////////////////////////////////////////
//Get the div for the dialog
var MAVcourseSettings = new MAVsettings(getCourseId(getCoursePageLink())) ;
var settingsDialogDiv = GM_getResourceText('settingsDialogDiv') ;
$("body").append(settingsDialogDiv);	


////////////////////////////////////////////////////////////////////////////////
//Add Activity Viewer Links to page
////////////////////////////////////////////////////////////////////////////////
window.addEventListener ("load", mavAddActivityViewerSwitch, false);

////////////////////////////////////////////////////////////////////////////////
//If activity viewer is turned on, then update the page
////////////////////////////////////////////////////////////////////////////////
window.addEventListener ("load", mavUpdatePage, false);


////////////////////////////////////////////////////////////////////////////////
//Bind functions for the dialog button clicks
////////////////////////////////////////////////////////////////////////////////

$("#MAVdisplayTextSize").bind("click", function() {
	$("#MAVdisplayColourLegend").hide();
	$("#MAVdisplaySizeLegend").fadeIn();
});
$("#MAVdisplayColour").bind("click", function() {
	$("#MAVdisplaySizeLegend").hide();
	$("#MAVdisplayColourLegend").fadeIn();
});


////////////////////////////////////////////////////////////////////////////////
//END OF PROGRAM
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////





//Add activityViewer javascript to page and let it do its thing
/**
 * Update the Moodle Page if is_on is set
 * 
 */
function mavUpdatePage()
{
	//If activityViewer "is_on", then load the activityViewer from oltdev and re-render page
	if (GM_getValue('is_on') == true)
		generateJSONRequest() ;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Add Mav menu options to the Settings Block in moodle page
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function mavAddActivityViewerSwitch()
{
	//Add the link option to turn on activityViewer

	//Get the html for the link to add to the course administration block
	var menu = mavCreateMenuElementDOM() ;
	
	//Add to the course administration block
	//Get the settingsnav div,
	//then the first ul element,
	//then the first li element,
	//then the first ul element.
	//Then append the menu HTML to what is already there
	var menuList = document.getElementById('settingsnav').getElementsByTagName('ul')[0].getElementsByTagName('li')[0].getElementsByTagName('ul')[0] ;
	menuList.appendChild(menu) ;
	mavSetMenuElementText() ;
}

/**
 * Create multi-level menu under settings block in Moodle which provides 'Toggle Activity Viewer' and 'Activity Viewer Settings' link options
 *
 * @returns {DOMElement} An li DOM element to be inserted into moodle page
 */
function mavCreateMenuElementDOM()
{
	/*
	Generate the following HTML to be inserted into the Settings block
	<li class="type_unknown contains_branch" id="yui_3_4_1_1_1367112303870_1216">
		<p class="tree_item branch" id="yui_3_4_1_1_1367112303870_1215">
			<span tabindex="0" title="Toggle Activity Viewer" id="yui_3_4_1_1_1367112303870_1214">Activity Viewer</span>
		</p>
		<ul id="yui_3_4_1_1_1367112303870_1221">
			<li class="type_setting collapsed item_with_icon" id="yui_3_4_1_1_1367112303870_1220">
				<p class="tree_item leaf" id="yui_3_4_1_1_1367112303870_1219">
					<a href="#" title="Toggle Activity Viewer" id="mav_activityViewerElement">
						<img alt="moodle" class="smallicon navicon" title="moodle" src="http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&amp;image=i%2Fnavigationitem&amp;rev=391">
							Turn Activity View On
					</a>
				</p>
			</li>
			<li class="type_setting collapsed item_with_icon" id="yui_3_4_1_1_1367112303870_1224">
				<p class="tree_item leaf" id="yui_3_4_1_1_1367112303870_1223">
					<a href="#" title="Activity Viewer Settings" id="yui_3_4_1_1_1367112303870_1222">
						<img alt="moodle" class="smallicon navicon" title="moodle" src="http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&amp;image=i%2Fnavigationitem&amp;rev=391">
							Activity Viewer Settings
					</a>
				</p>
			</li>
		</ul>
	</li>
	 */
	var li = document.createElement("li") ;
	li.setAttribute('class','type_unknown contains_branch collapsed') ;
		var p =  document.createElement("p") ;
		p.setAttribute('class','tree_item branch') ;
			var span = document.createElement("span") ;
			span.setAttribute('tabindex','0') ;
			span.innerHTML = 'Activity Viewer' ;
			span.setAttribute('title','Toggle Activity Viewer') ;
		p.appendChild(span) ;
	li.appendChild(p) ;
	var ul = document.createElement("ul") ;
		var li1 = document.createElement("li") ;
		li1.setAttribute('class','type_setting collapsed item_with_icon') ; 
			var p1 = document.createElement("p") ;
			p1.setAttribute('class','tree_item leaf') ;
				var a1 = document.createElement("a") ;
				a1.setAttribute('href','#') ;
				a1.setAttribute('title','Toggle Activity Viewer') ;
				a1.setAttribute('id','mav_activityViewerElement') ;
			p1.appendChild(a1) ;
		li1.appendChild(p1) ;
	ul.appendChild(li1) ;
		var li2 = document.createElement("li") ;
		li2.setAttribute('class','type_setting collapsed item_with_icon') ; 
			var p2 = document.createElement("p") ;
			p2.setAttribute('class','tree_item leaf') ;
				var a2 = document.createElement("a") ;
				a2.setAttribute('class','makealink') ;
				a2.setAttribute('title','Activity Viewer Settings') ;
				a2.innerHTML = '<img src="http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&amp;image=i%2Fnavigationitem&amp;rev=391" title="moodle" class="smallicon navicon" alt="moodle">Activity Viewer Settings' ;
			p2.appendChild(a2) ;
		li2.appendChild(p2) ;
	ul.appendChild(li2) ;
	
	li.appendChild(ul) ;
	
	//Set event handler to click the activity viewer switch link (ie turn on/off)
	a1.addEventListener('click',mavSwitchActivityViewer) ;
	
	//Set event handler to display the settings jQuery dialog if settings like clicked
	a2.addEventListener('click',mavDisplaySettings) ;
	
	//Return the DOM structure to be inserted into the page
	return li ;
}

/**
 * This function will set the link text for turning on or off the activity viewer, based
 * on the GM_getvalue setting is_on
 * 
 */
function mavSetMenuElementText()
{
	//Set text according to whether its already on or off (including img tag)
	var switchLinkText = (GM_getValue('is_on')) ? 'Turn Activity View Off' : 'Turn Activity View On' ;
	document.getElementById('mav_activityViewerElement').innerHTML =
	'<img src="http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&amp;image=i%2Fnavigationitem&amp;rev=391" title="moodle" class="smallicon navicon" alt="moodle">' + switchLinkText ;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Mav Settings Dialog
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Event handler to open new window and display optional settings for mav
 * 
 */
function mavDisplaySettings()
{
	
	//init the accordion
	initAccordion();

	//Update widgets on settings window to match the current GM_getvalue settings
	MAVcourseSettings.updateDialog() ;
	
	//Display dialog
	//$(settingsDialogDiv).dialog() ;
	$("#MAVsettingsDiv").dialog
	(
		{
			width: 720,
			height: 500,
			modal: true,
			//position: { my: "center top", at: "center top", of: $("body") },
			buttons:
			{
				"Cancel": function() { $(this).dialog("close") ; },
				"OK"    : function()
				{
					//Update GM_setvalue settings
					try
					{
						MAVcourseSettings.saveJSON() ;
					}
					catch(err)
					{
						alert(err) ;
						return ;
					}
					
					$(this).dialog("close") ;
					
					//IF MAV is already turned on, reload page to reflect settings changes
					if(GM_getValue('is_on') == true)
						window.location.reload() ;

					//If GM_getvalue('is_on') == true
						//Generate xmlhttpRequest
						//Update display
				}
			}
		}
	) ;
	//mavUpdateSettingsWindow(settingsWindow) ;
	
}

function mavSwitchActivityViewer()
{
	GM_setValue('is_on',!GM_getValue('is_on')) ;
	
	if (GM_getValue('is_on'))
	{
		//Toggle the text on the menu
		mavSetMenuElementText() ;
		//Fire updatePage function
		mavUpdatePage() ;
	}
	else
	{
		//Reload the page
		window.location.reload() ;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Accordion init and config for the dialog
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function initAccordion() 
{
	
	$("#MAVsettingsForm").accordion({
		collapsible: true,
		header: "h2",
		active: false,
		heightStyle: "content"
	});
	
	//init the select weeks jquery buttons
	$("input:button").button();
	$("#MAVdisplayModes, #MAVTypes").buttonset();
	
	$("#timeframe_selectall").bind("click", function(e) {			
		//tick all weeks
		$(".MAVTimeframe").attr('checked',true).prop('checked',true);
	});
	$("#timeframe_selectnone").bind("click", function(e) {			
		//untick all weeks
		$(".MAVTimeframe").prop("checked",false).removeAttr("checked");
	});
	
	
}


//matchine binding for below
/*			var validated = collectSelections();	
			if (validated) {
				do something
				send array to db or something
			}
			else {
				do something else
				example: show error saying "you must select a student first"	
			}
}
*/

//collecting which students are ticked
function collectSelections() {
	
	//clear the array first	
	clearArrays();		
	
	//collect the students involved
/*	var counter = 0;
	var validate = false;		
	$(".recipients").each(function(i) {
		if ( $(this).prop("checked")==true ) {
			studentMIDs[counter] = $(this).val();		
			counter++;	
			validate = true;	
		}
	});	
*/	
	
	return validate;		
}

/**
 * Class for interacting with settings dialog
 * 
 * @param   {Integer} function Integer representing id number of course
 */
function MAVsettings(courseid)
{
	//Instance course id (from breadcrumbs)
	this.courseid = courseid ;
	//Instance settings for dialog
	this.JSON = null ;
	//Default settings for dialog
	this.defaultJSON =
	{
		activityType: "C", //Default to clicks
		displayMode: "T", //Default to text size
		groups: [ 0 ] //Default to all students
	} ;
}

/**
 * Method for loading the activity type from GM and updating the dialog
 */
MAVsettings.prototype.loadActivityType = function()
{
	//Make sure JSON has been loaded from GM
	this.loadJSON() ;
	
	//Get the relevant info from the json for the display mode
	var type = this.JSON.activityType ;
	
	//Preset dialog with the stored settings
	//Unset all input elements
	$("#MAVTypes").children("input").prop("checked",false).removeAttr("checked");

	//Set only input element with value attribute set to 'mode'
	$("#MAVTypes > [value='" + type + "']").attr('checked',true).prop('checked',true);
	
	//Refresh the UI with the newly selected elements (sheesh - this is a bit crap of JQuery)
	//http://stackoverflow.com/questions/5145728/jquery-manually-set-buttonset-radios
	$("#MAVTypes").children("input").button("refresh") ;

	return this ;
} ;

/**
 * Method for taking the activity specified in the dialog and storing in MAVsettings instance
 */
MAVsettings.prototype.saveActivityType = function()
{
	//Get the settings from the dialog
	//http://stackoverflow.com/questions/8908943/get-the-currently-selected-radio-button-in-a-jquery-ui-buttonset-without-binding
	var activityType = $("#MAVTypes :radio:checked").attr('value') ;

	if(activityType == null)
		throw "No Activity Type selected" ;

	//Store them back into instance
	this.JSON.activityType = activityType ;

	return this ;
} ;

/**
 * Method for loading the display mode from GM and updating the dialog
 */
MAVsettings.prototype.loadDisplayMode = function()
{
	//Make sure JSON has been loaded from GM
	this.loadJSON() ;
	
	//Get the relevant info from the json for the display mode
	var mode = this.JSON.displayMode ;
	
	//Preset dialog with the stored settings
	//Unset all input elements
	$("#MAVdisplayModes").children("input").prop("checked",false).removeAttr("checked");

	//Set only input element with value attribute set to 'mode'
	$("#MAVdisplayModes > [value='" + mode + "']").attr('checked',true).prop('checked',true);
	
	//show the correct legend
	if ( mode == "T" ) {
		$("#MAVdisplaySizeLegend").show();
	}
	else if ( mode == "C" ) {
		$("#MAVdisplayColourLegend").show();
	}
	
	//Refresh the UI with the newly selected elements (sheesh - this is a bit crap of JQuery)
	//http://stackoverflow.com/questions/5145728/jquery-manually-set-buttonset-radios
	$("#MAVdisplayModes").children("input").button("refresh") ;

	return this ;
} ;

/**
 * Method for taking the display mode specified in dialog and storing in MAVsettings instance
 */
MAVsettings.prototype.saveDisplayMode = function()
{
	//Get the settings from the dialog
	//http://stackoverflow.com/questions/8908943/get-the-currently-selected-radio-button-in-a-jquery-ui-buttonset-without-binding
	var displayMode = $("#MAVdisplayModes :radio:checked").attr('value') ;

	if(displayMode == null)
		throw "No Display Mode selected" ;

	//Store them back into instance
	this.JSON.displayMode = displayMode ;

	return this ;
} ;

/**
 * Method for taking the selected groups from dialog and storing in MAVsettings instance
 */
MAVsettings.prototype.saveGroups = function()
{
	//Get the settings from the dialog
	//http://stackoverflow.com/questions/8908943/get-the-currently-selected-radio-button-in-a-jquery-ui-buttonset-without-binding
	var selectedGroups = [] ;
	$("#MAVGroupData :checkbox:checked").each
	(
		function (i)
		{
			selectedGroups.push($(this).attr('value')) ;
		}
	) ;
	if(debug) console.log('selected groupids='+selectedGroups) ;

	if(selectedGroups.length == 0)
		throw "No Student Groups Selected" ;

	//Store them back into instance
	this.JSON.groups = selectedGroups ;

	return this ;
} ;

/**
 * Method for loading the selected groups from GM and updating the dialog
 */
MAVsettings.prototype.loadGroups = function()
{
	//Make sure JSON has been loaded from GM
	this.loadJSON() ;
	
	//Get the relevant info from the json for the display mode
	var groups = this.JSON.groups ;
	
	//If groups is not yet initialised, then make it set to "All Groups"
	if(groups == null)
		groups = [ 0 ] ;

	//Preset dialog with the stored settings
	
	//Unset all input elements
	$("#MAVGroupData").children("input").prop("checked",false).removeAttr("checked");

	//Foreach group id previously selected, if it still exists set it again in dialog
	for(var i = 0 ; i < groups.length; i++)
	{
		//Set only input element with value matching group id
		$("#MAVGroupData > [value='" + groups[i] + "']").attr('checked',true).prop('checked',true);
	}

	return this ;
} ;


/**
 * Method to load JSON from Greasemonkey into object instance
 * 
 * @param   {Type} MAVsettings Description
 * 
 * @returns {MAVsettings} This object for chaining
 */
MAVsettings.prototype.loadJSON = function()
{
	if (this.JSON == null)
	{
		var GM_json = GM_getValue("course_"+this.courseid) ;
		if(GM_json == null || GM_json == '') //If no settings for this course
		{
			this.JSON = this.defaultJSON ; // Use default
		}
		else
		{
			this.JSON = $.parseJSON(GM_json) ; //Otherwise set out instance
		}
	}

	return this ;
} ;

/**
 * Method for updating the dialog with all the settings for this course stored in GM
 */
MAVsettings.prototype.updateDialog = function()
{
	//Load dialog settings for activity type
	this.loadActivityType() ;
	
	//Load dialog settings for display mode
	this.loadDisplayMode() ;
	
	//Get list of groups for course & insert into dialog
	this.getCourseGroups() ;
} ;

/**
 * Method to save JSON to Greasemonkey from object instance
 * 
 * @returns {MAVsettings} This object for chaining
 */
MAVsettings.prototype.saveJSON = function()
{
	//get activity type settings 
	this.saveActivityType() ;

	//get display mode settings
	this.saveDisplayMode() ;
	
	//get selected groups settings
	this.saveGroups() ;
	
	//set the mav version
	this.JSON.mavVersion = mavVersion ;
	
	//Store in GM
	GM_setValue("course_"+this.courseid,JSON.stringify(this.JSON)) ;
	
	return this ;
} ;

/**
 * This method will return the settings data structure to be converted to JSON
 */
MAVsettings.prototype.getJSON = function()
{
	if(this.JSON == null)
	  this.loadJSON() ;

	return this.JSON ;
}

/**
 * Method for using ajax to retrieve all groups for this course and then it call
 * loadGroups method to update the dialog with the selected groups
 */
MAVsettings.prototype.getCourseGroups = function()
{
	var data = JSON.stringify({ "courselink": getCoursePageLink().href }) ;

	var settings = this ;
	
  var xhr = $.ajax
  (
    {
      url: mavServerHome+'/getCourseGroups.php',
      xhr: function(){return new GM_XHR();}, //Use GM_xmlhttpRequest
      type: 'GET',
      data: { "json": data },
      dataType: 'json', 
      success: function(data)
      {
				if(debug) console.log(data) ;
				$("#MAVGroupData").html(data.html) ;
				settings.loadGroups() ;
      },
      error: function(xhr,status,message)
      {
        console.log('status='+status) ;
        console.log('message='+message) ;
      },
			complete: function(xhr,status)
			{
				console.log('status='+status) ;
				//TODO: Hide the progress spinning wheel
			}
    }
  ) ;
	
} ;


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Update page contents
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Generate json for ajax request to server for data
 * 
 */
function generateJSONRequest()
{
	var courseLink = getCoursePageLink() ;
	//If no course link found in breadcrumbs, then not on a course page
	if (courseLink == null)
		exit ;
	
	if(debug) console.log('course link='+courseLink.href) ;
	
	//Parse the page for moodle links, assemble and generate a JSONP request to get
	//the stats
	
	links = getMoodleLinks() ;
	
	requestData(courseLink,links) ;
}

/**
 * Make AJAX request to server to get data to render on page
 * 
 * @param   {String} courseLink The url for the course home page
 * @param   {Object} links    Object with properties holding the links
 * 
 */
function requestData(courseLink,links)
{
	//Input for the getActivity.php script to work with
	var settings = MAVcourseSettings.getJSON() ;
	var data = JSON.stringify
	(
		{
			'mavVersion': mavVersion,
			'settings': settings,
			'courselink': courseLink.href,
			'links': links
		}
	) ;
	
	if(debug) console.log(data) ;
	
	//var request = $.post
	//(
	//	mavServerHome+'/getActivity.php',
	//	{ "json": escape(data) },
	//	function(data)
	//	{
	//		console.log("Data loaded: "+data) ;
	//	},
	//	"json"
	//) ;

  var xhr = $.ajax
  (
    {
      url: mavServerHome+'/getActivity.php',
      xhr: function(){return new GM_XHR();}, //Use GM_xmlhttpRequest
      type: 'POST',
      data: { "json": data },
      dataType: 'json', 
      success: function(data)
      {
				updatePage(data) ;
      },
      error: function(xhr,status,message)
      {
        console.log('status='+status) ;
        console.log('message='+message) ;
      },
			complete: function(xhr,status)
			{
				console.log('status='+status) ;
				//TODO: Hide the progress spinning wheel
			}
    }
  ) ;
	
	//TODO: Display a second dialog that has spinning wheel and a cancel button
	//If cancel button is pressed, then call xhr.abort() to abort the ajax request
	//http://stackoverflow.com/questions/446594/abort-ajax-requests-using-jquery
	

}

function getMoodleLinks()
{
	var allLinks = document.getElementsByTagName("a") ;
	
	//alert("number of all links="+allLinks.length) ;
	
	
	//Need to match only href links that start with host
	//TODO: Need to use the window.location property to determine the hostname, rather than hardcoded
	modre = /^(?:https?:\/\/)?moodle\.cqu\.edu\.au\/mod\/([^\/]+)\/([^\/]+)$/ ;
	
	var links = {} ;
	
	for (var i=0; i < allLinks.length; i++)
	{
		var info = allLinks[i].href.match(modre) ;
		if (info != null)
		{
			var linkName = info.shift().replace(/^(?:https?:\/\/)?moodle\.cqu\.edu\.au\//,'\/') ;
			links[linkName] = info ;
		}
	}
	
	return links ;
}

function updatePage(data)
{
	//do stuff with JSON
	if(debug) console.log(data) ;
	
	var activityType = data.settings.activityType ;
	var displayMode = data.settings.displayMode ;
	
	//How to quantify the number in the page 
	var activityText;
	
	switch (activityType)
	{
		case 'C':
			activityText = ' clicks' ;
			break ;
		case 'S':
			activityText = ' students' ;
			break ;
	}
	
	allLinks = document.getElementsByTagName("a") ;
	
	for (var i=0; i < allLinks.length; i++)
	{
		var linkName = allLinks[i].href.replace(/^(?:https?:\/\/)?moodle\.cqu\.edu\.au\//,'\/') ;
		if (data['data'].hasOwnProperty(linkName))
		{
			//Add the count to the link text (using clicks or students)
			var counter = ' (' + data['data'][linkName] + activityText + ')' ;
			allLinks[i].innerHTML += counter ;
			//Add the count to the title text (using clicks or students)
			var counter = ' (' + data['data'][linkName] + activityText + ')' ;
			allLinks[i].title += counter ;
			//Highlighting links that have changed not working below
			//allLinks[i].style.textDecoration = 'none' ;
			allLinks[i].style.borderBottom = '1px double' ; //Double underline
			////////////////////////////////////////////////////////////////////
			
			if (displayMode == "T") {
				
				var fontSize = 0 ;
				
				//If activity Type is clicks, set font size based on proportion of students
				if(activityType == 'C')
				{
					fontSize = Math.round((data['data'][linkName] / data.studentCount * 10) + 12) ;
					if (fontSize > 40)
						fontSize = 40 ;
				}
				//Otherwise, if activity type is students, make a proportion of total students
				//with maximum font size of 40
				else if(activityType == 'S')
				{
					fontSize = Math.round(data['data'][linkName]*28/data.studentCount) + 12 ;
				}
	
				if (fontSize > 0)
				{
					allLinks[i].style.fontSize = fontSize+"px";
				}
			}
			
			else if (displayMode == "C") {
					
				var percentile;
				
				if (activityType == "C") {
					percentile = data['data'][linkName] / data.studentCount;
					percentile = Math.round(percentile);
					if (percentile>10) percentile=10;
					$(allLinks[i]).addClass("mavColour"+percentile);
				}
				else if (activityType == "S") {
					percentile = data['data'][linkName] / data.studentCount * 10;
					percentile = Math.round(percentile);
					$(allLinks[i]).addClass("mavColour"+percentile);
				}
				
				
			}
			
			
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
//Utility Functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Function to parse given url and extract as an object the query parameters
 * 
 * @param   {String} function The url to parse
 * 
 * @returns {Object} An object with properties names as params and matching values
 */
function parseQueryString(url)
{
	var nvpair = {};
	var qs = url.search.replace('?', '');
	var pairs = qs.split('&');
	for(var i = 0; i < pairs.length; i++)
	{
		var pair = pairs[i].split('=') ;
		nvpair[pair[0]] = pair[1];
	}
	return nvpair;
}

/**
 * Function to get the moodle DB courseid from the course page url
 * 
 * @param   {String} coursePageLink Course Home Page Link
 * 
 * @returns {Integer} The courseid or null
 */
function getCourseId(coursePageLink)
{
	var link = getCoursePageLink() ;
	if(debug) console.log('course homepage link='+link) ;
	if(link == null)
		return null ;
	var params = parseQueryString(link) ;

	if(debug) console.log('courseid='+params.id) ;

	return params.id ;
}

/**
 * Determine the course home page from the breadcrumbs
 * 
 * @returns {string} URL to the course home page for this page's course
 */
function getCoursePageLink()
{
	//xpath to the a element for the COURSE home page link in breadcrumbs
	//https://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript#First_Node
	//Not portable - Gecko only
	var courseLink = document.evaluate('/html/body/div[2]/div[2]/div/div/ul/li[3]/a',document,null,XPathResult.FIRST_ORDERED_NODE_TYPE, null) ;
	courseLink = courseLink.singleNodeValue ;
	
	var courseLinkRE = /^(?:https?:\/\/)?moodle\.cqu\.edu\.au\/course\/view\.php\?id=\d+$/ ;
	if (!courseLinkRE.test(courseLink.href))
	{
		courseLink = document.evaluate('/html/body/div[2]/div[2]/div/div/ul/li[4]/a',document,null,XPathResult.FIRST_ORDERED_NODE_TYPE, null) ;
		courseLink = courseLink.singleNodeValue ;
	}
	if(debug)
		console.log('coursepagelink='+courseLink) ;
		
	return courseLink ;
}

