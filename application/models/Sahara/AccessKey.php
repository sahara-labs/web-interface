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
 * @date 5th January 2012
 */

/**
 * Performs access key redemption.
 */
class Sahara_AccessKey
{
    /** @var Zend_Db_Adapter_Abstract Sahara Database. */
    private $_db;

    /** @var Zend_Config Configuration. */
    private $_config;

    /** @var Sahara_Logger Logger. */
    private $_logger;

    public function Sahara_AccessKey()
    {
        $this->_db = Sahara_Database::getDatabase();

        $this->_config = Zend_Registry::get('config');
        $this->_logger = Sahara_Logger::getInstance();
    }

    public function keyActivate($pkey)
    {
        if (!$this->_config->permkey->enable)
        {
            $this->_logger->warn('Tried to activate permission when the permission activation feature is disabled.');
            return array(
                        	'success' => false,
                            'error' => 'Permission activation feature is disabled.'
            );
        }

        if (!$pkey)
        {
            $this->_logger->debug("Tried to activate permission without supplied a permission key.");
            return array(
                      'success' => false,
                      'error' => 'No permission key supplied.'
            );
        }

        $tables = $this->_db->listTables();
        if (in_array('user_class_key', $tables))
        {
            $resp = $this->_newKeyActivate($pkey);

            /* If the key redemption was not successful because it was not found,
             * the key may be from the fallback system. */
            if (($resp['success'] === false && $resp['error'] == 'Key not valid.') &&
            in_array('user_association_redeem_keys', $tables))
            {
                $resp = $this->_legacyKeyActivate($pkey);
            }
        }

        return $resp;
    }

    /**
     * Tries redeem the key using the (new) 'user_class_key' table. This is
     * the preferred method as a better administration interface exists.
     *
     * @param String $pkey access key
     * @return array
     */
    private function _newKeyActivate($pkey)
    {
        $key = $this->_db->fetchRow($this->_db->select()
                ->from(array('uck' => 'user_class_key'))
                ->join(array('uc' => 'user_class'), 'uck.user_class_id = uc.id', array('name'))
                ->where('uck.redeem_key = ?', $pkey)
                ->where('uck.remaining > 0')
                ->where('uck.active = 1')
                ->where('uc.active = 1'));

        if (!$key) return array(
                'success' => false,
                'error' => 'Key not valid.');

        $auth = Zend_Auth::getInstance();
        list($ns, $name) = explode(':', $auth->getIdentity(), 2);

        $sel = $this->_db->select()
                ->from(array('u' => 'users'))
                ->where('namespace = ?', $ns)
                ->where('name = ?', $name);


        $sel->join(array('s' => 'shib_users_map'), 'u.name = s.user_name', array('home_org', 'affliation'));

        $user = $this->_db->fetchRow($sel);
        if (!$user) return array(
        		'success' => false,
                'error' => 'User not found.'
        );

        /* Check the constraints do indeed match. */
        $rowSet = $this->_db->fetchAll($this->_db->select()
                ->from('user_class_key_constraint')
                ->where('user_class_key_id = ?', $key['id']));
        if (count($rowSet))
        {
            foreach ($rowSet as $row)
            {

            }
        }

        /* Check the user doesn't already have the user association. */
        if ($this->_db->fetchOne($this->_db->select()
                ->from('user_association', 'count(users_id)')
                ->where('users_id = ?', $user['id'])
                ->where('user_class_id = ?', $key['user_class_id'])) != 0)
        {
            return array(
                  	'success' => false,
                    'error' => 'You have already redeemed the key.'
            );
        }

        /* All constraints are met so we can create the association. */
        $this->_db->beginTransaction();

        /* Mark a use. */
        $this->_db->update('user_class_key',  array('remaining' => (--$key['remaining'])),
                'redeem_key = ' . $this->_db->quote($key['redeem_key'])
        );

        $this->_db->insert('user_association', array(
                'users_id' => $user['id'],
                'user_class_id' => $key['user_class_id']
        ));

        $this->_db->insert('user_class_key_redemption', array(
            	'user_class_key_id' => $key['id'],
            	'user_id' => $user['id']
        ));

        $this->_db->commit();

        return array('success' => true);
    }

    /**
     * Tries to redeem the key using the (legacy) 'user_association_redeem_keys'.
     *
     * @param String $pkey
     * @return array
     */
    private function _legacyKeyActivate($pkey)
    {
        /* Check the key exists, has remaining uses and the redeeming class
         * is active. */
        $key = $this->_db->fetchRow($this->_db->select()
            ->from(array('rk' => 'user_association_redeem_keys'))
            ->join(array('uc' => 'user_class'), 'rk.user_class_id = uc.id', array('name'))
            ->where('rk.redeemkey = ?', $pkey)
            ->where('rk.remaining_uses > 0')
            ->where('uc.active = 1'));

        if (!$key) return array(
                  	'success' => false,
                    'error' => 'Key not valid.');


        /* Load user. */
        $auth = Zend_Auth::getInstance();
        list($ns, $name) = explode(':', $auth->getIdentity(), 2);
        $sel = $this->_db->select()
            ->from(array('u' => 'users'))
            ->where('namespace = ?', $ns)
            ->where('name = ?', $name);

        /* If the redemption key requires a specific organisation or affliation,
         * load the users properties. */
        if ($key['home_org'] || $key['affliation'])
        {
            $sel->join(array('s' => 'shib_users_map'), 'u.name = s.user_name', array('home_org', 'affliation'));
        }

        $user = $this->_db->fetchRow($sel);
        if (!$user) return array(
                     'success' => false,
                     'error' => 'Constraints not met.');

        /* Check the constraints do indeed match. */
        if ($key['home_org'] && $key['home_org'] != $user['home_org'] ||
                $key['affliation'] && $key['affliation'] != $user['affliation'])
        {
            return array(
                        	'success' => false,
                            'error' => 'Constraints not met.');
        }

        /* Check the user doesn't already have the user association. */
        if ($this->_db->fetchOne($this->_db->select()
               ->from('user_association', 'count(users_id)')
               ->where('users_id = ?', $user['id'])
               ->where('user_class_id = ?', $key['user_class_id'])) != 0)
        {
            return array(
                        	'success' => false,
                            'error' => 'You have already redeemed the key.'
            );
        }

        /* All constraints are met so we can create the association. */
        $this->_db->update('user_association_redeem_keys',  array('remaining_uses' => (--$key['remaining_uses'])),
                    		'redeemkey = ' . $this->_db->quote($key['redeemkey']));

        $this->_db->insert('user_association', array(
                        'users_id' => $user['id'],
                        'user_class_id' => $key['user_class_id']
        ));

        return array('success' => true);
    }
}