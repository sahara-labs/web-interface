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
 * @date 9th July 2010
 */

class Sahara_Auth
{
    /** @var UTS_Auth The successful authentication type. */
    private $_successType;

    /** @var assoc array Chain of session setup authenticators. */
    private $_sessionChain = array(
        'LdapAccount'   => array('Database'),          // LDAP account if it does not exist
        'Permissions'   => array('Ldap'),              // Permissions based on subject or user class
        'SambaPassword' => array('Dat', 'Database'),   // Reset the Samba passwords
        'HomeDirectory' => array('Ldap', 'Database')   // Sets up the users home directory
    );

    /** @var String Institution name. */
    private $_institution;

    /** @var String Username provided. */
    private $_username;

    /** @var String Password crendetial. */
    private $_password;

    /** @var Zend_Config Configuration (config.ini). */
    private $_config;

    /** @var Sahara_Logger Logger. */
    private $_logger;

    public function __construct($username, $password)
    {
        $this->_username = $username;
        $this->_password = $password;

        $this->_config = Zend_Registry::get('config');
        $this->_institution = $this->_config->institution;
        $this->_logger = Zend_Registry::get('logger');
    }

    /**
     * Runs through the auth type list and attempts to authenticate
     * the user. The user is considered authenticated if only one type
     * succeeds, so no subsequent method is run.
     *
     * @return boolean true if the user can be authenticated
     * @throws Exception - 101 - Authentication types are not configured
     */
    public function authenticate()
    {
        $authTypes = Zend_Registry::get('config')->auth->type;
        if (!$authTypes)
        {
            throw new Exception('Authentication types are not configured.', 101);
        }

        foreach ($authTypes->toArray() as $type)
        {
            if (!($auth = $this->_loadclass($this->_institution . "_Auth_Type_$type")) &&
                !($auth = $this->_loadclass("Sahara_Auth_Type_$type"))) continue;

            if ($auth->authenticate())
            {
                $this->_successType = $auth;
                break;
            }
        }

        return !is_null($this->_successType);
    }

    public function setUpSession()
    {

    }

    /**
     * Loads an auth class and depending on its type, set appropriate
     * properties.
     *
     * @param String $name class name
     * @param object instance
     */
    private function _loadClass($name)
    {
        try
        {
            /* Find the class to load. */
            $file = implode('/', explode('_', $name)) . '.php';
            $found = false;
            foreach (explode(PATH_SEPARATOR, get_include_path()) as $path)
            {
                if (file_exists($path . '/' . $file))
                {
                    $found = true;
                    break;
                }
            }

            if (!$found) return false;

            $cls = new $name();
            if ($cls instanceof Sahara_Auth_Type)
            {
                $cls->setUsername($this->_username);
                $cls->setPassword($this->_password);
            }

            return $cls;
        }
        catch (Exception $ex)
        {
            $this->_logger->fatal("Failed to load authentication type $name, with error: " . $ex->getMessage() . '.');
            return false;
        }
    }
}
