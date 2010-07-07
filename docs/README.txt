README
======

Problems
========
If there are any problems, quirks in browsers or any features you want 
implemented, feel free to email:

  * Michael Diponio (lead developer) <mdiponio@eng.uts.edu.au>
  * Tania Machet (software engineer) <tmachet@eng.uts.edu.au>

TODO
=====
 * Implement authentication. ('indexAction' in 'application/controllers/IndexController.php').
 * Cameras, the position is a little off and deploying streaming options is a little flaky across
   different browsers in different operating systems. ('library/Sahara/Session/Elements/Cameras.php').

Requirements
============

The Sahara Web Interface requires:
  - Apache 2.2+ with mod_rewrite enabled.
  - PHP 5.2.4+
  - Zend Framework 1.10 or later (See http://framework.zend.com/manual/en/requirements.introduction.html)
  - Sahara Scheduling Server
  

Setting Up Your VHOST
=====================

The following is a sample VHOST. Where <ROOT> is shown, replace this with 
this with the location of the extracted source. 

<VirtualHost *:80>
   DocumentRoot "<ROOT>/public"
   ServerName Sahara.local

   # This should be omitted in the production environment
   SetEnv APPLICATION_ENV development
    
   <Directory "<ROOT>/public">
       Options Indexes MultiViews FollowSymLinks
       AllowOverride All
       Order allow,deny
       Allow from all
   </Directory>
    
</VirtualHost>

Adding Authentication
=====================
Be default no authentication is provided for the Sahara WI as identity management 
is different across institutions. The UTS install is using LDAP authentication. 
Please email tmachet@eng.uts.edu.au or mdiponio@eng.uts.edu.au for details about
the UTS setup if you require it.

Authentication should be added to 'application/controllers/IndexController', inside
the indexAction method. Position is shown by a 'TODO' task marker. 
See http://framework.zend.com/manual/en/zend.auth.html for possible options to add 
authentication.

Pseudo code of authentication:

/* Set up adapter. */
$adapter = Zend_Auth_Adapter_<Some adapter>;
set up adapter;

/* Add user name (identity) and password (credential). */
$adapter->setIdentity($username);
$adapter->setCredential($password);

/* Run authentication. */
$result = $this->_auth->authenticate($adapter);
if ($result->getCode() != Zend_Auth_Result::SUCCESS)
{
	/* Failed authentication, so redisplay form with error message. */
	array_push($this->view->messages, "Authentication has failed.");
	$this->view->form->populate($this->_request->getParams());
	return;
}

NOTE: The above is only pseudo code so will need to be modified. Also note
a Zend Auth Adapter need not be used as the identity credential is
manually added to contain the <Institution>:<Username>, not just the 
identity credential.

Setting Up Custom Rig Type Pages
================================
In the folder institution/<Configured institution>/scripts/ add a file
with the script <Rig Type Name>.phtml. This will then be rendered for
session pages of for rigs with that rig type. For example:

Institution: UTS
Rig Type: Coupled_Tanks
Rendered page: institution/UTS/Coupled_Tanks.phtml.

If no rig type script is provided, a default script is used which
assumes a Remote Desktop style rig type.

NOTE: Documentation has been written with details of how to develop
rig type pages, in collaboration with developing rig clients.

Setting Up Custom Information Pages
===================================
To set up institution specific information pages i.e. News, FAQ, Contact
Us and Laboratory Information pages that use the default template but 
contain institute specific information.

In the folder institution/<Configured institution>/ add a file
with the name <information Type>.php eg Contacts.php or LabInfo.php. 
This will set up the information to be displayed on the page.

Include the following information:
CONTACT US: Create an associative array which contains 
	role => contact information.  
  The contact information is again an associative array with any 
  key => value pair that should be displayed (they will be displayed 
  in a table as field => value).
FAQ: The structure is list of associative arrays which contain the 
  key value pairs:
	question => question text
	answer =>  answer text
  Any links or editing must have the html mark up included.
NEWS: The structure is list of associative arrays which contain the  
  key value pairs:
	header => News item header text
	info  =>  News item information
  Any links or editing must have the html mark up included.
LABORATORY INFORMATION: For similar gallery style presentation, 
  this script should have a list of arrays with each array containing
  the information for the image. 
  The image information is an associative array containing:
    filename => image filename (from baseUrl)
    alt => subtitle for image
    title => title for image


If no rig type institute specific content is provided, the default information 
is used.

NOTE: There are example scripts in docs/InfoExamples.  
Additional documentation has been written with details of how to develop
these pages, in collaboration with developing rig clients.