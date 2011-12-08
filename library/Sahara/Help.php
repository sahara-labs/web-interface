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
    private static $_defHelp = array(
        'Rig Selection' => array(
                'help' => 'This page is used to select a rig type. A dialog will open after selecting the
                           rig type, enabling you to queue, reserve, or cancel a rig session. If these
                           opetions are not available, or the rig seems to be offline, you may need to
                           check back later.',
                'troubleshooting' => array(
                    'Queue:' => array(
                        'I\'ve been waiting a long time even though I am the 1st in the queue. How
						 	long do I have to wait in the queue to access the rig?' => 'Queue time depends upon
						 	completion of the previous user\'s session. Also, if the queueing time is longer than the
						 	leftover remaining rig session (typically less than ~15-20 mins) the user will not be
						 	allocated to a rig session. Queue time also may be long due to backlog of existing
						 	reservations. Please check the \'Reservation Calendar\' before queuing.',

                        'My queue position is getting pushed back, why?' =>
                        	'A higher priority user may be attempting to access the rig - most likely a
							technical officer is dealing with a rig issue.',

                        'Can I cancel my queue?' =>
                        	'Yes, you will be redirected to the "Rig Selection" page after cancelling the queue.',

                        'What happens if I close the browser window or my network fails?' =>
                        	'Please try to reopen the browser window as soon as possible. However, if this
                        	happens while waiting in a queue, your position in the queue may be removed and
                        	you may need to queue again.'
                    ),

                    'Reserving:' => array(
                        'How do I reserve a rig session?' => 'Select the rig and click on the "Reserve" button.
                        	This will direct you to the \'Reservation Calendar\' page.',

                        'I reserved a rig, but it was unavailable when I tried to access it.' => 'The system may be
                        resetting the rig prior to starting your session. Please give it a minute or two to reset
                        and then refresh your browser if it does not automatically redirect you to the session page.
                        You must log-in within 10 minutes of your reservation period, otherwise the system will drop
                        your reservation once the timer has expired to allow queuing users to access the rig.
						You will not be able to return to the rig without either queuing or making another reservation.'
                    ),

                    'Legend:' => array(
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
                'help' => 'This page allows you to reserve rig sessions in advance. Availability and time slots depend
                on your allotted permission for the rig.',

                'troubleshooting' => array(
                    'Create, Edit and/or Cancel' => array(
                        'How do I make a reservation?' => 'You can select a date to reserve the rig by clicking the
                        	calendar icon that is located next to the date window. You can select your desired time
                        	slot by clicking on the available times (green sections) and selecting the green check
                        	button. A reservation confimation dialog will appear to confirm. Click on the "Confirm
                        	Reservation" button. Another dialog will appear confirming that the reservation is
                        	sucessfully created.',

                        'Can I make multiple reservations?' => 'You may be able to make multiple reservations
                        	for a rig depending on the allotted permissions of the rig.',

                        'Reservation time is shown as \'Available\', but I can\'t reserve the rig.' =>
                            'This may happend due to reaching the maximum number of reservations allowed for a single
                            user. This also may be due to rigs that are reserved for priority users for that time
                            period. However, the user can still queue to use the rig.',

                        'I tried to reserve for a longer period, but the given option is for a shorter period.' =>
                            'Alloted session times are predefined by your instructor.',

                        'I reserved a rig, but it was unavailable when I tried to access it.' => 'The system may be
                        	resetting the rig prior to starting your session. Please give it a minute or two to reset
                        	and then refresh your browser if it does not automatically redirect you to the session page.
                        	You must log-in within 10 minutes of your reservation period, otherwise the system will
                        	drop your reservation once the timer has expired to allow queuing users to access the rig.
                        	You will not be able to return to the rig without either queuing or making another
                        	reservation.',

                        'How can I change/edit an existing reservation?' => 'You must first cancel the existing
                        	reservation and then create a new reservation. This can be done through the \'Existing
                        	Reservations\' tab.',

                        'How do I cancel a reservation?' => 'Click on the \'Existing Reservations\' tab. Then select
                        	the reservation that you wish to cancel. A dialog will appear asking you to confirm.',

                        'Can I set a reminder for my reservation?' => 'No, you will receive an automatic reminder via
                        	email from the system one hour before the rig session starts.',

                        'I received an error message and cannot confirm my reservation.' => 'Please reload the page.
                        	It will refresh the \'Reservation\' page. If the reservation confirmation does not apprear,
                        	try reserving again.'
                    ),

                    'Time Zones' => array(
                        'Time zone is based on your local computer time setting.' => 'The Remote Labs reservation calendar
                        is programmed to always set to the user\'s local computer time. Please check your computer
                        time setting and make sure it is set to your correct local time.'
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
                'help' => 'This is the main control page for setting up and accessing/launching the rig. Here users
                	can (depending on the rig) control or launch the rig, set video formats and view positions, and
                	change the interval speed for page refreshing.',

                'troubleshooting' => array(
                    'Session Time' => array(
                        'What is "Session Time"?' => '"Session Time" shows two different times: \'In Session\'
                        	indicates the overall time of your session usage while \'Remaining Time\' indicates the
                        	guaranteed time left to use the rig. This time duration is set by the course academic.
                        	A user can queue/reserve to use the rig to repeat experiments.',

                        'My session timed out and I cannot access the rig again.' => 'Typically this means that another
                        	user has queued or reserved the rig. Please reserve for another time or check back on the
                        	rig later.',

                        'What does \'Remaining\' mean and what happens when it reaches zero?' =>
                            'This indicates the guaranteed usage time left on the rig. When this reaches zero,
                            the user may be removed form the rig session if another user has reserved the time or
                            queued after the current user. If there is no reservation or queue, the rig session may be
                            extended for the current user.',

                        'I accidentally clicked on \'Finished Session\' button early and cannot access the rig again
                        	even though my reservation time hasn\'t ended.' => 'Another user may have queued and been
                        	allocated the session after you ended your rig session. You may need to join the queue
                        	again to acess the rig session.'
                    ),

                    'Idle Time' => array(
                        'What does the warning below the rig name mean?' => 'This warns the user about the idle
                        	time in which the user needs to launch/use the rig in order to remaing in the rig session.'
                    ),

                    'Video Formats' => array(
                        'I am unable to view WMP or VLC on the video box after selecting one of video formats.' =>
                        	'Depending on the selected video format, an appropriate plugin must be loaded by the
                           	browser to display the video. If the plugin is not installed or if the browser security
                           	policy prohibits loading the plugin, the video will not be displayed. Ensure Windows Media
                           	Plugin (or equivalent) or VLC plugins are installed to view the WMP or VLC video streams
                           	respectively.',

                        'I am unable to detach the video box(es) from the browser tab.' => 'Click the "Reset Positions"
                        	 button to detach and return to its original position.',

                        'For JPEG, what does the rate mean and why is it slow?' => 'It means a "refresh interval speed"
                        	of 2 seconds. You can also move the slider to change the refresh interval. It may seem slow
                        	due to the internet connection at the user\'s current location.'
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

    /** Help contents which is a merge of the default help and institution
     *  namespaced help. */
    private $_help = array();

    /** Page providing help on. */
    private $_page;

    public function __construct($controller = null, $action = null)
    {
        if ($controller && $action) $this->_page = $controller . $action;

        $this->_help = array_merge($this->_help, self::$_defHelp);
    }

    /**
     * Gets whole help map.
     */
    public static function getAllHelp()
    {
        return $this->_help;
    }

    /**
     * Gets the page help.
     */
    public function getPageHelp()
    {
        switch ($this->_page)
        {
            case 'indexindex':
                return $this->_help['Login']['help'];

            case 'queueindex':
                return $this->_help['Rig Selection']['help'];

            case 'queuequeuing':
                return $this->_help['Queue']['help'];

            case 'bookingsindex':
                return $this->_help['Reservation']['help'];

            case 'bookingswaiting':
                return $this->_help['Reservation Waiting']['help'];

            case 'bookingsexisting':
                return $this->_help['Existing Reservations']['help'];

            case 'sessionindex':
                return $this->_help['Session']['help'];

            default:
                return 'This page has no help.';
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
                return $this->_help['Login']['troubleshooting'];

            case 'queueindex':
                return $this->_help['Rig Selection']['troubleshooting'];

            case 'queuequeuing':
                return $this->_help['Queue']['troubleshooting'];

            case 'bookingsindex':
                return $this->_help['Reservation']['troubleshooting'];

            case 'bookingswaiting':
                return $this->_help['Reservation Waiting']['troubleshooting'];

            case 'bookingsexisting':
                return $this->_help['Existing Reservations']['troubleshooting'];

            case 'sessionindex':
                return $this->_help['Session']['troubleshooting'];

            default:
                return array();
        }
    }
}

