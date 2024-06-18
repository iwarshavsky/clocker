<?php
/*
+ class MyDB
class QueryException
class Response
class query
function setup
function main


*/

namespace DBRequest;


class MyDB extends \SQLite3 {
   function __construct() {
      $this->enableExceptions(true);

      try {
         $this->open("dbMain.db");
            
         //echo "<p>".$this->lastErrorCode()."</p>";
      } catch (Exception $e)
      {
         echo '<script language="javascript">';
         echo 'alert("Failed to open DB")';
         echo '</script>';
         exit;
      }

      //$this->exec($qry);
      //echo "<p>".$this->lastErrorCode()."</p>";
   }
   
   public function getArgType($arg)
   {
      switch (gettype($arg))
      {
         case 'double': return SQLITE3_FLOAT;
         case 'integer': return SQLITE3_INTEGER;
         case 'boolean': return SQLITE3_INTEGER;
         case 'NULL': return SQLITE3_NULL;
         case 'string': return SQLITE3_TEXT;
         default:
            throw new \InvalidArgumentException('Argument is of invalid type '.gettype($arg));
      }
   }

}

class QueryException extends \Exception{
   protected $message;
   protected $source;

   public function __construct($message, $code = 0, Exception $previous = null) {

      global $db;
      $this->message = $message;
      $this->source = \debug_backtrace()[1]['function'];
      $ConcatMessage = $this->source.': '.$message;
      $response = new Response();
      //$response->db_resultSet = $results;
      $response->db_lastErrorCode = $db->lastErrorCode();
      $response->db_lastErrorMessage = $ConcatMessage."; ".$db->lastErrorMsg();
      //$response->db_rowsAffected = $db->changes();
      //$response->db_lastInsertRowID = $db->lastInsertRowID();
      //$response->send();
      header('HTTP/1.1 500 Internal Server Error');
      global $db;
      $db->close();
      die($response->GetResponse()); // the failure reason is printed, it can be accessed if needed.

   }

}

class Response {

   public $db_resultSet;
   public $db_lastErrorCode;
   public $db_lastErrorMessage;
   public $db_rowsAffected;
   public $db_lastInsertRowID;

   function __construct($db_lastErrorMessage = NULL, $db_lastErrorCode = NULL, $db_resultSet = NULL, $db_rowsAffected = NULL, $db_lastInsertRowID = NULL) {
      $this->db_resultSet = $db_resultSet;
      $this->db_lastErrorCode = $db_lastErrorCode;
      $this->db_lastErrorMessage = $db_lastErrorMessage;
      $this->db_rowsAffected = $db_rowsAffected;
      $this->db_lastInsertRowID = $db_lastInsertRowID;
   }

   public function send() { // only use when HTTP status is 200 (OK)
      echo $this->GetResponse();
      exit;
   }

   public function GetResponse()
   {
      $responseArray = get_object_vars($this);
      // Return the array without the null properties which are useless.
      foreach ($responseArray as $key => $val)
      {
         if (!isset($val))
         {
            unset($responseArray[$key]);
         } 

      }
      return json_encode($responseArray);
   }
}

class query {
   //public $stage;
   public $arguments;
   public $query_type;
   public $query_SQL;
   public $result;
   public $response;
   public $exception;


   function __construct($input = NULL) {
      $this->arguments = $input;
      if (isset($input)) {
         $this->ExecuteQuery();
      }

   }

