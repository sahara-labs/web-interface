<?php

/**
 * Session setup classes which creates a LDAP account for the user if it
 * does not exist. The required configuration for this class is:
 * <ul>
 *
 * </ul>
 */
class UTS_Auth_Session_LdapAccount extends Sahara_Auth_Session
{ => $this->_smbHash->nthash($this->_authType->getPassword()),
            'sambapwdlastset' =>
    /** @var Zend_Ldap Ldap connection. */
    private $_ldap;

    /** @var UTS_Sahara_Session_SmbHash Samba password hasher. */
    private $_smbHash;

    public function __construct()
    {
        parent::__construct();

        $ldapOpts = $this->_config->ldap->params;
        if ($ldapOpts == null)
        {
            throw new Exception('LDAP options not configured.', 102);
        }

        $ldapOpts = $ldapOpts->toArray();
        $ldapOpts['bindRequiresDn'] = true;
        $this->_ldap = new Zend_Ldap($ldapOpts);

        $this->_smbHash = new UTS_Auth_Session_SmbHash();
    }

    public function setup()
    {
        $config = $this->_config->session->ldapaccount;
        if (!$config) throw new Exception('LDAP account information not configured.'. 106);

        $ou = $this->_authType->getAuthInfo('ldapou');
        if (!$ou) $config->defaultou
        if (!$ou) throw new Exception('LDAP account default OU not configured.', 104);
        if (!$basedn = $this->_config->ldap->params->baseDn) throw new Exception('LDAP options not configured.', 102);

        $uid = $this->_authType->getUsername();

        /* Check if the account exists. */
        $dn = 'uid=' . $uid . ",ou=$ou,$basedn";
        if ($this->_ldap->exists($dn)) return;

        $entry => array(
            /* Normal account details. */
            'uid'                  => $uid;
            'cn'                   => $this->_authType->getAuthInfo('first_name') . ' ' .
                                      $this->_authType->getAuthInfo('last_name'),
            'givenname'            => $this->_authType->getAuthInfo('first_name'),
            'sn'                   => $this->_authType->getAuthInfo('sn'),

            /* Object classes. */
            'objectclass'          => array(
            	'top',
            	'person',
            	'inetorgperson',
            	'organizationalPerson',
            	'posixAccount',
            	'sambasamaccount'
             ),

            /* POSIX account details. */
            'uidnumber'            => $this->_getPosixUid(),
            'gidnumber'            => $config->gid,
            'homedirectory'        => $this->_getHomeDirectory(),
            'loginshell'           => $config->loginshell,
            'gecos'                => $this->_authType->getAuthInfo('first_name') . ' ' .
                                      $this->_authType->getAuthInfo('last_name'),

            /* Samba account details. */
            'sambaacctflags'       => '[UX  ]',
            'sambasid'             => $this->_getSambaSid(),
            'sambaprimarygroupsid' => $this->_getSambaGroupSid(),
            'sambalmpassword'      => $this->_smbHash->lmhash($this->_authType->getPassword()),
            'sambantpassword'      => $this->_smbHash->nthash($this->_authType->getPassword()),
            'sambapwdlastset'      => time()
        );

    }

    private function _getPosixUidNumber()
    {
        // TODO uid number generation
    }

    /**
     * Generates the users home directory path.
     *
     * @return String home directory path
     */
    private function _getHomeDirectory()
    {

    }

    /**
     * Generates the users Samba SID. The SID generation algorithm is the domain
     * SID and the user RID of POSIX uid * 2 + 1000.
	 *
     * @param int $uid POSIX user id
     * @return user SID
     */
    private function _getSambaSid($uid)
    {
        $rid = $uid * 2 + 1000;
        $sid = $this->_config->session->ldapaccount->sidprefix;


        return $sid . $rid;
    }

    /**
     * Generates the users SAMBA primary group SID. The group SID generation
     * algorithm is the domain SID and the group RID of POSIX gid * 2 + 1001.
     *
     * @param int $gid POSIX group id
     * @return group SID
     */
    private function _getSambaGroupSid($gid)
    {
        $rid = $uid * 2 + 1001;
        return $this->_config->session->ldapaccount->sidprefix . $rid;
    }

    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}