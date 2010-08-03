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
 * @date 3rd August 2010
 */

/**
 * Controller for batch file uploads and batch operations.
 */
class BatchController extends Sahara_Controller_Action_Acl
{
    /**
     * Uploads a batch file for assignment for running on allocation.
     */
    public function uploadAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        echo 'Not yet implemented.';
    }

    /**
     * Uploads a batch file to the rig client. The user must already been to be
     * assigned to a rig.
	 */
    public function torigclientAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            $error = array(
                'success' => 'false',
                'error' => array(
                    'code' => -1,
                    'operation' => 'Batch control request',
                    'reason' => 'not in session'
                )
            );
            echo $this->view->json($error);
            return;
        }

        $adapter = new Zend_File_Transfer_Adapter_Http();

        $dest = $this->_config->upload->dir;
        if (!$dest)
        {
            $this->_logger->error("Batch download directory not configured, 'upload.dir' property.");
            throw new Exception("Batch download directory not configured.");
        }

        $adapter->setDestination($dest)
                ->addValidator('Count', false, 1);

        /* Size file validator. */
        if ($size = $this->_config->upload->size)
        {
             $adapter->addValidator('FilesSize', false, $size);
        }

        /* Extension file validator. */
        if ($ext = $this->_config->upload->extension)
        {
             $adapter->addValidator('Extension', false, $ext);
        }

        if (!$adapter->receive())
        {
            $error = 'File validation has failed.';
            foreach ($adapter->getMessages() as $k => $v)
            {
                switch ($k)
                {
                    case 'fileExtensionFalse':
                        $error .= ' The file extension was incorrect.';
                        break;
                    case 'fileUploadErrorIniSize':
                    case 'fileUploadErrorFormSize':
                        $error .= ' The file size was too large.';
                        break;
                    default:
                        $error .= ' ' . $v;
                        break;
                }
            }

            echo $this->view->json(array(
                'success' => false,
                'error' => array(
                    'code' => -10,
                    'operation' => 'Batch file upload',
                    'reason' => $error
                )
            ));
            return;
        }

        $file = $adapter->getFileName();
        list($ns, $name) = explode(':', $this->_auth->getIdentity());
        $request = array(
            'requestor' => $name,
            'fileName'  => basename($file),
            'batchFile' => file_get_contents($file)
        );

        if (!$request['batchFile'])
        {
            $this->_logger->warn("Failed to read batch file $file.");
             echo $this->view->json(array(
                'success' => false,
                'error' => array(
                    'code' => -10,
                    'operation' => 'Batch file upload',
                    'reason' => 'Failed to read batch file'
                )
            ));
            return;
        }

        unlink($file);

        try
        {
            $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
            echo $this->view->json($rigClient->performBatchControl($request));
        }
        catch (Exception $ex)
        {
            $this->_logger->error("Soap error bcalling batch 'performPrimitiveControl'. Message: "
            . $ex->getMessage() . ', code: ' . $ex->getCode() . '.');
            echo $this->view->json($ex);
        }
    }

    /**
     * Gets the status of running batch invocation.
     */
    public function statusAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            $error = array(
                'success' => 'false',
                'error' => array(
                    'code' => -1,
                    'operation' => 'Batch status request',
                    'reason' => 'not in session'
                )
            );
            echo $this->view->json($error);
            return;
        }

        $rigClient = new Sahara_Soap($response->contactURL . '?wsdl');
        echo $this->view->json($rigClient->getBatchStatus(
        ));
        return;
    }

    /**
     * Terminates a running batch invocation.
     */
    public function terminateAction()
    {
        // TODO batch terminate
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        if (!$response->isInSession)
        {
            /* Not in session, so unable to determine the rig clients address. */
            $error = array(
                'success' => 'false',
                'error' => array(
                    'code' => -1,
                    'operation' => 'Batch control request',
                    'reason' => 'not in session'
                )
            );
            echo $this->view->json($error);
            return;
        }


        echo 'Not yet implemented.';
    }
}