<?php

$sql = "UPDATE Listings SET isSold=1 WHERE id=" . $var;

if ($conn->query($sql) === TRUE) {
    echo "Record updated successfully";
} else {
    echo "Error updating record: " . $conn->error;
}
?>