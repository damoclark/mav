// ==UserScript==
// @name          Browser Addon Library for Moodle Interface
// @namespace	    http://damosworld.wordpress.com
// @description	  A library of classes for GM scripts to re-render Moodle pages 
// @version       0.0.1
// @copyright     GPL version 3; http://www.gnu.org/copyleft/gpl.html
// #exclude       *
// ==/UserScript==



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
function balmi_addJqueryCSS(balmi_config,jQueryCSS)
{
	//Make jQuery images load from mav server
	jQueryCSS = jQueryCSS.replace(/url\((images\/ui-[^\.]+.png)\)/gm,"url(" + balmi_config.getServerHtml() + "/$1)") ;
	GM_addStyle(jQueryCSS) ;	
}
