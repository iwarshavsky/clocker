<?php

require_once("db.php");

if (!empty($_POST))
{
//    setup();
   $inputQuery = new DBRequest\query($_POST);
   $inputQuery->response->send();
   $db->close();
   exit;
}
else {
   http_response_code(404);
   die("this file was indeed found but whatever");
}