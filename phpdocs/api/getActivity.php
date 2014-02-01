<?php

include_once('ignition.php') ;

//Use ignition but don't authenticate
$ignition = new ignition(false) ;

//Get our database connection helper
include_once('PDOdatabase.php') ;
//Get our utilities
include_once("balmi_utils.php") ;
include_once('generateSQLQuery.php') ;

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

	
////////////////////////////////////////////////////////////////////////////////
//Get the stats from the database as per input
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//Collate data to be inserted into the php query template
////////////////////////////////////////////////////////////////////////////////
$queryData = array() ;

//Get the activityType setting
$queryData['activityType'] = $input['settings']['activityType'] ;
//If not a valid value of C or S, make it C
if($queryData['activityType'] != 'C' and $queryData['activityType'] != 'S')
	$queryData['activityType'] = 'C';

//Get the specific student to query (if specified)	
if(array_key_exists('student',$input['settings']) and $input['settings']['student'])
{
	error_log("Getting activity for specific student ".$queryData['selectedStudent'],E_USER_NOTICE) ;
	$queryData['selectedStudent'] = strtolower($input['settings']['student']) ;

	//Check value for student is either a number or a character and number string
	if
	(
		!is_numeric($queryData['selectedStudent']) and
		!preg_match('/^[sqc]\d+$/',$queryData['selectedStudent'])
	)
	{
		error_log("selectedStudent value from json data is not a student number or moodleid",E_USER_ERROR) ;
		exit(1) ;
	}
}
//Else, instead some groups might have been specified (groups == 0 means no groups)
elseif($input['settings']['groups'][0] != 0) //If there are groups specified add to query
{
	$queryData['selectedGroups'] = $input['settings']['groups'] ;

	//Check all values for selectedGroups are numbers
	foreach($queryData['selectedGroups'] as $group)
	{
		if(!is_numeric($group))
		{
			error_log("selectedGroups value from json data contains a non-numeric: $group",E_USER_ERROR) ;
			exit(1) ;
		}
	}
}

$query = generateSQLQuery('getActivityQueryTemplate.php',$queryData) ;

if(getenv('DEBUG'))
	error_log("getActivity.php query=\n$query") ;

//Run query
$stmt = $dbh->prepare($query) ;

foreach($input['links'] as $link => $data)
{
	$module = $data[0] ;
	$url = $data[1] ;
	//@todo Check return value from execute to see if query failed
	$stmt->execute(array(':module'=>$module,':url'=>$url,':course'=>$courseid)) ;
	
	$result = $stmt->fetch(PDO::FETCH_NUM) ;
	
	$result = $result[0] ;
	//If querying clicks, query uses sum function which returns null if there
	//are no rows returned to sum, so detect this and set to 0
	if($result === null)
		$result = 0 ;
	
	if(getenv('DEBUG'))
	{
		error_log("module=$module, url=$url, course=$courseid, count=".$result) ;
	}

	$output[$link] = $result ;
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