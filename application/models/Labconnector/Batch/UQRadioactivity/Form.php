<?php
/**
 * LabConnector Model Web Interface for UQ's Radioactivity experiment
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
 * Experiment form for user to fill in for Radioactivity Experiment.
 */
class Labconnector_Batch_UQRadioactivity_Form extends Zend_Form
{
/*
	 * For UQ's Radioactivity Experiment we need to construc the follwing:
	 * 1. ExptSpecs - Only thing to show on the form. Rest is implied or read off variables.
	 * 			-><ExperimentSpecification>
	 * 			-><setupId>RadioactivityVsTime</setupId> 		(Should provide options)
	 * 			-><sourceName>Strontium-90</sourceName>			(Should provide options)
	 * 			-><absorberName>None</absorberName>				(Choice?)
	 * 			-><distance>55</distance>						(Should be an numerical input box)
	 * 			-><duration>5</duration>						(Should be an numerical input box)
	 * 			-><repeat>10</repeat>							(Should be a numerical input box)
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

        /* SetupID field. - This is a choice filed of radioactivity plot setup */
        $setupID = new Zend_Form_Element_Select('radioactivitysetup');
        $setupID->setLabel('Radioactivity Setup:')
             	->setMultiOptions(array(
                		'RadioactivityVsTime'   => 'RadioactivityVsTime'
             			))
             	->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($setupID);
        
        /* sourceName field. - This is a choice filed of computer date/time setup */
        $sourceName = new Zend_Form_Element_Select('sourcename');
        $sourceName->setLabel('Source Name:')
             	->setMultiOptions(array(
                		'Strontium-90' => 'Strontium-90'
             			))
             	->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($sourceName);
        
        /* absorberName field. - This is a choice (not sure about text field */
        $absorberName = new Zend_Form_Element_Select('absorbername');
        $absorberName->setLabel('Absorber Name:')
             	->setMultiOptions(array(
                		'None' => 'None'
             			))
             	->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($absorberName);
        
        /* distance field. - This is input text field in numeric only*/
        $distance = new Zend_Form_Element_Text('distance');
        $distance->setLabel('Distance:')
             ->setRequired(true)
             ->addValidator('NotEmpty')
             ->setErrorMessages(array('You must supply a numerical value.'))
             ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($distance);

        /* duration field. - This is input text field in numeric only*/
        $duration = new Zend_Form_Element_Text('duration');
        $duration->setLabel('Duration:')
             ->setRequired(true)
             ->addValidator('NotEmpty')
             ->setErrorMessages(array('You must supply a numerical value.'))
             ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($duration);
        
        /* repeat field. - This is input text field in numeric only*/
        $repeat = new Zend_Form_Element_Text('repeat');
        $repeat->setLabel('Repeat:')
             ->setRequired(true)
             ->addValidator('NotEmpty')
             ->setErrorMessages(array('You must supply a numerical value.'))
             ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($repeat);
        
        /* Submit button. */
        //$submit = new Zend_Form_Element_Submit('submitradioactivity');
        //$submit->setLabel('Submit')
        //       ->setDecorators(Sahara_Decorator_Table::$SUBMIT);
        //$this->addElement($submit);
        
         /* From display group container. */
        $this->addDisplayGroup(array('radioactivitysetup', 'sourcename', 'absorbername', 'distance', 'duration', 'repeat'), 'radioactivity_form');
        $dg = $this->getDisplayGroup('radioactivity_form');
        $dg->setDecorators(Sahara_Decorator_Table::$DISPLAYGROUP);
        
    }
}