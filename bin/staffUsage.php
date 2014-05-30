<?php

require_once('clignition.php') ;

$ignition = new clignition(false) ;

require_once('Term.php') ;
require_once('array_keys_exist.php') ;

/**
 * Go through the log/getActivity.txt file contents and identify the latest
 * version of MAV for each user using it
 */

if(!array_key_exists(1,$argv))
{
	usage() ;
	exit(1) ;
}

$activityFile = fopen('../log/getActivity.txt','r') ;

if(!$activityFile)
{
	error_log("Error opening log file",E_USER_ERROR) ;
	exit(1) ;
}

$activity = array() ;
while(($line = fgets($activityFile)))
{
	if($line === '')
		continue ;
	array_push($activity,json_decode($line,true)) ;
	//if($activity[count($activity)-1]['timestamp'] > 1400000000)
	//{
	//	echo $activity[count($activity)-1]['courselink'] . "\n" ;
	//	//echo json_indent($line) ;
	//}
}
fclose($activityFile) ;

switch($argv[1])
{
	case 'users':
		latestVersions($activity) ;
		break ;
	case 'weeks':
		weeklyUsage($activity) ;
		break ;
	case 'types':
		pageTypeUsage($activity) ;
		break ;
	default:
		usage() ;
		exit(1) ;
}

function usage()
{
	echo "Please provide parameter 'users' to get a user-version and usage listing or 'weeks' to get a click count by week of year\n" ;
	
}

function weeklyUsage($activity)
{
	/**
	 * @var array An associative array holding
	 *	array
	 *	(
	 *		'{strm}' => array
	 *		(
	 *			'{week}' => array
	 *			(
	 *				'views' => '{count}',
	 *				'staff' => array
	 *				(
	 *					'{username}' => '{count}'
	 *				)
	 *			)
	 *		)
	 *	) ;
	 */
	$terms = array() ;
	
	//Iterate over all the activity
	foreach ($activity as $a)
	{
		//Get the timestamp for the activity
		$timestamp = DateTime::createFromFormat('U',$a['timestamp']) ;
		//Work out what term it was in
		$term = new Term($timestamp) ;
		//Get the strm representing the term
		$strm = $term->getStrm() ;
		//Get the week of term that it happened
		$week = $term->getWeek($timestamp) ;
		//Get the week as a week epoch
		$weekEpoch = $week->getWeekEpoch() ;
		//If we already have a count for this term/week combination, add to it
		if(array_keys_exist(array($strm,$weekEpoch,'views'),$terms))
			$terms[$strm][$weekEpoch]['views']++ ;
		//Otherwise start count for this term/week combination
		else
			$terms[$strm][$weekEpoch]['views'] = 1 ;
			
		if(array_keys_exist(array($strm,$weekEpoch,'staff',$a['username']),$terms))
			$terms[$strm][$weekEpoch]['staff'][$a['username']]++ ;
		else
			$terms[$strm][$weekEpoch]['staff'][$a['username']] = 1 ;
	}

	//Sort the terms by term
	ksort($terms,SORT_NUMERIC) ;
	
	$total = 0 ;
	foreach ($terms as $strm => $weeks)
	{
		ksort($terms[$strm],SORT_NUMERIC) ;
		foreach ($terms[$strm] as $week => $rec)
		{
			$term = new Term($strm) ;
			$week = $term->getWeek($week) ;
			$week = $week->getWeekName() ;
			$count = $rec['views'] ;
			$staffCount = count($rec['staff']) ;
			echo "$strm, $week, $count, $staffCount\n" ;
			$total += $count ;
		}
	}
	echo "total, $total\n" ;
}

/**
 * Break down the activity according to Moodle modules or page types
 * 
 * @param array $activity The array of activity data
 */
function pageTypeUsage($activity)
{
	$modules = array() ;
	
	$noPageLink = 0 ;
	foreach ($activity as $a)
	{
		//If we don't have the page link, just skip
		if(!array_key_exists('pagelink',$a))
		{
			$noPageLink++ ;
			continue ;
		}
		
		$matches = array() ;
		//http:\/\/lms.server.com\/course\/view.php?id=42041
		if(preg_match('/^https?:\/\/[^\/]+\/course\//',$a['pagelink']))
		{
			if(!array_key_exists('course',$modules))
				$modules['course'] = 1;
			else
				$modules['course']++ ;
		}
		//http:\/\/lms.server.com\/mod\/forum\/view.php?id=742982
		elseif(preg_match('/^https?:\/\/[^\/]+\/mod\/([^\/]+)\/(.*)$/',$a['pagelink'],$matches))
		{
			array_shift($matches) ;
			if(!array_key_exists($matches[0],$modules))
				$modules[$matches[0]] = 1;
			else
				$modules[$matches[0]]++ ;
		}
	}
	asort($modules,SORT_NUMERIC) ;
	
	echo "MAV Page Views by Page Type\n" ;
	foreach ($modules as $module => $count)
	{
		echo "$module,$count\n" ;
	}
	echo "Unknown page views: $noPageLink\n" ;
}

