<?php
/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2010, University of Technology, Sydney
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * Neither the name of the University of Technology, Sydney nor the names
 *    of its contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author Michael Diponio (mdiponio)
 * @date 14th July 2010
 */

/**
 * Session setup classes which creates a LDAP account for the user if it
 * does not exist. The generated account has the object class posixAccout
 * and sambaSamAccount with appropriate POSIX and Samba account
 * information respectively.
 * <br />
 * The required configuration properties for generated user accounts are:
 * <ul>
 *	<li>session.ldapaccount.defaultou - The default organizational unit
 *  (OU) of generated user accounts.</li>
 *  <li>session.ldapaccount.gid - POSIX account gid.</li>
 *  <li>session.ldapaccount.loginshell - POSIX account login shell.</li>
 *  <li>session.ldapaccount.homebase - POSIX account home directory
 *  base. The generated home directory path will be
 *  &lt;homebase&gt;/&lt;account OU&gt;/&lt;uid&gt;
 *  <li>session.ldapaccount.sidprefix - The Samba domain SID to generate
 *  the Samba domain user SID and primary group SID.</li>
 * </ul>
 * Using this setup class also requires the following fields to be added
 * to the users table.
 * <ul>
 * 	<li>first_name - varchar - The first name of the user.</li>
 *  <li>last_name - varchar - The last name of the user.</li>
 *  <li>email - varchar - The email address of the user.</li>
 *  <li>ldapou - varchar - The organizational group the user
 *  should be a member of.</li>
 * </ul>
 * The SQL to do this is:
 * <pre>
    ALTER TABLE `users` ADD `ldapou` VARCHAR( 50 ) NULL ,
    ADD `first_name` VARCHAR( 50 ) NULL ,
    ADD `last_name` VARCHAR( 50 ) NULL ,
    ADD `email` VARCHAR( 100 ) NULL
 * </pre>
 */
class UTS_Auth_Session_LdapAccount extends Sahara_Auth_Session
{
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

    /**
     * Generates the LDAP user account if it doesn't exist.
     *
     * (non-PHPdoc)
     * @see models/Sahara/Auth/Sahara_Auth_Session::setup()
     */
    public function setup()
    {
        $config = $this->_config->session->ldapaccount;
        if (!$config) throw new Exception('LDAP account information not configured.'. 104);

        $ou = $this->_authType->getAuthInfo('ldapou');
        if (!$ou) $ou = $config->defaultou;
        if (!$ou) throw new Exception('LDAP account default OU not configured.', 104);

        if (!$basedn = $this->_config->ldap->params->baseDn) throw new Exception('LDAP options not configured.', 102);

        $uid = $this->_authType->getUsername();

        /* Check if the account exists. */
        $dn = 'uid=' . $uid . ",ou=$ou,$basedn";
        if ($this->_ldap->exists($dn)) return;

        $this->_logger->info("Generating account for user $uid with DN $dn.");

        $uidNumber = $this->_getPosixUidNumber();

        $entry = array(
            /* Normal account details. */
            'uid'                  => $uid,
            'cn'                   => $this->_authType->getAuthInfo('first_name') . ' ' .
                                      $this->_authType->getAuthInfo('last_name'),
            'givenname'            => $this->_authType->getAuthInfo('first_name'),
            'sn'                   => $this->_authType->getAuthInfo('last_name'),
            'userpassword'         => $this->_authType->getPassword(),
            'mail'                => $this->_authType->getAuthInfo('email'),

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
            'uidnumber'            => $this->_getPosixUidNumber(),
            'gidnumber'            => $config->gid,
            'homedirectory'        => $this->_getHomeDirectory($ou),
            'loginshell'           => $config->loginshell,
            'gecos'                => $this->_authType->getAuthInfo('first_name') . ' ' .
                                      $this->_authType->getAuthInfo('last_name'),

            /* Samba account details. */
            'sambaacctflags'       => '[UX  ]',
            'sambasid'             => $this->_getSambaSid($uidNumber),
            'sambaprimarygroupsid' => $this->_getSambaGroupSid(),
            'sambalmpassword'      => $this->_smbHash->lmhash($this->_authType->getPassword()),
            'sambantpassword'      => $this->_smbHash->nthash($this->_authType->getPassword()),
            'sambapwdlastset'      => time()
        );

        $this->_ldap->add($dn, $entry);
        $this->_logger->info('Generated account is: ' . print_r($entry, true));
    }

    /**
     * Gets a POSIX uid. The uid number is the next free UID number determined
     * by incrementing the response from the command:
     * <pre>
     * getent passwd | tail -n 1 | cut -d ':' -f3
     * </pre>
     *
     * @return int uid number
     */
    private function _getPosixUidNumber()
    {
        $out = array();
        $ret = 0;

        $uid = exec("getent passwd | tail -n 1 | cut -d ':' -f3", $out, $ret);
        if ($ret) throw new Exception("Response from determining UID was non-zero ($ret)", 107);

        for ($i = 0; $i < 100; $i++)
        {
            $out = array();
            $ret = 0;
            exec('getent passwd ' . ($uid + $i), $out, $ret);
            if ($ret == 2) return $uid + $i;
        }

        throw new Exception("Unable to find a free UID in 100 attempts.");
    }

    /**
     * Generates the users home directory path.
     *
     * @param String ou The account OU
     * @return String home directory path
     */
    private function _getHomeDirectory($ou)
    {
        $home = $this->_config->session->ldapaccount->homebase;
        if (!$home) throw new Exception("LDAP account home directory base not configured.", 104);

        if (strrpos($home, '/') != strlen($home) - 1) $home .= '/';

        return $home . $ou . '/' . $this->_authType->getUsername();
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
        $sid = $this->_config->session->ldapaccount->sidprefix;
        if (!$sid) throw new Exception("LDAP account Samba SID not configured.", 104);
        if (strrpos($sid, '-') != strlen($sid) - 1) $sid .= '-';

        return "$sid" . ($uid * 2 + 1000);
    }

    /**
     * Generates the users SAMBA primary group SID. The group SID generation
     * algorithm is the domain SID and the group RID of POSIX gid * 2 + 1001.
     *
     * @param int $gid POSIX group id
     * @return group SID
     */
    private function _getSambaGroupSid()
    {
        $sid = $this->_config->session->ldapaccount->sidprefix;
        if (!$sid) throw new Exception("LDAP account Samba SID not configured.", 104);
        if (strrpos($sid, '-') != strlen($sid) - 1) $sid .= '-';

        $gid = $this->_config->session->ldapaccount->gid;
        if (!$gid) throw new Exception("LDAP account gid not configured.", 104);

        return "$sid-" . ($gid * 2 + 1001);
    }

    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}