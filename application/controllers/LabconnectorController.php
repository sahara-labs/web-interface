<?php
/**
 * SAHARA LabConnector Controller
 *
 * Controller access the web service calls on SchedServer-LabConnector bundle.
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
 * @author Herbert Yeung
 * @date 16th June 2010
 */

/**
 * Controller for the LabConnector.
 */
class LabconnectorController extends Sahara_Controller_Action_Acl
{
	/**
     * Action to show a list of the lab connector experiments (TimeOfDay & Radioactivity).
     */
    public function indexAction()
    {
    	//$this->view->message = 'LabConnector string';
    	 
     	$this->view->headTitle('LabShare - iLabs Experiments');

     	 /* 
         * 1. a) Display to the user the experiment he/she has available to them
         * 	  b) Based of RIG_TYPE == ILABS  (Will become the reserved word)
         * 		 i.e. Permissions->getResourceClass()->getValue() == 'TYPE' (ResourceClass._TYPE)
         * 		   && Permissions->getResource()->getResourceName == 'ILABS'
         * 2. Redirect the user with the use of buttons to the experiment page (*.phtml)
         * 3. Display results once the results are available (via a Notification message)
         * */

        /* Load the permissions of the user. */
        $clientPerm = Sahara_Soap::getSchedServerPermissionsClient();
       
        $this->view->hasclass = true;
        $perms = $clientPerm->getPermissionsForUser(array('userQName' => $this->_auth->getIdentity()));        
    	$this->view->userID = $this->_auth->getIdentity();
        if (!isset($perms->permission))
        {
        	$this->view->hasclass = false;
            $this->view->errMsg = 'No Permissions for any iLabs Experiments';
            return;
        }
     	
         /* Translate the permissions into a form to display based on user class. */
        $resourceClasses = array();
		$nonUnique  = False;
        
    	foreach ($perms->permission as $perm)
        {
            /* This is a hack because PHPSoap / Zend SOAP seems to have some quirks
             * parsing WSDLs. It generates a different object structure
             * depending if there is one permission, or multiple permissions. */
            if ($perm->permission == null)
            {
                if (is_bool($perm)) continue;
                $p = $perm;
                $perm = $perms;
                $perm->isLocked = $perm->permission->isLocked;
            }
            else
            {
                $p = $perm->permission;
            }

            /* Load up resource information. */
            if($p->resourceClass == 'TYPE' && $p->resource->resourceName == 'ILABS')
            {
            	//Store permissionID to correlate it with resourceClass being 'RIG'
            	 $resource = array(
                'resourceClass' => $p->resourceClass,     // The resource class so either 'RIG', 'TYPE' or 'CAPS'
                'resource' => $p->resource->resourceName, // The resource name
                'permissionId' => $p->permissionID,       // Permission ID
                'display' => isset($p->displayName) ? $p->displayName : $p->resource->resourceName // Display name
           		 );
           		 
           		//For first instance we want to store it as it will be unique
                //TODO TO FIX UP - PRODUCING DUPLICATES
                foreach ($resourceClasses as $resourceClass)
                {
                	//Check for duplicates
  		           	if ($p->displayName == $resourceClass["display"])
    					$nonUnique = True;
                }
                	
                if(!$nonUnique)
                	array_push($resourceClasses, $resource);
                		
                $nonUnique = False;//Reset back to false for next iteration
            }          
        } //End
        
        //foreach($resourceClasses as $tmp)
        //   print($tmp["display"] . "<br>");
        
        /*
         * Account for when we have Sahara Labs that have permission but no iLabs Experiment permissions
         */
        if(!$resourceClasses)
        {    
        	$this->view->hasclass = false;
        	$this->view->errMsg = 'No Permissions for any iLabs Experiments';
        	return;
        }
        
        $this->view->ilabsExpts = $resourceClasses;
        
     	/* Load the labconnector for the user. */
		//$this->_redirectTo('index', 'labconnector'); //Get the User choice of Experiment first
        //$clientLabConnector = Sahara_Soap::getSchedServerLabConnectorClient();
        //$exptID = $clientLabConnector->submitExperiment(array('userQName' => $this->_auth->getIdentity()));
    }	
    
    /**
     * Action to show any errors encountered e.g. Permissions denied for Rig/Lab type
     */
    public function errorAction()
    {
    	$this->view->headTitle('LabShare - iLabs Experiments');
        $this->view->messages = $this->_flashMessenger->addMessage($this->errMsg);    	
        //$this->_flashMessenger->addMessage($this->errMsg);   	
    }
    
    /**
     * Action to show a list of the lab connector experiments (TimeOfDay & Radioactivity).
     */
   	public function experimentAction()
    {
    	$this->_helper->layout()->disableLayout();
    	/*
    	 * Check which experiment has been selected:
    	 * 1. At the moment there are only 2 choices:
    	 * 		a) Time Of Day (Batch)
    	 * 		b) UQ's Radioactivity experiment
    	 * 2. Activate each form based on the clicking the item
    	 * 3. Extrapolate the name to decide on which action to take
    	 */
    	
    	//Get the Experiment Name one is looking for & id
    	$exptname = $this->_request->getParam('exptname', '0');
    	$exptid   = $this->_request->getParam('exptid', '1');
    	
    	//Make the name available to the view
    	$this->view->exptname = $exptname;
    	$this->view->exptid   = $exptid;
    	
    	//Check which type of experiment is being invoked before displaying the formset
    	if ($exptname == "Time Of Day - Batch")
    		$form = new Labconnector_Batch_TimeOfDay_Form();
    	else if($exptname == "UQ Radioactivity Expt1")
	    	$form = new Labconnector_Batch_UQRadioactivity_Form();
    	
	    if(isset($form))
    		$this->view->form = $form;
    }
    
