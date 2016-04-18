<?php
/*
     Title:    Simple Book Exchange
     Authors:  Charlie Mathews
               Sarah Burgess
               Dan Mitchell
               Ben Stegner
*/

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once('constants.php');

// definitions
class Output
{
     private $content ;
     function  __construct()
     {
          $content = [] ;
     }
     function set($name, $new)
     {
          $this->content[$name] = $new ;
     }
     function error($message)
     {
          $this->content['errors'][] = $message ;
     }
     function log($message)
     {
          $this->content['logs'][] = $message ;
     }
     function getJSON()
     {
          return json_encode($this->content);
     }
}

/* token generator - http://stackoverflow.com/a/13733588 */
function crypto_rand_secure($min, $max)
{
    $range = $max - $min;
    if ($range < 1) return $min; // not so random...
    $log = ceil(log($range, 2));
    $bytes = (int) ($log / 8) + 1; // length in bytes
    $bits = (int) $log + 1; // length in bits
    $filter = (int) (1 << $bits) - 1; // set all lower bits to 1
    do {
        $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
        $rnd = $rnd & $filter; // discard irrelevant bits
    } while ($rnd >= $range);
    return $min + $rnd;
}

function getToken($length)
{
    $token = "";
    //$codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet = "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet.= "0123456789";
    $max = strlen($codeAlphabet) - 1;
    for ($i=0; $i < $length; $i++) {
        $token .= $codeAlphabet[crypto_rand_secure(0, $max)];
    }
    return $token;
}
/* end token generator */

// setup
$output = new Output();
session_start();
$conn = new mysqli('localhost', DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
     die("Connection failed: " . $conn->connect_error);
}