   //INSERT INTO tbl_eventList VALUES (NULL, datetime("now"), datetime("now","+1 day"),"First title","First Description");
   public $config = array( //make this static?
            //SQLite result codes -> https://www.sqlite.org/rescode.html
      -1 => array(
         "SQL" => '',
         "must" => NULL,
         "param_condition" => NULL,
         "param" => NULL,
         "no_preparation" => TRUE
      ),

      1 => array(
         //"SQL" => "SELECT * FROM tbl_eventList WHERE date(dateStart) <= date(:time, '+1 day') AND date(dateStart) >= date(:time) ORDER BY dateStart ASC;", //date(dateEnd) >= date(:time) ORDER BY dateStart ASC;",
         "SQL" => "SELECT * FROM tbl_eventList WHERE session_id=:session_id AND ((datetime(dateStart) <= datetime(:time, '+1 day') AND datetime(dateStart) >= datetime(:time)) OR 
         (datetime(dateEnd) <= datetime(:time, '+1 day') AND datetime(dateEnd) >= datetime(:time))) ORDER BY dateStart ASC;", //date(dateEnd) >= date(:time) ORDER BY dateStart ASC;",
         
         //"SQL" => "SELECT * FROM tbl_eventList WHERE NOT (datetime(dateEnd) < datetime('now','localtime')) AND NOT (datetime(dateStart) > datetime('now','localtime','+1 days')) ORDER BY datetime(dateStart) ASC;",
         "must" => ["time" => ":time", "session_id" => ":session_id"], //NULL, 
         "param_condition" => NULL,
         "param" => NULL,
         //"no_preparation" => TRUE
      ),
      // 2 => array(
      //    "SQL" => "SELECT * FROM tbl_eventList WHERE event_ID=:event_ID;",
      //    "must" => ["event_ID" => ":event_ID"],
      //    "param_condition" => NULL,
      //    "param" => NULL
      // ),
      2 => array(
         "SQL" => "SELECT * FROM tbl_eventList WHERE %s;",
         "must" => NULL,
         "param_condition" => 1,
         "param_delimiter" => "and",
         "param" => ["event_ID" => ":event_ID", "dateStart" => ":dateStart","dateEnd" => ":dateEnd", "title" => ":title", "description" => ":description", "color" => ":color", "session_id" => ":session_id"]
      ),
      // 3 => array(
      //    "SQL" => "SELECT * FROM tbl_eventList WHERE type_ID=:type_ID;",
      //    "must" => ["type_ID" => ":type_ID"],
      //    "param_condition" => NULL,
      //    "param" => NULL
      // ),
      4 => array(
         "SQL" => "UPDATE tbl_eventList SET %s WHERE event_ID=:ID AND session_id=:session_id;",
         "must" => ["event_ID" => ":ID", "session_id" => ":session_id"],
         "param_condition" => 1,
         "param_delimiter" => ",",
         "param" => ["dateStart" => ":dateStart","dateEnd" => ":dateEnd", "title" => ":title", "description" => ":description", "color" => ":color"]
      ),

      // 5 => array(
      //    "SQL" => "INSERT INTO tbl_eventList VALUES (NULL, :dateStart, :dateEnd, :title, :description, :type_ID);",
      //    "must" => ["dateStart" => ":dateStart","dateEnd" => ":dateEnd", "title" => ":title", "description" => ":description", "type_ID" => "type_ID"],
      //    "param_condition" => NULL,
      //    "param" => NULL
      // ),
      5 => array(
         "SQL" => "INSERT INTO tbl_eventList VALUES (NULL, :dateStart, :dateEnd, :title, :description, :color, :session_id);",
         "must" => ["dateStart" => ":dateStart","dateEnd" => ":dateEnd", "title" => ":title", "description" => ":description", "color" => "color", "session_id" => ":session_id"],
         "param_condition" => NULL,
         "param" => NULL
      ),
      6 => array(
         "SQL" => "DELETE FROM tbl_eventList WHERE event_ID=:ID AND session_id=:session_id;",
         "must" => ["event_ID" => ":ID", "session_id" => ":session_id"],
         "param_condition" => NULL,
         "param" => NULL
      ),
      7 => array(
         "SQL" => "SELECT * FROM tbl_eventList WHERE session_id=:session_id;",
         "must" => ["session_id" => ":session_id"],
         "param_condition" => NULL,
         "param" => NULL
      ),
      8 => array(
         "SQL" => "INSERT INTO tbl_sessions VALUES (:session_id, :title, :creation_date, :description);",
         "must" => ["session_id" => ":session_id", "title" => ":title", "creation_date" => ":creation_date", "description" => ":description"],
         "param" => NULL,
         "param_condition" => NULL
      ),
      9 => array(
         "SQL" => "UPDATE tbl_sessions SET %s WHERE session_id=:session_id;",
         "must" => ["event_ID" => ":ID", "session_id" => ":session_id"],
         "param_condition" => 1,
         "param_delimiter" => ",",
         "param" => ["title" => ":title","description" => ":description"]
      ),

