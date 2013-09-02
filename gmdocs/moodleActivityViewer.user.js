// ==UserScript==
// @name          Moodle Activity Viewer
// @namespace	    http://damosworld.wordpress.com
// @description	  Re-render Moodle pages to show student usage
// @version       0.4.5
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_getResourceText
// @grant         GM_info
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// @require       /htmllib/themelib/jquery-1.9.1.js
// @require       /htmllib/themelib/jquery-ui-1.10.2.custom.min.js
// @require       GM_XHR.js
// @require       balmi.user.js
// @require       GM_balmi_config.js
// @resource      jQueryCSS /htmllib/themelib/jquery-ui-1.10.2.custom.min.css
// @resource      settingsDialogDiv settingsDialogDiv.html
// @resource      busyAnimationDiv busyAnimation.html
// @resource      mavCSS MAVStyles.css
// @include       http://moodle.cqu.edu.au/*
// ==/UserScript==



//don't run on frames or iframes
if (window.top != window.self)  
	exit ;

///////////////////////////////////////////////////////////////////////////////
//Configure server paths
///////////////////////////////////////////////////////////////////////////////
var balmi_config = new balmi_config() ;
var mavServerHome = balmi_config.getServerApi() ;
var mavServerHtml = balmi_config.getServerHtml() ;
var mavVersion = balmi_config.getVersion() ; //GM_info.script.version ;

//Get an instance of balmi object to interact with moodle page
var balmi = new balmi(balmi_config) ;

//Turn on/off debugging
var debug = balmi_config.getDebug() ;

if (debug)
{
	console.log('mavServerHome='+mavServerHome) ;
	console.log('mavServerHtml='+mavServerHtml) ;
	console.log('mavVersion='+mavVersion) ;
}

//If there is no course home page link in the breadcrumbs, then this is not
//a course site in moodle (probably home page)
if(getCoursePageLink() == null)
	exit ;


///////////////////////////////////////////////////////////////////////////////
//Add jQuery and MAV CSS to page
///////////////////////////////////////////////////////////////////////////////
var jQueryCSS = GM_getResourceText("jQueryCSS") ;
balmi.addCSS(jQueryCSS) ;

if (debug) console.log('jquery css added') ;

var mavCSS = GM_getResourceText("mavCSS") ;
GM_addStyle(mavCSS) ;


///////////////////////////////////////////////////////////////////////////////
//Adding the dialog to the page
///////////////////////////////////////////////////////////////////////////////
//Get the div for the dialog
var MAVcourseSettings = new MAVsettings(getCourseId(getCoursePageLink())) ;
var settingsDialogDiv = GM_getResourceText('settingsDialogDiv') ;
$("body").append(settingsDialogDiv);	

if (debug)
	console.log('Just before adding busy animation div') ;

///////////////////////////////////////////////////////////////////////////////
//Adding the busy animation to the page
///////////////////////////////////////////////////////////////////////////////
//Add the hidden div to the page, and set the src for the image inside the div
var busyAnimationDiv = GM_getResourceText('busyAnimationDiv') ;
$("body").append(busyAnimationDiv) ;
if (debug)
	console.log('Got after inserting busyanimationdiv') ;

$("#MAVbusyAnimationImage").attr('src',mavServerHome+'/'+$("#MAVbusyAnimationImage").attr('src')) ;
if (debug)
	console.log('Got after updating src attribute for animation image') ;

//Configure div to show and hide during ajax calls
$(document).ajaxStart
(
	function()
	{
		$("#MAVbusyAnimationImage").show();
		//alert("Busy on") ;
	}
) ;
$(document).ajaxComplete
(
	function()
	{
		$("#MAVbusyAnimationImage").hide();
	}
) ;

if (debug)
	console.log('Got after ajaxsetup') ;

///////////////////////////////////////////////////////////////////////////////
//Add Activity Viewer Links to page
///////////////////////////////////////////////////////////////////////////////
window.addEventListener ("load", function() {mavAddActivityViewerSwitch(balmi)}, false);

///////////////////////////////////////////////////////////////////////////////
//If activity viewer is turned on, then update the page
///////////////////////////////////////////////////////////////////////////////
window.addEventListener ("load", mavUpdatePage, false);


///////////////////////////////////////////////////////////////////////////////
//Bind functions for the dialog button clicks
///////////////////////////////////////////////////////////////////////////////

$("#MAVdisplayTextSize").bind("click", function() {
	$("#MAVdisplayColourLegend").hide();
	$("#MAVdisplaySizeLegend").fadeIn();
});
$("#MAVdisplayColour").bind("click", function() {
	$("#MAVdisplaySizeLegend").hide();
	$("#MAVdisplayColourLegend").fadeIn();
});


///////////////////////////////////////////////////////////////////////////////
//END OF PROGRAM
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////





//Add activityViewer javascript to page and let it do its thing
/**
 * Update the Moodle Page if is_on is set
 * 
 */
function mavUpdatePage()
{
	//If activityViewer "is_on", then load the activityViewer from server and re-render page
	if (GM_getValue('is_on') == true)
		generateJSONRequest() ;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Add Mav menu options to the Settings Block in moodle page
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function mavAddActivityViewerSwitch(balmi)
{
	//Add the link option to turn on activityViewer

	//The menu structure for MAV
	var menuConfig = {
		settings_menu:
		[
			{
				text: 'Activity Viewer',
				listeners: { click: null, mouseover: null },
				submenu:
				[
					{
						id: 'mav_activityViewerElement', //id property for the url a tag
						text: //Toggle option
						{
							on:  'Turn Activity View Off',
							off: 'Turn Activity View On'
						},
						toggle: isMavOn(), //Internal state of toggle - 'on' text will be displayed
						url: '#',
						image: 'http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&image=i%2Fnavigationitem&rev=391', //Default moodle node image
						title: 'Toggle Activity Viewer',
						listeners: { click: mavSwitchActivityViewer }
					},
					{
						text: 'Activity Viewer Settings',
						title: 'Activity Viewer Settings',
						image: 'http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&image=i%2Fnavigationitem&rev=391', //Default moodle node image
						listeners: { click: mavDisplaySettings }
					}
				]
			}
		]
	} ;
	
	balmi.insertMenu(menuConfig) ;
}

/**
 * Function returns true if MAV is switched on, otherwise false
 * 
 * @returns {boolean} True if MAV is on, otherwise false
 */
function isMavOn()
{
	var mav_on = GM_getValue('is_on') ;
	return mav_on ;
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


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Mav Settings Dialog
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Accordion init and config for the dialog
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

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
		displayMode: "C", //Default to colour
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
 *
 * @todo This needs to be refactored into the balmi class
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


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//Update page contents
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

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
				if (debug)
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

