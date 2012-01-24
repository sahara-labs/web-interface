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
 * Help information for UTS site..
 */
class UTS_Help
{
    /* Default help contents. */
    public $help = array(
        'Login' => array(
                'help' => 'To use the UTS Remote Labs you must have a valid account to login. Depending on your
                	origin you must use the correct login method. Use the following troubleshooting to determine
                	you correct login method.',

                'troubleshooting' => array(
                    'System Requirements' => array(
                        'Operating System: Windows Server 2003, Windows XP, Windows Vista, Linux,
                        and Mac OS 10.5 and above.',
                        'Browser (tested and supported): Mozilla Firefox 3.0 and above, Chrome,
                        Internet Explorer 6 and above, Safari',
                        'Screen Resolution: 1024x768'
                    ),

    				'UTS FEIT users' => 'Log in using your normal UTS FEIT username. If you are a student this is your student
                        	number and UTS email password and if you are a staff member this is your Engineering username
                        	which is composed of your first name and last name. Before you may login, you must have
                        	"Remote Labs access". Generally if you are a student who is enrolled in a subject that
                        	has a remote laboratory component or if you are a staff member who has requested access
                        	you have "Remote Labs access". Also, before your first login, all UTS FEIT users must reset
                        	their passwords at <a href="https://webmail.eng.uts.edu.au/myaccount/" target="_blank">
                        	https://webmail.eng.uts.edu.au/myaccount/</a>. If you are still receiving an error message,
                        	please click on the "Contact Support" button and provide specific details of the error or issue.',

                   'Non-AAF (Australian Access Federation) users' => 'Generally, remote labs account details are emailed
                   			from Labshare to users prior to your class access period. Please check your email
                   			including junk and spam boxes/folders for your account details. If you still can\'t
                   			find the account details, please click on the "Contact Support" button for the account request.',

                   'AAF (Australian Access Federation) users' =>
                       '<p>All users from institutions that are registered with AAF should click on the AAF button to
                        log in to the UTS Remote Labs. Select your own institution from the drop down list. Log in
                        using your normal username and password. At this point, you are taken to the rig selection
                        page and need to click the "Activate Access" button. Enter in the \'access key\' that
                        has been provided to you earlier and click on "Activate".</p>

                       <div style="margin-top:10px">
                       		<h3>Unable to log in?</h3>
                       		<p>If you get an error like Authentication failed, try the following:</p>
                       		<ul style="margin-left:25px">
                            	<li>Make sure you selected the correct home institution</li>
                            	<li>Try logging into something at your university or school using the same username and
                             	password. If this doesn\'t work, contact your IT support and have them reset your
                             	password</li>
                           		<li>In some cases (but not always) your institution will ask you via an on-screen dialogue
                             	whether you want to release details (attributes) such as name and Email address. If so,
                             	please release these details as they are required for a successful login.</li>
                             	<li>If you\'re sure everything is right and it still doesn\'t work, contact the TLI
                             	helpdesk via the "Contact Support" button. The help desk will need the following details:
                             	<ul style="margin-left:40px">
                             	    <li>The name of your institution</li>
                             	    <li>Your login name</li>
                             	    <li>Your Remote Labs subject</li>
                             	    <li>The time that you tried to login (as close as possible)</li>
                             	    <li>Any errors you may have seen</li>
                                 </ul></li>
                             </ul>
                         </div>',

					'Permission activiation didn\'t work' =>
					    'If you get a "Key not valid" error, the problem may be one of the following:
					    <ul style="margin-left:25px">
					    	<li>It was entered incorrectly.</li>
					    	<li>It\'s a single use key which has already been used.</li>
					    	<li>It\'s a multi-use key and the maximum number of uses have been exceeded.</li>
					    	<li>The key was not used before the its expiry time.</li>
					    </ul>'
                )
            )
    );
}

