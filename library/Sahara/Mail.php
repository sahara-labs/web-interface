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
 * @date 19th April 2010
 */

/**
 * Sends emails to a one or more receipts.
 */
class Sahara_Mail
{
    /** @var array List of addresses to send the email to. */
    private $_to = array();

    /** @var String From header in email. */
    private $_from;

    /** @var String Message subject. */
    private $_subject;

    /** @var String Message body. */
    private $_body;

    /** @var Zend_Config Configuration. */
    private $_config;

    public function __construct()
    {
        $this->_config = Zend_Registry::get('config');
        $tr = new Zend_Mail_Transport_Smtp($this->_config->email->smtp);
        Zend_Mail::setDefaultTransport($tr);
    }

    /**
     * Adds an address to send the email to.
     *
     * @param String $address
     * @return Sahara_Mail this object to chain methods
     */
    public function addTo($address)
    {
        array_push($this->_to, $address);
        return $this;
    }

    /**
     * Sets the list of reciepts.
     *
     * @param array $to list of reciepts
     * @return Sahara_Mail this object to chain methods
     */
    public function setTo($addresses)
    {
        $this->_to = $address;
        return $this;
    }

    /**
     * Sets the from address of the email.
     *
     * @param String $address email from address
     * @return Sahara_Mail this object to chain methods
     */
    public function setFrom($address)
    {
        $this->_from = $address;
    }

    /**
     * Sets the subject of the email.
     *
     * @param String $subject email subject
     * @return Sahara_Mail this object to chain methods
     */
    public function setSubject($subject)
    {
        $this->_subject = $subject;
        return $this;
    }
}