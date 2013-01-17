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
    }
    
    /**
     * Action which checks whether an activity identifer is unique.      
     */
    public function checkactivityAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        if ($param = $this->_request->getParam('activityID'))
        {
            echo $this->view->json(array(
                    'unique' => count(Sahara_Database_Record_Project::load(array('activity' => $param))) == 0
            ));
        }
        else echo $this->view->json(array(
                'unique' => false,
                'error'  => 'Missing parameter.'
        ));
    }
    
    /**
     * Action that adds a new project.
     */
    public function addprojectAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        $project = new Sahara_Database_Record_Project();
        
        $success = true;
        $reason = '';
        
        /* Activity ID. */
        if (!($project->activity = $this->_request->getParam('activityID')))
        {
            $success = false;
            $reason = 'Parameter not supplied';
        }
        
        /* The Activity ID must be unique. */
        if (count(Sahara_Database_Record_Project::load(array('activity' => $project->activity))) != 0)
        {
            echo $this->view->json(array(
                    'success' => false,
                    'reason' => 'Activity ID is not unique'
            ));
            return;
        }
        
        /* User. */
        list($ns, $name) = explode(':', $this->_auth->getIdentity());
        if (!($project->user = Sahara_Database_Record_User::getLoginUser()))
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
        $project->is_open = $this->_request->getParam('openAccess') == 'true';
        $project->is_shared = $this->_request->getParam('shareCollection') == 'true';
        $project->auto_publish_collections = $this->_request->getParam('autoPublish') == 'true';
        
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
                    
                    /* If a metadata value validationr regex is stored, make sure the
                     * value match the regex. */
                    if ($def->regex && preg_match('/' . $def->regex . '/', $metadata->value) === 0)
                    {
                        $success = false;
                        $reason = 'Value of metadata \'' . $def->name . '\' is not valid.';
                    }
                }
                else if (!$def->is_optional)
                {
                    $success = false;
                    $reason = 'Missing metadata \'' . $def->name . '\'.';
                    break;
                }
            }
        }
        
        /* Actually save the record. */
        if ($success) 
        {
            try 
            {
                $project->save();
            }
            catch (Sahara_Database_Exception $ex)
            {
                $this->_logger->error('Failed to add project with error: ' . $ex->getMessage());
                $success = false;
                $reason = $ex->getMessage();
            }
        }
        
        echo $this->view->json(array('success' => $success, 'reason' => $reason));
    }
    
    /**
     * Actions that updates a project.
     */
    public function updateprojectAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        if (!($activity = $this->_request->getParam('activityID')))
        {
            echo $this->view->json(array(
                    'success' => false,
                    'reason' => 'Required parameter missing.' 
            ));
            return;
        }
        
        $project = Sahara_Database_Record_Project::load(array('activity' => $activity));
        if (count($project) != 1)
        {
            echo $this->view->json(array(
                    'success' => false,
                    'reason' => 'Project not found.'
            ));
            return;
        }
        
        /* Only one project can be loaded because of the unique constraint on 
         * the activity identifier. */
        $project = $project[0];
        
        if (!Sahara_Database_Record_User::getLoginUser()->equals($project->user))
        {
            /* The logged in user is not authorised to modified the project. */
            echo $this->view->json(array(
                    'success' => false,
                    'reason' => 'Not authorised.'
            ));
            return;
        }
        
        if ($project->publish_time)
        {
            /* The project has been published and is therefore finalished from 
             * changes. */ 
            echo $this->view->json(array(
                     'success' => false,
                     'reason' => 'Not authorised'
            ));
            return;
        }
        
        /* User class. */
        if ($this->_request->getParam('userClass'))
        {
            $userClass = Sahara_Database_Record_UserClass::load($this->_request->getParam('userClass'));
            if (!$project->userClass->equals($userClass))
            {
                $project->userClass = $userClass;
            }
        }
        
        /* Behavioural parameters. */
        if ($this->_request->getParam('shareCollection'))
        {
            $project->is_shared = $this->_request->getParam('shareCollection') == 't';
        }
        
        if ($this->_request->getParam('openAccess'))
        {
            $project->is_open = $this->_request->getParam('openAccess') == 't';
        }
        
        if ($this->_request->getParam('autoPublish'))
        {
            $project->auto_publish_collections = $this->_request->getParam('autoPublish') == 't';
        }
        
        /* Metadata. */
        foreach (Sahara_Database_Record_ProjectMetadataTypes::load() as $metadata)
        {
            if (!($val = $this->_request->getParam($metadata->name))) continue;

            if ($metadata->regex && preg_match("/$metadata->regex/", $val) == 0)
            {
                echo $this->view->json(array(
                        'success' => false,
                        'error' => 'Metadata value is not valid.'
                ));
                return;
            }
            
            if ($mdRecord = $project->getMetadata($metadata))
            {
                $mdRecord->value = $val;
            }
            else
            {
                $mdRecord = new Sahara_Database_Record_ProjectMetadata();
                $mdRecord->value = $val;
                $mdRecord->type = $metadata;
                $project->metadata = $mdRecord;
            }
        }
        
        try
        {
            $project->save();
            echo $this->view->json(array(
                    'success' => true
            ));
        }
        catch (Sahara_Database_Exception $ex)
        {
            $this->_logger->error("Failed updating project '$project->activity' with error: " . $ex->getMessage());
            echo $this->_view->json(array(
                    'success' => false,
                    'error' => 'Failed to update record.'
            ));
        }
    }
    
    /**
     * Action that publishs a project. 
     */
    public function publishprojectAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        if (!$this->_request->getParam('activityID'))
        {
            echo $this->view->json(array(
                    'success' => false,
                    'error'   => 'Required parameter not supplied.'
            ));
            return;
        }
        
        $project = Sahara_Database_Record_Project::load(array('activity' => $this->_request->getParam('activityID')));
        if (count($project) == 0)
        {
            echo $this->view->json(array(
                    'success' => false,
                    'error'   => 'Project not found'
            ));
            return;
        }

        $project = $project[0];
        
        /* Check the project being deleted is actually owned by the logged
         * in user. */
        if (!Sahara_Database_Record_User::getLoginUser()->equals($project->user))
        {
        	echo $this->view->json(array(
        			'success' => false,
        			'error' => 'Not authorised'
        	));
        	return;
        }
        
        /* Check the project has not already been published. */
        if ($project->publish_time)
        {
            echo $tis->view->json(array(
                    'success' => false,
                    'error' => 'Project already published'
            ));
        }

        // TODO Properly implement this. 
        $project->publish_time = new DateTime();
        
        try
        {
            $project->save();
            echo $this->view->json(array('success' => true));
        }
        catch (Sahara_Database_Exception $ex)
        {
            $this->_logger->error("Failed to publish project '$project->activity' with error: " . $ex->getMessage());
            echo $this->view->json(array(
                    'success' => false,
                    'error' => 'Failed publishing project.'
            ));
        }       
    }
    
    /**
     * Action that remove a project. 
     */
    public function removeprojectAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
        if (!$this->_request->getParam('activityID'))
        {
            echo $this->view->json(array(
                    'success' => false,
                    'error'   => 'Required parameter not supplied.'
            ));
            return;
        }
        
        $project = Sahara_Database_Record_Project::load(array('activity' => $this->_request->getParam('activityID')));
        if (count($project) == 0)
        {
            echo $this->view->json(array(
                    'success' => false,
                    'error' => 'Project not found.'
            ));
            return;
        }
        
        /* There can only be one project as the activity ID has a unique 
         * constraint. */
        $project = $project[0];
        
        /* Check the project being deleted is actually owned by the logged 
         * in user. */
        if (!Sahara_Database_Record_User::getLoginUser()->equals($project->user))
        {
            echo $this->view->json(array(
                    'success' => false,
                    'error' => 'Not authorised'
            ));
            return;
        }
        
        try
        {
            $project->delete();
            echo $this->view->json(array('success' => true));
        }
        catch (Sahara_Database_Exception $ex)
        {
            $this->_logger->error("Failed to delete project '$project->activity' with error: " . $ex->getMessage());
            echo $this->view->json(array(
                    'success' => false,
                    'error' => $ex->getMessage()
            ));
        }
    }
    
    /**
     * Action that display the view for collections and collection creation.
     */
    public function collectionsAction()
    {
        $this->view->headTitle($this->_headPrefix . ' Collections');
        
        if (!$this->_request->getParam('activityID'))
        {
            /* We need the activity indentifier to show collection information. */
            $this->_redirectTo('index', 'research');
        }
        
        $project = Sahara_Database_Record_Project::load(array('activity' => $this->_request->getParam('activityID')));
        if (count($project) != 1)
        {
            /* Project not found. */
            $this->_redirectTo('index', 'research');
        }
        
        $project = $project[0];
        
        if (!$project->user->equals(Sahara_Database_Record_User::getLoginUser()))
        {
            /* Login user does not own the specified project. */
            $this->_redirectTo('index', 'research');
        }
        
        if (!$project->publish_time)
        {
            /* Only published projects have collections. */
            $this->_redirectTO('index', 'research');
        }
        
        $this->view->project = $project;
    }
}