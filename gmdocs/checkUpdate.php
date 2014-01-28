<?php

//We are sending json back from this script
header('Content-Type: application/json');

//Get the version of the script
$inputData = array_key_exists('version',$_REQUEST) ? $_REQUEST['version'] : null ;

//Create json structure and send back update url, and latest version info
$outputData = array
(
	'response' => 1, //1 means ok, 0 means disabled or error
	'message'  => null, //Return an optional message (such as an error or advice)
	'version'  => '0', //The latest version from the metadata of local script file
	'url'      => calculateCurrentScriptBaseUrl() . '/moodleActivityViewer.user.js',
	//Tell client whether needs to update or not (if no version provided by
	//client, then return null as we can't tell)
	'update'   => null 
) ;

//Open moodleActivityViewer.user.js file and read in version number
$gmScript = fopen('moodleActivityViewer.user.js','r') ;

//If there is an error opening the file, then report back to browser there
//was an error.  It can try again later
if(!$gmScript)
{
	$outputData['response'] = 0 ;
	echo json_encode($outputData) ;
	error_log('Error opening moodleActivityViewer.user.js - error code returned to browser') ;
	exit(0) ;
}

//Parse the script file's metadata header
$scriptMeta = parseGMScriptMetadata($gmScript) ;


//Return data to the browser
$outputData['version'] = $scriptMeta['version'] ;

//If client provided version input, return true if client version is less
//than latest version
if(!is_null($inputData))
	$outputData['update'] = version_compare($inputData,$outputData['version'],'<') ;

error_log('checkUpdate response='.json_encode($outputData),E_USER_NOTICE) ;

echo json_encode($outputData) ;

////////////////////////////////////////////////////////////////////////////////
//End of Script
////////////////////////////////////////////////////////////////////////////////

function parseGMScriptMetadata($file)
{
	//Greasemonkey Metadata syntax http://wiki.greasespot.net/Metadata_Block
	
	//Collect data from script metadata
	$metadata = array
	(
		'version' => null
	) ;
	
	//Finite state flag
	// 0 = looking for start of userscript header
	// 1 = looking for meta tags (ie. @version)
	$state = 0 ;
	
	//Sample GM header that this function parses
// ==UserScript==
// @name          Moodle Activity Viewer
// @namespace	    http://damosworld.wordpress.com
// @description	  Re-render Moodle pages to show student usage
// @version       0.5.5
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
// @require       GM_mav_config.js
// @resource      jQueryCSS /htmllib/themelib/jquery-ui-1.10.2.custom.min.css
// @resource      settingsDialogDiv settingsDialogDiv.html
// @resource      busyAnimationDiv busyAnimation.html
// @resource      mavCSS MAVStyles.css
// @include       http://moodle.cqu.edu.au/*
// ==/UserScript==
	
	while($line = fgets($file))
	{
		switch ($state)
		{
			case 0: //Still looking for the start of the metadata block
				if(strpos($line,'// ==UserScript==') !== 0)
					continue ;
				else
					$state = 1 ;
				break ;
			case 1: //Now looking for the meta data tags and their data
				$data = array() ;
				if(preg_match('/^\/\/ @([^\s]+)\s+(.*)$/',$line,$data))
				{
					if($data[1] == 'version')
					{
						$metadata['version'] = $data[2] ;
					}
				}
				elseif(strpos($line,'// ==/UserScript==') === 0)
					break 2 ; //Exit the while loop - we're done!
				break ;
		}
	}
	
	fclose($file) ;
	
	if($metadata['version'] == null)
		return null ;
	
	return $metadata ;
}


function calculateCurrentScriptBaseUrl()
{
	$url = ($_SERVER['HTTPS']) ? 'https://' : 'http://' ;
	$url .= $_SERVER['SERVER_NAME']  . preg_replace('/\/[^\/]+$/','',$_SERVER['SCRIPT_NAME']) ;
	return $url ;
}


?>

