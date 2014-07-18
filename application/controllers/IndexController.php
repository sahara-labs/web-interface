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
        $this->view->headTitle($this->_headPrefix . 'Login');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $config = Zend_Registry::get('config');
        $this->view->inst = $inst = $config->institution;

        $form = new Sahara_Auth_Form();
        $this->view->form = $form;

        $this->view->localLabel = $config->auth->localLabel;
        if ($this->view->ssoLayout = ($config->auth && $config->auth->useSSO))
        {
            $this->view->localAuth = $config->auth->useLocalAuth;

            /* Load interface information. */
            $this->view->ssoIcon = $config->auth->ssoIcon;
            $this->view->ssoLabel = $config->auth->ssoLabel;
            $this->view->ssoHover = $config->auth->ssoHover;
            $this->view->localIcon = $config->auth->localIcon;
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

                /* The authentication method may modify the username, such as prefixing the username,
                 * so we will read it back out. */
                $username = $saharaAuth->getUsername();
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
                case Sahara_Acl::RESEARCH:
                    $this->_redirectTo('index', 'queue');
                    break;
                case Sahara_Acl::ACADEMIC:
                    $this->_redirectTo('index', 'queue');
                    break;
                case Sahara_Acl::ADMIN:
                    $this->_redirectTo('index', 'queue');
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

        /* We may need to pass auth token through. */
        $params = array();
        if ($this->_getParam('pkey')) $params['pkey'] = $this->_getParam('pkey');

        if (!$saharaAuth->signon($params))
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

        if ($this->_getParam('pkey'))
        {
            /* Authorisation key has been specified, so redeem it. */
            $ac = new Sahara_AccessKey();
            $res = $ac->keyActivate(urldecode($this->_getParam('pkey')));
            if (!$res['success'])
            {
                $this->_flashMessenger->addMessage('Failed permission redemption: ' . $res['error']);
            }
        }

        /* Redirect to an appropriate page. */
        switch ($user->persona)
        {
            case Sahara_Acl::USER:
                $this->_redirectTo('index', 'queue');
                break;
            case Sahara_Acl::RESEARCH:
            	$this->_redirectTo('index', 'research');
            	break;
            case Sahara_Acl::ACADEMIC:
                $this->_redirectTo('index', 'queue');
                break;
            case Sahara_Acl::ADMIN:
                $this->_redirectTo('index', 'queue');
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
     * Receives a support request.
     */
    public function supportAction()
    {
        /* Disable view renderer and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $params = $this->_request->getParams();

        /* Try to detect bots auto-submitting the form. Two methods are currently
         * employed, making sure the user agent starts with 'Mozilla' & making sure
         * the honeypot field is not set. */
        if ((isset($params['botsfu']) && $params['botsfu'] != '') || // Bot honey pot
            (!isset($params['useragent']) || $params['useragent'] == '' || // User agent must be set
                    strpos(trim($params['useragent']), 'Mozilla/') !== 0)) // User agent must start with Mozilla, GG Opera
        {
            $this->_logger->warn('Rejecting support message from IP: ' . $this->_getRemoteIP() . ', name: ' .
                    $params['name'] . ', email: ' . $params['email']);
            echo $this->view->json(array('success' => 'false'));
            return;
        }


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
        $body .= "IP: " . $this->_getRemoteIP() . "\n";
        $body .= "User Agent: " . urldecode($params['useragent']) . "\n";
        $body .= "Java enabled: " . $params['javaenabled'] . "\n";
        $body .= "UTC Offset: " . $params['utcoffset'] . "\n";

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
     * Returns the remote IP of the client.
     *
     * @return string the remote IP
     */
    private function _getRemoteIP()
    {
        return isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'];
    }

    /**
     * Help page.
     */
    public function requirementsAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Help');
    }

    /**
     * Action to activate a permission with a permission key.
     */
    public function permactivateAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout->disableLayout();

        $ac = new Sahara_AccessKey();
        echo $this->view->json($ac->keyActivate($this->_getParam('pkey')));
    }
}

