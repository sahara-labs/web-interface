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
 * @date 4th March 2010
 */

/**
 * Single sign on integration class.
 */
abstract class Sahara_Auth_SSO
{

    /**
     * @var Zend_Config Configuration.
     */

    protected $_config;

    /**
     * @var Sahara_Logger Logger.
     */
    protected $_logger;

    public function __construct()
    {
        $this->_config = Zend_Registry::get('config');
        $this->_logger = Zend_Registry::get('logger');
    }

    /**
     * Signs on using the SSO system.
     *
     * @param array $params Parameters to passthrough on the return path (optional)
     * @return boolean true if successful
     */
    public abstract function signon($params = array());

    /**
     * Signs off using the SSO system.
     *
     * @return boolean true if successful
     */
    public abstract function signoff();

    /**
     * Returns the properties value from the underlying record class.
     *
     * @param $property proerty to obtain value of
     * @return mixed String | array | null
     */
    public abstract function getAuthInfo($property);

    /**
     * Gets the user name of the signed on user.
     *
     * @return String user name.
     */
    public abstract function getUsername();

    /**
     * Returns the SSO type.
     *
     * @var String authenticator type
     */
    public function getAuthType()
    {
        $cls = get_class($this);
        $clsParts = explode('_', $cls);
        return end($clsParts);
    }
}
