PATCH INFORMATION
-----------------
To apply the patch:

cd WI/trunk
patch -p0 < docs/LabConnector/labconnector.patch
patch -p0 < docs/LabConnector/labconnector_newfiles.patch

To revert the patch:
cd WI/trunk
svn revert -R .
rm -rf application/models/LabconnectorController.php
rm -rf application/controllers/LabconnectorController.php
rm -rf application/views/scripts/labconnector

Ran the following command: 

OLD FILES:
cd WI/trunk
svn  diff --diff-cmd=diff -x -95 -x -w -x -b -x '--exclude=docs/LabConnector/labconnector.patch' . > labconnector.patch

NEW FILES:
cd WI/trunk
svn diff -N application/views/scripts/labconnector application/models/Labconnector application/controllers/LabconnectorController.php application/views/scripts/labconnector . > docs/LabConnector/labconnector_newfiles.patch

These changes implement the following:
1. Accessing of labs by Sahara USER
2. Restrict access to iLabs to RIG:TYPE equalling 'ILABS'
3. Adjust permissions based on user access rights.
4. Make the UI appear as seamless as Sahara-WI UI.
==================================================================================
