<?php


/**
 * This function loads a php template that is a dynamically generated SQL query
 * from given path and evaluates it using the passed variable data and
 * returns the generated SQL string
 * 
 * @param string $template php template filename
 * @param array $queryData associative array of SQL template variables
 * 
 * @return string    The resultant SQL query
 */
function generateSQLQuery($template,$queryData=null)
{
	//Use output buffering to capture the output of the php query template script
	ob_start() ;
	include($template) ;
	//The generated query is now stored in $query from the output of the included script
	$query = ob_get_contents() ;
	ob_end_clean() ;
	return $query ;
}

?>