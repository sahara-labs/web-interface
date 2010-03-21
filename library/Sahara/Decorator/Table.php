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
 * Contains form decorators for putting the form in a table.
 */
class Sahara_Decorator_Table
{
    /** @var array Element decorator with element in a table row. */
    public static $ELEMENT = array('ViewHelper',
                                   array('Description', array('tag' => 'div','class' => 'desc')),
                                   array('Errors', array('tag' => 'div', 'class' => 'err')),
                                   array(array('data' => 'HtmlTag'), array('tag' => 'td', 'class' => 'rowField')),
                                   array('Label', array('tag' => 'td', 'class' => 'rowLabel')),
                                   array(array('row' => 'HtmlTag'), array('tag' => 'tr', 'class' => 'row'))
                             );

	/** @var array Display group decorator which puts the form in a table. */
	public static  $DISPLAYGROUP = array('FormElements',
                                         array('HtmlTag', array('tag' => 'table', 'class' => 'formdisplaygroup')),
										'Fieldset'
                                   );

	/** @var array Submit button decorator which puts the button in a div. */
	public static $SUBMIT = array('ViewHelper',
                                  array('HtmlTag', array('tag' => 'div'))
                            );
}