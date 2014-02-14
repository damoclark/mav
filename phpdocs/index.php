<?php

//Load Smarty
include_once("OLT_Smarty.php") ;

//Create Smarty
$smarty = new OLT_Smarty() ;


//Determine what browser they have
$browser = get_browser(null,true) ;

//Set variables in template
$smarty->assign('browser',$browser) ;
$smarty->assign('title', "Moodle Activity Viewer (MAV) Installation and Setup");
$smarty->assign('siteTitle', "Moodle Activity Viewer");
$smarty->assign('loggedin', true);  
$smarty->assign('breadcrumbsExists', false); 
$smarty->assign('slogan', false);

//Send template to browser
$smarty->display('index.tpl') ;

?>
