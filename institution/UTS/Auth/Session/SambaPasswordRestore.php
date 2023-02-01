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
 * Session setup class which restores the users LDAP record samba passwords
 * to match the login password.
 */
class UTS_Auth_Session_SambaPasswordRestore extends Sahara_Auth_Session
{
    /** @var Zend_LDAP LDAP connection. */
    private $_ldap;

    /** @var UTS_Auth_Session_SmbHash Samba password hasher. */
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
        $entry = $this->_ldap->search('uid=' . $this->_authType->getUsername())->getFirst();
        if (!$entry) throw new Exception('LDAP entry with uid=' . $this->_authType->getUsername() . ' not found.');

        if (isset($entry['l']))
        {
            /* Having the l attribute can mean a user is in session. */
            $qname = Zend_Registry::get('config')->institution . ':' . $this->_authType->getUsername();
            $session = Sahara_Soap::getSchedServerQueuerClient()->
                    isUserInQueue(array('userQName' => $qname));

            /* If in session, don't play around with Samba passwords, they are probably
             * already set with batch login passwords. */
            if ($session->inSession) return;

            /* Having 'l' and not in session means something f'ed up, so delete it. */
            $this->_logger->warn('Account with DN ' . $entry['dn'] . " has 'l' attribute and is not in session. " .
                    'This attribute will be deleted.');

            $entry['l'] = '';
        }

        $lmHash = $this->_smbHash->lmhash($this->_authType->getPassword());
        $ntHash = $this->_smbHash->nthash($this->_authType->getPassword());
        if ($lmHash == $entry['sambalmpassword'] && $ntHash == $entry['sambantpassword']) return;

        $entry['sambalmpassword'] = $lmHash;
        $entry['sambantpassword'] = $ntHash;

        $this->_ldap->save($entry['dn'], $entry);
        $this->_logger->debug("Restored password of user with DN " . $entry['dn']);
    }

    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}