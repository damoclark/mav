<?php

include_once('ignition.php') ;

//Use ignition but don't authenticate
$ignition = new ignition(false) ;

//Get our database connection helper
include_once('PDOdatabase.php') ;
//Get our utilities
include_once("balmi_utils.php") ;
//Get OLT_SMarty
include_once("OLT_Smarty.php") ;

$pdoDB = new PDOdatabase('DBCONF') ;
$dbh = $pdoDB->connectPDO('MOODLE2') ;

$input = json_decode($_REQUEST['json'],true) ;

//Log request
$input['username'] = $_SERVER['REMOTE_USER'] ;
$now = new DateTime() ;
$input['timestamp'] = $now->format('U') ;
file_put_contents
(
	getenv('PROJECTDIR').'/log/getActivity.txt',
	json_encode
	(
		$input,
		JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT
	)."\n", //Append a newline
	FILE_APPEND|LOCK_EX
) ;

$output = array() ;

//Get the course id from courselink property of json data
$courseid = getCourseIdFromCourseHomePageLink($input['courselink']) ;

if($courseid == null)
{
	error_log("No course code found for page ".$input['courselink']) ;
	exit(1) ;
}

if(getenv('DEBUG'))
{
	error_log("getActivity: courseid=$courseid") ;
	error_log("getActivity: settings\n".$input['settings']) ;
}

////////////////////////////////////////////////////////////////////////////////
// Get Maximum number of clicks for any link on course site
////////////////////////////////////////////////////////////////////////////////
//DISABLED BECAUSE NO LONGER USED FOR PAGE RENDERING
//$select =
//"
//	select l.module,l.url,count(l.id) as counter from m_log l, m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
//	where
//	con.contextlevel = 50
//	and con.id = ra.contextid
//	and r.id = ra.roleid
//	and ra.userid = u.id
//	and r.archetype = 'student'
//	and con.instanceid = c.id
//	and l.userid = u.id
//	and l.course = c.id
//	--The above limits any results from m_log to students only
//	and course = :course
//  and module <> 'course' --Dont include clicks to course homepage
//	group by l.module,l.url
//  order by count(l.id) desc
//  limit 1
//" ;
//
//$stmt = $dbh->prepare($select) ;
//$stmt->execute(array(':course'=>$courseid)) ;
//
//$row = $stmt->fetch(PDO::FETCH_ASSOC) ;
//if($row != null)
//	$maxCount = $row['counter'] ;


////////////////////////////////////////////////////////////////////////////////
// Get number of students enrolled in course
////////////////////////////////////////////////////////////////////////////////
$select =
"
	select count(u.id) as counter from m_role r,m_role_assignments ra,m_context con,m_user u, m_course c
	where
	con.contextlevel = 50
	and con.id = ra.contextid
	and r.id = ra.roleid
	and ra.userid = u.id
	and r.archetype = 'student'
	and con.instanceid = c.id
  and c.id = :course
" ;

$stmt = $dbh->prepare($select) ;
$stmt->execute(array(':course'=>$courseid)) ;

$row = $stmt->fetch(PDO::FETCH_ASSOC) ;
if($row != null)
	$studentCount = $row['counter'] ;

//Get the number of clicks for given link in course
$query = new OLT_Smarty() ;
$query->assign('activityType',$input['settings']['activityType']) ;
if($input['settings']['groups'][0] != 0) //If there are groups specified add to query
	$query->assign('selectedGroups',$input['settings']['groups']) ;
$select = $query->fetch('getActivityQuery.tpl') ;

if(getenv('DEBUG'))
	error_log("getActivity.php query=\n$select") ;

//Run query
$stmt = $dbh->prepare($select) ;

foreach($input['links'] as $link => $data)
{
	$module = $data[0] ;
	$url = $data[1] ;
	$stmt->execute(array(':module'=>$module,':url'=>$url,':course'=>$courseid)) ;
	
	$rowCount = $stmt->rowCount() ;
	if(getenv('DEBUG'))
		error_log("module=$module, url=$url, course=$courseid, count=$rowCount") ;

	$output[$link] = $rowCount ;
}

$output = array('data' => $output) ;
//$output['maxCount'] = $maxCount ;
$output['studentCount'] = $studentCount ;
$output['settings'] = $input['settings'] ;

header('Content-Type: application/json');

echo json_encode($output) ;

if(getenv('DEBUG'))
	error_log('output='.json_encode($output)) ;

?>