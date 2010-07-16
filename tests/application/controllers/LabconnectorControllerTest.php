<?php
/**
 * SAHARA LabconnectonrControllerTest tests Zend Controller for LabConnector:
 * index, submitexperiment, error, results & refreshresults actions
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
 * @date 6th July 2010
 */
require_once TESTS_PATH . '/application/AbstractControllerTestCase.php';
require_once APPLICATION_PATH . '/controllers/LabconnectorController.php';


/**
 * 
 * LabConnectorTestCase: Test cases for indexAction(), errorAction(), experimentAction, 
 * submitExperimentAction(), refreshResultsAction() and resultsAction()
 * @author heyeung
 * 
 * Note: There appears to be a bug with the AT covers property for PHPUnit.
 * Removed it to make the unit tests run.
 *
 */
class LabconnectorControllerTest extends AbstractControllerTestCase
{
	/**
 	* @test
 	* covers LabconnectorController::indexAction()
 	*/
    public function defaultIndex()
    {
        $this->dispatch('/labconnector/index');
        $this->assertController('labconnector');
        $this->assertAction('index');
    }

    /**
 	* @test
 	* covers LabconnectorController::submitexperimentAction()
 	*/
    public function submitTimeOfDayExperiment()
    {
        //$this->dispatch('/labconnector/submitexperiment/?exptname=test');
		//$this->request->setQuery(array(
        //    'exptname' => 'Time Of Day - Batch'));
		$this->dispatch('/labconnector/submitexperiment?exptname=Test');
        $this->assertController('labconnector');
        $this->assertAction('submitexperiment');
    }
       
 	/**
 	* @test
 	* covers LabconnectorController::resultsAction()
 	*/
	public function resultsInXMLFormat()
    {
    	//We want to create the file for testing
    	
    	
    	$this->request->setQuery(array('errMsg'=>'Test Error'));
        $this->dispatch('/labconnector/results');
        $this->assertController('labconnector');
        //$errorMsg = $this->getRequest()->getParam('error_message', null);
        //$this->assertEquals(null, $errorMsg);
    }
    
	/**
 	* @test
 	* covers LabconnectorController::refreshresultsAction()
 	*/
	public function refreshresultsAsync()
    {
    	$this->request->setQuery(array('errMsg'=>'Test Error'));
        $this->dispatch('/labconnector/refreshresults');
        $this->assertController('labconnector');
        //$errorMsg = $this->getRequest()->getParam('error_message', null);
        //$this->assertEquals(null, $errorMsg);
    }
    
	/**
 	* @test
 	* covers LabconnectorController::experimentAction()
 	*/
	public function listAvailableExperiments()
    {
    	$this->request->setQuery(array('errMsg'=>'Test Error'));
        $this->dispatch('/labconnector/experiment');
        $this->assertController('labconnector');
        //$errorMsg = $this->getRequest()->getParam('error_message', null);
        //$this->assertEquals(null, $errorMsg);
    }
}
