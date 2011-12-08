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
 * @author Tania Machet (tmachet)
 * @date 13th December 2010
 */

class ReportsController extends Sahara_Controller_Action_Acl
{
    /** @var operator for queries */
    private $OPERATOR = "AND";  // Always 'and' for first release

    /** @var Type for rig query */
    private $RIG = "RIG";  // Always 'and' for first release

    public function indexAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Reports');

        /* Load the rig names for the initial screen */
        $rep = Sahara_Soap::getSchedServerReportsClient();

        $rigNames = $rep->queryInfo(array(
            'querySelect' => array('operator' => $this->OPERATOR,
        							'typeForQuery' => $this->RIG,
        							'queryLike' => '%'),
        	'requestor' => array('userQName' => $this->_auth->getIdentity()),
            'limit' => '3' ));

        $this->view->persona = $this->_acl->getUserRole();
    }

    public function getvalueAction()
    {
        /* Disable view render and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        /* Get Parameter */
        $group = $this->_request->getParam("group","RIG");
        $like = $this->_request->getParam("like");
        $limit = $this->_request->getParam("limit","3");

        /* check group value */
        switch($group)
        {
        	case "RIG":
        	case "RIG_TYPE":
        	case "USER":
        	case "USER_CLASS":
	        	$req = Sahara_Soap::getSchedServerReportsClient();
	        	$result = $req->queryInfo(array(
	            	'querySelect' => array('operator' => $this->OPERATOR,
	        							'typeForQuery' => $group,
	        							'queryLike' => $like),
	        		'requestor' => array('userQName' => $this->_auth->getIdentity()),
	            	'limit' => $limit ));
	        	break;
        	default:
        		$result = "There are no results";
         };

        echo $this->view->json($result);
    }

    public function accessreportAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Access Report');

        /* Get Parameter */
        $params = $this->_request->getParams();

        /* check group value */
        switch($params['accessgroup'])
        {
        	case "RIG":
        	case "RIG_TYPE":
        	case "USER":
        	case "USER_CLASS":
	        	$req = Sahara_Soap::getSchedServerReportsClient();

	        	// Supply pagination if valid
        		if (array_key_exists("pageNumber", $params) &&  array_key_exists("pageLength", $params))
        		{
		        	$result = $req->querySessionAccess(array(
		        		'requestor' => array('userQName' => $this->_auth->getIdentity()),
		        		'querySelect' => array('operator' => $this->OPERATOR,
		        							'typeForQuery' => $params['accessgroup'],
		        							'queryLike' => $params['accessvalue']),
		            	'startTime' => strtotime($params['accessfrom']),
		        		'endTime' => strtotime($params['accessto']),
		        		'pagination' => array('numberOfPages' => 1,
		        				'pageNumber' => $params['pageNumber'],
		        				'pageLength' => $params['pageLength'] ) ));
        		}
        		else
        		{
        			$result = $req->querySessionAccess(array(
		        		'requestor' => array('userQName' => $this->_auth->getIdentity()),
		        		'querySelect' => array('operator' => $this->OPERATOR,
		        							'typeForQuery' => $params['accessgroup'],
		        							'queryLike' => $params['accessvalue']),
		            	'startTime' => strtotime($params['accessfrom']),
		        		'endTime' => strtotime($params['accessto'])));
        		}
		        break;
        	default:
        		$result = "There are no results";
         };

         $this->view->results = $result;
         $this->view->search = $params;
    }

    public function sessionreportAction(){

        $this->view->headTitle($this->_headPrefix . 'Session Report');


        /* Get Parameter */
        $params = $this->_request->getParams();

        //TODO account for pages
		$pageNum = (array_key_exists("pageNumber", $params) ? $params['pageNumber'] : 1);


        /* check group value */
        switch($params['sessiongroup'])
        {
        	case "RIG":
        	case "RIG_TYPE":
        	case "USER":
        	case "USER_CLASS":
	        	$req = Sahara_Soap::getSchedServerReportsClient();

        		if (array_key_exists("pageNumber", $params) &&  array_key_exists("pageLength", $params))
        		{
	        		$result = $req->querySessionReport(array(
		        		'requestor' => array('userQName' => $this->_auth->getIdentity()),
		        		'querySelect' => array('operator' => $this->OPERATOR,
		        							'typeForQuery' => $params['sessiongroup'],
		        							'queryLike' => $params['sessionvalue']),
		            	'startTime' => strtotime($params['reportfrom']),
		        		'endTime' => strtotime($params['reportto']),
		        		'pagination' => array('numberOfPages' => 1,
		        				'pageNumber' => $params['pageNumber'],
		        				'pageLength' => $params['pageLength'] ) ));

        		}
        		else
        		{
	        		$result = $req->querySessionReport(array(
		        		'requestor' => array('userQName' => $this->_auth->getIdentity()),
		        		'querySelect' => array('operator' => $this->OPERATOR,
		        							'typeForQuery' => $params['sessiongroup'],
		        							'queryLike' => $params['sessionvalue']),
		            	'startTime' => strtotime($params['reportfrom']),
		        		'endTime' => strtotime($params['reportto']) ));
        		}
	        	break;
        	default:
        	$result = "There are no results";
         };

         $this->view->results = $result;
         $this->view->search = $params;
   }

}
