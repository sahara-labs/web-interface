<?php

class UTS_Auth
{
    protected static $_authChain = array(
        'Database', // Requires the users auth flag to be true
        'Ldap',     // Requires object class utsperson
    );

    protected static $_successLink;

    protected static $_sessionChain = array(
        'LdapAccount'   => array('Database'), // LDAP account if it does not exist
        'Permissions'   => array('Ldap'),     // Permissions based on subject or user class
        'SambaPassword' => array('Dat', 'Database') // Reset the Samba passwords
        'HomeDirectory' => array('Ldap', 'Database+')
    );

    /** @var String Username provided. */
    protected static $_username;

    /** @var String Password crendetial. */
    protected static $_password;



    public function __construct($username, $password)
    {
        $this->_username = $username;
        $this->_password = $password;
    }

    public function authenticate()
    {
        foreach (self::$_authChain as $type)
        {
            $auth = new "UTS_Auth_$type";
            if ($auth->authenticate())
            {
                self::$_successLink = $auth;
                break;
            }
        }
    }

    public function postAuthenticate()
    {
        foreach (self::$_sessionChain)
        {
            $session =
        }
    }
}