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
//Get the stats from the database as per input
////////////////////////////////////////////////////////////////////////////////

$accessQuery = generateSQLQuery('getStudentAccessQueryTemplate.php') ;

$noAccessQuery = generateSQLQuery('getStudentNoAccessQueryTemplate.php') ;

if(getenv('DEBUG'))
	error_log("getStudentAccess.php access query=\n$accessQuery") ;

if(getenv('DEBUG'))
	error_log("getStudentAccess.php no access query=\n$noAccessQuery") ;

//Run access query
$accessStmt = $dbh->prepare($accessQuery) ;

//Run no access query
$noAccessStmt = $dbh->prepare($noAccessQuery) ;

foreach($input['links'] as $link => $data)
{
	//List of students who have accessed link
	$studentAccess = array() ;
	//List of students who haven't accessed link
	$studentNoAccess = array() ;

	$module = $data[0] ;
	$url = $data[1] ;

	//Get the student access list first
	
	//@todo Check return value from execute to see if query failed
	$accessStmt->execute(array(':module'=>$module,':url'=>$url,':course'=>$courseid)) ;
	
	//Collate the list of students who have accessed the link $link
	while($result = $accessStmt->fetch(PDO::FETCH_ASSOC))
	{
		$studentAccess[] = $result ;
	}
	
	//Now get the student not access list
	//@todo Check return value from execute to see if query failed
	$noAccessStmt->execute(array(':module'=>$module,':url'=>$url,':course'=>$courseid)) ;
	
	//Collate the list of students who have accessed the link $link
	while($result = $noAccessStmt->fetch(PDO::FETCH_ASSOC))
	{
		$studentNoAccess[] = $result ;
	}
	
	if(getenv('DEBUG'))
	{
		error_log("module=$module, url=$url, course=$courseid, count=".$result) ;
	}

	//Add the counted students to the input data structure so it can be logged
	$input['links'][$link][] = count($studentAccess) ;
	$input['links'][$link][] = count($studentNoAccess) ;

	//Assign the counted students to the output data structure
	$output[$link]['access'] = $studentAccess ;
	$output[$link]['noaccess'] = $studentNoAccess ;
}

//Log request
$input['username'] = $_SERVER['REMOTE_USER'] ;
$now = new DateTime() ;
$input['timestamp'] = $now->format('U') ;
//Add the action for this record in the log
$input['action'] = 'getStudentAccess' ;
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
$output['settings'] = $input['settings'] ;

header('Content-Type: application/json');

echo json_encode($output) ;

if(getenv('DEBUG'))
	error_log('output='.json_encode($output)) ;

/*
 Sample output

{
	"data": {
		"\/mod\/elluminate\/view.php?id=2013": {
			"access": [{
					"username": "s123456",
					"firstname": "Gerry",
					"lastname": "Laws"
				}, {
					"username": "s234567",
					"firstname": "Charlotte",
					"lastname": "Li"
				}, {
					"username": "s345789",
					"firstname": "Billy",
					"lastname": "Stubbs"
				}
			],
			"noaccess": [{
					"username": "s456789",
					"firstname": "Shelly",
					"lastname": "Allens"
				}, {
					"username": "s567890",
					"firstname": "Helen",
					"lastname": "Albert"
				}, {
					"username": "s6789012",
					"firstname": "Mitch",
					"lastname": "Fletcher"
				}, {
					"username": "s7890123",
					"firstname": "Margaret",
					"lastname": "Ford"
				}, {
					"username": "s8901234",
					"firstname": "Yolanda",
					"lastname": "Harrison"
				}, {
					"username": "s9012345",
					"firstname": "Billy",
					"lastname": "Howardstone"
				}, {
					"username": "s012345",
					"firstname": "Terrance",
					"lastname": "Youngberry"
				}
			]
		}
	},
	"settings": {
		"activityType": "S",
		"displayMode": "C",
		"groups": ["0"],
		"mavVersion": "0.4.4"
	}
}	
*/

/*
 Sample log output

 The links structure has 2 numbers in the array.  The first number is a count of
 the number of students who have accessed that link, while the second number is
 a count of students who haven't access the link.
 
{
	"mavVersion": "0.6.4-dev99990",
	"settings": {
		"activityType": "S",
		"displayMode": "C",
		"groups": ["0"],
		"mavVersion": "0.6.4-dev9992"
	},
	"courselink": "http:\/\/lms.server.com\/course\/view.php?id=263822",
	"pagelink": "http:\/\/lms.server.com\/mod\/book\/view.php?id=166\u0026chapterid=6610",
	"links": {
		"\/mod\/book\/view.php?id=1636\u0026chapterid=6674": ["book", "view.php?id=1636\u0026chapterid=6674", 7, 3]
	},
	"username": "nerkf",
	"timestamp": "1402372428",
	"action": "getStudentAccess"
} 
*/

?>
