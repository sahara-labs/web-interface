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
 * @date 18th March 2010
 */

/**
 * Base class for controller classes.
 * <br />
 * Sets up and ensures the user has permission.
 */
class Sahara_Controller_Action_Acl extends Zend_Controller_Action
{
    /** Pseudo role for in queue users. */
    const PSEUDO_ROLE_QUEUE = "INQUEUE";

    /** Pseudo role for in session users. */
    const PSEUDO_ROLE_SESSION = "INSESSION";

    /** @var Sahara_Acl Authorisation. */
    protected $_acl;

    /** @var Zend_Auth Authentication. */
    protected $_auth;

    /** @var Zend_Controller_Action_Helper_FlashMessenger Flash messager to
     *  between redirects. */
    protected $_flashMessenger;

    /** @var Zend_Controller_Action_Helper_Redirector Redirector to redirect
     *  to other action controller. */
    protected $_redirector;

    /** @var Sahara_Logger Logger. */
    protected $_logger;

    /** @var array Controlled pages which will not redirect. */
    private $_noRedirectPages = array('indexlogout', 'indexfeedback', 'queuecancel', 'queueupdate',
                                      'sessionfinish');

    /**
     * Initalisation.
     */
    public function init()
    {
        $this->_auth = Zend_Auth::getInstance();
        $this->_acl = new Sahara_Acl($this->_auth->getIdentity());

        $this->_logger = Sahara_Logger::getInstance();

        $this->_flashMessenger = $this->getHelper('FlashMessenger');
        $this->_redirector = $this->getHelper('Redirector');
    }

    /**
     * Loads up permissions and authorisation. If the user is authorized to view
     * the current page they are redirected to the login page.
     */
    public function preDispatch()
    {
        $this->_acl->loadPermissions();

        $controller = $this->getRequest()->getControllerName();
        $action = $this->getRequest()->getActionName();

        /* Check if the user has permission for the requested resource. */
        if (!$this->_acl->hasPermission($controller, $action))
        {
            $this->_logger->warn('User ' . $this->_auth->getIdentity() . " tried to access a resource they do not " .
                    "have access to (controller=$controller, action=$action).");
            $this->_flashMessenger->addMessage("Permission denied accessing $action on $controller.");
            $this->_redirectTo('index', 'index');
        }

        /* Set up some information for the navigation menu. */
        $this->view->userRole = $this->_acl->getUserRole();
        $this->view->controller = $controller;
        $this->view->action = $action;


        /* Check if the user has a pending request and should be in the queue
         * or on a experiment page. */
        if ($this->_acl->getUserRole() != Sahara_Acl::UNAUTH)
        {
            $session = Sahara_Soap::getSchedServerQueuerClient()->isUserInQueue(array('userQName' => $this->_auth->getIdentity()));
            $this->_logger->debug('User ' . $this->_auth->getIdentity() . ' with role ' . $this->_acl->getUserRole() .
                    ' is ' . ($session->inQueue ? 'in queue' : 'not in queue') . ' and ' .
                    ($session->inSession ? 'in session.' : 'not in session') . '.');

            /* Force a user to be specific places depending on where they are in session. */
            if ($session->inQueue && "$controller$action" != 'queuequeuing' &&
                    !in_array("$controller$action", $this->_noRedirectPages))
            {
                /* User in queue but not on queueing page. */
                $this->_logger->debug('Redirecting user ' . $this->_auth->getIdentity() . ' to queueing page (queuing ' .
                        "action on queue) from $action on $controller.");
                $this->_redirectTo('queuing', 'queue');
            }
            else if ($session->inQueue)
            {
                $this->view->userRole = self::PSEUDO_ROLE_QUEUE;
            }
            else if ($session->inSession && "$controller$action" != 'sessionindex' &&
                    !in_array("$controller$action", $this->_noRedirectPages))
            {
                /* User in session but not on session page. */
                $this->_logger->debug('Redirecting user ' . $this->_auth->getIdentity() . ' to session page (index ' .
                        "action on session) from $action on $controller.");
                $this->_redirectTo('index', 'session');
            }
            else if ($session->inSession)
            {
                $this->view->userRole = self::PSEUDO_ROLE_SESSION;
            }
            else if ("$controller$action" == 'queuequeuing' || "$controller$action" == 'sessionindex')
            {
                /* User in queue or experiment page, but not in either. */
                $this->_logger->debug('Redirecting user ' . $this->_auth->getIdentity() . ' to role home from ' .
                    "$action on $controller.");

                /* Was in queue or in session, but thatis finished so redirect
                 * them back home. */
                switch ($this->_acl->getUserRole())
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
    }

    /**
     * Redirects to the specified controller action. Request parameters
     * can optionally be supplied.
     *
     * @param String $action action to redirect to
     * @param String $controller controller containing the action
     * @param array $params request parameters (optional)
     */
    protected function _redirectTo($action, $controller, $params = array())
    {
        $this->_redirector->goto($action, $controller, null, $params);
    }
}