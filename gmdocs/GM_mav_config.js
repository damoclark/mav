/**
 * Creates an instance of mav_config
 *
 * Greasemonkey scripts often need to request UI elements (Html) and AJAX data
 * (Api) from an alternate source to the location of the page in which the
 * script executes.  Rather than hard-code this into the scripts, the following
 * class can instead be @include statement and customised externally to the
 * script, providing a separation between code and config
 *
 * The class provides the four following pieces of information, according to
 * how you have configured it:
 *
 * getGmScriptPath - Returns the path to the moodleActivityViewer.user.js script
 * from whence it was installed
 *
 * getServerApi - Absolute URI to the path from which API related AJAX scripts
 * can be called using GM_xmlhttpRequest function. So you simply prepend this
 * URI string to the name of each of the scripts you wish to call.
 *
 * getServerHtml - Absolute URI to the path from which your GM script may
 * request UI files, such as css, images and so on that are not originated from
 * the moodle page in which the GM script executes.
 *
 * getVersion - As a convenience, is a wrapper to the GM_info.script.version
 * property so that you can retrieve the version of the currently running GM
 * script
 *
 * setLastCheckUpdate - Takes optional Date object and sets this as the last
 * check update check time in greasemonkey settings, or if not Date object
 * provided, uses the present time
 *
 * getLastCheckUpdateAsString - Returns a date/time as a string of the last time
 * MAV checked for a new version of MAV by calling checkUpdate.php.  Will be
 * undefined if no date presently set
 *
 * getLastCheckUpdate - Returns a date/time as UNIX epoch of the last time MAV
 * checked for a new version of MAV by calling checkUpdate.php.  Will be
 * undefined if no date presently set
 *
 * needsCheckUpdate - Takes an optional interval or defaults to 1day and checks
 * when this interval period has elapsed since the last check for update for
 * MAV.  Returns true if MAV needs to check for update, otherwise false
 * 
 * getDebug - A boolean option that turns debug logging into the console log
 * on if set to true otherwise off if false.  Have true on development env
 * and false in production is advised.
 * 
 * Configuration information for moodleActivityViewer.user.js script
 *
 * @constructor
 * @author Damien Clark damo.clarky@gmail.com
 * @this {mav_config}
 */
function mav_config()
{
	////////////////////////////////////////////////////////////////////////////
	//Configure server paths
	////////////////////////////////////////////////////////////////////////////
	var gmScriptPath = 'https://oltdev.cqu.edu.au/mav/gm' ;
	var mavServer = 'https://oltdev.cqu.edu.au' ;
	var mavJqueryHtml = mavServer + '/htmllib/themelib' ;
	var mavHtml = mavServer + '/mav' ;
	var version = GM_info.script.version ;
	var lastCheckUpdate = GM_getValue('lastcheckupdate') ;
	if (lastCheckUpdate === '')
		lastCheckUpdate = undefined ;
	var debug = true ;
	
	/**
	 * Get the absolute root path URI to the moodleActivityViewer.user.js script
	 * file where other GM install files are located
	 * 
	 * @returns {string} URI to the root path of the GM install files
	 */
	this.getGmScriptPath = function()
	{
		return gmScriptPath ;
	}
	
	/**
	 * Get the absolute root path URI to the mav server for all GM script related requests
	 * 
	 * @returns {string} URI to the root path of mav server (eg. https://olt.cqu.edu.au)
	 */
	this.getServer = function()
	{
		return mavServer ;
	} ;
	
	/**
	 * Get the absolute URI to the root path of mav server static HTML related files
	 * such as those related to jquery themes that might be included
	 * 
	 * @returns {string} URI to the root path of mav server static HTML related files (eg. https://olt.cqu.edu.au/htmllib/themelib)
	 */
	this.getJqueryHtml = function()
	{
		return mavJqueryHtml ;
	} ;
	
	/**
	 * Get the absolute URI to the root path of mav server static HTML related files
	 * such as busy animations and help links
	 * 
	 * @returns {string} URI to the root path of mav server static HTML related files
	 */
	this.getHtml = function()
	{
		return mavHtml ;
	} ;
	
	/**
	 * Get the absolute URI to the root path of the jQuery library and jquery-ui
	 * theme files
	 * 
	 * @returns {string} URI to the root path of the jQuery & jQuery-ui theme files
	 */
	this.getJqueryHtml = function()
	{
		return mavJqueryHtml ;
	} ;
	
	/**
	 * Get the version of MAV
	 * 
	 * @returns {string} Version number of MAV
	 */
	this.getVersion = function()
	{
		return version ;
	} ;
	
	/**
	 * Takes optional Date object and sets this as the last check update check
	 * time in greasemonkey settings, or if not Date object provided, uses the
	 * present time
	 * 
	 * @param   {Date} date Optional date object to set the last update time or null
	 */
	this.setLastCheckUpdate = function(date)
	{
		if (date === undefined)
		{
			date = new Date() ;
			if (debug) console.log('in setLastCheckUpdate, no date specified so using current date/time='+date.toISOString()) ;
		}

		if(debug) console.log('setting lastupdate GM value to '+date.toISOString()) ;
		lastCheckUpdate = date.toISOString() ;
		GM_setValue('lastcheckupdate',date.toISOString()) ;
	}
	
	/**
	 * Get the date/time MAV last checked for updated version of MAV as a string
	 * 
	 * @returns {string} Date/time in TODO format or undefined if no date set
	 */
	this.getLastCheckUpdateAsString = function()
	{
		if(debug) console.log('last check update as string='+lastCheckUpdate) ;
		return lastCheckUpdate ;
	}
	
	/**
	 * Get the date/time MAV last checked for updated version of MAV as a UNIX
	 * epoch
	 * 
	 * @returns {integer} Date/time in TODO format or undefined if no date set
	 */
	this.getLastCheckUpdate = function()
	{
		if (lastCheckUpdate === undefined)
			return undefined ;

		var lastCheckUpdateDate = new Date(lastCheckUpdate) ;
	
		//getTime returns unix epoch in milliseconds so divide by 1000
		var lastCheckUpdateEpoch = Math.floor(lastCheckUpdateDate.getTime() / 1000) ;
		
		if(debug) console.log('last check update as unix epoch='+lastCheckUpdateEpoch) ;
		
		return lastCheckUpdateEpoch ;
	}
	
 
	/**
	 * Takes an optional interval or defaults to 1day and checks when this interval
	 * period has elapsed since the last check for update for MAV.  Returns
	 * true if MAV needs to check for update, otherwise false
	 * 
	 * @param   {integer} this Number of seconds to have elapsed since last check or 1 day if not provided
	 * 
	 * @returns {boolean} True if we need to check for an update otherwise false
	 */
	this.needsCheckUpdate = function(interval)
	{
		if (interval === undefined)
		{
			interval = 86400 ; //1 day
		}
		
		var currentDate = new Date() ;
	
		var lastCheckUpdate = this.getLastCheckUpdate() ;
		
		if (lastCheckUpdate === undefined)
			return true ;

		//If last update longer than interval, return true
		return (((currentDate.getTime() / 1000) - lastCheckUpdate) > interval) ; 		
	}

	/**
	 * Is debugging turned on
	 * 
	 * @returns {boolean} True if debugging on, otherwise false
	 */
	this.getDebug = function()
	{
		return debug ;
	}
}

