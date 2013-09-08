<?php

/**
 * PDOdatabase class - Read database connection parameters from .ini file (the path to which is specified through an environment variable) and create a PDO connection
 *
 * Config ini file format for a PDO database connection
 * [MOODLE2]
 * adapter = pgsql
 * host = oltdev.cqu.edu.au
 * dbname = moodle2_prod
 * port = 5433
 * username = moodle
 * password = ''
 * 
 */
class PDOdatabase
{
	
	protected $varname = null ;
	protected $configPath = null ;
	protected $config = null ;
	
	/**
	 * Constructor
	 *
	 * @param string $varname Environment variable name that represents the path to the config file with database connection parameters
	 * 
	 * @return PDOdatabase    This object
	 */
	public function __construct($varname=null)
	{
		if($varname != null)
		{
			$this->varname = $varname ;
			$this->configPath = getenv($varname) ;
			$this->config = $this->parseConfig($this->configPath) ;
		}
	}
	
	protected function parseConfig($configFilename)
	{
		if($configFilename == null)
			throw new PDOdatabase_Exception("No configFile specified.  Dont know where to read database parameters from",PDOdatabase_Exception::FATAL_ERROR) ;
		
		if(!is_file($configFilename) or !is_readable($configFilename))
			throw new PDOdatabase_Exception("Config file '" . $configFilename . "' does not exist, is not readable, or is not a file",PDOdatabase_Exception::FATAL_ERROR) ;
		
		$config = parse_ini_file($configFilename,true) ;
		
		if($config === false)
			throw new PDOdatabase_Exception("Error parsing config file '" . $configFilename . "'",PDOdatabase_Exception::FATAL_ERROR) ;

		//Save the config data structure
		return $config ;
	}
	
	/**
	 * Connect to database with the ini file section heading given as $database and return PDO connection
	 * 
	 * @param string $database   The section heading for the database parameters in ini file
	 * @param string $configFile Optional specific config file to use instead of one offered to constructor
	 *
	 * @throws Exception If cannot connect, config file is invalid or the database section heading is invalid
	 * 
	 * @return PDO    A connected PDO object
	 */
	public function connectPDO($database,$configFilename=null)
	{
		if($configFilename == null and $this->config == null)
			throw new PDOdatabase_Exception("No configFile specified.  Dont know where to read database parameters from",PDOdatabase_Exception::FATAL_ERROR) ;
		
		$config = (isset($configFilename)) ? $this->parseConfig($configFilename) : $this->config ;

		if(!array_key_exists($database,$config))
			throw new PDOdatabase_Exception("Database section $database does not exist in config file $configFilename",PDOdatabase_Exception::FATAL_ERROR) ;

//$dbh = new PDO('pgsql:host=oltdev.cqu.edu.au;dbname=moodle2_prod;port=5433','moodle',$password) ;
		
		$settings = $config[$database] ;
		/* Supported parameters:
		 * adapter = pgsql
		 * host = oltdev.cqu.edu.au
		 * dbname = moodle2_prod
		 * port = 5433
		 * username = moodle
		 * password = ''
		 */
		$connectionString = $settings['adapter'] . ':' ;
		foreach(array('host','dbname','port') as $param)
		{
			if(!array_key_exists($param,$settings))
				continue ;
			$connectionString .= "{$param}={$settings[$param]};" ;
		}
		if(getenv('DEBUG'))
			error_log("$connectionString") ;
		return new PDO($connectionString,$settings['username'],$settings['password']) ;
	}
}

/**
 * Exception handler class for PDOdatabase
 */
class PDOdatabase_Exception extends Exception
{
	const FATAL_ERROR = 1 ;
	const NONFATAL_ERROR = 0 ;
}


?>