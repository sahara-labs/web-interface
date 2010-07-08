<?php

class UTS_Auth
{
    /** @var assoc array Chain of authenticators to run in order. */
    private  $_authChain = array(
        'Database', // Requires the users auth flag to be true
        'Ldap',     // Requires object class utsperson
    );

    /** @var UTS_Auth The successful authenticator. */
    private $_successLink;

    /** @var assoc array Chain of session setup authenticators. */
    private $_sessionChain = array(
        'LdapAccount'   => array('Database'),          // LDAP account if it does not exist
        'Permissions'   => array('Ldap'),              // Permissions based on subject or user class
        'SambaPassword' => array('Dat', 'Database')    // Reset the Samba passwords
        'HomeDirectory' => array('Ldap', 'Database')  // Sets up the users home directory
    );

    /** @var String Username provided. */
    private $_username;

    /** @var String Password crendetial. */
    private $_password;

    public function __construct($username, $password)
    {
        $this->_username = $username;
        $this->_password = $password;
    }

    /**
     * Runs through the authenticator chain and attempts to authenticate
     * the user. The user is considered authenticated if only one method
     * succeeds, so no subsequent method is run.
     *
     * @return boolean true if the user can be authenticated
     */
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

        return is_null(self::$_successLink);
    }

    public function setUpSession()
    {
        foreach (self::$_sessionChain as $type => $links)
        {

        }
    }

    public function getAuthenticatorType()
    {
        return 'Chainer';
    }
}