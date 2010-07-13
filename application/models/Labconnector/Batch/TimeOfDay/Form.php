<?php
/**
 * LabConnector Model Web Interface for TimeofDay experiment
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
 * @author Herbert Yeung
 * @date 17th June 2010
 */

/**
 * Experiment form for user to fill in for TimeOfDay Experiment.
 */
class Labconnector_Batch_TimeOfDay_Form extends Zend_Form
{

	/*
	 * For time of Day Experiment we need to construc the follwing:
	 * 1. ExptSpecs - Only thing to show on the form. Rest is implied or read off variables.
	 * 			-><ExperimentSpecification>
	 * 			-><setupId id="LocalClock">LocalClock</setupId> (Should provide options)
	 * 			-><formatName>12-Hour</formatName>				(Should provide options)
	 * 			-></ExperimentSpecification> 
	 * 2. UserID    - SchedServer-Labconnector needs to track for results returned back
	 * 3. LabID     - SchedServer-LabConnector ProxyClient should track as will always be unique
	 * 4. Priority  - Set it to 1. Cannot see it actually being used by iLabs all that much
	 * 
	 */
	public function __construct()
    {
        parent::__construct();

        $this->setMethod('POST');
        
		/*
		 * Fields for the Experiment Specificaiton data (XML) to be entered 
		 * */

        /* SetupID field. - This is a choice filed of computer date/time setup */
        $setupID = new Zend_Form_Element_Select('timesetup');
        $setupID->setLabel('Time Setup:')
             	->setMultiOptions(array(
                		'LocalClock'   => 'LocalClock',
               	  		'NetworkClock' => 'NetworkClock'
             			))
             	->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($setupID);
        
        /* FormatName field. - This is a choice filed of computer date/time setup */
        $timeFmt = new Zend_Form_Element_Select('timefmt');
        $timeFmt->setLabel('Time Format:')
             	->setMultiOptions(array(
                		'12-Hour' => '12-Hour',
               	  		'24-Hour' => '24-Hour'
             			))
             	->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($timeFmt);
        
        /* Submit button. */
        //$submit = new Zend_Form_Element_Submit('submittimeofday');
        //$submit->setLabel('Submit')
        //       ->setDecorators(Sahara_Decorator_Table::$SUBMIT);
        //$this->addElement($submit);

        /* From display group container. */
        $this->addDisplayGroup(array('timesetup', 'timefmt'), 'timeofday_form');
        $dg = $this->getDisplayGroup('timeofday_form');
        $dg->setDecorators(Sahara_Decorator_Table::$DISPLAYGROUP);
        
    }
}