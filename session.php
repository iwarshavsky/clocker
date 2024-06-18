<?php

require_once("db.php");

if (!empty($_POST))
{
//    setup();
try {
    // create a UUID, check if it exists. If it does, create another one.
    $UUID;
    while (TRUE) {
        $UUID = vsprintf( '%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4) );
        $test_id_query = sprintf("SELECT id from tbl_sessions WHERE id='%s';", $UUID);
        $test_id_query_obj = new DBRequest\query($test_id_query);
        if (count($test_id_query_obj->response->db_resultSet) == 0)
        {
            break; // UUID is not used
        }
    }
    $_POST["session_id"] = $UUID;
    // Add UUID entry, return affected row number
    $inputQuery = new DBRequest\query($_POST);
    // translate affected row number to ID
    $inputQuery = new DBRequest\query('SELECT id from tbl_sessions WHERE ROWID='.strval($inputQuery->response->db_lastInsertRowID).';');
    print($inputQuery->response->db_resultSet[0]["id"]);
} 
catch (Exception $e)
{
    print("");
} 
finally {
    $db->close();
    exit;
}


   

}
else {
   http_response_code(404);
   die("this file was indeed found but whatever");
}