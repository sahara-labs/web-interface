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
 * @date 17th March 2010
 */

/**
 * Default controller that gets called.
 */
class IndexController extends Sahara_Controller_Action_Acl
{
	/**
	 * The default action that gets called.
	 */
    public function indexAction()
    {
        $this->view->headTitle(self::HEAD_TITLE_PREFIX . 'Login');
        $this->view->messages = $this->_flashMessenger->getMessages();

       $config = Zend_Registry::get('config');
        $this->view->inst = $inst = $config->institution;

        $form = new Sahara_Auth_Form();
        $this->view->form = $form;
        if ($this->view->ssoLayout = ($config->auth && $config->auth->useSSO))
        {
            $this->view->localAuth = $config->auth->useLocalAuth;

            /* Load interface information. */
            $this->view->ssoIcon = $config->auth->ssoIcon;
            $this->view->ssoLabel = $config->auth->ssoLabel;
            $this->view->ssoHover = $config->auth->ssoHover;
            $this->view->localIcon = $config->auth->localIcon;
            $this->view->localLabel = $config->auth->localLabel;
            $this->view->localHover = $config->auth->localHover;
        }

        if ($this->_request->isPost() && $form->isValid($this->_request->getParams()))
        {
            Zend_Session::regenerateId();

            $username = $form->getValue('username');
            $password = $form->getValue('password');

            if ($config->auth && $config->auth->useSahara)
            {
                $saharaAuth = new Sahara_Auth($username, $password);
                if (!$saharaAuth->authenticate())
                {
                    /* Authentication failed. */
                    $this->view->messages = array('Authentication failure.');
                    return;
                }

                $saharaAuth->setupSession();
            }
            else
            {
                /******************************************************************
                 ** TODO Add your authentication.                                **
                 ******************************************************************/
            }

            $user = Sahara_Soap::getSchedServerPermissionsClient()->getUser(array(
            		'userQName' => $inst . ':' . $username
            ));

            /* Store the authentication information if the user is authenticated. */
            if ($user->persona != Sahara_Acl::UNAUTH)
            {
                $storage = $this->_auth->getStorage();
                $storage->clear();
                $storage->write($user->userQName);
            }

            /* Redirect to an appropriate page. */
            switch ($user->persona)
            {
                case Sahara_Acl::USER:
                    $this->_redirectTo('index', 'queue');
                    break;
                case Sahara_Acl::ACADEMIC:
                    $this->_redirectTo('index', 'academic');
                    break;
                case Sahara_Acl::ADMIN:
                    $this->_redirectTo('index', 'admin');
                    break;
                default:
                    $this->view->messages = array("Unknown user '$username'.");
                    break;
            }
        }
    }

    /**
     * SSO login action.
     */
    public function ssoAction()
    {
        /* Authenticate. */
        $saharaAuth = new Sahara_Auth();
        if (!$saharaAuth->signon())
        {
            $this->_flashMessenger->addMessage('Failed single sign on.');
            $this->_redirectTo('index', 'index');
        }

        /* Setup session. */
        $saharaAuth->setupSession();

		/* Validate and store account. */
        $user = Sahara_Soap::getSchedServerPermissionsClient()->getUser(array(
            		'userQName' => $this->_config->institution . ':' . $saharaAuth->getUsername()
        ));

        /* Store the authentication information if the user is authenticated. */
        if ($user->persona != Sahara_Acl::UNAUTH)
        {
            $storage = $this->_auth->getStorage();
            $storage->clear();
            $storage->write($user->userQName);
        }

        /* Redirect to an appropriate page. */
        switch ($user->persona)
        {
            case Sahara_Acl::USER:
                $this->_redirectTo('index', 'queue');
                break;
            case Sahara_Acl::ACADEMIC:
                $this->_redirectTo('index', 'academic');
                break;
            case Sahara_Acl::ADMIN:
                $this->_redirectTo('index', 'admin');
                break;
            default:
                $this->_flashMessenger->addMessage("Unknown user '" . $saharaAuth->getUsername() . "'.");
                $this->_redirectTo('index', 'index');
                break;
        }
    }

