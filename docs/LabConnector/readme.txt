PATCH INFORMATION
-----------------
Ran the following command: 
diff -r -U 8 --excluce=.svn original/trunk modified/trunk > labconnector.patch

These changes implement the following:
1. Accessing of labs by Sahara USER
2. Restrict access to iLabs to RIG:TYPE equalling 'ILABS'
3. Adjust permissions based on user access rights.
4. Make the UI appear as seamless as Sahara-WI UI.
==================================================================================
