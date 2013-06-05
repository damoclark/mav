<?php

include_once('ignition.php') ;

//Use ignition but don't authenticate
$ignition = new ignition(false) ;

//Get our database connection helper
include_once('PDOdatabase.php') ;
include_once('mav_utils.php') ;
include_once("OLT_Smarty.php") ;

$pdoDB = new PDOdatabase() ;
$dbh = $pdoDB->connectPDO('MOODLE2','/usr/local/www/moodleActivity/etc/database.ini') ;

$input = json_decode($_REQUEST['json'],true) ;

$output = array() ;

error_log('courselink='.$input['courselink']) ;

//Get the course id from courselink property of json data
$courseid = getCourseIdFromCourseHomePageLink($input['courselink']) ;

if($courseid == null)
{
	error_log("No course code found") ;
	exit(1) ;
}

error_log("courseid=$courseid") ;

////////////////////////////////////////////////////////////////////////////////
// Get number of students enrolled in course
////////////////////////////////////////////////////////////////////////////////
$select =
"
	select id,name from m_groups
	where courseid = :course
" ;

$stmt = $dbh->prepare($select) ;
$stmt->execute(array(':course'=>$courseid)) ;

//Return as
//array
//(
//	id => groupname,
//	id2 => groupname2,
//	...
//)
$groups = array() ;

while($row = $stmt->fetch(PDO::FETCH_NUM))
{
	$groups[$row[0]] = $row[1] ;
}

//Sort them sensibly like a human would (natural sort)
natsort($groups) ;

$output['data'] = $groups ;

$smarty = new OLT_Smarty() ;

$smarty->assign('groups',$groups) ;

$output['html'] = $smarty->fetch('getCourseGroups.tpl') ;

header('Content-Type: application/json');
echo json_encode($output) ;

error_log('output='.json_encode($output)) ;

?>
