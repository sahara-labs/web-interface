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
        $this->view->headTitle('Remote Labs - Login');
        $this->view->messages = $this->_flashMessenger->getMessages();

        $inst = Zend_Registry::get('config')->institution;
        $this->view->inst = $inst;

        $form = new Sahara_Auth_Form();
        $this->view->form = $form;

        if ($this->_request->isPost() && $form->isValid($this->_request->getParams()))
        {
            Zend_Session::regenerateId();

            $username = $form->getValue('username');
            $password = $form->getValue('password');

            /******************************************************************
             ** TODO Add your authentication.                                **
             ******************************************************************/

            /* Store the authentication information. */
            $qName =  $inst . ':' . $username;
            $storage = $this->_auth->getStorage();
            $storage->clear();
            $storage->write($qName);


            $user = Sahara_Soap::getSchedServerPermissionsClient()->getUser(array('userQName' => $qName));
            if ($user->persona == 'NOTFOUND')
            {
                /**************************************************************
                 ** TODO Try to find about the user and add permissions.     **
                 **************************************************************/
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
                    $this->view->messages = array("Unknown user \"$qName\".");
                    break;
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

        $params = $this->_request->getParams();
        $this->_logger->info('Received feedback email from ' . $params['name'] . ' (' . $params['email'] . '). ' .
                'Feedback type: ' . $params['type'] . '. Purpose of user: ' . $params['purpose'] . '. Feedback: ' .
                $params['feedback'] . '.');

        // TODO email feedback report

        /* Tells validation engine that submission succeeded. */
        echo 'true';
    }
}

