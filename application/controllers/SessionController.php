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
 * @date 5th April 2010
 */

/**
 * Controller for being in session.
 */
class SessionController extends Sahara_Controller_Action_Acl
{
    /**
     * Action which displays the session page.
     */
    public function indexAction()
    {
        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        $this->view->rig = $this->view->stringTransform($response->resource->resourceName, '_', ' ');
        $this->view->headTitle("Remote Labs - " . $this->view->rig);

        $this->view->time = array(
            'hours' => floor($response->time / 3600),
            'mins'  => floor(($response->time % 3600) / 60),
            'secs'  => floor(($response->time % 3600) % 60)
        );

        $this->view->remaining = array(
            'hours' => floor($response->timeLeft / 3600),
            'mins' => floor(($response->timeLeft % 3600) / 60),
            'secs'  => floor(($response->timeLeft % 3600) % 60)
        );

        $this->view->rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
        $this->view->info = $response;

        /* Type specific page rendering. */
        if (($instDir = realpath(Bootstrap::$rootDirectory .'/../institution/' .
                Zend_Registry::get('config')->institution . '/scripts/')))
        {
            $scriptPaths = $this->view->getScriptPaths();
            array_push($scriptPaths, $instDir);
            $this->view->setScriptPath($scriptPaths);
        }
        else
        {
            $this->_logger->info("Institution rig script directory does not exist so overridden rig scripts " .
            	"will not be renderable.");
        }
    }

    /**
     * Action to provide info about a session.
     */
    public function infoAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        echo $this->view->json($response);
    }

    /**
     * Action to finish a rig session.
     */
    public function finishAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->finishSession(array(
        		'userQName' => $this->_auth->getIdentity()
        ));

        echo $this->view->json($response);
    }

    /**
     * Action to bridge a primitive call to the in session rigclient. The
     * response is returned as a JSON string.
     */
    public function primitiveBridgeAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();



        echo $this->view->json($response);
    }
}