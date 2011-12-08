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
 * Administration controller.
 */
class AdminController extends Sahara_Controller_Action_Acl
{
    /**
     * Admin actions controller.
     */
    public function indexAction()
    {
        /* TODO Create list of actions. */
        $this->_redirectTo('rig');
    }

    /**
     * Rig administration.
     */
    public function rigAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Rig Administration');

        /* Get a list of rig types. */
        $service = Sahara_Soap::getSchedServerRigManagementClient();
        $response = $service->getTypes();

        $rigTypes = array();
        if (is_array($response->type))
        {
            foreach ($response->type as $type)
            {
                $type = $type;
                $rigTypes[$type->name] = $type;
            }
        }
        else if (is_object($response->type))
        {
            $rigTypes[$response->type->name] = $response->type;
        }
        else return;

        $this->view->rigTypes = $rigTypes;
    }

    /**
     * Provides rig type status.
     */
    public function typeAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        echo $this->view->json(
            Sahara_Soap::getSchedServerRigManagementClient()->getTypeStatus(array(
                'name' => $this->_getParam('name')
            ))
        );
    }

    /**
     * Rig page action.
     */
    public function rigpageAction()
    {
        $name = $this->_getParam('rig');
        if (!$name)
        {
            $this->_redirectTo('rig', 'admin');
        }

        $this->view->headTitle($this->_headPrefix . $this->view->stringTransform($name, '_', ' '));
        $this->view->rig = Sahara_SOAP::getSchedServerRigManagementClient()->getRig(array('name' => $name));
    }

    /**
     * Action to kick a user off a rig.
     */
    public function kickAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $name = $this->_getParam('rig');
        $reason = $this->_getParam('reason', 'None supplied.');
        if (!$name)
        {
            echo $this->view->json(array(
                'successful' => false,
                'failureCode' => -1,
                'failureReason' => 'Rig name not supplied.'
            ));
        }

        echo $this->view->json(Sahara_Soap::getSchedServerRigManagementClient()->freeRig(array(
            'requestorQName' => $this->_auth->getIdentity(),
            'rig' => array('name' => $name),
            'reason' => $reason
        )));
    }

    /**
     * Action to put a rig offline for a time period.
     */
    public function putofflineAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $name = $this->_getParam('rig');
        $start = $this->_getParam('start');
        $end = $this->_getParam('end');
        $reason = $this->_getParam('reason');

        if (!$name || !$start || !$end || !$reason)
        {
            echo $this->view->json(array(
                'successful' => false,
                'failureCode' => -1,
                'failureReason' => 'Required param not supplied.'
            ));
        }

        $tzOff = new DateTimeZone(date_default_timezone_get());
        $tzOff = $tzOff->getOffset(new DateTime());
        $tz = $tzOff > 0 ? '+' : '-';
        $tz .= Sahara_DateTimeUtil::zeroPad(floor(abs($tzOff) / 3600)) . ':' . Sahara_DateTimeUtil::zeroPad(abs($tzOff) % 3600);

        list($date, $time) = explode(' ', trim($start));
        list($day, $mon, $yr) = explode('/', $date);
        list($hr, $min) = explode(':', $time);
        $start = trim($yr) . '-' . trim($mon) . '-' . trim($day)  . 'T' . trim($hr) . ':' . trim($min) . ':00' . $tz;

        list($date, $time) = explode(' ', trim($end));
        list($day, $mon, $yr) = explode('/', $date);
        list($hr, $min) = explode(':', $time);
        $end = trim($yr) . '-' . trim($mon) . '-' . trim($day)  . 'T' . trim($hr) . ':' . trim($min) . ':00' . $tz;

        echo $this->view->json(Sahara_Soap::getSchedServerRigManagementClient()->putRigOffline(array(
            'requestorQName' => $this->_auth->getIdentity(),
            'rig' => array('name' => $name),
            'start' => $start,
            'end' => $end,
            'reason' => $reason
        )));
    }

    /**
     * Action to cancel a rig offline period.
     */
    public function cancelofflineAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $id = $this->_getParam('pid');
        if (!$id)
        {
            echo $this->view->json(array(
                'successful' => false,
                'failureCode' => -1,
                'failureReason' => 'Period ID not supplied.'
            ));
        }

        echo $this->view->json(Sahara_Soap::getSchedServerRigManagementClient()->cancelRigOffline(array(
            'requestorQName' => $this->_auth->getIdentity(),
            'period' => array(
                'id' => $id,
                /* Dummy fields. */
                'start' => '2010-02-02T00:00:00+00:00',
                'end' => '2010-02-02T00:00:00+00:00',
                'reason' => 'dummy'
            )
        )));
    }

    /**
     * Action create perm keys.
     */
    public function permkeyAction()
    {
	    /* This should only be enabled if the permission key system is enabled. */
	    if (!$this->_config->permkey->enable)
        {
            $this->_logger->warn('Tried to load permission key creation interface when the permission activation feature is disabled.');
            $this->_redirectTo('index');
        }

        $this->view->headTitle($this->_headPrefix . 'Permission Keys');

        $db = Sahara_Database::getDatabase();
        $this->view->classes = $db->fetchAll($db->select()->from('user_class'));

        if ($this->_request->isPost())
        {
            $this->view->keys = array();

            $params = $this->_request->getParams();
            for ($i = 0; $i < $params['num']; $i++)
            {
                /* Generate key. */
                $key = '';
                for ($k = 0; $k < 25; $k++)
                {
                    switch (rand(0, 3))
                    {
                        case 0:
                            $key .= chr(rand(0, 24) + 97);
                            break;
                        case 1:
                            $key .= chr(rand(0, 24) + 65);
                            break;
                        case 2:
                            $key .= chr(rand(0, 10) + 48);
                            break;
                    }
                }
                array_push($this->view->keys, $key);

                $row = array(
                    'redeemkey' => $key,
                    'user_class_id' => $params['class'],
                    'remaining_uses' => $params['uses']
                );

                if ($params['home']) $row['home_org'] = $params['home'];
                if ($params['aff']) $row['affliation'] = $params['aff'];

                $db->insert('user_association_redeem_keys', $row);
            }
        }
    }
}
