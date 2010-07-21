PATCH INFORMATION
-----------------
To apply the patch in UNIX platforms:

cd WI/trunk
patch -p0 < docs/LabConnector/labconnector.patch
patch -p0 < docs/LabConnector/labconnector_newfiles.patch

To apply the patch in M$ Windows platforms:
<Make sure to install the Gnu32 version of patch.exe & diffutils and add to %PATH% in environment variables>
cd WI/trunk
patch -p0 < docs/LabConnector/labconnector.patch --verbose --binary
patch -p0 < docs/LabConnector/labconnector_newfiles.patch --verbose --binary

To revert the patch:
cd WI/trunk
svn revert -R .
rm -rf application/models/Labconnector
rm -rf application/controllers/LabconnectorController.php
rm -rf application/views/scripts/labconnector

==================================================================================
Ran the following command: 

MODIFIED EXISTING FILES:
cd WI/trunk;
svn  diff --diff-cmd=diff -x -95 -x -w -x -b -x '--exclude=docs/LabConnector/labconnector.patch' . > docs/LabConnector/labconnector.patch

NEW FILES SPECIFIC TO LABCONNECTOR:
cd WI/trunk;
svn add application/views/scripts/labconnector
svn add application/models/Labconnector
svn add application/controllers/LabconnectorController.php
svn add public/css/labconnector.css
svn add public/js/labconnector.js
svn diff -N application/views/scripts/labconnector application/models/Labconnector/Batch/UQRadioactivity/Form.php application/models/Labconnector/Batch/TimeOfDay/Form.php application/controllers/LabconnectorController.php application/views/scripts/labconnector public/css/labconnector.css public/js/labconnector.js > docs/LabConnector/labconnector_newfiles.patch

These changes implement the following:
1. Accessing of labs by Sahara USER
2. Restrict access to iLabs to RIG:TYPE equalling 'ILABS'
3. Adjust permissions based on user access rights.
4. Make the UI appear as seamless as Sahara-WI UI.
==================================================================================
