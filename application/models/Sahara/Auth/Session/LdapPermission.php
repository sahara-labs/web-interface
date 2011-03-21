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
 * @date 13th July 2010
 */

/**
 * Adds permission to an user based on their LDAP account details. The
 * configuration for this class is:
 * <ul>
 * 	<li>session.ldappermission.rule - Rules which define which users have
 *  the specified permissions.</li>
 * </ul>
 */
class Sahara_Auth_Session_LdapPermission extends Sahara_Auth_Session
{
    /** @var array The list of filter rules. */
    private $_filterRules;

    /** @var Zend_Db Database adapter. */
    private $_db;

    public function __construct()
    {
        parent::__construct();
        $rules = $this->_config->session->ldappermission->rule;

        if (!$rules) throw new Exception("No LDAP permission rules defined.", 105);

        $this->_filterRules = array();
        foreach ($rules->toArray() as $r)
        {
            array_push($this->_filterRules, new Sahara_Auth_Session_LdapPermission_Rule($r));
        }

        $this->_db = Sahara_Database::getDatabase();
    }

    /**
     * (non-PHPdoc)
     * @see models/Sahara/Auth/Sahara_Auth_Session::setup()
     */
    public function setup()
    {
        if (!$this->_authType instanceof Sahara_Auth_Type_Ldap) throw new Exception("LdapPermission requires the " .
        	"authentication type to be Sahara_Auth_Type_Ldap.");

        /* Load the existing list of permissions. */
        $user = $this->_db->fetchRow($this->_db->select()
            ->from('users')
            ->where('name = ?',$this->_authType->getUsername())
            ->where('namespace = ?', $this->_config->institution));
        if (!$user) throw new Exception("Cannot user generate permissions from LDAP when the user doesn't exist.");

        $matches = $this->_db->fetchAll($this->_db->select()
            ->from('user_association')
            ->where('users_id = ?', $user['id']));

        $existingPermissions = array();
        if ($matches)
        {
            $select = $this->_db->select()
                ->from('user_class');
            foreach ($matches as $m)
            {
                $select->orWhere('id = ?', $m['user_class_id']);
            }

            $classes = $this->_db->fetchAll($select);
            foreach ($classes as $c)
            {
                array_push($existingPermissions, $c['name']);
            }
        }

        /* Appies the filter results to determine the required user classes. */
        $requiredPermissions = array();
        $entry = $this->_authType->getLdapEntry();

        foreach ($this->_filterRules as $rule)
        {
            if ($rule->applies($entry))
            {
                $requiredPermissions = array_merge($requiredPermissions, $rule->getUserClasses());
            }
        }
        $requiredPermissions = array_unique($requiredPermissions);

        $this->_addAssociations($user['id'], array_diff($requiredPermissions, $existingPermissions));
        $this->_removeAssociations($user['id'], array_diff($existingPermissions, $requiredPermissions));
    }

    /**
     * Adds user associations between the user and the list of classes.
     *
     * @param int $uid user identifier
     * @param array $classes list of user class names
     */
    private function _addAssociations($uid, $classes)
    {
        if (!count($classes)) return;

        $select = $this->_db->select()->from('user_class');
        foreach ($classes as $c)
        {
            $select->orWhere('name = ?', $c);
        }
        $classes = $this->_db->fetchAll($select);

        foreach ($classes as $c)
        {
            $data = array(
                'users_id' => $uid,
                'user_class_id' => $c['id']
            );
            $this->_db->insert('user_association', $data);
        }
    }

    /**
     * Removes user associations between the user and the list of classes.
     *
     * @param int $uid user identifier
     * @param array $classes list of user class names
     */
    private function _removeAssociations($uid, $classes)
    {
        if (!count($classes)) return;

        $select = $this->_db->select()->from('user_class');
        foreach ($classes as $c)
        {
            $select->orWhere('name = ?', $c);
        }
        $classes = $this->_db->fetchAll($select);

        foreach ($classes as $c)
        {
            $where = $this->_db->quoteInto('users_id = ? AND ', $uid) .
                     $this->_db->quoteInto('user_class_id = ?', $c['id']);

            $this->_db->delete('user_association', $where);
        }
    }
}
