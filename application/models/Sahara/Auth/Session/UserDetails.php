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
* @date 23rd August 2011
*/

/**
 * Updates the users details to ensure first name, last name and email are
 * correct provided the underlying database type can provide the user
 * details. The required configuration details is needed to specify
 * the fields to obtain the user details:
 * <ul>
 * 	<li>userdetails.firstname - The list of first name fields to check.</li>
	<li>userdetails.lastname - The list of last name fields to check.</li>
	<li>userdetails.email - The list of email address fields to check.</li>
 * </ul>
 * More then one field may be configured, seperating each field with a
 * comma ',' character. If more than one is configured, the first field
 * which provides a non-null value is used.
 */
class Sahara_Auth_Session_UserDetails extends Sahara_Auth_Session
{
    /** @var Zend_Db_Adapter_Abstract Database adapter. */
    private $_db;

    /** @var array The list of fields to check for firstname. */
    private $_fnFields;

    /** @var array The list of fields to check for surname. */
    private $_snFields;

    /** @var array The list of fields to check for email. */
    private $_emailFields;

    public function __construct()
    {
        parent::__construct();

        $this->_db = Sahara_Database::getDatabase();

        $ud = $this->_config->userdetails;
        if (!$ud || !$ud->firstname || !$ud->lastname || !$ud->email)
        {
            $this->_logger->error('User details session setup class not properly configured.');
            throw new Exception('User details session setup class not properly configured.');
        }

        $this->_fnFields = array();
        foreach (explode(',', $ud->firstname) as $f) array_push($this->_fnFields, trim($f));

        $this->_snFields = array();
        foreach (explode(',', $ud->lastname) as $f) array_push($this->_snFields, trim($f));

        $this->_emailFields = array();
        foreach (explode(',', $ud->email) as $f) array_push($this->_emailFields, trim($f));
    }

    public function setup()
    {
        /* Load the user's record. */
        $table = new Zend_Db_Table('users');
        $record = $table->fetchRow($table->select()
            ->where('name = ?', $this->_authType->getUsername())
            ->where('namespace = ?', $this->_config->institution));

        if (!$record)
        {
            $this->_logger->warn('User '. $this->_authType->getUsername() . ' does not exist so cannot update their ' .
                ' details.');
            return;
        }

        /* Load the user details. */
        $fn = $this->_getAuthProperty($this->_fnFields);
        $sn = $this->_getAuthProperty($this->_snFields);
        $email = $this->_getAuthProperty($this->_emailFields);

        /* Compare and store. */
        $needsSave = false;
        if ($fn && $record->first_name != $fn)
        {
            $record->first_name = $fn;
            $needsSave = true;
        }

        if ($sn && $record->last_name != $sn)
        {
            $record->last_name = $sn;
            $needsSave = true;
        }

        if ($email && $record->email != $email)
        {
            $record->email = $email;
            $needsSave = true;
        }

        if ($needsSave) $record->save();
    }

    private function _getAuthProperty($propFields)
    {
        $val = NULL;
        foreach ($propFields as $f) if ($val = $this->_authType->getAuthInfo($f)) break;

        return is_array($val) ? array_shift($val) : $val;
    }
}
