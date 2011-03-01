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
 * @date 28th February 2010
 */

/**
 * Help information for Sahara.
 */
class Sahara_Help
{
    /* Default help contents. */
    private static $_help = array(
        'Rig Selection' => array(
                'help' => 'This page is used for selecting a rig type. A dialog will open after
                	selecting the rig type, enabling you to queue, reserve, or cancel a rig session.
                	If these options are not available, or the rig seems to be offline, you may need
                	to check back later.',
                'troubleshooting' => array(
                    'Queue:' => array(
                        'How long do I have to wait in the queue?' => 'Queue time depends upon
                       		 completion of the previous user\'s session.',

                        'Queue time depends upon completion of the previous user\'s session.' =>
                        	'A high priority user may be attempting to access the rig.',

                        'Can I cancel my queue?' =>
                        	'Yes, you will be redirected to the "Rig Selection" page after cancelling the queue.',

                        'What happens if I close the browser window or my network fails?' =>
                        	'Please try to reopen the browser window as soon as possible. However, if this
                        	happens while waiting in a queue, your position in the queue may be removed and
                        	you may need to queue again.',

                       'How do I get to "Rig Session" page from here?' => 'The system directs the user to
                        	the "Rig Session" page automatically after you queue and the rig is available to use.'
                    ),

                    'Reserving:' => array(
                        'How do I reserve a rig session?' => 'Select the rig and click on the "Reserve" button.
                         	This will direct you to the reservation page.',
                        'I reserved a rig, but it was unavailable when I tried to access it.' => 'This may
                         	happen due to rigs that are fully reserved by other users for that time.  However,
                         	you can still queue to use the rig.'
                    ),

                    'Explanation of Legend:' => array(
                        'Active - The rig is online and the user may queue to use.',
                        'Inactive - User does not have permission to queue for this rig. Permissions are
                        time-based and the current time is out of the assigned usage period.',
                        'Locked - The rig is online, but it is locked. Before a user can queue, a pass
                        key must be supplied.',
                        'Free - The rig is online and free to use.',
                        'In Use - The rig is online, but being accessed by another user.',
                        'Offline - The rig if offline and cannot be used.'
                    )
                )
            ),

       'Reservation' => array(
                'help' => 'The \'Reservation\' page allows you to reserve future rig sessions in advance.
    	            Availability and time slots depend on alloted permissions for the rig.',
                'troubleshooting' => array(
                    'Reservations' => array(
                        'How do I make a reservation?' => 'You can select a date to reserve the rig by
                        	clicking the calendar icon that is located next to the date window. You can select
                        	your desired time slot by clicking on the available times (green sections) and
                        	selecting the green check button. A reservation confirmation dialog will appear
                        	to confirm. Click on the "Confirm Reservation" button. Another dialog will appear
                        	confirming that the reservation is successfully created.',
                        'Can I make multiple reservations?' => 'You may be able to make multiple reservations
                        	for a rig depending on the allotted permissions of the rig.',
                        'Reservation time is shown as \'Available\', but I can\'t reserve the rig.' =>
                            'This may happen due to reaching the maximum number of reservations allowed for
                            a single user. This also may be due to rigs that are reserved for
                            priority users for that time period.  However, the user can stillqueue to use the rig.',
                        'I tried to reserve for a longer period, but the given option is for a shorter period.' =>
                            'Alloted session times are predefined by your instructor.'
                    ),
                    'Editing Reservations' => array(
                        'How can I change/edit a reservation?' => 'You must first cancel the existing reservation
                        	and then create a new reservation. This can be done through the \'Reservation\' tab.'
                    ),
                    'Cancelling Reservations' => array(
                        'How do I cancel a reservation?' => 'Click on the \'Existing Reservations\' tab which
                        	is located next to the \'Rig Selection\' tab. Then select the reservation that you
                        	wish to cancel. A dialog will appear asking you to confirm.'
                    ),
                    'Reservation Reminder' => array(
                        'Can I set a reminder for my reservation?' => 'No, you will receive an automatic
                        	reminder by email from the system one hour before the rig session starts.'
                    ),
                    'Reservation Confirmation' => array(
                        'I received an error message and cannot confirm my reservation.' => 'Please reload the page.
                        	It will refresh the \'Reservation\' page. If the reservation confirmation does
                        	not appear, try reserving again.'
                    ),
                    'Time Zones' => array(
                        'Time zone is based on your local computer time setting.'
                    ),
                )
            ),

        'Reservation Waiting' => array(
                'help' => 'This is a stand-off page which is shown when your reservation is going to
                	start with in 30 minutes. It shows how long you have left before your reservation starts
                	and will automatically redirect to the session page which your session is allocated.',
                'troubleshooting' => array(
                    'Timer' => array(
                        'What does it mean - "you have \'X\' minutes and \'X\' seconds before your
                    		reservation starts"?' =>  'This indicates the time left to wait before you can
                    		start your rig session.',
                        'The timer has counted down to zero, but the rig session does not start/open.' =>
                            'This may occur due to one of the following reasons:
                            <ol style="margin-left:20px">
                            	<li>The rig is resetting itself to prepare for the next user.</li>
                            	<li>You have not accessed the rig during the given grace period for
                            	your scheduled reservation, thus your session has timed out.</li>
                            	<li>The rig has become unavailable and/or under-going maintenance.</li>
                            </ol>',
                        'How do I get to \'Rig Session\' page from this page?' => 'The system will
                        	automatically direct you to the \'Rig Session\' page once the timer has
                        	counted down'
                    ),
                    'Going Offline' => array(
                        'What happens if I close the browser or my network fails while I am waiting?' =>
                            'The system will keep counting down the time. If the session has already
                            started, you will lose your rig session if the idle time has been maximised',
                        'What happens if I log out from this page?' => 'Your session will end and you
                        	may need to queue again to start a new session.'
                    ),
    				'Cancelling Reservations' => array(
                        'Can I cancel my reservation?' => 'Yes, please click the red \'Cancel Reservation\'
                         button on the right of the page.'
                    )
                )
            ),

        'Existing Reservations' => array(
                'help' => 'This page lets you review your existing reservations or cancel your reservations.',
                'troubleshooting' => array(
                    'Reservations' => array(
                        'I made a reservation, but the system has cancelled it.' => 'In some circumstances,
    	                    the system may cancel a reservation and will provide you with a reason for
    	                    the cancellation',
                    ),
                    'Cancelling Reservations' => array(
                        'How do I cancel a reservation?' => 'Click on the \'Existing Reservations\' tab which
                         is located next to the \'Rig Selection\' tab. Then select the reservation that you
                         wish to cancel. A dialog will appear asking you to confirm.'
                    ),
                    'Reservation Reminder' => array(
                    	'Can I set a reminder for my reservation?' => 'No, you will receive an automatic
                    		reminder by email from the system one hour before the rig session starts.'
                    )
                )
            ),

        'Queue' => array(
            'help' => 'This is a stand-off page which is shown when you are queuing for a rig. It shows your
            	current queue position and will automatically redirect to the \'Session\' page when your are
            	allocated to a rig.',
            'troubleshooting' => array(
                'How long do I have to wait in the queue?' => 'Queue time depends upon completion of the
                	previous user\'s session',
                'Why has my position number increased in the queue?' => 'A high priority user may be
                	attempting to access the rig.',
                'Can I cancel my queue?' => 'Yes, you will be redirected to the \'Rig Selection\' page after
                	cancelling the queue.',
                'What happens if I close the browser window or my network fails?' => 'Please try to reopen
                	the browser window as soon as possible. However, if this happens while waiting in a
                	queue, your position in the queue may be removed and you may need to queue again.',
                'How do I get to \'Rig Session\' page from here?' => 'The system directs the user to
                	the \'Rig Session\' page automatically after you queue and the rig is available to use'
            )
        ),

        'Session' => array(
                'help' => 'This is the main control page for set up and accessing/launching the rig. Here
                 	you can, depending on the rig, launch the rig, set your video formats, set your view
                 	positions, and change the interval speed for page refreshing.',
                'troubleshooting' => array(
                    'Session Time' => array(
                        'What is \'Session Time\'?' => 'Session Time shows two different times: \'In
                        	Session\' indicates the overall time of your session usage while \'Remaining
                        	Time\' indicates the guaranteed time left to use the rig.',
                        'My session timed out and I cannot access the rig again.' => 'Typically this
                        	means that another user has queued or reserved the rig. Please reserve
                        	for another time or check back on the rig later.',
                        'What does \'Remaining\' mean and what happens when it reaches zero?' =>
                            'This indicates the guaranteed usage time left on the rig. When this
                            reaches zero, the user may be removed from the rig session if another
                            user has reserved the time or queued after the current user. If there
                            is no reservation or queue, the rig session may be extended for the
                            current user.'
                    ),
                    'Idle Time' => array(
                        'What does the warning below the rig name mean?' => 'This warns the
                        	user about the idle time in which the user needs to launch/use the rig
                         	in order to remain in the rig session'
                    ),
                    'Ending Session' => array(
                        'What happens if my browser closes or my network fails while I am using
                        	the rig session?' => 'If this happens, you may need to log back into
                        	Remote Labs to resume the rig session. However, if another user has
                        	queued and accessed the rig during this time, you may need to join
                        	the queue again to access the rig session.',
                        'I accidentally clicked on \'Finish Session\' early and cannot access the
                        	rig again even though my reservation time hasn\'t ended.' => 'You
                         	may be removed from the rig session if another user has queued after
                         	you ended your rig session. You may need to join the queue again to
                         	access the rig session.'
                    )
                )
        ),

        'Login' => array(
                'help' => 'A username and password is required to access the Remote Labs. A proper
            		username and password are provided by the institution that hosts Remote
            		Labs. Please click on the "<span>Contact Support</span>" button to request
            		a username and password.',
                'troubleshooting' => array(
                    'System Requirements' => array(
                        'Operating System: Windows Server 2003, Windows XP, Windows Vista, Linux,
                        and Mac OS 10.5 and above.',
                        'Browser (tested and supported): Mozilla Firefox 3.0 and above, Chrome,
                        Internet Explorer 6 and above, Safari',
                        'Screen Resolution: 1024x768'
                    ),

                    'I don\'t have an account. How do I request/receive a username and password?' =>
                    'Please click on the "Contact Support" button to request a username and password.',

                    'I have an account, but I can\'t access and have received an error message' =>
                    'You may need to reactivate your account for the Remote Labs. Please click on the
                    "Contact Support" button and provide specific details of the error you are receiving.',

                    'I forgot my username and/or password' => 'Please click on the "Contact Support"
                    button to request your username and/or password.'
                )
            )
    );

