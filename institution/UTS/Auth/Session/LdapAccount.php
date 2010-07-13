<?php

class UTS_Auth_Session_LdapAccount extends Sahara_Auth_Session
{
    /** @var Zend_Ldap Ldap connection. */
    private $_ldap;

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
            'uid' => $uid;
            'cn' => $this->_authType->getAuthInfo('first_name') . ' ' . $this->_authType->getAuthInfo('last_name'),
            'givenname' => $this->_authType->getAuthInfo('first_name'),
            'sn' => $this->_authType->getAuthInfo('sn'),

            /* Object classes. */
            'objectclass' => array(
            	'top', 'person', 'inetorgperson', 'organizationalPerson', 'posixAccount', 'sambasamaccount'),

            /* POSIX account details. */
            'uidnumber' => $this->_getPosixUid(),
            'gidnumber' => $config->gid,
            'homedirectory' => $this->_getHomeDirectory(),
            'loginshell' => $config->loginshell,
            'gecos' => $this->_authType->getAuthInfo('first_name') . ' ' . $this->_authType->getAuthInfo('last_name'),

            /* Samba account details. */
            'sambaacctflags' = '[UX  ]',
            'sambasid' => $this->_getSambaSid(),
            'sambaprimarygroupsid' => $this->_getSambaGroupSid(),
            'sambalmpassword' => $this->_getSambaPassword('LM'),
            'sambantpassword' => $this->_getSambaPassword('NT'),
            'sambapwdlastset' => time()
        )

    }

    private function _getPosixUidNumber()
    {
        // TODO uid number generation
    }

    private function _getHomeDirectory()
    {
        // TODO home directory generation
    }

    private function _getSambaSid()
    {
        // TODO Samba SID generation
    }

    private function _getSambaGroupSid()
    {
        // TODO Group sid
    }

    private function _getSambaPassword($type)
    {
        // TODO samba password
    }

    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}