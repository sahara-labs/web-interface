README
======

How to generating institute specific information for information pages.

Create an Institute Directory
-----------------------------
Create a new folder in this directory (INSTALLDIR/institution) with the name of the institution 
configured in the config.ini file.  
All institute specific scripts here will be used to display the pages. 
If the script does not exist in this directory, the default information is used.

Contact Us information
-----------------------
Create file Contacts.php which sets up the information to be displayed on the Contact Us page in the
table.  The structure is an associative array which contains role => contact information.  
The contact information is again an associative array with any key => value pair that should be 
displayed (they will be displayed in a table as field => value).

The script should have a method getContacts() which returns this array. 

FAQ information
-----------------------
Create file Contacts.php which sets up the information to be displayed on the Contact Us page in the
table.  The structure is an associative array which contains role => contact information.  
The contact information is again an associative array with any key => value pair that should be 
displayed (they will be displayed in a table as field => value).

The script should have a method getContacts() which returns this array. 
