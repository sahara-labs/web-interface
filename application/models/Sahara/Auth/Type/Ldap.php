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
 * @date 8th July 2010
 */

/**
 * Authenticates a user with a LDAP server. For authentication to succeed, the
 * supplied user credenitals must successfully bind to the ldap server and any
 * configured attributes and values must exist in the user's LDAP record. The
 * required configuration for this class is:
 * <ul>
 * 	<li>ldap.params.host - Address of LDAP server.</li>
 *  <li>ldap.params.username - Username of administrative user for inital
 *  bind.</li>
 *  <li>ldap.params.password - Password of administrative user.</li>
 *  <li>ldap.params.baseDn - Base DN for searching.</li>
 * </ul>
 */
class Sahara_Auth_Type_Ldap extends Sahara_Auth_Type
{
    /** @var Zend_Ldap Ldap. */
    private $_ldap;

    /** @var array User record from LDAP. */
    private $_userRecord;

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

    /**
     * Authenticates the user against a LDAP server. If the supplied credentials are
     * correct, any configured record attributes are checked on the users record to
     * se whether LDAP will be allowed.
     *
     * @see models/Sahara/Auth/Sahara_Auth_Type::authenticate()
     */
    public function authenticate()
    {
        try
        {

            $this->_ldap->bind($this->_user, $this->_pass);
            $this->_userRecord = $this->_ldap->getEntry($this->_ldap->getBoundUser());
            if ($attribs = $this->_config->auth->ldap)
            {
                foreach ($attribs->toArray() as $attr => $val)
                {
                    if (!array_key_exists($attr, $this->_userRecord)) return false;

                    if (is_array($val))
                    {
                        foreach ($val as $v)
                        {
                            if (!$this->checkAttribMatch($attr, $v)) return false;
                        }
                    }
                    else
                    {
                        if (!$this->checkAttribMatch($attr, $val)) return false;
                    }
                }
            }

            return true;
        }
        catch (Exception $ex)
        {
            if ($ex->getCode() == Zend_Ldap_Exception::LDAP_NO_SUCH_OBJECT ||       // User name not known
                $ex->getCode() == Zend_Ldap_Exception::LDAP_INVALID_CREDENTIALS ||  // Password wrong
                $ex->getCode() == Zend_Ldap_Exception::LDAP_UNWILLING_TO_PERFORM)   // Account is locked
            {
                return false;
            }
            else
            {
                throw $ex;
            }
        }
    }

    /**
     * Returns information from the user's LDAP record.
     *
     * @see models/Sahara/Auth/Sahara_Auth_Type::getAuthInfo()
     */
    public function getAuthInfo($property)
    {
        if (array_key_exists($property, $this->_userRecord))
        {
            return $this->_userRecord[$property];
        }
        return null;
    }

    /**
     * Returns the users LDAP entry.
     */
    public function getLdapEntry()
    {
        return $this->_userRecord;
    }

    /**
     * Returns whether the LDAP record attribute matches the specified
     * value.
     *
     * @param String $attrib attribute value
     * @param String $val value to match
     * @return whether the value matches
     */
    private function checkAttribMatch($attrib, $val)
    {
        $attribVal = $this->_userRecord[$attrib];
        if (is_array($attribVal))
        {
            return in_array($val, $attribVal);
        }
        else
        {
            return $attribVal = $val;
        }
    }

    /**
     * Disconnects from the LDAP server.
     */
    public function __destruct()
    {
        $this->_ldap->disconnect();
    }
}
