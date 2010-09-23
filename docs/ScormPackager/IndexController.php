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
 * 
 * Modification: Added in ability to process parameter rigtype and use it to list it for user
 * @author Herbert Yeung
 * @date 23rd September 2010
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
        $this->view->headTitle('Remote Labs - Login');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $inst = Zend_Registry::get('config')->institution;
        $this->view->inst = $inst;

        $form = new Sahara_Auth_Form();
        $this->view->form = $form;

        // Configure database and store to the registry.
        $db = Zend_Db::factory($this->_config->db);
        Zend_Db_Table_Abstract::setDefaultAdapter($db);
        Zend_Registry::set('db', $db);
        
        if ($this->_request->isPost() && $form->isValid($this->_request->getParams()))
        {
            Zend_Session::regenerateId();

            $username = $form->getValue('username');
            $password = $form->getValue('password');

            /******************************************************************
             ** TODO Add your authentication.                                **
             ******************************************************************/
            $adapter = new Zend_Auth_Adapter_DbTable(Zend_Registry::get('db'),
                                                                       'users',                // Contact table
                                                                       'name',                 // Column containing identity
                                                                       'password', // Column containing credential
                                                                       'SHA1(?)');
            
                       $adapter->setIdentity($username);
                       $adapter->setCredential($password);
                       $result = $this->_auth->authenticate($adapter);
                       
                       if ($result->getCode() != Zend_Auth_Result::SUCCESS)
                       {
                               /* Failed authentication, so redisplay form with error message. */
                               array_push($this->view->messages, "Authentication has failed. Please enter user name and password.");
                               $this->view->form->populate($this->_request->getParams());
                               return;                         
                       }
            
            /* Store the authentication information. */
            $qName =  $inst . ':' . $username;
            $storage = $this->_auth->getStorage();
            $storage->clear();
            $storage->write($qName);

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
            /* SCORMPACKAGER - if the user requested for a resource + is a valid user
             * then pass to the QueueController indexAction() the resource type  */
            $rigtype = $this->_request->getQuery('rigtype');
            
            if(isset($rigtype) && ($user->persona == Sahara_Acl::USER ||
                                   $user->persona == Sahara_Acl::ACADEMIC || 
                                   $user->persona == Sahara_Acl::ADMIN))
            {
                // Redirect the user to QueueController indexAction() with resource type
                $this->_redirectTo('index', 'queue', array('rigTypeValue' => $rigtype));
                //$this->_redirectTo('index', 'queue', array('rigTypeValue' => $rigtype, 'rigListOfType' => get_object_vars(json_decode($resourceListResponse->queueTarget, true))));
            }
            else 
            {
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
    }

    /**
     * Logs out and ends a session.
     */
    public function logoutAction()
    {
        $this->_auth->clearIdentity();
        $this->_flashMessenger->addMessage('You have logged out.');
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

        $params = $this->_request->getPost();
        /* Make sure the fields are populated. */
        if (!(isset($params['name']) && isset($params['email']) && isset($params['type']) &&
              isset($params['purpose']) && isset($params['feedback'])))
        {
            echo 'true';
            return;
        }
        $this->_logger->info('Received feedback email from ' . $params['name'] . ' (' . $params['email'] . '). ' .
                'Feedback type: ' . $params['type'] . '. Purpose of user: ' . $params['purpose'] . '. Feedback: ' .
                $params['feedback'] . '.');

        $mail = new Sahara_Mail();
        $mail->setFrom($this->_config->email->from->address, $this->_config->email->from->name);
        $mail->setSubject('Sahara feedback from ' . $params['name'] . ' <' . $params['email'] . '>');

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
        $body .= "#################################################################\n";

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
        echo 'true';
    }
}