      // 8 => array(
      //    "SQL" => "SELECT * FROM tbl_Types;",
      //    "must" => NULL,
      //    "param" => NULL,
      //    "no_preparation" => TRUE
      // ),
      // 9 => array(
      //    "SQL" => "INSERT INTO tbl_Types VALUES (NULL, :type_Name);",
      //    "must" => ["type_Name" => ":type_Name"],
      //    "param" => NULL
      // ),
      // 10 => array(
      //    "SQL" => "UPDATE tbl_Types SET name=:name WHERE type_ID=:type_ID;",
      //    "must" => ["type_ID" => ":type_ID", "type_name" => ":type_Name"],
      //    "param" => NULL
      // )
   );

   /*
   GetQuerySQL - uses parameters provided when object is created
   Returns query string before binding and execution if all required params are provided.
   Throws Exception if failed on any test
   */
   function GetQuerySQL() {
      try {
         //throw new QueryException("TEST");
         //$input_query_type = ;
         $args = &$this->arguments;
         if (is_null($args)) {
            throw new QueryException("No arguments provided");
            //return FALSE;
         }
         $query_type = &$this->query_type;
         global $db;

         // test if action is found in config and set it as $query_type
         if (array_key_exists('action',$args))
         {
            if (!array_key_exists($args['action'], $this->config)) { 
               //echo "<h1>Bad action</h1>";
               throw new QueryException("Action not found in configuration");
               //return FALSE;
            } else {
               $query_type = $args['action'];
            }
         }
         else {
            //echo "<h1>Bad action</h1>";
            throw new QueryException("No action provided");   
            //return FALSE;
         }
         
         //test if "must" is set as required (not null).
         if (!is_null($this->config[$query_type]["must"])) {
            foreach ($this->config[$query_type]["must"] as $key => $value) {
               if(!array_key_exists($key,$args)) {
                  //echo "<h1>Failed to find $key</h1>";
                  throw new QueryException("Failed to find $key");
                  //return FALSE;
               }
            }
         }

         //if string is formatted and param is not null
         if (strstr($this->config[$query_type]["SQL"],"%") && !is_null($this->config[$query_type]["param"]) && !is_null($this->config[$query_type]["param_delimiter"])) { 
            $param_count = 0;
            $param_string = '';
            $query = '';
            foreach ($this->config[$query_type]["param"] as $key => $value) {
               if(array_key_exists($key,$args)) {
                  if ($param_count > 0) {
                     $delimiter = $this->config[$query_type]["param_delimiter"];
                     $param_string .= "$delimiter "; // comma is only relevant for set. also need and
                  }
                  $param_string .= $key."=".$value;
                  $param_count++;
                  
               }
            }
            // if param condition is met
            if ($param_count < $this->config[$query_type]["param_condition"]) {
               //echo "<h1>Missing parameters!</h1>";
               throw new QueryException("Parameter condition is not met");
               //return FALSE;
            }
         // set query
            $query = sprintf($this->config[$query_type]["SQL"],$param_string);


         } else {
            $query = $this->config[$query_type]["SQL"];
         }

         // // replace "*session" with UUID if needed
         // $query = str_replace("*session", vsprintf( '"%s%s-%s-%s-%s-%s%s%s"', str_split(bin2hex(random_bytes(16)), 4) ), $query);

         //echo $query;
         $this->query_SQL = $query;
         return $query;
      }
      catch ( QueryException $e ) {
         //$this->exception = $e;
         //return false;
         return $e;
      }
   }

   /*
      ExecuteQuery - can run $external_query directly
      Returns result set for SELECT.
      Returns number of affected rows for UPDATE, INSERT, DELETE
      Returns FALSE if failed to execute.
   */
   public function ExecuteQuery()
   {
      // check if exception
      //$GetQuerySQL_result = $this->IsQueryException();
      switch (gettype($this->arguments))
      {
         case 'string': // external query
            $query = $this->arguments;
            $query_type = -1;
         break;
         case 'array':
            $this->GetQuerySQL();
            $query = &$this->query_SQL;
            $query_type = &$this->query_type;
            $args = &$this->arguments;
         break;
         default:
            $exception = new QueryException("Invalid argument type");
      }
      
      global $db;
      
      // raw execution with multiple SQL queries
      $attempts = 0;
      $attempts_max = 5;
      //$successful_execution = FALSE;


      //if (isset($this->config[$query_type]["must"]) && isset($this->config[$query_type]["param_condition"]))
      if (!array_key_exists('no_preparation', $this->config[$query_type])) // looks for no_preparation
      {
         // Prepare query
         $stmt = $db->prepare($query);
         $temp = $stmt->getSQL(true);
         try {
            $stmt = $db->prepare($query);
            
         } catch ( \Exception $e ) {
            
            //echo "<h1>Failed to prepare query!</h1>";
            //echo $e->getMessage();
            $exception = new QueryException("Failed to prepare query");
            //return FALSE;
         }
         
         //create array of all possible params
         //param - must
         // + -
         // - +
         // + +
         $must = &$this->config[$query_type]["must"];
         $param = &$this->config[$query_type]["param"];
         $testIsNull = !is_null($must) ? 10 : 0;
         $testIsNull += !is_null($param) ? 1 : 0;
         switch ($testIsNull)
         {
            case 1: // only param exists
               $param_full = $param;
            break;
            case 10: // only must
               $param_full = $must;
            break;
            case 11: //both
               $param_full = array_merge($must, $param);
            break;

         }
         
         //bind given params to query 
         foreach ($args as $key => $value) {
            if(array_key_exists($key,$param_full)) {
               $stmt->bindValue($param_full[$key], $value, $db->getArgType($value));
            }
         }

      }

      do {
         try {
            // if statement is prepared, then stmt exists, if not, it's not
            if (isset($stmt)) {
               $result = $stmt->execute();
            } else {
               $result = $db->query($query);
            }
            
            $results = [];
            if ($result->numColumns() > 0) {

               while (TRUE)
               {
                  $row = $result->fetchArray(SQLITE3_ASSOC);
                  if (!$row) {
                     break;
                  } else {
                     $results[] = $row;
                  }
               }
            }
            
            $response = new Response();
            $response->db_resultSet = $results;
            $response->db_lastErrorCode = $db->lastErrorCode();
            $response->db_lastErrorMessage = $db->lastErrorMsg();
            $response->db_rowsAffected = $db->changes();
            $response->db_lastInsertRowID = $db->lastInsertRowID();

            $this->response=$response;
            return TRUE;
            //### Execution was successful! ###
            // Should I check the result code?

            break;

         } catch ( \Exception $e ) {
            
            //echo "Attempt: ".$attempts."<br>";
            
            $attempts++;
         }
         
      } while ($attempts < $attempts_max);

      //echo "<p>Error: ".$db->lastErrorCode().": ".$db->lastErrorMsg()."</p>";
      $exception = new QueryException("Failed to execute query after $attempts attempts");
      //return FALSE;

      
   }

}


 //$db = new MyDB();
 //$clearDB = new query("DROP TABLE tbl_Types,tbl_Types;");
 //exit;


