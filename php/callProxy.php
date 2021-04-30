<?php
    include 'C:\xampp\phpMyAdmin\examples\cartoDBProxy.php';
    //          ^CHANGE THIS TO THE PATH TO YOUR cartodbProxy.php
    $queryURL = $_POST['qurl'];
    $return = goProxy($queryURL);
    echo $return;
?>
