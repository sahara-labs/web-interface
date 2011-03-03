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
 * @date 3rd March 2011
 */

/**
 * Controller to for Single Sign On support.
 */
class SsoController extends Sahara_Controller_Action_Acl
{
    /** simpleSAMLPHP SSO type. */
    const SIMPLE_SAML = 'simpleSAMLPHP';

    /**
     * Login.
     */
    public function loginAction()
    {
        if (!$this->_config->auth->useSSO)
        {
            $this->_logger->error('Attempted SSO sign on when SSO auth path is disabled.  Set the \'auth.useSSO\' ' .
                    'property to true to enable the SSO feature.');
            throw new Exception('Attempted SSO sign on when SSO auth path is disabled.');
        }

        switch ($this->_config->auth->ssoType)
        {
            case self::SIMPLE_SAML:
                $this->_simpleSamlPhp();
                break;
            default:
                $this->_logger->error('Unknown single sign on type \'' + $this->_config->auth->ssoType + '\'.');
                throw new Exception('Unknown single sign on type.');
        }
    }

    private function _simpleSamlPhp()
    {
        $this->_bootstrapSimpleSamlPhp();

        if (!($sp = $this->_config->simpleSaml->authSource))
        {
            $this->_logger->error('simpleSAMLPHP authentication source is not configured. Set ' .
            		'\'simpleSaml.authSource\ with the authentication source.');
            throw new Exception("simpleSAMLPHP authentications source not configured.");
        }

        $ssimple = new SimpleSAML_Auth_Simple($sp);

        /* This will trigger SSO login. If the user isn't logged in, they while
         * be redirected to an auth source. */
        $ssimple->requireAuth(array(
            'ReturnTo' => 'http://apollo.eng.uts.edu.au:7070/index/login'
        ));

        $attrs = new Sahara_Auth_SSO_SimpleSAML_ShibAttributes($ssimple->getAttributes());

        $id = '';
        if ($this->_config->simpleSaml->shib->forceSharedToken)
        {
            /* The ID must be the shared token, fail otherwise. */
            if (!($id = $attrs->getSharedToken()))
            {
                $this->_logger->error('Unable to obtain shared token for simpleSAMLPHP login. Attribute dump: ' .
                       $attrs->implode());
                $this->_flashMessenger->addMessage('Failed authentication (unable to obtain shared token).');
                $this->_redirectTo('index', 'index');
            }
        }
        else if ($this->_config->simpleSaml->shib->forceTargetedID)
        {
            /* The ID must be the targeted ID, fail otherwise. */
            if (!($id = $attrs->getTargetedID()))
            {
                $this->_logger->error('Unable to obtain targetted ID for simpleSAMLPHP login. Attribute dump: ' .
                        $attrs->implode());
                $this->_flashMessenger->addMessage('Failed authentication (unable to obtain targeted ID).');
                $this->_redirectTo('index', 'index');
            }
        }
        else
        {
            /* Here we first try shared token and fall back to targetted ID.
             * As long as one is valid, we can continue. */
            $id = $attrs->getSharedToken() ? $attrs->getSharedToken() : $attrs->getTargetedID();
            if (!$id)
            {
                $this->_logger->error('Unable to obtain either shared token or targeted ID for simpleSAMLPHP login.' .
                        'Attribute dump: ' . $attrs->implode());
                $this->_flashMessenger->addMessage('Failed authentication (unable to obtain shared token or ' .
                		'targeted ID).');
               $this->_redirectTo('index', 'index');
            }
        }

        $db = Sahara_Database::getDatabase();
        $shibMapTable = new Zend_Db_Table('shib_users_map');
        $usersTable = new Zend_Db_Table('users');

        $mapping = $table->fetchRow($table->select()
                        ->where('tid = ?', $id));
        if ($mapping)
        {
            /* The mapping already exists, so no need to generate an account. */
            $users = $db->fetchRow($db->select()
                    ->from('users')
                    ->where('id = ?', $mapping->users_id));
        }
        else
        {
            /* This is the first time the user has logged into the system, so
             * we need to generate an account for them. */
            $this->_logger->info("First login of SSO user with ID $id so going to generate an account for them.");

            $fname = $attrs->getFirstname();
            $lname = $attrs->getLastname();
            if (!$fname || !$lname)
            {
                $this->_logger->debug("First name ($fname) and last name ($lname) combination was not valid for  " .
                	'SSO account generation. Falling back to display name.');
                list($fname, $lname) = explode($attrs->getDisplayName(), 2);
            }

            $uid = '';
            $foundUid = false;
            $i = 0;
            if ($fname && $lname)
            {

            }


            if (!$foundUid)
            {
                $i = 0;
                $this->_logger->debug("Generating Sahara ID from shared token or targetted ID.");
                do
                {

                }
                while (!$foundUid);
            }
        }

        return $users;
    }

    private function _sanitise($str)
    {

    }

    /**
     * Sets up the simpleSAMLPHP by registering its autoloader.
     */
    private function _bootstrapSimpleSamlPhp()
    {
        return;

        if (!($path = $this->_config->simpleSaml->location))
        {
            $this->_logger->error('The location of the simpleSAMLPHP directory is not configured. Set the ' .
                    "'simpleSaml.location' with the location of the simpleSAMLPHP installation directory.");
            throw new Exception('The location of the simpleSAMLPHP directory is not configured.');
        }

        $file = realpath($path . '/lib/_autoload.php');
        if (!is_file($file))
        {
            $this->_logger->error("The configure simpleSAMLPHP installation directory ($path) does not appear to " .
            	    'a valid simpleSAMLPHP installation.');
            throw new Exception("Didn't find autoloader, check installation path.");
        }

        include_once $file;
    }
}