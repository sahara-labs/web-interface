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

    /** @var int Duration of each booking slot in seconds. */
    const SLOT_DURATION = 900;  // 15 minutes

    /**
	 * View to make a booking.
     */
    public function indexAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Create Reservations');

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
        $this->view->name = $perm->displayName;
        if (!$this->view->name) $this->view->name = $perm->resource->resourceName;

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

        if ($start->getTimestamp() > $end->getTimestamp())
        {
            /* The horizon has moved passed the end of the permission, so no
             * bookings are allowed. */
            $this->view->currentDay = $end->format(self::DATE_FORMAT);
            $this->view->horizonPassed = true;
        }

        $this->view->endDay = $end->format(self::DATE_FORMAT);

        /* More pre-conditions to display a booking page. However, these aren't
         * handled by the queue page, so give a *helpful* warning. */
        $bookingsResponse = Sahara_Soap::getSchedServerBookingsClient()->getBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'showCancelled' => false,
            'showFinished' => false
        ));
        $bookings = $bookingsResponse->bookings;

        /* Make sure the user has not exceeded the number of permission allowed
         * bookings. Also we want to annotate the interface with existing bookings
         * so the user may not make concurrent bookings. */
        $this->view->userBookings = array();
        $numBookings = 0;
        if (is_array($bookings))
        {
            foreach ($bookings as $b)
            {
                if ($b->permissionID->permissionID == $pid) $numBookings++;
                if (strpos($b->startTime, $this->view->currentDay) === 0)
                {
                    $ss = Sahara_DateTimeUtil::getSlotTimeFromISO8601($b->startTime) - 1;
                    $es = Sahara_DateTimeUtil::getSlotTimeFromISO8601($b->endTime);
                    while (++$ss < $es) array_push($this->view->userBookings, $ss);
                }
            }
        }
        else if ($bookings != NULL)
        {
            if ($bookings->permissionID->permissionID == $pid) $numBookings++;
            if (strpos($bookings->startTime, $this->view->currentDay) === 0)
            {
                $ss = Sahara_DateTimeUtil::getSlotTimeFromISO8601($bookings->startTime) - 1;
                $es = Sahara_DateTimeUtil::getSlotTimeFromISO8601($bookings->endTime);
                while (++$ss < $es) array_push($this->view->userBookings, $ss);
            }
        }
        $this->view->numBookings = $numBookings;

        /* Timezone information. */
        // TODO Cache timezone results
        $this->view->tz = Sahara_Soap::getSchedServerBookingsClient()->getTimezoneProfiles();
        $tzOff = ($this->view->tz->offsetFromUTC >= 0 ? '+' : '-') .
                Sahara_DateTimeUtil::zeroPad(floor(abs($this->view->tz->offsetFromUTC) / 3600)) . ':' .
                Sahara_DateTimeUtil::zeroPad(floor(abs($this->view->tz->offsetFromUTC) % 3600 / 60));

        $freeTimes = Sahara_Soap::getSchedServerBookingsClient()->findFreeBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $perm->permissionID),
            'period' => array('startTime' => $this->view->currentDay . 'T00:00:00' . $tzOff,
                              'endTime'   => $this->view->currentDay . 'T23:59:59' . $tzOff)
        ));
        $freeTimes = $freeTimes->bookingSlot;

        $this->view->slots = array();
        $this->view->numSlots = 24 * 60 * 60 / self::SLOT_DURATION;
        $this->view->midSlot = $this->view->numSlots / 2;
        if (is_array($freeTimes))
        {
            foreach ($freeTimes as $t)
            {
                $this->view->slots[Sahara_DateTimeUtil::getSlotTimeFromISO8601($t->slot->startTime)] = $t->state;
            }
        }
        else if ($freeTimes != NULL)
        {
            $this->view->slots[Sahara_DateTimeUtil::getSlotTimeFromISO8601($freeTimes->slot->startTime)] = $freeTimes->state;
        }
        else
        {
            /* For some reason the resource free times response didn't actually
             * provide any times. We will assume we are in a no-permission
             * range. */
            $this->view->slots[0] = 'NOPERMISSION';
        }

        /* Presentation configuration. */
        $this->view->showTzButton = $this->_config->bookings->addTzButton;
        $this->view->dateFormat = $this->_config->bookings->dateFormat;
    }

    /**
     * Commits a boooking.
     */
    public function commitAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $params = $this->_request->getParams();

        $response = Sahara_Soap::getSchedServerBookingsClient()->createBooking(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'booking' => array(
                'bookingID' => 0,
                'permissionID' => array('permissionID' => $params['pid']),
                'startTime' => $params['start'],
                'endTime' => $params['end']
            ),
            'sendNotification' => (bool)$params['send'],

        ));

        echo $this->view->json($response);
    }

    /**
     * Action to get the list of times for a day.
     */
    public function timesAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout()->disableLayout();

        $numSlots = 24 * 60 * 60 / self::SLOT_DURATION;

        if (!($date = $this->_request->getParam('day')) ||
            !($tz   = $this->_request->getParam('tz')) ||
            !($pid  = $this->_request->getParam('pid')))
        {
            $response = array();
            for ($i = 0; $i < $numSlots; $i++) $response[$i] = 'NOPERMISSION';

            echo $this->view->json($response);
            return;
        }

        $bookingsResponse = Sahara_Soap::getSchedServerBookingsClient()->getBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'showCancelled' => false,
            'showFinished' => false
        ));
        $bookings = $bookingsResponse->bookings;

        $userBookings = array();
        if (is_array($bookings))
        {
            foreach ($bookings as $b)
            {
                if (strpos($b->startTime, $date) === 0)
                {
                    $ss = Sahara_DateTimeUtil::getSlotTimeFromISO8601($b->startTime) - 1;
                    $es = Sahara_DateTimeUtil::getSlotTimeFromISO8601($b->endTime);
                    while (++$ss < $es) array_push($userBookings, $ss);
                }
            }
        }
        else if ($bookings != NULL)
        {
            if (strpos($bookings->startTime, $date) === 0)
            {
                $ss = Sahara_DateTimeUtil::getSlotTimeFromISO8601($bookings->startTime) - 1;
                $es = Sahara_DateTimeUtil::getSlotTimeFromISO8601($bookings->endTime);
                while (++$ss < $es) array_push($userBookings, $ss);
            }
        }

        $freeTimes = Sahara_Soap::getSchedServerBookingsClient()->findFreeBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $this->_request->getParam('pid')),
            'period' => array('startTime' => $date . "T00:00:00" . $tz,
                              'endTime'   => $date . "T23:59:59" . $tz)
        ));
        $freeTimes = $freeTimes->bookingSlot;

        $freeSlots = array();
        if (is_array($freeTimes))
        {
            foreach ($freeTimes as $t)
            {
                $freeSlots[Sahara_DateTimeUtil::getSlotTimeFromISO8601($t->slot->startTime)] = $t->state;
            }
        }
        else if ($freeTimes != NULL)
        {
            $freeSlots[Sahara_DateTimeUtil::getSlotTimeFromISO8601($freeTimes->slot->startTime)] = $freeTimes->state;
        }

        /* Combine the user bookings and free times. */
        $state = 'NOPERMISSION';
        $response = array();
        for ($i = 0; $i < $numSlots; $i++)
        {
            if (array_key_exists($i, $freeSlots)) $state = $freeSlots[$i];

            $response[$i] = in_array($i, $userBookings) ? 'OWNBOOKING' : $state;
        }

        echo $this->view->json($response);
    }

    /**
	 * View to view a list of existing bookings.
     */
    public function existingAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Reservations');

        // TODO Cache timezone results
        $this->view->tz = Sahara_Soap::getSchedServerBookingsClient()->getTimezoneProfiles();

        $bookingsResponse = Sahara_Soap::getSchedServerBookingsClient()->getBookings(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'showCancelled' => true,
            'showFinished' => true
        ));

        if (is_array($bookingsResponse->bookings))
        {
            $this->view->bookings = $bookingsResponse->bookings;
        }
        else if ($bookingsResponse->bookings != NULL)
        {
            $this->view->bookings = array($bookingsResponse->bookings);
        }
        else
        {
            $this->view->bookings = false;
        }

        /* Presentation configuration. */
        $this->view->showTzButton = $this->_config->bookings->addTzButton;
        $this->view->dateFormat = $this->_config->bookings->dateFormat;
    }

    /**
     * Action to cancel a booking.
     */
    public function cancelAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->view->layout()->disableLayout();

        $bid = $this->_request->getParam('bid');
        if ($bid > 0)
        {
            echo $this->view->json(Sahara_Soap::getSchedServerBookingsClient()->cancelBooking(array(
                'userID' => array('userQName' => $this->_auth->getIdentity()),
                'bookingID' => array('bookingID' => $bid),
                'reason' => $this->_request->getParam('reason', 'User cancellation.')
            )));
        }
        else
        {
            echo $this->view->json(array('success' => false));
        }
    }

    /**
     * View for a booking that is about to start.
     */
    public function waitingAction()
    {
        $this->view->headTitle($this->_headPrefix . 'Reservation');

        $this->view->bid = $this->_request->getParam('bid');
        if (!$this->view->bid)
        {
            $this->_redirectTo('index', 'queue');
        }

        $booking = Sahara_Soap::getSchedServerBookingsClient()->getBooking(array(
            'userID' => array('userQName' => $this->_auth->getIdentity()),
            'bookingID' => array('bookingID' => $this->view->bid)
        ));

        $this->view->displayName = $booking->displayName;
        $this->view->time = Sahara_DateTimeUtil::getTsFromISO8601($booking->startTime) - time();
    }
    
    /**
     * View to list bookings for a specific rig.
     */
    public function rigAction()
    {
    	if (!($this->hasParam('for') && 
			  $rig = Sahara_Database_Record_Rig::loadFirst(array('name' => $this->_getParam('for')))))
		{
			$this->_logger->debug('Missing param or rig not found');
			$this->_redirectTo('index', 'index');
		}
		
		$this->view->headTitle($this->_headPrefix . "Reservations for $rig->name");
		
		$from = new DateTime();
		if ($this->hasParam('from'))
		{
			list($day, $mon, $year) = explode('-', $this->_getParam('from'));
			$from->setDate($year, $mon, $day);
		}
		$from->setTime(0, 0, 0);
		

		$to = new DateTime();
		$to->setTime(23, 59, 59);
		if ($this->hasParam('to'))
		{
			list($day, $mon, $year) = explode('-', $this->_getParam('to'));
			$to->setDate($year, $mon, $day);
			
			$diff = $from->diff($to);
			if ($diff->invert)
			{
				$to->setTimestamp($from->getTimestamp());
				$to->add(new DateInterval('P7D'));
			}
		}
		else
		{
			$to = new DateTime();
			$to->setTimestamp($from->getTimestamp());
			$to->add(new DateInterval('P7D'));
		}
		
		
		$this->view->rig = $rig;
		$this->view->from = $from;
		$this->view->to = $to;
		$this->view->bookings = $rig->dateRangeBookings($from, $to);
    }
}