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
 * @date 21st July 2010
 */

class HomeController extends Sahara_Controller_Action_Acl
{
    public function indexAction()
    {
        $this->view->headTitle($this->_headPrefix . "Home Directory");

        $home = new Sahara_Home(Sahara_Home::getHomeDirectoryLocation());
        if (!$home->isValid())
        {
            $this->view->homeExists = false;
            return;
        }
        $this->view->homeExists = true;
        $this->view->home = $home;

        /* Use the flattened contents because directories will not get displayed. */
        $home->loadContents();
        $this->view->files = $home->getFlattenedContents();
    }

    /**
     * Action to list files in a directory as JSON.
     */
    public function listAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $home = new Sahara_Home(Sahara_Home::getHomeDirectoryLocation());
        $home->loadContents();
        echo $this->view->json($home->getFlattenedContents());
    }

    /**
     * Action list files generated during a session as JSON.
     */
    public function listsessionAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        $home = new Sahara_Home(Sahara_Home::getHomeDirectoryLocation(), time() - $response->time);
        $home->loadContents();
        echo $this->view->json($home->getFlattenedContents());
    }

    /**
     * Action to download a file.
     */
    public function downloadAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $path = Sahara_Home::getHomeDirectoryLocation();

        $reqPath = $this->_getParam('path');
        if ($reqPath) $reqPath = implode('/', explode(':', $reqPath));
        $reqFile = $this->_getParam('file');
        $mime = $this->_getParam('mime');
        if ($mime) $mime = implode('/', explode(':', $mime));

        list($junk, $user) = explode(':', $this->_auth->getIdentity(), 2);

        /* If a path was provided, add that to the download path. */
        if ($reqPath && !($path = realpath($path . '/' . $reqPath)))
        {
            $this->_logger->warn("Unable to download file $reqFile because path $path does not exist in home directory " .
            		"$homeDir.");
            echo "FAILED: Path $reqPath does not exist.";
            return;
        }

        /* Make sure the download path contains the users name. The assumption
         * is the home directory is composed of something like:
         * 	  '/home/<user name>/<request path>/<request file>' or
         *    'C:/Users/<user name>/<request path>/<request file>'. */
        if (strpos($path, $user) === false)
        {
            $this->_logger->warn("Unable to download file $reqFile because path $path does not contain user name $user.");
            echo "FAILED: Path does not include name $user.";
            return;
        }

        $file = $path . '/' . $reqFile;
        if (!is_file($file))
        {
            $this->_logger->warn("Unable file download of $reqFile because it does not exist.");
            echo "FAILED: File $reqFile does not exist.";
            return;
        }

        if (!is_readable($file))
        {
            $this->_logger->warn("Unable to download file $reqFile because it is not readable.");
            echo "FAILED: File $reqFile is not readable.";
            return;
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . ($mime ? mime : 'application/octet-stream'));
        header('Content-Disposition: attachment; filename='.basename($file));
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file));
        ob_clean();
        flush();
        readfile($file);
        return;
    }

    /**
     * Action to delete a file.
     */
    public function deleteAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $path = $homePath = Sahara_Home::getHomeDirectoryLocation();

        $reqPath = $this->_getParam('path');
        if ($reqPath) $reqPath = implode('/', explode(':', $reqPath));
        $reqFile = $this->_getParam('file');

        list($junk, $user) = explode(':', $this->_auth->getIdentity(), 2);

        if ($reqPath && !($path = realpath($path . '/' . $reqPath)))
        {
            $this->_logger->warn("Unable to delete $reqFile because path $path does not exist in home directory " .
            		"$homeDir.");
            echo "FAILED: Path $reqPath does not exist.";
            return;
        }

        if (strpos($path, $user) === false)
        {
            $this->_logger->warn("Unable to delete $reqFile because path $path does not contain user name $user.");
            echo "FAILED: Path does not include name $user.";
            return;
        }

        $file = $path . '/' . $reqFile;
        if (!is_file($file))
        {
            $this->_logger->warn("Unable to delete $reqFile because it does not exist.");
            echo "FAILED: File $reqFile does not exist.";
            return;
        }

        if (!unlink($file))
        {
            echo 'FAILED: Permission denied.';
            return;
        }

        $home = new Sahara_Home($homePath);
        $home->loadContents();
        echo $this->view->json($home->getFlattenedContents());
    }

    /**
     * Action to delete a file.
     */
    public function deletesessionAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $path = $homePath = Sahara_Home::getHomeDirectoryLocation();

        $reqPath = $this->_getParam('path');
        if ($reqPath) $reqPath = implode('/', explode(':', $reqPath));
        $reqFile = $this->_getParam('file');

        list($junk, $user) = explode(':', $this->_auth->getIdentity(), 2);

        if ($reqPath && !($path = realpath($path . '/' . $reqPath)))
        {
            $this->_logger->warn("Unable to delete $reqFile because path $path does not exist in home directory " .
            		"$homeDir.");
            echo "FAILED: Path $reqPath does not exist.";
            return;
        }

        if (strpos($path, $user) === false)
        {
            $this->_logger->warn("Unable to delete $reqFile because path $path does not contain user name $user.");
            echo "FAILED: Path does not include name $user.";
            return;
        }

        $file = $path . '/' . $reqFile;
        if (!is_file($file))
        {
            $this->_logger->warn("Unable to delete $reqFile because it does not exist.");
            echo "FAILED: File $reqFile does not exist.";
            return;
        }

        if (!unlink($file))
        {
            echo 'FAILED: Permission denied.';
            return;
        }

        $response = Sahara_Soap::getSchedServerSessionClient()->getSessionInformation(array(
            'userQName' => $this->_auth->getIdentity()
        ));

        $home = new Sahara_Home($homePath, time() - $response->time);
        $home->loadContents();
        echo $this->view->json($home->getFlattenedContents());
    }
}
