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
 * @date 8th July 2010
 */

/**
 * Authentication link class which authenticates of the Sahara database 'users'
 * table. The 'users' table must be modified to have the following columns
 * added:
 * <ul>
 * 	<li>auth_allowed - boolean | tinyint(1) - Whether database
 *  database will be allowed for the user.</li>
 *  <li>password - varchar(64) - The SHA1 hashed authentication credential.</li>
 * </ul>
 * The following queries will modify the default Sahara database.
 * <br /><pre>
=== MySQL =====================================================================
ALTER TABLE `users`
ADD `auth_allowed` TINYINT (1) NOT NULL DEFAULT '0',
ADD `password` VARCHAR( 64 ) NULL;
===============================================================================
</pre>
 */
class Sahara_Auth_Type_Database extends Sahara_Auth_Type
{
    /** @var Zend_Db_Table_Row User record. */
    private $_record;

    public function __construct()
    {
        parent::__construct();
        Sahara_Database::getDatabase();
    }

    /**
     * Returns true if the user can be authenticaed using the
     * supplied credential. The tests for success with this authentication
     * type are:
     * <ol>
     * 	<li>The user must exist.</li>
     * 	<li>The user must have database authorisation enabled
     * 	(auth_allowed = true).</li>
     *  <li>The password must match the record password.</li>
     * </ol>
     *
     * @return boolean true if the user is authenticated
     * @see models/Sahara/Auth/Sahara_Auth_Type::authenticate()
     */
    public function authenticate()
    {
        $table = new Zend_Db_Table('users');
        $this->_record = $table->fetchRow($table->select()
                ->where('name = ?', $this->_user)
                ->where('namespace = ?', $this->_config->institution));

        /* 1) User must exist. */
        if ($this->_record == null) return false;

        $allowed = (int)$this->_record->auth_allowed;
        if (is_string($allowed)) // Occurs when 'bit(1)' type is used
        {
            $allowed = (int)$allowed && true;
        }

        /* 2) Authorisation must be enabled. */
        if (!$allowed) return false;

        /* 3) Passwords must match. */
        return $this->_record->password == sha1($this->_pass);
    }

    /**
     * Returns the properties value from the underlying record class.
     *
     * @param $property proerty to obtain value of
     * @return mixed String | array | null
     */
    public function getAuthInfo($property)
    {
        if ($this->_record == null) return null;

        return $this->_record->$property;
    }
}
