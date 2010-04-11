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
 * @date 5th April 2010
 */

abstract class Sahara_Session_Element
{
    /** @var Sahara_Soap Soap instance to rig client. */
    protected $_rigClient;

    /** @var Zend_View View renderer. */
    protected $_view;

    /** @var Zend_Config Configuration. */
    protected $_config;

    /** @var Sahara_Logger Logger. */
    protected $_logger;

    public function __construct($rig)
    {
        $this->_rigClient = $rig;

        $this->_config = Zend_Registry::get('config');
        $this->_logger = Sahara_Logger::getInstance();

        $this->_view = new Zend_View();
        $this->_view->setScriptPath(realpath(dirname(__FILE__) .'/Element/'));
    }

    /**
     * Renders the session element content to HTML.
     *
     * @return String HTML to display
     */
    public abstract function render();

    /**
     * Returns the value of the specified rig attribute.
     *
     * @param String $attr rig attribute to obtain value of
     * @return mixed attribute value or false if not found
     */
    protected function _getRigAttribute($attr)
    {
        list($ns, $name) = explode(':', Zend_Auth::getInstance()->getIdentity(), 2);

        $response = $this->_rigClient->getAttribute(array(
                'requestor' => $name,
                'attribute' => $attr
        ));

        if (!isset($response->value)) return false;
        return $response->value;
    }
}