<?php
require_once("db.php");

$cookie_name = "clock_history";

// check if UUID is correct, if not navigate to homepage
$id_exists = FALSE;
if (isset($_GET["id"]))
{
   $test_id_query = sprintf("SELECT * from tbl_sessions WHERE id='%s';", $_GET["id"]);
   $test_id_query_obj = new DBRequest\query($test_id_query);
   if (count($test_id_query_obj->response->db_resultSet) == 0)
   {
      print("<script>window.history.pushState('', 'Clocker', window.location.href.split('?')[0]);</script>");
      $id_exists = FALSE;
      // $url = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
      // header("Location: ".$url); /* Redirect browser to the same address without get parameters */
      // exit();
   }
   else {
      $id_exists = TRUE;
   }

}


//// I can make some improvements in regards to the cookies, but I it's currently very late at night and I'm tired.

if (!$id_exists)
{

   include("new_clock.php");
   // get existing cookies
   
   

   //

}

if ($id_exists)
{
   // add cookie
   // check if already exists, if not then add it
   $cookie_value = "";
   if(!isset($_COOKIE[$cookie_name]))
   {
      $cookie_value = $_GET["id"];
   }
   else 
   {
      
      if (strpos($_COOKIE[$cookie_name], $_GET["id"]) !== false)
      {
         $cookie_value = $_COOKIE[$cookie_name];
      } else 
      {
         if (strlen($_COOKIE[$cookie_name]) > 0) {
            $cookie_value = $_COOKIE[$cookie_name].','.$_GET["id"];
            
         }
      }
   }
   setcookie($cookie_name, $cookie_value , time() + (86400 * 30), ".");
   include("clock.html");
}
