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
                    "have access to (controller=$controller - action=$action).");
            $this->_flashMessenger->addMessage("Permission denied accessing $action on $controller.");
            $this->_redirector->goto('index', 'index');
        }

        /* Check if the user has a pending request and should be in the queue or on a experiment page. */
        // TODO redirect to experiment or queue page
    }
}