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
    const UNAUTH = 'NOTFOUND';

    /** Demonstration user. */
    const DEMO = 'DEMO';

    /** Normal users. */
    const USER = 'USER';

    /** Academic users. */
    const ACADEMIC = 'ACADEMIC';

    /** Administrator user. */
    const ADMIN = 'ADMIN';

    /** @var assoc array Pages an unauthenticated user may access. */
    protected $_unAuthPages = array('index' => array('index', 'logout', 'feedback'),
                                    'labinfo' => array('index'),
                                    'info' => array('index', 'faq', 'contact'),
                                    'demo' => array('index'),
                                    'error' => array('error')
                            );

    /** @var assoc array Pages a demonstration user may access. */
    protected $_demoPages = array();

    /** @var assoc array Pages a user may access. */
    protected $_userPages = array('queue' => array('index', 'unlock', 'info', 'queue', 'queuing', 'cancel',
                                                   'update', 'inqueue'),
                                  'bookings' => array('index', 'commit', 'times', 'existing', 'cancel', 'waiting'),
                                  'session' => array('index', 'info', 'finish', 'primitivebridge',
                                                     'attributebridge'),
                                  'primitive' => array('json', 'echo', 'file'),
                                  'batch' => array('upload', 'torigclient', 'status', 'abort'),
                                  'home' => array('index', 'list', 'listsession', 'download',
                                  				  'delete', 'deletesession')
                            );

    /** @var assoc array Pages an academic user may access. */
    protected $_academicPages = array('academic' => array('index'));

    /** @var assoc array Pages an administrator user may access. */
    protected $_adminPages = array('admin' => array('index', 'rig', 'type', 'rigpage', 'kick',
                                                    'canceloffline')
                            );

    /** @var String The users qualified name. */
    protected $_user;

    /** @var String The users role. */
    protected $_userRole;

    /** @var Sahara_Logger Logger. */
    protected $_logger;

    public function __construct($user)
    {
        $this->_user = $user;
        $this->_logger = Sahara_Logger::getInstance();
    }

    /**
     * Loads the users role and the appropriate permissions for that role.
     */
    public function loadPermissions()
    {
        $this->_userRole = self::UNAUTH;

        if ($this->_user != null)
        {
        	/* Attempt to find the user's 'persona' which defines their role. */
            $user = Sahara_Soap::getSchedServerPermissionsClient()->getUser(array('userQName' => $this->_user));
            $this->_userRole = $user->persona;
        }
        else
        {
            $this->_userRole = self::UNAUTH;
        }

        /* Add role hierarchy. */
        $this->addRole(new Zend_Acl_Role(self::UNAUTH));
        $this->addRole(new Zend_Acl_Role(self::DEMO), self::UNAUTH);
        $this->addRole(new Zend_Acl_Role(self::USER), self::DEMO);
        $this->addRole(new Zend_Acl_Role(self::ACADEMIC), self::USER);
        $this->addRole(new Zend_Acl_Role(self::ADMIN), self::ACADEMIC);

        /* Loads the permissions in a stack with each higher privilege role
         * inheriting the preceding roles privileges. */
        switch ($this->_userRole)
        {
            case self::ADMIN:
                $this->_loadAclAssoc(self::ADMIN, $this->_adminPages);
                /* Falls through. */
            case self::ACADEMIC:
                $this->_loadAclAssoc(self::ACADEMIC, $this->_academicPages);
                /* Falls through. */
            case self::USER:
                $this->_loadAclAssoc(self::USER, $this->_userPages);
                /* Falls through. */
            case self::DEMO:
                $this->_loadAclAssoc(self::DEMO, $this->_demoPages);
                /* Falls through. */
            case self::UNAUTH:
                $this->_loadAclAssoc(self::UNAUTH, $this->_unAuthPages);
        }
    }

    /**
     * Returns true if the user has permission to use the specified controller
     * and action.
     *
     * @param String $controller controller name
     * @param String $action controller action
     * @return boolean true if the user has permission
     */
    public function hasPermission($controller, $action)
    {
        return $this->isAllowed($this->_userRole, null, strtolower("$controller-$action"));
    }

    /**
     * Loads the specified ACL array for the specified role.
     *
     * @param String $role name of role
     * @param assoc array $assoc acl list
     */
    protected function _loadAclAssoc($role, $assoc)
    {
        foreach ($assoc as $controller => $actionList)
        {
            foreach ($actionList as $action)
            {
                $this->allow($role, null, "$controller-$action");
            }
        }
    }

    /**
     * Gets the users role.
     *
     * @return String users role
     */
    public function getUserRole()
    {
        return $this->_userRole;
    }
}