/**
 * Output latest version of mav and users
 * 
 */
function latestVersions($activity)
{
	$users = array() ;
	
	foreach($activity as $a)
	{
		if(!array_key_exists($a['username'],$users))
		{
			$users[$a['username']] = array
			(
				'version'   => 0,
				'timestamp' => 0,
				'count'     => 0
			) ;
		}
		//If we don't have a version yet for given user,
		//or if we find a newer version, then update the list
		if(isset($a['mavVersion']) and version_compare($users[$a['username']]['version'],$a['mavVersion']) < 0)
		{
			$users[$a['username']]['version'] = $a['mavVersion'] ;
		}
		
		//Update the timestamp for the given username
		$users[$a['username']]['timestamp'] = $a['timestamp'] ;
		
		//Update the count on accesses for given username
		$users[$a['username']]['count']++ ;
	
		//if(array_key_exists('student',$a['settings']) and $a['settings']['student'] !== 0)
		//if( array_key_exists('student',$a['settings']))
		//{
		//	echo $a['username'] . "\n" . json_indent(json_encode($a['settings'],false)) . "\n\n"  ;
		//}
	}
	
	//Sort the list of users according to last accessed timestamp
	uasort($users,function($a,$b){ return ($b['timestamp'] - $a['timestamp']) ;}) ;
	//Sort the list of users according to version number
	//uasort($users,function($a,$b){ return version_compare($b['version'],$a['version']) ;}) ;
	//Sort the list of users according to number of accesses
	//uasort($users,function($a,$b){ return ($b['count'] - $a['count']) ;}) ;
	
	//Get the timezone from the current time - use when outputting in foreach
	$time = new DateTime() ;
	$timezone = $time->getTimezone() ;
	foreach($users as $user => $data)
	{
		echo $user . " --> " . $data['version'] . " (" . DateTime::createFromFormat('U',$data['timestamp'])->setTimezone($timezone)->format('r') . ") [" . $data['count'] . "]\n" ;
	}
	
}





//Commented out custom code as using php built in function version_compare
///**
// * Compare version strings of the form 0.0.0.  Returns < 0 if $a is less than $b,
// * > 0 if $a is greater than $b, and 0 if $a and $b are equal
// * 
// * @param string $a Software version of form 0.0.0
// * @param string $b Software version of form 0.0.0
// * 
// * @return integer    Returns < 0 if $a is less than $b, > 0 if $a is greater than $b, and 0 if $a and $b are equal
// */
//function version_cmp($a,$b)
//{
//	$aSplit = explode('.',$a) ;
//	$bSplit = explode('.',$b) ;
//	
//	$i = 0 ;
//	do
//	{
//		//Work out which number is larger
//		$c = $bSplit[$i] - $aSplit[$i] ;
//		//If they are equal, test the next number
//		if($c != 0)
//			continue ;
//		//keep checking while matching numbers are equal, and there are more numbers to check
//	} while($c == 0 and ++$i < count($aSplit)) ;
//	
//	return $c ;
//}



/**
 * Indents a flat JSON string to make it more human-readable.
 *
 * @param string $json The original JSON string to process.
 *
 * http://www.daveperrett.com/articles/2008/03/11/format-json-with-php/
 *
 * @return string Indented version of the original JSON string.
 */
function json_indent($json)
{
	$result      = '';
	$pos         = 0;
	$strLen      = strlen($json);
	$indentStr   = '  ';
	$newLine     = "\n";
	$prevChar    = '';
	$outOfQuotes = true;

	for ($i=0; $i<=$strLen; $i++)
	{
		// Grab the next character in the string.
		$char = substr($json, $i, 1);

		// Are we inside a quoted string?
		if ($char == '"' && $prevChar != '\\')
		{
			$outOfQuotes = !$outOfQuotes;
		// If this character is the end of an element,
		// output a new line and indent the next line.
		}
		else if(($char == '}' || $char == ']') && $outOfQuotes)
		{
			$result .= $newLine;
			$pos --;
			for ($j=0; $j<$pos; $j++)
			{
				$result .= $indentStr;
			}
		}

		// Add the character to the result string.
		$result .= $char;

		// If the last character was the beginning of an element,
		// output a new line and indent the next line.
		if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes)
		{
			$result .= $newLine;
			if ($char == '{' || $char == '[')
			{
				$pos ++;
			}

			for ($j = 0; $j < $pos; $j++)
			{
				$result .= $indentStr;
			}
		}

		$prevChar = $char;
	}

	return $result;
}



?>
