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
 * @date 9th March 2010
 */

/**
 * Controller for viewing, making and deleting bookings.
 */
class BookingsController extends Sahara_Controller_Action_Acl
{
    /** @var String date format. */
    const DATE_FORMAT = 'Y-m-d';
    /**
	 * View to make a booking.
     */
    public function indexAction()
    {
        $this->view->headTitle(self::HEAD_TITLE_PREFIX . 'Create Reservations');

        if (($pid = $this->_getParam('pid', 0)) == 0)
        {
            /* No permission identifier supplied, so back to the queue page. */
            $this->_flashMessenger->addMessage('No permission identifier supplied.');
            $this->_redirectTo('index', 'queue');
        }

        $permissions = Sahara_Soap::getSchedServerPermissionsClient()->getPermissionsForUser(
                array('userQName' => $this->_auth->getIdentity())
        );


        $permissions = $permissions->permission;
        if (is_array($permissions))
        {
            /* Multiple permissions. */
            foreach ($permissions as $p)
            {
                if ($p->permission->permissionID == $pid)
                {
                    $perm = $p->permission;
                }
            }
        }
        else if ($permissions != NULL)
        {
            /* Just the one. */
            if ($permissions->permission->permissionID == $pid)
            {
                $perm = $permissions->permission;
            }
        }

        /* Make sure the user has the permission. */
        if (!isset($perm))
        {
            $this->_logger->warn("Can't book because user " . $this->_auth->getIdentity() . " doesn't have permission " +
                    "with identifier '$pid'.");
            $this->_flashMessenger->addMessage("Doesn't have permissions with identifier '$pid'.");
            $this->_redirectTo('index', 'queue');
        }

        /* Pre-conditions to display a booking page. This should all be handled
         * by the queue page (i.e. the user should not be allowed to get here,
         * so give them a forcible redirect. */
        if (!$perm->canBook) // Must allow bookings
        {
            $this->_logger->warn("Can't book because permission with identifier '$pid' does not allow bookings.");
            $this->_flashMessenger->addMessage("Permission with identifier '$pid' does not allow bookings.");
            $this->_redirectTo('index', 'queue');
        }
        else if (Sahara_DateTimeUtil::isBeforeNow($perm->expiry))
        {
            $this->_logger->warn("Can't book because permission with identifier '$pid' is expired.");
            $this->_flashMessenger->addMessage("Permission with identifier '$pid' is expired.");
            $this->_redirectTo('index', 'queue');
        }
        $this->view->permission = $perm;

        /* More pre-conditions to display a booking page. However, these aren't
         * handled by the queue page, so give a *helpful* warning. */
        $bookingsResponse = Sahara_Soap::getSchedServerBookingsClient()->getBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $perm->permissionID),
            'showCancelled' => false,
            'showFinished' => false
        ));
        $bookings = $bookingsResponse->bookings;

        /* Work out the number of bookings. */
        $numBookings = 0;
        if (is_array($bookings)) $numBookings = count($bookings);
        else if ($bookings != NULL) $numBookings = 1;

        if ($numBookings >= $perm->maxBookings)
        {
            $this->view->canBook = false;
            return;
        }
        $this->view->canBook = true;

        /* The start time is which ever of the time horizion or permission start
         * that comes first. */
        $horizon = new DateTime();
        if ($perm->timeHorizon > 0)
        {
            $horizon->add(new DateInterval('PT' . $perm->timeHorizon . 'S'));
        }

        $start = new DateTime($perm->start);
        if ($start->getTimestamp() < $horizon->getTimestamp())
        {
            $start = $horizon;
        }

        $this->view->currentDay = $start->format(self::DATE_FORMAT);
        $end = new DateTime($perm->expiry);
        $this->view->endDay = $end->format(self::DATE_FORMAT);

        $freeTimes = Sahara_Soap::getSchedServerBookingsClient()->findFreeBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $perm->permissionID),
            'period' => array('startTime' => $this->view->currentDay . 'T00:00:00',
                              'endTime'   => $this->view->currentDay . 'T23:59:59')
        ));

        $times = $freeTimes->bookingSlot;
        $slots = array();
        $i = 0;
        if (is_array($times))
        {
            foreach ($times as $t)
            {
                $st = new DateTime($t->slot->startTime);
                $secs = $st->format('G') * 3600 + $st->format('i') * 60 + $st->format('s');

            }
        }
    }

    /**
	 * View to view a list of existing bookings.
     */
    public function existingAction()
    {
        $this->view->headTitle(self::HEAD_TITLE_PREFIX . 'Reservations');
        // TODO
    }
}