$db;
global $db;
$db = new MyDB();



function setup ()
{



   /***
    *
    
    The old queries before removing type_ID for color
    
    */ 



      //  $queries = array(
      // /*
      //    Create tbl_Types
      //    add type sleep if doesn't exist
      //    create tbl_eventList
      // */
      // "PRAGMA foreign_keys = ON;", // used in order to enable enforcement of foreign keys.
      // "CREATE TABLE IF NOT EXISTS tbl_Types (
      //    type_ID INTEGER PRIMARY KEY,
      //    type_Name TEXT NOT NULL UNIQUE,
      //    type_color TEXT
      // );", // color stored as rgba hex: #00ff0060;
      // "INSERT OR IGNORE INTO tbl_Types VALUES (NULL, 'None'),(NULL, 'Sleep');",
      // "CREATE TABLE IF NOT EXISTS tbl_eventList (
      //    event_ID INTEGER PRIMARY KEY,
      //    dateStart TEXT NOT NULL,
      //    dateEnd TEXT NOT NULL,
      //    title TEXT DEFAULT 'New Event' NOT NULL,
      //    description TEXT,
      //    type_ID INTEGER NOT NULL, 
      //    FOREIGN KEY (type_ID) REFERENCES tbl_Types (type_ID)
      // );");
    
   // global $db;
   // $db = new MyDB();
//////////  // $queries = array(
//////////  //    /*
//////////  //       Create tbl_Types
//////////  //       add type sleep if doesn't exist
//////////  //       create tbl_eventList
//////////  //    */
//////////  //    "PRAGMA foreign_keys = ON;", // used in order to enable enforcement of foreign keys.
//////////
//////////  //    "CREATE TABLE IF NOT EXISTS tbl_eventList (
//////////  //       event_ID INTEGER PRIMARY KEY,
//////////  //       dateStart TEXT NOT NULL,
//////////  //       dateEnd TEXT NOT NULL,
//////////  //       title TEXT DEFAULT 'New Event' NOT NULL,
//////////  //       description TEXT,
//////////  //       color TEXT NOT NULL
//////////  //    );"); // color stored as rgba hex: #00ff0060;
//////////                 
//////////  //       foreach ($queries as $querySQL)
//////////  //       {
//////////  //          $setup = new query($querySQL);
//////////  //       }
}
// if (!empty($_POST))
// {
//    setup();
//    $inputQuery = new query($_POST);
//    $inputQuery->response->send();
//    $db->close();
//    exit;
// }
// else {
//    http_response_code(404);
//    die("this file was indeed found but whatever");
// }

   //include 'index.html';

   /*    Actions:

     -1 -> Empty
      0 -> Setup
      1 -> Select from tbl_eventList by time.
      2 -> Select from tbl_eventList by type_ID.
      3 -> Select from tbl_eventList by event_ID
      4 -> Update tbl_eventList by event_ID and other param(s)
      5 -> Insert event
      6 -> Delete event 

*/


   //["action"=>4,"dateStart" => date('Y-m-d H:i:s', time()),"dateEnd" => date('Y-m-d H:i:s', strtotime('+1 day', time())), "title" => "Nice!", "description" => "Awesome!"]


?>