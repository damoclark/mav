// ==UserScript==
// @name          Browser Addon Library for Moodle Interface
// @namespace	    http://damosworld.wordpress.com
// @description	  A library of classes for GM scripts to re-render Moodle pages 
// @version       0.0.1
// @copyright     GPL version 3; http://www.gnu.org/copyleft/gpl.html
// #exclude       *
// ==/UserScript==




/**
 * Balmi - Browser Addon Library for Moodle Interface - Greasemonkey class for manipulating Moodle pages
 * 
 * @param   {balmi_config} Configuration object for balmi server
 * 
 */
function balmi(balmi_config)
{
	//////////////////////////////////////////////////////////////////////////////
	// Instance variables
	//////////////////////////////////////////////////////////////////////////////

	/**
	 * @type balmi_config Configuration object for balmi server
	 */
	var config = balmi_config ;
	
	/**
	 * @type string URL for home page of current course site
	 */
	var coursePageLink = null ;
	
	/**
	 * @type string Version of balmi javascript library
	 */
	var balmiVersion = '0.0.1' ;
	
	/**
	 * @type string CSS for styling menu links in blue so look like real links
	 */
	var menuCSS = 'a.makealink:visited { color: #818600 !important; } a.makealink:hover {	color: #c6006f !important; }' ;

	//////////////////////////////////////////////////////////////////////////////
	//Constructor initialisation
	//////////////////////////////////////////////////////////////////////////////
	
	//Add css to page for styling menu links in blue
	GM_addStyle(menuCSS) ;
	
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//Methods
	//////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Returns the version of this balmi library file
	 * 
	 * @param   {Type} this Description
	 * 
	 * @returns {string} Version string of this library
	 */
	this.getVersion = function()
	{
		return balmiVersion ;
	}
	
	/**
	 * Returns the moodle DB courseid from the course page url
	 * 
	 * @param   {String} coursePageLink Course Home Page Link
	 * 
	 * @returns {Integer} The courseid or null
	 */
	this.getCourseId = function()
	{
		var link = this.getCoursePageLink() ;
		if(config.getDebug()) console.log('course homepage link='+link) ;
		if(link == null)
			return null ;
		var params = this.parseQueryString(link) ;
	
		if(config.getDebug()) console.log('courseid='+params.id) ;
	
		return params.id ;
	}

	/**
	 * Method to parse given url and extract as an object the query parameters
	 * 
	 * @param   {String} function The url to parse
	 * 
	 * @returns {Object} An object with properties names as params and matching values
	 */
	this.parseQueryString = function(url)
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
	 * Determine the course home page from the breadcrumbs
	 * 
	 * @returns {Element} Element object representing the URL to the course home page for this page's course
	 */
	this.getCoursePageLink = function()
	{
		if (coursePageLink != null)
			return coursePageLink ;

		//Find the breadcrumbs div
		var breadcrumbs = document.getElementsByClassName('breadcrumb')[0] ;
		console.log('breadcrumbs='+breadcrumbs) ;
		//and then find all the child a tags
		var courseLink = breadcrumbs.getElementsByTagName('a') ;
		console.log('courselink='+courseLink) ;
		//and finally iterate over the a tags, and match the one that matches a course home page
		//and finally get the last one (that will be)
		for (var i=0; i < courseLink.length; i++)
		{
			console.log('breadcrumb link href='+courseLink.item(i).href) ;
			if(courseLink.item(i).href.match(/\/course\/view\.php\?id=\d+$/))
			{
				console.log('breadcrumb link href='+courseLink.item(i).href+' matched') ;
				courseLink = courseLink.item(i) ;
				break ;
			}
		}
		//courseLink = courseLink.item(courseLink.length-1) ;
		if (courseLink instanceof HTMLCollection)
		{
			console.log('Not on course page') ;
			return null ;
		}

		console.log('courselink='+courseLink) ;
		coursePageLink = courseLink ;
		
		return courseLink ;
	}

	/**
	 * Get the shortname for the current Moodle course site
	 * 
	 * @returns {string} The shortname as a string
	 */
	this.getCourseCode = function()
	{
		var courseLink = this.getCoursePageLink() ;
		var courseCode = courseLink.innerHTML ;
		console.log('coursecode='+courseCode) ;
		return courseCode ;
	}
	
	/**
	 * Traverse current moodle page and retrieve all links back to Moodle in format
	 * compatible with balmi server API getActivity.php
	 *
	 * data structure returned looks like an object of the form for each link
	 * {
	 *   "/mod/forum/view.php?id=12345": ["forum","view.php?id=12345"]
	 *   "/mod/page/view.php?id=12345": ["page","view.php?id=12345"]
	 * }
	 * 
	 * @returns {object} List of Moodle links in format compatible with getActivity.php
	 */
	this.getMoodleLinks = function()
	{
		var allLinks = document.getElementsByTagName("a") ;
		
		//alert("number of all links="+allLinks.length) ;
		
		
		//Need to match only href links that start with host
		//TODO: Need to use the window.location property to determine the hostname, rather than hardcoded
		//RE for matching module-based links in moodle pages
		modre = /^(?:https?:\/\/)?moodle\.cqu\.edu\.au\/mod\/([^\/]+)\/([^\/]+)$/ ;
		//RE for matching the course home page link
		coursere = /^(?:https?:\/\/)?moodle\.cqu\.edu\.au\/(course)\/(view\.php\?.*)$/ ;
		
		var courseHomeLink = this.getCoursePageLink() ;
		
		var links = {} ;
		
		for (var i=0; i < allLinks.length; i++)
		{
			var info = allLinks[i].href.match(modre) ;
			
			//If this link doesn't match a module test if it matches course home page
			if (info == null && allLinks[i].href == courseHomeLink.href)
			{
				//If so, then we want to add it to the link of links to query
				info = allLinks[i].href.match(coursere) ;
			}
			
			if (info != null)
			{
				var linkName = info.shift().replace(/^(?:https?:\/\/)?moodle\.cqu\.edu\.au\//,'\/') ;
				links[linkName] = info ;
			}
		}
		
		return links ;
	}

	/**
	 * This method will scrape the moodle page and return the m_user id number for
	 * the currently logged in user
	 *
	 * @returns {integer} m_user id number for currently logged in user
	 */
	this.getLoggedInUserIdNumber = function()
	{
		var a = document.getElementsByClassName('logininfo')[0].children[0] ;
		var id = a.href.match(/id=(.*)$/)[0] ;
		
		return id ;
	}
	
	/**
	 * This method will scrape the moodle page and return the full name for
	 * the currently logged in user
	 *
	 * @returns {string} full name for currently logged in user
	 */
	this.getLoggedInUserFullname = function()
	{
		var a = document.getElementsByClassName('logininfo')[0].children[0] ;
		var fullname = a.innerHTML ;

		return fullname ;
	}
	
	/**
	 * This method will add html to an existing block in the Moodle page
	 *
	 * Example blocks and their class names
	 *
	 * SUPPORT - block_cqu_course_support
	 * HELP - block_cqu_help
	 * COMMUNICATION - block_cqu_communications
	 * INFORMATION - block_cqu_course_info
	 * QUICKMAIL - block_quickmail
	 * EVALUATION - block_evaluation
	 * ASSESSMENT - block_cqu_assessment
	 * LATEST NEWS - block_news_items
	 * 
	 * @param   {string} function The unique html class name associated with the block
	 * @param   {element} html     DOM element object to be appended to contents of block
	 *
	 * @returns {boolean} True if the html was added to the block otherwise false
	 */
	this.addToBlock = function(blockclassname,html)
	{
		try
		{
			var tmp = document.createElement("p");
			tmp.appendChild(html) ;
			supportDiv = document.getElementsByClassName(blockclassname)[0].getElementsByClassName('content')[0] ;
			supportDiv.appendChild(tmp) ;
		}
		catch(error)
		{
			return false ;
		}
		return true ;
	}

	/**
	 * Method for inserting menu into page
	 *
	 * For example:
	 * <code>
 	 *	var menuConfig = {
	 *		settings_menu:
	 *		[
	 *			{
	 *				text: 'Activity Viewer',
	 *				listeners: { click: null, mouseover: null },
	 *				submenu:
	 *				[
	 *					{
	 *						id: 'mav_activityViewerElement', //id property for the url a tag
	 *						text: //Toggle option
	 *						{
	 *							on:  'Turn Activity View Off',
	 *							off: 'Turn Activity View On'
	 *						},
	 *						toggle: isMavOn(), //Internal state of toggle - 'on' text will be displayed
	 *						//url: '#',
	 *						image: 'http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&image=i%2Fnavigationitem&rev=391', //Default moodle node image
	 *						title: 'Toggle Activity Viewer',
	 *						listeners: { click: mavSwitchActivityViewer }
	 *					},
	 *					{
	 *						text: 'Activity Viewer Settings',
	 *						title: 'Activity Viewer Settings',
	 *						image: 'http://moodle.cqu.edu.au/theme/image.php?theme=cqu2013&image=i%2Fnavigationitem&rev=391', //Default moodle node image
	 *						listeners: { click: mavDisplaySettings }
	 *					}
	 *				]
	 *			}
	 *		]
	 *	} ;
	 *	
	 *	balmi.insertMenu(menuConfig) ;
	 * </code>
	 * 
	 * @param   {object} menu Menu structure
	 * 
	 */
	this.insertMenu = function(menu)
	{
		if (menu == null)
			throw "No menu object provided" ;
	
		for(var menuitem in menu)
		{
			if(config.getDebug())
			{
				console.log('Working on menuitem '+menuitem) ;
				console.log(menu[menuitem]) ;
			}
			var items = parseMenu(menu[menuitem]) ;
			
			if (menuitem == 'settings_menu')
			{
				//Add to the course administration block
				//Get the settingsnav div,
				//then the first ul element,
				//then the first li element,
				//then the first ul element.
				//Then append the menu HTML to what is already there
				var menuList = document.getElementById('settingsnav').getElementsByTagName('ul')[0].getElementsByTagName('li')[0].getElementsByTagName('ul')[0] ;
	
				for (var i=0; i < items.length; i++)
				{
					var tmp = document.createElement("div");
					tmp.appendChild(items[i]);
					if(config.getDebug())
						console.log(tmp.innerHTML)
					menuList.appendChild(items[i]) ;
					if(config.getDebug())
						console.log('added '+items[i]+' to page') ;
				}
				mavSetMenuElementText() ;
			}
		}
	}

	/**
	 * Parse menu object and generate HTML to be inserted into Moodle Page
	 * 
	 * @param   {object} moodleMenu Menu structure
	 * 
	 * @returns {Array} Array of DOM HTML Elements (li) to be inserted into Moodle Menu
	 */
	function parseMenu(menuitem)
	{
		var elements = [] ;
		if(config.getDebug())
			console.log('Inside parseMenu looking at '+menuitem.text) ;
		
		//Iterate over all menu items (eg. settings and/or navigation)
		for (var i=0; i < menuitem.length; i++)
		{
			if(config.getDebug())
				console.log('working on '+menuitem[i]) ;
			//Create the outer layer list item
			var li = document.createElement('li') ;
			if (menuitem[i].hasOwnProperty('submenu')) //Then this is a menu entry only
			{
				if(config.getDebug())
					console.log('has submenu') ;
				li.setAttribute('class','type_unknown contains_branch collapsed') ;
				var p = document.createElement('p') ;
				p.setAttribute('class','tree_item branch') ;
				var span = document.createElement("span") ;
				span.setAttribute('tabindex','0') ;
				
				//Set the menu name
				span.innerHTML = menuitem[i].text ;
				//If the menu item has a title, assign it
				if (menuitem[i].hasOwnProperty('title')) 
					span.setAttribute('title',menuitem[i].title) ;
				p.appendChild(span) ;
				li.appendChild(p) ;
				
				//Now, recurse through child nodes in the menu and add them to the main
				//menu li element
				var ul = document.createElement("ul") ;
	
				if(config.getDebug())
				{
					console.log('submenu count = '+menuitem[i].submenu.length) ;
					console.log(menuitem[i].submenu) ;
				}
				var children = parseMenu(menuitem[i].submenu) ;
				for (var k=0; k < children.length; k++)
				{
					ul.appendChild(children[k]) ;
				}
				
				//for (var j=0; j < menuitem[i].submenu.length; j++)
				//{
				//	console.log(menuitem[i].submenu[j]) ;
				//	var children = this.parseMenu(menuitem[i].submenu[j]) ;
				//	for (var k=0; k < children.length; k++)
				//	{
				//		ul.appendChild(children[k]) ;
				//	}
				//}
				li.appendChild(ul) ;
			}
			else //Its just a single menu heading
			{
				if(config.getDebug())
					console.log('does not have submenu') ;
				//Set li style as a clickable menu item
				li.setAttribute('class','type_setting collapsed item_with_icon') ; 
				var p = document.createElement("p") ;
				p.setAttribute('class','tree_item leaf') ;
				var a = document.createElement("a") ;
				
				//Set url for menu item
				if (menuitem[i].hasOwnProperty('url'))
					a.setAttribute('href',menuitem[i].url) ;
				else //If no href, then make the a look like a link (blue in css)
					a.setAttribute('class','makealink') ; 
				//Set title for menu item
				if (menuitem[i].hasOwnProperty('title'))
					a.setAttribute('title',menuitem[i].title) ;
				//Set id for menu item
				if (menuitem[i].hasOwnProperty('id'))
					a.setAttribute('id',menuitem[i].id) ;
				
				//Set event handlers
				for (var event in menuitem[i].listeners)
				{
					if(config.getDebug())
						console.log('adding event '+event+' with listeners') ;
					a.addEventListener(event,menuitem[i].listeners[event]) ;
				}
				
				if (menuitem[i].hasOwnProperty('image'))
				{
					var img = document.createElement('img') ;
					img.setAttribute('class','smallicon navicon') ;
					img.setAttribute('src',menuitem[i].image) ;
					a.appendChild(img) ;
				}
	
				//Add link to paragraph
				p.appendChild(a) ;
				//Add paragraph to list item
				li.appendChild(p) ;
				
				//Add link text to a tag
				var text = '' ;
				if (menuitem[i].hasOwnProperty('toggle'))
				{
					if(config.getDebug())
						console.log('This menu item is a toggle') ;
					//If toggle is true, then use the on property as text for menu item
					//otherwise, use of the off property
					text = (menuitem[i].toogle) ? menuitem[i].text.on : menuitem[i].text.off ;
				}
				else //Its just a single menu heading
				{
					text = menuitem[i].text ;
				}
				var textNode = document.createTextNode(text)
	
				a.appendChild(textNode) ;
			}
			var tmp = document.createElement("div");
			tmp.appendChild(li);
			if(config.getDebug())
				console.log(tmp.innerHTML)
	
			elements.push(li) ;
		}
		
		return elements ;
	}

	
	
}