    /**
     * Logs out and ends a session.
     */
    public function logoutAction()
    {
        /* Clear the Sahara session storage. */
        $this->_auth->clearIdentity();

        if ($this->_config->auth->useSSO)
        {
            /* If we are using SSO authentication, we need to propogate the
             * logoff to the SSO service. */
            $saharaAuth = new Sahara_Auth();
            $saharaAuth->signoff();

            $message = 'You have logged out. To make sure you are completely logged out, please close your browser.';
        }
        else $message = 'You have logged out.';



        $this->_flashMessenger->addMessage($message);
        $this->_redirectTo('index', 'index');
    }

    /**
     * Receives a feedback request.
     */
    public function feedbackAction()
    {
        /* Disable view renderer and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $params = $this->_request->getParams();
        /* Make sure the fields are populated. */
        if (!(isset($params['name']) && isset($params['email']) && isset($params['type']) &&
              isset($params['purpose']) && isset($params['feedback'])))
        {
            echo $this->view->json(array('success' => 'false'));
            return;
        }
        $this->_logger->info('Received feedback email from ' . $params['name'] . ' (' . $params['email'] . '). ' .
                'Feedback type: ' . $params['type'] . '. Purpose of user: ' . $params['purpose'] . '. Feedback: ' .
                $params['feedback'] . '.');

        $mail = new Sahara_Mail();
        $mail->setFrom($params['email'], $params['name']);
        $mail->setSubject('Sahara feedback from ' . $params['name']);

        /* Feedback email body. */
        $body  = "#################################################################\n";
        $body .= "## Sahara Feedback Received\n";
        $body .= "#################################################################\n\n";

        $body .= "Time: " . date('r') . "\n\n";

        if ($cred = $this->_auth->getIdentity())
        {
            $body .= "## Session Details\n";
            $body .= "Credential: $cred\n";

            try
            {
                $session = Sahara_Soap::getSchedServerQueuerClient()
                        ->isUserInQueue(array('userQName' => $this->_auth->getIdentity()));
                $body .= "In Queue: " . ($session->inQueue ? 'true' : 'false') . "\n";
                $body .= "In Session: " . ($session->inSession ? 'true' : 'false') . "\n";

                if ($session->inQueue)
                {
                     $body .= "Queued resource ID: " . $session->queuedResouce->resourceID . "\n";
                     $body .= "Queued resource name: " . $session->queuedResouce->resourceName . "\n";
                     $body .= "Queued resource type: " . $session->queuedResouce->type . "\n";
                }

                if ($session->inSession)
                {
                     $body .= "Session resource ID: " . $session->assignedResource->resourceID . "\n";
                     $body .= "Session resource name: " . $session->assignedResource->resourceName . "\n";
                     $body .= "Session resource type: " . $session->assignedResource->type . "\n";
                }
            }
            catch (Exception $ex)
            {
                $body .= "Exception when attempting to determine session status with message '" . $ex->getMessage()
                        . "'.\n";
            }
            $body .= "\n";
        }

        $body .= "## Feedback Details\n";
        $body .= "From: " . $params['name'] . " <" . $params['email'] . ">\n";
        $body .= "Type: " . $params['type'] . "\n";
        $body .= "Purpose: " . $params['purpose'] . "\n\n";
        $body .= "Feedback:\n ";
        $body .= $params['feedback'] . "\n\n";

        $body .= "## Diagnostics:\n";
        $body .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
        $body .= "User Agent: " . urldecode($params['useragent']) . "\n";
        $body .= "Java enabled: " . $params['javaenabled'] . "\n";

        if (array_key_exists('navplugins', $params))
        {
            $body .= "Plugins:\n";
            $plugins = explode(';', urldecode($params['navplugins']));
            foreach ($plugins as $p)
            {
                if (strpos($p, '=') === false) continue;

                list($name, $ver) = explode('=', $p, 2);
                $body .= "  * $name => $ver\n";
            }
        }

        $body .= "\n#################################################################\n";

        $mail->setBody($body);

        $addresses = $this->_config->feedback->address;
        if ($addresses instanceof Zend_Config)
        {
            foreach ($addresses as $addr)
            {
            	$mail->addTo($addr);
            }
        }
        else
        {
            $mail->addTo($addresses);
        }

        try
        {
            $mail->send();
        }
        catch (Exception $ex)
        {
            $this->_logger->error('Failed to send feedback email. Error message: ' .
                    $ex->getMessage() . ". Message body: $body");
        }

        /* Tells validation engine that submission succeeded. */
        echo $this->view->json(array('success' => 'true'));
    }

