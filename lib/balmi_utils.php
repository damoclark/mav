<?php

function getCourseIdFromCourseHomePageLink($link)
{
	if($link != null)
	{
		$courseid = array() ;
		preg_match('/(\d+)$/',$link,$courseid) ;
		if(array_key_exists(1,$courseid))
			$courseid = $courseid[1] ;
		else
			$courseid = null ;
	}
	else
	{
		$courseid = null ;
	}
	return $courseid ;
}

?>