    /**
     * Action to handle submit experiment calls
     */
  	public function submitexperimentAction()
    {
    	/* Disable layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
    	
        //$params = $this->_request->getPost();
        $params = $this->_request->getParams();
        
        /* Check the Experiment Specs are what they are before submitting */
        $xmlText = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<experimentSpecification></experimentSpecification>";
     	$exptSpecsXMLObj = simplexml_load_string($xmlText);
     	
     	if($params['exptname'] == "Time Of Day - Batch")
     	{
     		$exptSpecsXMLObj->addChild("setupId", $params['timesetup']);
     		$exptSpecsXMLObj->addChild("formatName", $params['timefmt']);
     	}
     	else if($params['exptname'] == "UQ Radioactivity Expt1") 
     	{ 
     		$exptSpecsXMLObj->addChild("setupId", $params['radioactivitysetup']);
     		$exptSpecsXMLObj->addChild("sourceName", $params['sourcename']);
     		$exptSpecsXMLObj->addChild("absorberName", $params['absorbername']);
     		$exptSpecsXMLObj->addChild("distance", $params['distance']);
     		$exptSpecsXMLObj->addChild("duration", $params['duration']);
     		$exptSpecsXMLObj->addChild("repeat", $params['repeat']);
     	}
     
	//var_dump($exptSpecsXMLObj->asXML());
	
     	if ($this->_auth->getIdentity())
        {
         	try
            {
                $submitExperimentResponse = Sahara_Soap::getSchedServerLabConnectorClient()
                        ->submitExperiment(array('userID' => $this->_auth->getIdentity(),
                        						 'labID'  => $params['exptname'], //Pass to SchedServer-LabConnector LabName than rather ID
                        						 'priority' => $params['exptpriority'],
                        						 'experimentSpecs' => $exptSpecsXMLObj->asXML()));
                 
                 /* Display the experiment ID to the user as well as a successful message */ 
                 $this->view->exptresponseid = $submitExperimentResponse->experimentID;
                 $this->view->exptresponsemsg = $submitExperimentResponse->errorMessage;  

                 /* Tells validation engine that submission succeeded. */
                 echo ($submitExperimentResponse->experimentID >= 0 ? 'true' :  $this->view->json(array("failed" => "failed")));
            }
            catch (Exception $ex)
            {
            	//echo var_dump($ex);
                echo "Exception when connecting to the SchedServer-LabConnector: " . $ex->getMessage() . "\n";
            }
        }
    }
    
    /**
     * Action to refresh the retrieval the results for the user
     */
   	public function refreshresultsAction()
    {
    	/* Disable the renderer and layout as we are only returning the results as JSON */
    	$this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();
        
    	/* 
         * Check if the user has permissions and the directory exists 
         * If not display nothing to the user 
         * */
    	if ($this->_auth->getIdentity())
        {
        	/* Read the Experiment Storage location for user */
	    	$config = Zend_Registry::get('config');
	    	$userPath = str_replace(":", "_", $this->_auth->getIdentity()); //Namespace contains colons which is replaced
	    	$fileStoragePath = $config->experiment->storage->dir . "/" . $userPath . "/" . "results.txt";
	        $resultsfilesize = 0;
	    	
	        /* Check file exists & file's modified timestamp has changed */
	        if(($resultsfilesize < filesize($fileStoragePath)))
	        {
	        	Zend_Registry::set('filesizeval', filesize($fileStoragePath));
	        	//$this->resultsfilesize = filesize($fileStoragePath);
	        	
	        	$experimentStorage = file_get_contents($fileStoragePath);
	        	if($experimentStorage)
	        		echo $this->view->$experiemntStorage;
	        	else
	        		echo "Error";
	        }
      	}
    }
    
   /**
    * Action to retrieve the results for the user
    */
   	public function resultsAction()
    {
    	$this->_helper->viewRenderer->setNoRender();
    	$this->_helper->layout()->disableLayout();
    	
    	/* Read the Experiment Storage location for user */
	    $config = Zend_Registry::get('config');
    	$userdirectoryID = $this->_request->getParam('userdirectoryID', '0');
    	$userPath = str_replace(":", "_", $userdirectoryID); //Namespace contains colons which is replaced
    	$fileStoragePath = $config->experiment->storage->dir . "/" . $userPath . "/" . "results.txt";
	    $experimentStorage = file_get_contents($fileStoragePath);
	    //$this->view->experimentStorage = $experimentStorage;
	    
	    if($experimentStorage)
    		echo $fileStoragePath . ":<br><br>" . $experimentStorage;
    	else
    		$this->_redirectTo('labconnector', 'error');
    }
}