    /**
     * Help page.
     */
    public function helpAction()
    {
        $this->view->headTitle(self::HEAD_TITLE_PREFIX . 'Help');
    }

    /**
     * Action to activate a permission with a permission key.
     */
    public function permactivateAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout->disableLayout();

        if (!$this->_config->permkey->enable)
        {
            $this->_logger->warn('Tried to activate permission when the permission activation feature is disabled.');
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'Permission activation feature is disabled.'
            ));
            return;
        }

        if (!($pkey = $this->_getParam('pkey')))
        {
            $this->_logger->debug("Tried to activate permission without supplied a permission key.");
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'No permission key supplied.'
            ));
            return;
        }

        $db = Sahara_Database::getDatabase();

        /* Check the key exists, has remaining uses and the redeeming class
         * is active. */
        $key = $db->fetchRow($db->select()
                ->from(array('rk' => 'user_association_redeem_keys'))
                ->join(array('uc' => 'user_class'), 'rk.user_class_id = uc.id', array('name'))
                ->where('rk.redeemkey = ?', $pkey)
                ->where('rk.remaining_uses > 0')
                ->where('uc.active = 1'));

        if (!$key)
        {
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'Key not valid.'
            ));
            return;
        }

        /* Load user. */
        list($ns, $name) = explode(':', $this->_auth->getIdentity(), 2);
        $sel = $db->select()
            ->from(array('u' => 'users'))
            ->where('namespace = ?', $ns)
            ->where('name = ?', $name);

        /* If the redemption key requires a specific organisation or affliation,
         * load the users properties. */
        if ($key['home_org'] || $key['affliation'])
        {
            $sel->join(array('s' => 'shib_users_map'), 'u.name = s.user_name', array('home_org', 'affliation'));
        }

        $user = $db->fetchRow($sel);
        if (!$user)
        {
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'Constraints not met.'
            ));
            return;
        }

        /* Check the constraints do indeed match. */
        if ($key['home_org'] && $key['home_org'] != $user['home_org'] ||
                $key['affliation'] && $key['affliation'] != $user['affliation'])
        {
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'Constraints not met.'
            ));
            return;
        }

        /* Check the user doesn't already have the user association. */
        if ($db->fetchOne($db->select()
                ->from('user_association', 'count(users_id)')
                ->where('users_id = ?', $user['id'])
                ->where('user_class_id = ?', $key['user_class_id'])) != 0)
        {
            echo $this->view->json(array(
            	'success' => false,
                'error' => 'Already been redeemed.'
            ));
            return;
        }

        /* All constraints are met so we can create the association. */
        $db->update('user_association_redeem_keys',  array('remaining_uses' => $key['remaining_uses']--),
        		'redeemkey = ' . $db->quote($key['redeemkey']));

        $db->insert('user_association', array(
            'users_id' => $user['id'],
            'user_class_id' => $key['user_class_id']
        ));

        echo $this->view->json(array('success' => true));
    }
}

