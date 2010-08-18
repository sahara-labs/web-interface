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
 * @date 21st March 2010
 */

/**
 * Form to send feedback.
 */
class Sahara_Feedback_Form extends Zend_Form
{
    public function __construct()
    {
        parent::__construct();

        $this->setAttrib('id', 'feedback_form');

        /* Name. */
        $name = new Zend_Form_Element_Text('name');
        $name->setLabel('Name:')
             ->setRequired(true)
             ->addValidator('NotEmpty')
             ->setAttrib('class', 'validate[required]')
             ->setErrorMessages(array('You must supply your name.'))
             ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($name);

        /* Email. */
        $email = new Zend_Form_Element_Text('email');
        $email->setLabel('Email:')
              ->setRequired(true)
              ->addValidator('EmailAddress')
              ->setAttrib('class', 'validate[required,custom[email]]')
              ->setErrorMessages(array('You must supply your contact email address.'))
              ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($email);

        /* Type. */
        $type = new Zend_Form_Element_Select('type');
        $type->setLabel('Type:')
             ->setMultiOptions(array(
                 'General comment' => 'General comment',
                 'Bug report'     => 'Bug report',
                 'Feature request' => 'Feature request'
             ))
             ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($type);

        /* Purpose of use. */
        $purpose = new Zend_Form_Element_Text('purpose');
        $purpose->setLabel('Purpose:')
                ->setRequired(true)
                ->setAttrib('class', 'validate[required]')
                ->setErrorMessages(array('You must supply the purpose of your Remote Laboratory use.'))
                ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($purpose);

        /* Feedback. */
        $feedback = new Zend_Form_Element_Textarea('feedback');
        $feedback->setLabel('Feedback:')
                 ->setRequired(true)
                 ->setAttrib('class', 'validate[required]')
                 ->setErrorMessages(array('You must supply some feedback!'))
                 ->setAttrib('rows', '10')
                 ->setDecorators(Sahara_Decorator_Table::$ELEMENT);
        $this->addElement($feedback);

        $this->addDisplayGroup(array('name', 'email', 'type', 'purpose', 'feedback'), 'feedback_form');
        $dg = $this->getDisplayGroup('feedback_form');
        $dg->setDecorators(Sahara_Decorator_Table::$DISPLAYGROUP);
    }
}
