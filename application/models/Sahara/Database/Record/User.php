<?php
/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2012, University of Technology, Sydney
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
 * @date 18th December 2012
 */

/**
 * Users table record.
 */
class Sahara_Database_Record_User extends Sahara_Database_Record
{
    /** @var String Name of table. */
    protected $_name = 'users';
    
    /** @var array Relationships with other tables. */
    protected $_relationships = array(
            'userClasses' => array(
                'table' => 'user_class',
                'entity' => 'UserClass',
                'join'  => 'table',
                'join_table'  => 'user_association',
                'join_table_source' => 'users_id',
                'join_table_dest' => 'user_class_id'
            )
    );
    
    /**
     * Gets the user record of the logged is user. If no user is logged in,
     * NULL is returned.
     * 
     * @return Sahara_Database_Table_User logged in user
     */
    public static function getLoginUser()
    {    
        $name = Zend_Auth::getInstance()->getIdentity();
        if (!$name)
        {
            /* No user logged in. */
            return NULL;
        }

        $name = explode(':', $name, 2);
        return self::load(array('namespace' => $name[0], 'name' => $name[1]));
    }
}
 
