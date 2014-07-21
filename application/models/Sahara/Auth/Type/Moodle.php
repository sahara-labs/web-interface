<?php
/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2014, University of Technology, Sydney
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
 * @date 15th July 2014
 */

/**
 * Authentication type the connects to a Moodle database and uses records stored
 * in the 'users' table to attempt to authentication a user. <br />
 * The required configuration for this class is:
 * <ul>
 *    <li>moodle.database.adapter - Moodle database server adapter
 *    (See http://framework.zend.com/manual/en/zend.db.adapter.html).</li>
 *    <li>moodle.database.params.host - IP address or hostname of
 *    Moodle database server.</li>
 *    <li>moodle.database.params.dbname - Moodle database name.</li>
 *    <li>moodle.database.params.username - Moodle database user's name.</li>
 *    <li>moodle.database.params.password - Moodle database user's password.</li>
 *    <li>moodle.database.prefix - Prefix to table names in the Moodle
 *    database.</li>
 *    <li>moodle.md5_salt - Password salt Moodle is using to hash passwords, if
 *    the hashed password is detected as a MD5 hash. Newer versions of Moodle
 *    use crypt(3) passwords, with random salts so option is not used
 *    in that case.</li>
 *    <li>moodle.username_prefix - Optional prefix to use for usernames.
 *    This is to allow user names to be globally unique.</li>
 * </ul>
 *  For authentication to succeed, the following criteria must be true:
 * <ol>
 *     <li>The user must have a Moodle record, that is the entered username
 *     must match a record with the same value in the username column.</li>
 *     <li>The password must match, after the equivalent hashing methods
 *     Moodle would apply are performed to the entered password.</li>
 *     <li>The user must be "confirmed", 'confirmed' column true.</li>
 *     <li>The user must not be deleted, 'deleted' column false.</li>
 *     <li>The user must not be suspended, 'suspended' column false.</li>
 * </ol>
 */
class Sahara_Auth_Type_Moodle extends Sahara_Auth_Type
{
    /** @private Zend_Db Database driver for Moodle's database. */
    private $_mdb;

    /** @private stdClass User Moodle record. */
    private $_record;

    public function __construct()
    {
        parent::__construct();

        if (!($mconfig = $this->_config->moodle) || !$mconfig->database)
        {
            throw new Exception('Moodle database authentication type incorrectly configured.');
        }

        $this->_mdb = Zend_Db::factory($mconfig->database);
        $this->_mdb->setFetchMode(Zend_Db::FETCH_OBJ);
    }

    public function authenticate()
    {
        $rows = $this->_mdb->fetchAll('SELECT * FROM ' .
                    $this->_config->moodle->database->prefix . 'user WHERE username = ?', $this->_user);

        /* The record must exist. */
        if (count($rows) != 1) return false;

        $this->_record = $rows[0];

        /* Account criteria. */
        if (!$this->_record->confirmed || $this->_record->deleted || $this->_record->suspended) return false;

        /* Password must match. */
        if (preg_match('/^[0-9a-f]{32}$/', $this->_record->password))
        {
            /* Moodle is using MD5 password, which may need salt applied. */
            $pass = $this->_pass . ($this->_config->moodle->md5_salt ? $this->_config->moodle->md5_salt : '');
            return md5($pass) === $this->_record->password;
        }
        else if (preg_match('/^\$\d\w?\$/', $this->_record->password))
        {
            /* Moodle is using crypt passwords. */
            return crypt($this->_pass, $this->_record->password) === $this->_record->password;
        }
        else
        {
            /* Unexpected hashed password format, throwing error. */
            $this->_logger->warn('Unexpected Moodle hashed password format for user \'' . $this->_user .
                    '\', unable to authenticate them.');
            return false;
        }
    }

    public function getAuthInfo($property)
    {
        return $this->_record->$property;
    }

    public function getUsername()
    {
        if ($this->_config->moodle->username_prefix)
        {
            return $this->_config->moodle->username_prefix . $this->_user;
        }
        else
        {
            return $this->_user;
        }
    }

    /**
     * Returns the plain Moodle username that was used to authenticate.
     *
     * @return {string} Moodle username
     */
    public function getMoodleUsername()
    {
        return $this->_user;
    }

    /**
     * Returns the connection to the Moodle database.
     *
     * @return Zend_Db Moodle database connection.
     */
    public function getMoodleDatabaseConn()
    {
        return $this->_mdb;
    }
}