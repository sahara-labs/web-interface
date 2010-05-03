README
======

WHAT is Database Authentication?
--------------------------------
Database Authentication is a simple, local authentication implementation for Sahara.  
The patches allow passwords to be associated with each user, stored with SHA1 encription, 
and used as authentication for logon into Sahara.

The sql script adds the 'password' field to the 'users' table allowing a SHA1 encrypted 
password to be entered for each user. The 'DBAuthenication.diff' patch changes the 
configuration file to include database details, and the IndexController to authenticate 
the user using the user name and password supplied.

How to use Database Authentication
-----------------------------------
Apply the DBAuthentication patch to the WI installation.  
Run the sql script on the database.
Change the parameted in config.ini to match the database.