    /** Page providing help on. */
    private $_page;

    public function __construct($controller = null, $action = null)
    {
        if ($controller && $action) $this->_page = $controller . $action;
    }

    /**
     * Gets whole help map.
     */
    public static function getAllHelp()
    {
        return self::$_help;
    }

    /**
     * Gets the page help.
     */
    public function getPageHelp()
    {
        switch ($this->_page)
        {
            case 'indexindex':
                return self::$_help['Login']['help'];

            case 'queueindex':
                return self::$_help['Rig Selection']['help'];

            case 'queuequeuing':
                return self::$_help['Queue']['help'];

            case 'bookingsindex':
                return self::$_help['Reservation']['help'];

            case 'bookingswaiting':
                return self::$_help['Reservation Waiting']['help'];

            case 'bookingsexisting':
                return self::$_help['Existing Reservations']['help'];

            case 'sessionindex':
                return self::$_help['Session']['help'];

            default:
                return 'This page current has no help.';
        }
    }

    /**
     * Gets the page trouble shooting.
     */
    public function getPageTS()
    {
        switch ($this->_page)
        {
            case 'indexindex':
                return self::$_help['Login']['troubleshooting'];

            case 'queueindex':
                return self::$_help['Rig Selection']['troubleshooting'];

            case 'queuequeuing':
                return self::$_help['Queue']['troubleshooting'];

            case 'bookingsindex':
                return self::$_help['Reservation']['troubleshooting'];

            case 'bookingswaiting':
                return self::$_help['Reservation Waiting']['troubleshooting'];

            case 'bookingsexisting':
                return self::$_help['Existing Reservations']['troubleshooting'];

            case 'sessionindex':
                return self::$_help['Session']['troubleshooting'];

            default:
                return array();
        }
    }
}

