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
 * @date 21st February 2010
 */

class Sahara_Acl extends Zend_Acl
{
    /** Unauthorised user. */
    const UNAUTH = 'UNAUTH';

    /** Demonstration user. */
    const DEMO = 'DEMO';

    /** Normal users. */
    const USER = 'USER';

    /** Academic users. */
    const ACADEMIC = 'ACADEMIC';

    /** Administrator user. */
    const ADMIN = 'ADMIN';

    /** Pages an unauthenticated user may access. */
    protected $_unAuthPages = array('index' => array('index'));

    /** Pages a demonstration user may access. */
    protected $_demoPages = array();

    /** Pages a user may access. */
    protected $_userPages = array();

    /** Pages an academic user may access. */
    protected $_academicPages = array();

    /** Pages an administrator user may access. */
    protected $_adminPages = array();

    /** The users qualified name. */
    protected $_userQName;

    /** The users role. */
    protected $_userRole;

    public function __construct($user)
    {
        $this->_userQName = $user;
    }

    public function loadPermissions()
    {
        $this->_userRole = self::UNAUTH;


    }


    /**
     * Loads the Acl list for unauthenticated users.
     */
    protected function _loadUnAuthAcls()
    {
        $this->addRole(new Zend_Acl_Role(self::UNAUTH));
        $this->_loadAclAssoc(self::UNAUTH, $this->_unAuthPages);
    }

    /**
     * Loads the Acl list for demonstration users.
     */
    protected function _loadDemoAcls()
    {
        $this->_loadUnAuthAcls();
        $this->addRole(new Zend_Acl_Role(self::DEMO));
        $this->_loadAclAssoc(self::DEMO, $this->_demoPages);
    }

    /**
     * Loads the Acl list for users.
     */
    protected function _loadUserAcls()
    {
        $this->_loadDemoAcls();
        $this->addRole(new Zend_Acl_Role(self::USER));
        $this->_loadAclAssoc(self::USER, $this->_userPages);
    }

    /**
     * Loads the Acl list for academic users.
     */
    protected function _loadAcademicAcls()
    {
        $this->_loadUserAcls();
        $this->addRole(new Zend_Acl_Role(self::ACADEMIC));
        $this->_loadAclAssoc(self::ACADEMIC, $this->_academicPages);
    }

    /*
     * Loads the Acl list for admin users.
     */
    protected function _loadAdminAcls()
    {
        $this->_loadAcademicAcls();
        $this->addRole(new Zend_Acl_Role(self::ADMIN));
        $this->_loadAclAssoc(self::UNAUTH, $this->_adminPages);
    }

    /**
     * Loads the specified ACL array for the specified role.
     *
     * @param String $role name of role
     * @param assoc array $assoc acl list
     */
    protected function loadAclAssoc($role, $assoc)
    {
        foreach ($assoc as $controller => $actionList)
        {
            foreach ($actionList as $action)
            {
                $this->allow($role, null, $controlle . '-' .$action);
            }
        }
    }

    /**
     * Gets the users role.
     * @return String users role
     */
    protected function getuserRole()
    {
        return $this->_userRole;
    }
}