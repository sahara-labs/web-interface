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
 * @date 16th August 2013
 */

/**
 * Controller for research data file handling.
 */
class DatafileController extends Sahara_Controller_Action_Acl
{
    /**
     * Action that downloads a data file.
     */
    public function downloadAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        /* Load file. */
        if (!($fID = $this->_getParam('file')) || !($file = Sahara_Database_Record_SessionFile::load($fID)))
        {
            echo 'File not found.';
            return;
        }

        /* Make sure the file is loadable. */
        if (!$file->isDownloadable())
        {
            echo 'File not readable.';
            return;
        }

        /* Check the user actually generated the file. */
        list($ns, $user) = explode(':', $this->_auth->getIdentity(), 2);
        if (!($file->session->user->namespace == $ns && $file->session->user->name))
        {
            echo 'Not authorised to access file.';
            return;
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . ($mime ? mime : 'application/octet-stream'));
        header('Content-Disposition: attachment; filename=' . $file->name);
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file->getAbsolutePath()));
        ob_clean();
        flush();
        readfile($file->getAbsolutePath());
        return;
    }

    /**
     * Action to upload a new data file.
     */
    public function uploadAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        /* Load the session the file is being attached too. */
        if (!($sID = $this->_getParam('session-id')) || !($session = Sahara_Database_Record_Session::load($sID)))
        {
            echo 'FAILED: Session not found.';
            return;
        }
        
        /* Make sure the user is the person who ran the session. */
        list($ns, $user) = explode(':', $this->_auth->getIdentity(), 2);
        if (!($session->user->namespace == $ns && $session->user->name == $user))
        {
            echo 'FAILED: Not authorised to add file.';
            return;
        }
        
        /* Upload the file. */
        if (!($dest = $this->_config->upload->dir))        
        {
        	$this->_logger->error("Download directory not configured, 'upload.dir' property.");
        	throw new Exception('Download directory not configured.');
        }
        
        /* Configure the file uploader. */
        $adapter = new Zend_File_Transfer_Adapter_Http();        
        $adapter->setDestination($dest);
        if ($size = $this->_config->upload->size)
        {
        	$adapter->addValidator('FilesSize', false, $size);
        }
        
        /* Receive the files. */        
        if (!$adapter->receive())
        {
        	$error = 'File validation has failed.';
        	foreach ($adapter->getMessages() as $k => $v)
        	{
        		switch ($k)
        		{
        			case 'fileUploadErrorIniSize':
        			case 'fileUploadErrorFormSize':
        				$error .= ' The file size was too large.';
        				break;
        			default:
        				$error .= ' ' . $v;
        				break;
        		}
        	}
        
        	echo "FAILED: $error";
        	return;
        }
        
        /* Stores the files. */
        $names = array();
        foreach ($adapter->getFileInfo() as $file => $info)
        {
            $sf = new Sahara_Database_Record_SessionFile();
            $sf->session = $session;

            $sf->transferred = true;
            $sf->transfer = 'UPLOAD';
            $sf->timestamp = new DateTime();

            $path = $adapter->getFileName($file);
            $sf->name = implode('_', explode(' ', substr($path, strrpos($path, '/') + 1)));

            if (!($this->_config->ands && ($script = $this->_config->ands->fileops) && 
                    ($mounter = $this->_config->ands->mountuser) && $mount = $this->_config->ands->mountpoint))
            {
            	$this->_logger->warn('ANDS file operations script or mount user not configured.');
            	$response['reason'] = 'Incorrect configuration.';
            	echo $this->view->json($response);
            	return;
            }
            
            if (substr($mount, -1) != '/') $mount .= '/';
            $sf->path = "/$session->id";
            
            exec("sudo -u $mounter $script cp '$path' '$mount$session->id/$sf->name'", $output, $code);
            if ($code == 0)
            {
            	$response['success'] = true;
            }
            else
            {
            	$this->_logger->warn("Failed to copy '$path' to '$sf->path'. Code: $code, line: " . $output[0]);
            	$response['reason'] = "File copy file to shared directory. Code: $code";
            }
            
            unlink($path);
            
            try
            {
            	$sf->save();
                array_push($names, "$sf->name=$sf->id");
            }
            catch (Sahara_Database_Exception $ex)
            {
            	$this->_logger->error("Failed to add file to session '$session->id':" . $ex->getMessage());
            	echo 'FAILED: Failed to add record: ' . $ex->getMessage();
            	return;
            }
        }
        
        echo "SUCCESS: " . implode(',', $names);
    }

    /**
     * Action to delete a data file.
     */
    public function deleteAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = array('success' => false, 'message' => '');

        /* Load file. */
        if (!($fID = $this->_getParam('file')) || !($file = Sahara_Database_Record_SessionFile::load($fID)))
        {
            $response['message'] = 'File not found.';
            echo $this->view->json($response);
            return;
        }

        /* Check the user actually generated the file. */
        list($ns, $user) = explode(':', $this->_auth->getIdentity(), 2);
        if (!($file->session->user->namespace == $ns && $file->session->user->name == $user))
        {
            $response['message'] = 'Not authorised to access file.';
            echo $this->view->json($response);
            return;
        }

        $path = $file->getAbsolutePath();
        try
        {
            $file->delete();
        }
        catch (Sahara_Database_Exception $ex)
        {
            $this->_logger->error("Failed to delete record $file->id: " . $ex->getMessage());
            $response['message'] = 'Failed to delete record.';
            echo $this->view->json($message);
            return;
        }

        if (is_file($path))
        {
            if (!($this->_config->ands && ($script = $this->_config->ands->fileops) && ($mounter = $this->_config->ands->mountuser)))
            {
                $this->_logger->warn('ANDS file operations script or mount user not configured.');
                $response['reason'] = 'Incorrect configuration.';
                echo $this->view->json($response);
                return;
            }
            
            exec("sudo -u $mounter $script del '$path'", $output, $code);
            if ($code != 0)
            {
                $this->_logger->warn("Failed to delete '$path'. Code: $code, line: " . $output[0]);
                $response['reason'] = "File delete failed. Code: $code";
                echo $this->view->json($response);
                return;
            }
        }

        $response['success'] = true;
        echo $this->view->json($response);
    }
}
