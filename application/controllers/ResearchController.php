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
 * @date 31st October 2012
 */

/**
 * Controller for research project management.
 */
class ResearchController extends Sahara_Controller_Action_Acl
{
    /**
     * Action that shows list of existing projects.
     */
    public function indexAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Research Projects');
        
        /* Metadata definitions. */
        $this->view->definitions = Sahara_Database_Record_ProjectMetadataTypes::load(NULL, NULL, 'is_optional');

        /* Load the users and their class. */
        $this->view->user = Sahara_Database_Record_User::getLoginUser();
        
        /* Load all the projects for the user. */
        
    }
    
    /**
     * Action that adds a new project.
     */
    public function addprojectAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
         Sahara_Database_Record_UserClass::load($this->_request->getParam('userClass'));
        
        $project = new Sahara_Database_Record_Project();
        
        $success = true;
        $reason = '';
        
        /* Activity ID. */
        if (!($project->activity = $this->_request->getParam('activityID')))
        {
            $success = false;
            $reason = 'Parameter not supplied';
        }
        
        /* User. */
        list($ns, $name) = explode(':', $this->_auth->getIdentity());
        if (!($project->user = Sahara_Database_Record_User::load(array('namespace' => $ns, 'name' => $name))))
        {
            $success = false;
            $reason = 'User not found.';
        }
        
        /* User class. */
        if (!($this->_request->getParam('userClass') && 
                $project->userClass = Sahara_Database_Record_UserClass::load($this->_request->getParam('userClass'))))
        {
            $success = false;
            $reason = 'Parameter not supplied or invalid.';
        }
    
        /* Project modifiers. */
        $project->is_open = $this->_request->getParam('openAccess') == 'true' ? 1 : 0;
        $project->is_shared = $this->_request->getParam('shareCollection') == 'true' ? 1 : 0;
        $project->auto_publish_collection = $this->_request->getParam('autoPublish') == 'true' ? 1 : 0;
        
        /* Timestamps. */
        $project->creation_time = new DateTime();
        $project->last_update = new DateTime();
        
        /* Other metadata. */
        $definitions = Sahara_Database_Record_ProjectMetadataTypes::load();
        if (count($definitions) > 0)
        {
            foreach ($definitions as $def)
            {
                if ($this->_request->getParam($def->name) != null)
                {
                    $metadata = new Sahara_Database_Record_ProjectMetadata();
                    $metadata->type = $def;
                    $metadata->value = $this->_request->getParam($def->name);
                    $project->metadata = $metadata;
                }
                else if (!$def->is_optional)
                {
                    $success = false;
                    $reason = 'Missing metadata.';
                    break;
                }
            }
        }
        
        /* Actually save the record. */
        if ($success) $success = $project->save();
        
        echo $this->view->json(array('success' => $success, 'reason' => $reason));
    }
}