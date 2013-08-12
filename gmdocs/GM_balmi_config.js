/**
 * Creates an instance of balmi_config
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
 * getDebug - A boolean option that turns debug logging into the console log
 * on if set to true otherwise off if false.  Have true on development env
 * and false in production is advised.
 * 
 * Configuration information for moodleActivityViewer.user.js script
 *
 * @constructor
 * @author Damien Clark damo.clarky@gmail.com
 * @this {balmi_config}
 */
function balmi_config()
{
	////////////////////////////////////////////////////////////////////////////
	//Configure server paths
	////////////////////////////////////////////////////////////////////////////
	this.balmiServer = '' ;
	this.balmiServerApi = this.balmiServer + '' ;
	this.balmiServerHtml = this.balmiServer + '' ;
	this.version = GM_info.script.version ;
	this.debug = true ;
	
	/**
	 * Get the absolute root path URI to the balmi server for all GM script related requests
	 * 
	 * @returns {string} URI to the root path of balmi server (eg. https://olt.cqu.edu.au)
	 */
	this.getServer = function()
	{
		return this.balmiServer ;
	} ;
	
	/**
	 * Get the absolute URI to the API scripts for balmi server 
	 * 
	 * @returns {string} URI to the root path of balmi server API scripts (eg. https://olt.cqu.edu.au/mav)
	 */
	this.getServerApi = function()
	{
		return this.balmiServerApi ;
	} ;
	
	/**
	 * Get the absolute URI to the root path of balmi server static HTML related files
	 * such as those related to jquery themes that might be included
	 * 
	 * @param   {Type} this Description
	 * 
	 * @returns {string} URI to the root path of balmi server static HTML related files (eg. https://olt.cqu.edu.au/htmllib/themelib)
	 */
	this.getServerHtml = function()
	{
		return this.balmiServerHtml ;
	} ;
	
	this.getVersion = function()
	{
		return this.version ;
	} ;
	
	this.getDebug = function()
	{
		return this.debug ;
	}
}

