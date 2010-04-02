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

/**
 * Controller for the queue.
 *
 * <ul>
 * 	<li>index - Display a list of resource a user can queue for.</li>
 * </ul>
 */
class QueueController extends Sahara_Controller_Action_Acl
{
    /**
     * Action to show a list of queueable resources.
     */
    public function indexAction()
    {
        $this->view->headTitle('Remote Labs: Select a resource');

        /* Load the permissions of the user. */
        $client = Sahara_Soap::getSchedServerPermissionsClient();
        $perms = $client->getPermissionsForUser(array('userQName' => $this->_auth->getIdentity()));

        if (!isset($perms->permission))
        {
            $this->view->noPermissions = true;
            return;
        }

        /* Translate the permissions into a form to display based on user class. */
        $userClasses = array();
        $i = 1;

        foreach ($perms->permission as $perm)
        {
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

            /* Add the user class if it hasn't already been loaded. */
            if (!array_key_exists($p->userClass->userClassName, $userClasses))
            {
                $userClasses[$p->userClass->userClassName] = array();
            }

            /* Load up resource information. */
            $resource = array(
                'resourceClass' => $p->resourceClass,     // The resource class so either 'RIG', 'TYPE' or 'CAPS'
                'resource' => $p->resource->resourceName, // The resource name
                'locked' => $perm->isLocked,              // Whether the permission is locked
                'active' => Sahara_DateTimeUtil::isBeforeNow($p->start) && // Whether the permission is active
                            Sahara_DateTimeUtil::isAfterNow($p->expiry),
                'id' => 'permission' . $p->permissionID,  // An ID to hook to a dialog
                'start' => $p->start,                     // Start time of the resource
                'expiry' => $p->expiry,                   // Expiry time of the resource
                'permissionId' => $p->permissionID,       // Permission ID
                'display' => isset($p->displayName) ? $p->displayName : $p->resource->resourceName // Display name
            );

            array_push($userClasses[$p->userClass->userClassName], $resource);
        }

        /* Sort each of the user class permissions by resource name. */
        foreach ($userClasses as $class => $permList)
        {
            $typePerms = array();
            $rigPerms = array();
            $capsPerms = array();
            foreach ($permList as $perm)
            {
                if      ($perm['resourceClass'] == 'TYPE') $typePerms[$perm['resource']] = $perm;
                else if ($perm['resourceClass'] == 'RIG') $rigPerms[$perm['resource']] = $perm;
                else if ($perm['resourceClass'] == 'CAPABILITY') $capsPerms[$perm['resource']] = $perm;
            }

            ksort($typePerms);
            ksort($rigPerms);
            ksort($capsPerms);
            $userClasses[$class] = array(
                'Rig Types:' => array_values($typePerms),
                'Specific Rigs:'  => array_values($rigPerms),
                'Other:' => array_values($capsPerms)
            );
        }

        $this->view->userPermissions = $userClasses;
    }

    /**
     * Action to show the queuing page.
     */
    public function queuingAction()
    {
        $this->view->headTitle('Remote Lab: Queue');
        echo 'Queueing';
    }

    /**
     * Action that provides information about a permission. The response is
     * returned as a JSON query.
     */
    public function infoAction()
    {
        /* Disable the view renderer and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $id = $this->_request->getParam('id', '0');

        $client = Sahara_Soap::getSchedServerQueuerClient();
        $resp = $client->checkPermissionAvailability(array('permissionID' => $id));

        if ($resp->queuedResource->type == 'NOTFOUND')
        {
            $this->_logger->info("Permission with ID $id not found on Scheduling Server.");
        }

        /* Add a count of number of free resources. */
        $resp->numberFree = 0;
        if (count($resp->queueTarget) > 1 && $resp->queueTarget[1] instanceof stdClass)
        {
            /* Multiple queue targets. */
            foreach ($resp->queueTarget as $t)
            {
                if ($t->isFree) $resp->numberFree++;
            }
        }
        else if (count($resp->queueTarget))
        {
            /* One queue target (quirk in PHPSoap). */
            if ($resp->queueTarget->isFree) $resp->numberFree = 1;
        }

        echo $this->view->json($resp);
    }

    /**
     * Action that queues an experiment.
     */
    public function queueAction()
    {
        /* Disable view render and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $params = $this->_request->getParams();

        $client = Sahara_Soap::getSchedServerQueuerClient();
        $response = $client->addUserToQueue(array(
            'userID'       => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $params['id'])
        ));

        echo $this->view->json($response);
    }

    /**
     * Action that removes a user from the queue.
     */
    public function cancelAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $response = Sahara_Soap::getSchedServerQueuerClient()->removeUserFromQueue(array(
        	'userQName' => $this->_auth->getIdentity()
        ));

        echo $this->view->json($response);
    }

    /**
     * Action that unlocks a permission.
     */
    public function unlockAction()
    {
        /* Disable view renderer and layout. */
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $params = $this->_request->getParams();

        $client = Sahara_Soap::getSchedServerPermissionsClient();
        $response = $client->unlockUserLock( array(
            'userID'       => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $params['permission']),
            'lockKey'      => $params['passkey']
        ));

        echo $this->view->json(array('successful' => $response->successful));
    }
}
