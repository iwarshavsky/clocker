<!-- Template taken from https://www.w3docs.com/tools/editor/5789  -->
<!DOCTYPE html>
<html>
  <head>
    <title>Clocker - Welcome</title>
    <!-- <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet"> -->
    <!-- <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.4.1/css/all.css" integrity="sha384-5sAR7xN1Nv6T6+dT2mhtzEpVJvfS3NScPQTrOxhwjIuvcA67KV2R5Jz6kr4abQsz" crossorigin="anonymous"> -->
    <style>
      html, body {
      display: flex;
      justify-content: center;
      height: 100%;
      }
      body, div, h1, form, input, textarea, p, li, a { 
      padding: 0;
      margin: 0;
      outline: none;
      font-family: Roboto, Arial, sans-serif;
      font-size: 16px;
      color: #666;
      }
      h1 {
      padding: 10px 0;
      font-size: 32px;
      font-weight: 300;
      text-align: center;
      }
      p {
      font-size: 12px;
      }
      hr {
      color: #a9a9a9;
      opacity: 0.3;
      }
      .main-block {
      max-width: 340px; 
      min-height: 460px; 
      padding: 10px 0;
      margin: auto;
      border-radius: 5px; 
      border: solid 1px #ccc;
      box-shadow: 1px 2px 5px rgba(0,0,0,.31); 
      background: #ebebeb; 
      }
      form {
      margin: 0 30px;
      }
      .account-type, .gender {
      margin: 15px 0;
      }
      input[type=radio] {
      display: none;
      }
      label#icon {
      margin: 0;
      border-radius: 5px 0 0 5px;
      }
      label.radio {
      position: relative;
      display: inline-block;
      padding-top: 4px;
      margin-right: 20px;
      text-indent: 30px;
      overflow: visible;
      cursor: pointer;
      }
      label.radio:before {
      content: "";
      position: absolute;
      top: 2px;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1c87c9;
      }
      label.radio:after {
      content: "";
      position: absolute;
      width: 9px;
      height: 4px;
      top: 8px;
      left: 4px;
      border: 3px solid #fff;
      border-top: none;
      border-right: none;
      transform: rotate(-45deg);
      opacity: 0;
      }
      input[type=radio]:checked + label:after {
      opacity: 1;
      }
      input[type=text], input[type=password], textarea {
      width: 100%;
      /* height: 36px; */
      margin: 13px 0 0 -5px;
      padding-left: 10px; 
      border-radius: 0 5px 5px 0;
      border: solid 1px #cbc9c9; 
      box-shadow: 1px 2px 5px rgba(0,0,0,.09); 
      background: #fff; 
      padding-top: 10px;
    padding-bottom: 10px;
      }
      input[type=password] {
      margin-bottom: 15px;
      }
      #icon {
      display: inline-block;
      padding: 9.3px 15px;
      box-shadow: 1px 2px 5px rgba(0,0,0,.09); 
      background: #1c87c9;
      color: #fff;
      text-align: center;
      }
      .btn-block {
      margin-top: 10px;
      text-align: center;
      }
      button {
      width: 100%;
      padding: 10px 0;
      margin: 10px auto;
      border-radius: 5px; 
      border: none;
      background: #1c87c9; 
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 30px;
      }
      button:hover {
      background: #26a9e0;
      }
    </style>
  </head>
  <body>
    <script src="request.js"></script>
    <script>
        document.querySelector("body").addEventListener("submit", function (e) {
            var form = document.querySelector("form");
            form.checkValidity();
            e.preventDefault();
            new_session(form.elements.title.value, form.elements.description.value);
        });

    </script>
    <div class="main-block">
      <h1>Create a new clock</h1>
      <form action="/">

        <hr>


        <input type="text" name="title" placeholder="Title" required autocomplete="off"/>
        <textarea name="description" cols="40" rows="5" placeholder="Add some info" autocomplete="off"></textarea>
        <hr>
        <div class="btn-block">
          <button type="submit" href="/">Create</button>
        </div>
        
        <div>
        <?php
        if(isset($_COOKIE[$cookie_name]))
   {
      $html = "<p>You have recently viewed:</p><ul>";
      $cookie_str = '"'.implode('","',explode(",",$_COOKIE[$cookie_name])).'"';
      $cookie_query = sprintf("SELECT * from tbl_sessions WHERE id in (%s);", $cookie_str);//$_COOKIE[$cookie_name]);
      $cookie_query_obj = new DBRequest\query($cookie_query);
      // if (count($test_id_query_obj->response->db_resultSet) > 0)
      // {
      // create hyperlinks for the cookies
      foreach ($cookie_query_obj->response->db_resultSet as $i => $entry) {
         $html .= '<li><a href="?id='.$entry["id"].'">'.$entry["title"].'</a></li>';
      //   }

      }
      $html .= "</ul>";
      print($html);

   }
   ?>
   </div>
      </form>
    </div>
  </body>
</html>





