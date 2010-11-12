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
    /**
	 * View to make a booking.
     */
    public function indexAction()
    {
        $this->view->headTitle('Remote Labs - Bookings');

        if (($pid = $this->_getParam('pid', 0)) == 0)
        {
            /* No permission identifier supplied, so back to the queue page. */
            $this->_flashMessenger->addMessage('No permission identifier supplied.');
            $this->_redirectTo('index', 'queue');
        }

        $perm = Sahara_Soap::getSchedServerPermissionsClient()->getPermission(array('permissionID' => $pid));

        /* Pre-conditions to display a booking page. This should all be handled
         * by the queue page (i.e. the user should not be allowed to get here,
         * so give them a forcible redirect. */
        if ($perm->permissionID == 0) // Must exist
        {
            $this->_logger->warn("Can't book because permission with identifier '$pid' not found.");
            $this->_flashMessenger->addMessage("Permission with identifier '$pid' not found.");
            $this->_redirectTo('index', 'queue');
        }
        else if (!$perm->canBook) // Must allow bookings
        {
            $this->_logger->warn("Can't book because permission with identifier '$pid' does not allow bookings.");
            $this->_flashMessenger->addMessage("Permission with identifier '$pid' does not allow bookings.");
            $this->_redirectTo('index', 'queue');
        }
        else if (Sahara_DateTimeUtil::isBeforeNow($perm->expiry) || Sahara_DateTimeUtil::isAfterNow($perm->start))
        {
            $this->_logger->warn("Can't book because permission with identifier '$pid' is expired.");
            $this->_flashMessenger->addMessage("Permission with identifier '$pid' is expired.");
            $this->_redirectTo('index', 'queue');
        }

        /* More pre-conditions to display a booking page. However, these aren't
         * handled by the queue page, so give a *helpful* warning. */
        $bookings = Sahara_Soap::getSchedServerBookingsClient()->getBookings(array(
            'userID' => array('userQName', $this->_auth->getIdentity()),
            'permissionID' => array('permissionID' => $perm->permissionID),
            'showCancelled' => false,
            'showFinished' => false
        ));

        // Booking horizon has elapsed expiry
        // Too may existing permission

        $this->view->permission = $perm;

        echo "<pre>";
        var_dump($bookings);
        echo "</pre>";
    }

    /**
	 * View to view a list of existing bookings.
     */
    public function existingAction()
    {
        // TODO
    }
}