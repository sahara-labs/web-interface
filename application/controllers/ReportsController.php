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
 * @author Tania Machet (tmachet)
 * @date 13th December 2010
 */

class ReportsController extends Sahara_Controller_Action_Acl
{
    public function indexAction()
    {
        $this->view->headTitle(self::HEAD_TITLE_PREFIX . 'Reports');
        $this->view->noPermissions = true;
        
        /* Load the permissions of the user. */
        $client = Sahara_Soap::getSchedServerPermissionsClient();
        $perms = $client->getPermissionsForUser(array('userQName' => $this->_auth->getIdentity()));

        if (!isset($perms->permission))
        {
            $this->view->noPermissions = true;
            return;
        }
        
        foreach ($perms->permission as $perm)
        {
            $this->view->noPermissions = false;
            
             /* This is a hack because PHPSoap / Zend SOAP seems to have some quirks
             * parsing WSDLs. It generates a different object structure
             * depending if there is one permission, or multiple permissions. */
            if ($perm->permission == null)
            {
                if (is_bool($perm)) continue;
                $p = $perm;
                $perm = $perms;
                $perm->isLocked = $perm->permission->isLocked;
            }
            else
            {
                $p = $perm->permission;
            }
        }
        
        $this->view->permission = $perms;
    }
}