// form response
if($_SESSION['loggedin'] === TRUE)
{
     /*
     $conn = new mysqli('localhost', DB_USER, DB_PASS, DB_NAME);
     if ($conn->connect_error) {
          die("Connection failed: " . $conn->connect_error);
     }
     */
     //session exists
     if(isset($_GET['request']))
     {
          if($_GET['request'] == 'logout')
          {
               $_SESSION['loggedin'] = FALSE ;
               $_SESSION['user'] = NULL ;
               $_SESSION['power'] = 0 ;
          }
          if($_GET['request'] == 'search' && isset($_GET['query']) === TRUE)
          {
               $var = "%" . $_GET['query'] . "%" ;
               $var = mysqli_real_escape_string($conn, $var) ;
               /*
               $sql = 'SELECT * FROM Listings WHERE isSold = \'false\' AND ( isbn LIKE \'%'.$var.'%\' OR author LIKE \'%'.$var.'%\' OR title LIKE \'%'.$var.'%\') ORDER BY created';
               $result = $conn->query($sql);

               $list = [];
               
               if ($result->num_rows > 0) 
                    while($row = $result->fetch_assoc())
                    {
                         $obj['id'] = $row['id'];
                         $obj['seller'] = $row['seller'];
                         $obj['created'] = $row['created'];
                         $obj['title'] = $row['title'];
                         $obj['author'] = $row['author'];
                         $obj['isbn'] = $row['isbn'];
                         $obj['edition'] = $row['edition'];
                         $obj['condition'] = $row['cond'];
                         $list[] = $obj;
                    }
               else $output->log('No results were found for the query "'.$var.'".');
               
               $output->set('results', $list);
               */
               
               $stmt = $conn->prepare("SELECT * FROM Listings WHERE isSold = 0 AND ( isbn LIKE ? OR author LIKE ? OR title LIKE ?) ORDER BY created");
               $stmt->bind_param("sss", $var,$var,$var);

               $stmt->execute();
               $stmt->store_result();
               
               $list = [] ;
               if($stmt->num_rows > 0) 
               {
                    $stmt->bind_result($id, $seller, $created, $author, $title, $isbn, $edition, $cond, $isSold, $price);
                    while($stmt->fetch())
                    {
                         
                         $row['id'] = $id;
                         $row['seller'] = $seller;
                         $row['created'] = $created;
                         $row['author'] = $author;
                         $row['title'] = $title;
                         $row['isbn'] = $isbn;
                         $row['edition'] = $edition;
                         $row['condition'] = $cond;
                         $row['isSold'] = $isSold;
                         $row['price'] = $price;
                         $list[] = $row ;
                    }

                    $output->log("Retrieved records for " . $var . ".");
               }
               else $output->log("No records found for " . $var . ".");
               
               $output->set('results', $list);
               
               $stmt->free_result();
               $stmt->close();
          }
          if($_GET['request'] == 'single' && isset($_GET['query']) === TRUE)
          {
               $var = $_GET['query'] ;
               $var = mysqli_real_escape_string($conn, $var) ;
               
               $stmt = $conn->prepare("SELECT * FROM Listings WHERE isSold = 0 AND id=? ORDER BY created");
               $stmt->bind_param("s", $var);

               $stmt->execute();
               $stmt->store_result();
               
               $list ;
               if($stmt->num_rows > 0) 
               {
                    $stmt->bind_result($id, $seller, $created, $author, $title, $isbn, $edition, $cond, $isSold, $price);
                    while($stmt->fetch())
                    {
                         
                         $row['id'] = $id;
                         $row['seller'] = $seller;
                         $row['created'] = $created;
                         $row['author'] = $author;
                         $row['title'] = $title;
                         $row['isbn'] = $isbn;
                         $row['edition'] = $edition;
                         $row['condition'] = $cond;
                         $row['isSold'] = $isSold;
                         $row['price'] = $price;
                         $list = $row ;
                    }

                    $output->log("Retrieved record for " . $var . ".");
               }
               else $output->log("No record found for " . $var . ".");
               
               $output->set('results', $list);
               
               $stmt->free_result();
               $stmt->close();
          }
          if($_GET['request'] == 'insert' && isset($_GET['title']) && isset($_GET['author']))
          {
               $seller = $_SESSION['user'];
               $created = date("Y-m-d") ;
               
               $author = mysqli_real_escape_string($conn, $_GET['author']) ;
               $title = mysqli_real_escape_string($conn, $_GET['title']) ;

               if(isset($_GET['isbn'])) $isbn = mysqli_real_escape_string($conn, $_GET['isbn']) ;
               else $isbn = NULL ;
               if(isset($_GET['ed'])) $edition = mysqli_real_escape_string($conn, $_GET['ed']) ;
               else $edition = NULL ;
               if(isset($_GET['cond'])) $cond = mysqli_real_escape_string($conn, $_GET['cond']) ;
               else $cond = NULL ;
               if(isset($_GET['price'])) $price = mysqli_real_escape_string($conn, $_GET['price']) ;
               else $price = NULL ;
               
               if($title != NULL)
               {
                    //$stmt = $conn->prepare("INSERT INTO Listings (seller, created, author, title, isbn, edition, cond, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    if (!($stmt = $conn->prepare("INSERT INTO Listings (seller, created, author, title, isbn, edition, cond, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"))) {
                        $output->error("Prepare failed: (" . $mysqli->errno . ") " . $mysqli->error);
                    }
                    $stmt->bind_param("ssssssss", $seller, $created, $author, $title, $isbn, $edition, $cond, $price);

                    if($stmt->execute()) $output->log("New records created successfully.");
                    else $output->error("There was a problem creating the record (" . $stmt->errno . ") " . $stmt->error);

                    $stmt->close();
               }
               else $output->error("Title was blank.");
               
          }
       
          if($_GET['request'] == 'mybooks')
          {
               $user = $_SESSION['user'] ;

               $stmt = $conn->prepare("SELECT * FROM Listings WHERE seller=?");
               $stmt->bind_param("s", $user);

               $stmt->execute();
               $stmt->store_result();
               
               
               $list = [] ;
               if($stmt->num_rows > 0) 
               {
                    $stmt->bind_result($id, $seller, $created, $author, $title, $isbn, $edition, $cond, $isSold, $price);
                    while($stmt->fetch())
                    {
                         
                         $row['id'] = $id;
                         $row['seller'] = $seller;
                         $row['created'] = $created;
                         $row['author'] = $author;
                         $row['title'] = $title;
                         $row['isbn'] = $isbn;
                         $row['edition'] = $edition;
                         $row['condition'] = $cond;
                         $row['isSold'] = $isSold;
                         $row['price'] = $price;
                         
                         $list[] = $row ;
                    }

                    $output->log("Retrieved records for " . $user . ".");
               }
               else $output->log("No records found for " . $user . ".");
               
               $output->set('results', $list);
               
               $stmt->free_result();
               $stmt->close();
          }
          if($_GET['request'] == 'switchSold' && isset($_GET['query']))
          {
               $validRequest = FALSE ;
               $currentlySold = 0;
               
               $book_id = $_GET['query'];
               $user = $_SESSION['user'];
               
               $stmt = $conn->prepare("SELECT isSold FROM Listings WHERE id=? AND seller=?");
               $stmt->bind_param("ss", $book_id, $user);
               
               $stmt->execute();
               $stmt->store_result();
               
               if($stmt->num_rows > 0) 
               {
                    //$stmt->bind_result($id, $seller, $created, $author, $title, $isbn, $edition, $cond, $isSold, $price);
                    $stmt->bind_result($isSold);
                    $stmt->fetch();
                    $currentlySold = $isSold ;
                    $validRequest = TRUE ;
               }
               else $output->error("That book did not exist. (" . $user . " " . $book_id . ")");

               $stmt->free_result();
               $stmt->close();
               
               if($validRequest == TRUE)
               {
                    if($currentlySold == 0) $currentlySold = 1 ;
                    else $currentlySold = 0 ;
                    
                    $stmt = $conn->prepare("UPDATE Listings SET isSold=? WHERE id=?");
                    $stmt->bind_param("is", $currentlySold, $book_id);

                    $stmt->execute();

                    $output->log("Switched book(" . $book_id . " " . $currentlySold . ")");

                    $stmt->close();
               }
               
          }
          if($_GET['request'] == 'delete' && isset($_GET['query']))
          {
               if($_SESSION['power'] >= DELETE_POWER)
               {
                    $book_id = $_GET['query'];
                    
                    $stmt = $conn->prepare("DELETE FROM Listings WHERE id=?");
                    $stmt->bind_param("s", $book_id);

                    $stmt->execute();

                    $output->log("Book " . $book_id . " deleted.");

                    $stmt->close();
               }
               else $output->error("Unauthorized request.");
          }
          if($_GET['request'] == 'sell' && isset($_GET['query']) && isset($_GET['method']))
          {
               
               $var = $_GET['query'] ;
               $var = mysqli_real_escape_string($conn, $var) ;
               
               $stmt = $conn->prepare("SELECT * FROM Listings WHERE isSold = 0 AND id=? ORDER BY created");
               $stmt->bind_param("s", $var);

               $stmt->execute();
               $stmt->store_result();
               
               $list ;
               if($stmt->num_rows > 0) 
               {
                    $stmt->bind_result($id, $seller, $created, $author, $title, $isbn, $edition, $cond, $isSold, $price);
                    while($stmt->fetch())
                    {
                         
                         $row['id'] = $id;
                         $row['seller'] = $seller;
                         $row['created'] = $created;
                         $row['author'] = $author;
                         $row['title'] = $title;
                         $row['isbn'] = $isbn;
                         $row['edition'] = $edition;
                         $row['condition'] = $cond;
                         $row['isSold'] = $isSold;
                         $row['price'] = $price;
                         $list = $row ;
                    }
               }
               
               $stmt->free_result();
               $stmt->close();
               
               $msg = $_SESSION['user'] . EMAIL_ENDING . ' is interested in your book "' . $list['title'] . '".' ;
         
               $msg = $msg . ' They would like the delivery method to be "' . $_GET['method'] . '".';
               if(isset($_GET['note']) && strlen($_GET['note']) > 5) $msg = $msg . ' Note from buyer: "' . $_GET['note'] . '"' ;
               $msg = $msg . ' You should email them asap to arrange a purchace!';
               
               $output->log($msg);
               if(!DEBUG) mail($list['seller'].EMAIL_ENDING,"You have a buyer!",$msg);
               
          }
     }
     
     //$conn->close();
}
else
{
     //no session exists yet
     $_SESSION['loggedin'] = FALSE ;
     
     if(isset($_GET['user']) === TRUE && isset($_GET['key']) === FALSE)
     {
          //username was set
          if(strpos($_GET['user'],'@') !== FALSE || filter_var($_GET['user'].EMAIL_ENDING, FILTER_VALIDATE_EMAIL) === FALSE || strlen($_GET['user']) < 4)
          {
               //username was invalid
               $output->error('Invalid username "'. $_GET['user'] .'".');
          }
          else
          {
               //username was ok
               $newKey = getToken(5) ;
               $_SESSION['key'] = $newKey ;
               $_SESSION['user'] = $_GET['user'] ;
               $output->log('Awesome! We\'ve just emailed you a five digit key. Enter it here.');// ('.$newKey.')');
               $msg = 'Welcome to the ' . EMAIL_ENDING . ' book exchange! Your token is ' . $newKey . '.' ;
               if(!DEBUG) mail($_GET['user'].EMAIL_ENDING,"Your Login Token",$msg);
          }
     }
     elseif(isset($_GET['key']) === TRUE)
     {
          //key & username were set
          //if valid, they are a legitimate user
          if($_GET['key'] == $_SESSION['key'])
          {
               $stmt = $conn->prepare("SELECT * FROM Users WHERE user=?");
               $stmt->bind_param("s", $_SESSION['user']);

               $stmt->execute();
               $stmt->store_result();
               
               $userExists = FALSE ;
               if($stmt->num_rows > 0) 
               {
                    $userExists = TRUE ;
                    $stmt->bind_result($user, $power);
                    $stmt->fetch();
                    $_SESSION['power'] = $power ;
               }
               
               $stmt->free_result();
               $stmt->close();
               
               if($userExists == FALSE)
               {
                    $stmt = $conn->prepare("INSERT INTO Users (user, power_level) VALUES (?, 1)");
                    $stmt->bind_param("s", $_SESSION['user']);

                    $stmt->execute();

                    $output->log("New user created successfully.");

                    $stmt->close();
               }
               $_SESSION['loggedin'] = TRUE ;
          }
     }
}

$conn->close();
        
$output->set('loggedin',$_SESSION['loggedin']);
if($_SESSION['loggedin'])
{
     $output->set('user',$_SESSION['user']);
     $output->set('power',$_SESSION['power']);
}

// output response
echo $output->getJSON();
?>
