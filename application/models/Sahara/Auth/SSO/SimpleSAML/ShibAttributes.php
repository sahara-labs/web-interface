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
    const COMMON_NAME_OID = 'urn:oid:2.5.4.3';
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
    public function getSharedToken()
    {
        return $this->_getAttr(self::SHARED_TOKEN_OID);
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
     * Gets the common name or null if not provided.
     *
     * @return String comman name
     */
    public function getCommonName()
    {
        return $this->_getAttr(self::COMMON_NAME_OID);
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
        return $this->_getAttr(self::AFFLIATION_OID);
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
     * Opportunistically obtain the first name of the user. This looks at the
     * given name, common name and display name attributes (in that order) to
     * determine whether the first name is provided.
     */
    public function opportunisticFirstname()
    {
        if ($this->getFirstname()) return $this->getFirstname();
        if ($this->getCommonName()) return substr($this->getCommonName(), 0, strstr($this->getCommonName(), ' '));
        if ($this->getDisplayName()) return substr($this->getDisplayName(), 0, strstr($this->getDisplayName(), ' '));

        return null;
    }

   /**
    * Opportunistically obtain the last name of the user. This looks at the
    * surname, common name and display name attributes (in that order) to
    * determine whether the last name is provided.
    */
    public function opportunisticSurname()
    {
        if ($this->getSurname()) return $this->getSurname();
        if ($this->getCommonName()) return substr($this->getCommonName(), strstr($this->getCommonName(), ' '));
        if ($this->getDisplayName()) return substr($this->getDisplayName(), strstr($this->getDisplayName(), ' '));

        return null;
    }

    /**
     * Gets the attribute value or null if it doesn't exist.
     *
     * @param String $attr attribute
     */
    private function _getAttr($attr)
    {
         if (!array_key_exists($attr, $this->_attrs)) return null;
         if (is_array($this->_attrs[$attr]) && count($this->_attrs[$attr]) == 1)
         {
             return $this->_attrs[$attr][0];
         }
         else return $this->_attrs[$attr];
    }
}
