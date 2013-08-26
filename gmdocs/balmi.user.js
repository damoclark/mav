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
	 * Add jquery-ui css to GM sandbox using GM_addStyle and rewrite any url(paths)
	 * to be absolute according to the balmi_config parameter's getServerHtml URI
	 *
	 * eg.
	 *
	 * change:
	 * url(images/ui-bg_glass_75_ccdc6a_1x400.png)
	 * to:
	 * url(https://host.cqu.edu.au/html/images/ui-bg_glass_75_ccdc6a_1x400.png)
	 * 
	 * @param   {balmi_config} function  balmi_config object for balmi script
	 * @param   {string} jQueryCSS CSS for jquery-ui (eg. contents of jquery-ui-1.10.2.custom.css)
	 */
	this.addCSS = function(css)
	{
		//Make jQuery images load from mav server
		css = css.replace(/url\((images\/ui-[^\.]+.png)\)/gm,"url(" + config.getServerHtml() + "/$1)") ;
		GM_addStyle(css) ;	
	}

	/**
	 * Method for inserting menu into page
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

