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

/**
 * Main Sahara authenticator which can do local authentication or single sign on.
 */
class Sahara_Auth
{
    /** @var UTS_Auth The successful authentication type. */
    private $_successType;

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

    public function __construct($username = null, $password = null)
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
        $authTypes = $this->_config->auth->type;
        if (!$authTypes)
        {
            throw new Exception('Authentication types are not configured.', 101);
        }

        foreach ($authTypes->toArray() as $type)
        {
            if (!($auth = $this->_loadclass($this->_institution . "_Auth_Type_$type")) &&
                !($auth = $this->_loadclass("Sahara_Auth_Type_$type"))) continue;

            if (!($auth instanceof Sahara_Auth_Type))
            {
                $this->_logger->_error("Auth type $type is not an implementation of Sahara_Auth_Type. Excluding it " .
                    	'from the authentication chain.');
                continue;
            }

            $auth->setUsername($this->_username);
            $auth->setPassword($this->_password);

            if ($auth->authenticate())
            {
                $this->_successType = $auth;
                $this->_username = $auth->getUsername();
                break;
            }
        }

        return !is_null($this->_successType);
    }

    /**
     * Uses single sign on to attempt to authenticate the user
     *
     * @param array $params parameters to use for SSO return addresses
     * @return boolean true if the user can be authenticated
     * @throws Exception SSO type are not configured correctly.
     */
    public function signon($params = array())
    {
    	/* Make sure SSO is enabled. */
        if (!$this->_config->auth->useSSO)
        {
            $this->_logger->error('Attempted SSO sign on when SSO auth is not enabled.  Set the \'auth.useSSO\' ' .
                    'property to true to enable the SSO feature.');
            return false;
        }

        /* Load the SSO class. */
        $ssoType = $this->_config->auth->ssoType;
        if (!$ssoType)
        {
            $this->_logger->error('SSO type is not configured. Set the \'auth.ssoType\' property to a valid SSO type.');
            throw new Exception('SSO type not configured.');
        }

        if (!($sso = $this->_loadclass($this->_institution . "_Auth_SSO_$ssoType")) &&
            !($sso = $this->_loadclass("Sahara_Auth_SSO_$ssoType")))
        {
            $this->_logger->error("Unable to load SSO type $ssoType, failing SSO authentication.");
            throw new Exception("Unable to load SSO type $ssoType.");
        }

        if (!($sso instanceof Sahara_Auth_SSO))
        {
            $this->_logger->_error("SSO type $type is not an implementation of Sahara_SSO_Type. Failing SSO authentication.");
            throw new Exception("$ssoType is not an instance of Sahara_Auth_SSO");
        }

        if ($sso->signon($params))
        {
            $this->_successType = $sso;
            $this->_username = $sso->getUsername();
            $this->_password = $this->_fakePassword();
            return true;
        }

        return false;
    }

    /**
     * Signs off the user from the SSO service.
     */
    public function signoff()
    {
        if (!$this->_config->auth->useSSO)
        {
            $this->_logger->error('Attempted SSO sign off when SSO auth is not enabled.');
        }

         /* Load the SSO class. */
        $ssoType = $this->_config->auth->ssoType;
        if (!$ssoType)
        {
            $this->_logger->error('SSO type is not configured. Set the \'auth.ssoType\' property to a valid SSO type.');
            throw new Exception('SSO type not configured.');
        }

        if (!($sso = $this->_loadclass($this->_institution . "_Auth_SSO_$ssoType")) &&
            !($sso = $this->_loadclass("Sahara_Auth_SSO_$ssoType")))
        {
            $this->_logger->error("Unable to load SSO type $ssoType, failing SSO sign off.");
            throw new Exception("Unable to load SSO type $ssoType.");
        }

        if (!($sso instanceof Sahara_Auth_SSO))
        {
            $this->_logger->_error("SSO type $type is not an implementation of Sahara_SSO_Type. Failing SSO sign off..");
            throw new Exception("$ssoType is not an instance of Sahara_Auth_SSO");
        }

        $sso->signoff();
    }

    /**
     * Sets up a session.
     */
    public function setupSession()
    {
        $sessionTypes = $this->_config->auth->session;
        if (!$sessionTypes) return;

        foreach ($sessionTypes as $session)
        {
            /* Configuration format is <Session Type>{<Succeeding auth type>,...,}. */
            list($setup, $auth) = explode('{', $session, 2);

            /* If no auth types are configured for the session setup to run, don't
             * run it. */
            if (!strpos($auth, '}')) continue;

            /* Only run the session setup, if it is configured to run for the
             * the succeeding auth type. */
            $auth = substr($auth, 0, -1);
            if (!in_array($this->_successType->getAuthType(), explode(',', $auth))) continue;

            if (!($obj = $this->_loadclass($this->_institution . "_Auth_Session_$setup")) &&
                !($obj = $this->_loadclass("Sahara_Auth_Session_$setup"))) continue;

            $obj->setSuccessfulAuthType($this->_successType);
            $obj->setup();
        }
    }

    /**
     * Gets the username.
     */
    public function getUsername()
    {
        return $this->_username;
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
            foreach (explode(PATH_SEPARATOR, get_include_path()) as $path)
            {
                if (file_exists($path . '/' . $file))
                {
                    return new $name();
                }
            }

            $this->_logger->debug("Unable to find auth class $name in include path.");
            return false;
        }
        catch (Exception $ex)
        {
            $this->_logger->fatal("Failed to load auth class $name, with error: " . $ex->getMessage());
            return false;
        }
    }

    /**
     * Gets a fake password comprising numbers, lower and upper case letters.
     *
     * @return String password
     */
    private function _fakePassword()
    {
        $pass = '';
        for ($i = 0; $i < 8; $i++)
        {
            switch (rand(0, 2))
            {
                case 0: // Numbers
                    $pass .= chr(rand(48, 57));
                    break;
                case 1: // Upper case letters
                    $pass .= chr(rand(65, 90));
                    break;
                case 2: // Lower case letters
                    $pass .= chr(rand(97, 122));
                    break;
            }
        }
        return $pass;
    }
}
