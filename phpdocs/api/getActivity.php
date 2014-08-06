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
	
	//If the module is glossary, then check if its the link to a particular
	//glossary (eg view.php), and if so, add &tab=-1 on end as this is what
	//appears in the logs, even though its not in the links on the page
	if($module == 'glossary' and preg_match('/^view\.php\?id=\d+$/',$data[1]))
		$url = $data[1].'&tab=-1' ;
	else //Otherwise, don't change at all
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

	//Update input data structure (so can be added to activity log)
	$input['links'][$link][] = $result ;
	
	//Update output data structure
	$output[$link] = $result ;
}

//Log request to activity log
$input['username'] = $_SERVER['REMOTE_USER'] ;
$now = new DateTime() ;
$input['timestamp'] = $now->format('U') ;
//Add the action for this record in the log
$input['action'] = 'getActivity' ;
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

$output = array('data' => $output) ;
//$output['maxCount'] = $maxCount ;
$output['studentCount'] = $studentCount ;
$output['settings'] = $input['settings'] ;

header('Content-Type: application/json');

echo json_encode($output) ;

if(getenv('DEBUG'))
	error_log('output='.json_encode($output)) ;

//Logging output format
/*
 The numbers in the links structure is the result from the database calculation
 (ie. either number of clicks for that link or number of students, depending on
 whether settings['activityType'] == 'S' or 'C')
 
{
	"mavVersion": "0.6.4-dev99990",
	"settings": {
		"activityType": "S",
		"displayMode": "C",
		"groups": ["0"],
		"mavVersion": "0.6.4-dev9992"
	},
	"courselink": "http:\/\/lms.server.com\/course\/view.php?id=2242",
	"pagelink": "http:\/\/lms.server.com\/course\/view.php?id=2242",
	"links": {
		"\/course\/view.php?id=22287": ["course", "view.php?id=2242", 10],
		"\/mod\/elluminate\/view.php?id=2013931": ["elluminate", "view.php?id=201393", 3],
		"\/mod\/forum\/view.php?id=749842": ["forum", "view.php?id=74984", 9],
		"\/mod\/page\/view.php?id=1666753": ["page", "view.php?id=166675", 8],
		"\/mod\/page\/view.php?id=1922603": ["page", "view.php?id=192260", 2],
		"\/mod\/forum\/view.php?f=365802": ["forum", "view.php?f=36580", 1],
		"\/mod\/book\/view.php?id=1960001": ["book", "view.php?id=196000", 0],
		"\/mod\/book\/view.php?id=1707164": ["book", "view.php?id=170716", 0],
		"\/mod\/resource\/view.php?id=2051417": ["resource", "view.php?id=201417", 4],
		"\/mod\/resource\/view.php?id=2071418": ["resource", "view.php?id=201418", 4],
		"\/mod\/resource\/view.php?id=1765407": ["resource", "view.php?id=176507", 5],
		"\/mod\/resource\/view.php?id=1766508": ["resource", "view.php?id=176508", 4],
		"\/mod\/resource\/view.php?id=1761509": ["resource", "view.php?id=176509", 3],
		"\/mod\/book\/view.php?id=1636616\u0026chapterid=6610": ["book", "view.php?id=163666\u0026chapterid=6610", 10],
		"\/mod\/forum\/view.php?id=1713655": ["forum", "view.php?id=171365", 10],
		"\/mod\/elluminate\/view.php?id=1636619": ["elluminate", "view.php?id=166619", 7],
		"\/mod\/book\/view.php?id=1633666\u0026chapterid=6611": ["book", "view.php?id=163666\u0026chapterid=6611", 10],
		"\/mod\/forum\/view.php?id=1664661": ["forum", "view.php?id=164661", 10],
		"\/mod\/elluminate\/view.php?id=1766648": ["elluminate", "view.php?id=166648", 9],
		"\/mod\/book\/view.php?id=1638666\u0026chapterid=6612": ["book", "view.php?id=163666\u0026chapterid=6612", 10],
		"\/mod\/book\/view.php?id=1653666\u0026chapterid=6613": ["book", "view.php?id=163666\u0026chapterid=6613", 10],
		"\/mod\/forum\/view.php?id=1641663": ["forum", "view.php?id=164663", 8],
		"\/mod\/resource\/view.php?id=2201429": ["resource", "view.php?id=201429", 7],
		"\/mod\/resource\/view.php?id=2013430": ["resource", "view.php?id=201430", 5],
		"\/mod\/elluminate\/view.php?id=1954516": ["elluminate", "view.php?id=194516", 9],
		"\/mod\/elluminate\/view.php?id=1676650": ["elluminate", "view.php?id=166650", 4],
		"\/mod\/resource\/view.php?id=2047892": ["resource", "view.php?id=204792", 4],
		"\/mod\/book\/view.php?id=16366\u0026chapterid=6614": ["book", "view.php?id=163666\u0026chapterid=6614", 9],
		"\/mod\/forum\/view.php?id=17664": ["forum", "view.php?id=187664", 5],
		"\/mod\/elluminate\/view.php?id=16662": ["elluminate", "view.php?id=166652", 2],
		"\/mod\/forum\/view.php?id=7491": ["forum", "view.php?id=74981", 6],
		"\/mod\/forum\/view.php?id=7482": ["forum", "view.php?id=74982", 6],
		"\/mod\/page\/view.php?id=7483": ["page", "view.php?id=74983", 3],
		"\/mod\/book\/view.php?id=16366": ["book", "view.php?id=163666", 0],
		"\/mod\/forum\/view.php?id=16662": ["forum", "view.php?id=164662", 0],
		"\/mod\/assignment\/view.php?id=67810": ["assignment", "view.php?id=167810", 10],
		"\/mod\/assignment\/view.php?id=16812": ["assignment", "view.php?id=167812", 10],
		"\/mod\/assignment\/view.php?id=17947": ["assignment", "view.php?id=167947", 10],
		"\/mod\/resource\/view.php?id=16994": ["resource", "view.php?id=167994", 0],
		"\/mod\/resource\/view.php?id=17995": ["resource", "view.php?id=167995", 0],
		"\/mod\/resource\/view.php?id=16796": ["resource", "view.php?id=167996", 0],
		"\/mod\/resource\/view.php?id=20412": ["resource", "view.php?id=201412", 0],
		"\/mod\/resource\/view.php?id=20145": ["resource", "view.php?id=201415", 0],
		"\/mod\/elluminate\/view.php?id=22979": ["elluminate", "view.php?id=229279", 0],
		"\/mod\/book\/view.php?id=8947\u0026chapterid=3978": ["book", "view.php?id=89497\u0026chapterid=3978", 0],
		"\/mod\/forum\/post.php?forum=1058": ["forum", "post.php?forum=10598", 0],
		"\/mod\/forum\/discuss.php?d=11145": ["forum", "discuss.php?d=111145", 1],
		"\/mod\/forum\/discuss.php?d=11104": ["forum", "discuss.php?d=110104", 1],
		"\/mod\/forum\/discuss.php?d=19438": ["forum", "discuss.php?d=109438", 1],
		"\/mod\/forum\/discuss.php?d=10794": ["forum", "discuss.php?d=107984", 0],
		"\/mod\/forum\/discuss.php?d=10647": ["forum", "discuss.php?d=106479", 1],
		"\/mod\/forum\/view.php?f=1098": ["forum", "view.php?f=10598", 0],
		"\/mod\/assignment\/index.php?id=12242": ["assignment", "index.php?id=2242", 5],
		"\/mod\/elluminate\/index.php?id=22242": ["elluminate", "index.php?id=2242", 5],
		"\/mod\/forum\/index.php?id=22452": ["forum", "index.php?id=2242", 4],
		"\/mod\/forum\/view.php?id=2222": ["forum", "view.php?id=22224", 0],
		"\/mod\/forum\/user.php?id=212": ["forum", "user.php?id=2121", 0],
		"\/mod\/forum\/user.php?id=212\u0026mode=discussions": ["forum", "user.php?id=212\u0026mode=discussions", 0],
		"\/mod\/forum\/user.php?id=2121\u0026course=22222": ["forum", "user.php?id=2121\u0026course=2242", 0],
		"\/mod\/forum\/user.php?id=2121\u0026course=22222\u0026mode=discussions": ["forum", "user.php?id=212\u0026course=22222\u0026mode=discussions", 0]
	},
	"username": "nerkf",
	"timestamp": "1402372419",
	"action": "getActivity"
}
*/
	
?>