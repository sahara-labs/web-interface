PATCH INFORMATION
-----------------
To apply the patch:

cd WI/trunk
patch -p0 < docs/LabConnector/labconnector.patch

Ran the following command: 

cd WI/trunk
svn  diff --diff-cmd=diff -x -95 -x -w -x -b -x '--exclude=docs/LabConnector/labconnector.patch' . > labconnector.patch

These changes implement the following:
1. Accessing of labs by Sahara USER
2. Restrict access to iLabs to RIG:TYPE equalling 'ILABS'
3. Adjust permissions based on user access rights.
4. Make the UI appear as seamless as Sahara-WI UI.
==================================================================================
