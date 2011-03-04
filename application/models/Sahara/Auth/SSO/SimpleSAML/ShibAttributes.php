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
 * @date 3rd March 2011.
 */

/**
 * Provides a friendly interface to determine SimpleSAML attributes.
 */
class Sahara_Auth_SSO_SimpleSAML_ShibAttributes
{
    /** Attribute OIDs. */
    const SHARED_TOKEN_OID = 'urn:oid:1.3.6.1.4.1.27856.1.2.5';
    const TARGETED_ID_OID = 'urn:oid:1.3.6.1.4.1.5923.1.1.1.10';
    const SN_OID = 'urn:oid:2.5.4.4';
    const GIVEN_NAME_OID = 'urn:oid:2.5.4.42';
    const DISPLAY_NAME_OID = 'urn:oid:2.16.840.1.113730.3.1.241';
    const EMAIL_OID = 'urn:oid:0.9.2342.19200300.100.1.3';
    const HOME_ORG_OID = 'urn:oid:1.3.6.1.4.1.25178.1.2.9';
    const AFFLIATION_OID = 'urn:oid:1.3.6.1.4.1.5923.1.1.1.1';

    /** Attribute hashmap. */
    private $_attrs;

    public function __construct($attrs)
    {
        $this->_attrs = $attrs;
    }

    /**
     * Gets the shared token attribute or null if not provided.
     *
     * @return String shared token
     */
    public function getShartedToken()
    {
        return $this->_getAttr($attr);
    }

    /**
     * Gets the targeted ID attribute or null if not provided.
     *
     * @return String targeted ID
     */
    public function getTargetedID()
    {
        return $this->_getAttr(self::TARGETED_ID_OID);
    }

    /**
     * Gets the given name or null if not provided.
     *
     * @return String given name
     */
    public function getFirstname()
    {
        return $this->_getAttr(self::GIVEN_NAME_OID);
    }

    /**
     * Gets the surname or null if not provided.
     *
     * @return String cn
     */
    public function getSurname()
    {
        return $this->_getAttr(self::SN_OID);
    }

    /**
     * Gets the display name or null if not provided.
	 *
	 * @return String display name
     */
    public function getDisplayName()
    {
        return $this->_getAttr(self::DISPLAY_NAME_OID);
    }

    /**
     * Gets the email or null if not provided.
     *
     * @return email
     */
    public function getEmail()
    {
        return $this->_getAttr(self::EMAIL_OID);
    }

    /**
     * Gets the orginisation or null if not provided.
     *
     * @return String orginisation
     */
    public function getOrginisation()
    {
        return $this->_getAttr(self::HOME_ORG_OID);
    }

    /**
     * Gets the affliation or null if not provided.
     *
     * @return affliation
     */
    public function getAffliation()
    {
        return $this->_getAttr($attr);
    }

    /**
     * Gets an imploded version of the attributes.
     */
    public function implode()
    {
        $str = '';
        foreach ($this->_attrs as $k => $v)
        {
            $str .= $k . '=' . $v . ';';
        }

        return substr($str, 0, strlen($str) - 1);
    }

    /**
     * Gets the attribute value or null if it doesn't exist.
     *
     * @param String $attr attribute
     */
    private function _getAttr($attr)
    {
        return array_key_exists($attr, $this->_attrs) ? $this->_attrs[$attr] : null;
    }
}