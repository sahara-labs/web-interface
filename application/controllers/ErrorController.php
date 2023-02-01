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
 * Error controller.
 */
class ErrorController extends Zend_Controller_Action
{
    /** Puesdo role when an error occurs. */
    const PUESDO_ROLE_ERROR = 'ERROR';

    /**
     * Error action.
     */
    public function errorAction()
    {
        $config = Zend_Registry::get('config');

        $this->view->headTitle(($config->page->title ? $config->page->title :
                Sahara_Controller_Action_Acl::DEFAULT_HEAD_PREFIX) . ' - ' . 'Error Occurred',
                Zend_View_Helper_Placeholder_Container_Abstract::SET);

        /* Information that should have been populated by the action
         * pre-dispatch hook, but because this is an error fallback,
         * we assume nothing. */
        $this->view->userRole = self::PUESDO_ROLE_ERROR;
        $this->view->controller = 'index';
        $this->view->action = 'index';

        $errors = $this->_getParam('error_handler');

        switch ($errors->type)
        {
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_ROUTE:
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_CONTROLLER:
            case Zend_Controller_Plugin_ErrorHandler::EXCEPTION_NO_ACTION:
                /*---- 404 error -- controller or action not found. ---------*/
                $this->getResponse()->setHttpResponseCode(404);
                $this->view->code = 404;
                $this->view->message = '404 - Page not found';
                break;
            default:
                /*---- Application error. -----------------------------------*/
                $this->sendErrorEmail($errors);

                /* Clear the authentication information, if not in debug. */
                if (APPLICATION_ENV != 'development') $auth = Zend_Auth::getInstance()->clearIdentity();

                $this->getResponse()->setHttpResponseCode(500);
                $this->view->code = 500;
                $this->view->message = '500 - Application Error';
                break;
        }

        if (($log = Sahara_Logger::getInstance()) &&
                ($this->view->code != 404 || APPLICATION_ENV == 'development'))
        {
            $log->fatal($this->view->message .': ' . $errors->exception);
        }

       	$this->view->env = APPLICATION_ENV;
       	$this->view->exception = $errors->exception;
        $this->view->request = $errors->request;
    }

    private function sendErrorEmail($errors)
    {
        $config = Zend_Registry::get('config');
        if ($config->error->disableMessages) return;

        $request = $errors->request;
        $exception = $errors->exception;

        $mail = new Sahara_Mail();
        $mail->setFrom($config->email->from->address, $config->email->from->name);
        $mail->setSubject('Sahara WI fatal error occurred at ' . date('r'));

        $body  = "#################################################################\n";
        $body .= "## Sahara Fatal Error\n";
        $body .= "#################################################################\n\n";
        $body .= "Time: " . date('r') . "\n";
        $body .= "Request: " . $request->getRequestUri() . "\n";
        $body .= "Params: ";
        foreach ($request->getParams() as $p => $v)
        {
            /* Don't provide the clear text credential. */
            $len = strlen($v);
            if ($p == 'password')
            {
                 $v = '';
                 for ($i = 0; $i < $len; $i++) $v .= '*';
            }

            $body .= "$p=$v ";
        }
        $body .= "\n\n";

        /* ---- Error Information ---------------------------------------------*/
        $body .= "#################################################################\n";
        $body .= "## Error information\n";
        $body .= "Type: " . $errors->type . "\n";
        $body .= "Exception: " . get_class($exception) . "\n";
        $body .= "Message: " . $exception->getMessage(). "\n";
        $body .= "Code: " . $exception->getCode() . "\n";
        $body .= "File: " . $exception->getFile() . "\n";
        $body .= "Line: " . $exception->getLine() . "\n";
        $body .= "Trace: \n";
        $body .= $exception->getTraceAsString() . "\n\n";

        /* ---- Session Information -------------------------------------------*/
        if ($cred = Zend_Auth::getInstance()->getIdentity())
        {
            $body .= "#################################################################\n";
            $body .= "## Session information\n";
            $body .= "Credential: $cred\n";

            try
            {
                $session = Sahara_Soap::getSchedServerQueuerClient()
                        ->isUserInQueue(array('userQName' => Zend_Auth::getInstance()->getIdentity()));
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
                $body .= "Exception when attempting to determine session status with message '" .
                        $ex->getMessage() . "', code " . $ex->getCode() . ".\n";
            }
        }
        else
        {
            $body .= "#################################################################\n";
            $body .= "## No session information\n";
        }

        $body .= "#################################################################\n\n";

        $mail->setBody($body);

        $addresses = $config->error->address;
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
            /* Nothing much more we can do. */
        }
    }
}

