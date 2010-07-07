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
 * @date 15th June 2010
 */

class UTS_News
{
	/** 
	 * The Frequently Asked questions for UTS
	 * A list of arrays containing the questions and answers, stored as an associative 
	 * array containing:
	 *   - question => The question to be displayed
	 *   - answer => The answer to be displayed
	 */

		private $news = array( 
			array("header" => "Latest News",
				"info" => "<ul> 
					<li> Sahara V2.0 has been released!  The latest version is available on
					<a href=\"http://sourceforge.net/projects/labshare-sahara/\"> 
					Sourceforge.</a>  It is currently being trialled at UTS, Curtin and RMIT 
					with more sites planned soon. </li><br>
					<li>UTS, RMIT, Curtin and QUT have new rigs recently completed or close to operational. 
					</li> <br>
					<li>Additional funding has been recieved for research and federated access implementation. </li> <br>
					<li>Coming up is the sharing trials where Sahara will be utilised to share remote labs across 
					institutions.</li>"),
			
			array( "header" => "March 2010",
				"info" => "<a href=\"http://www.labshare.edu.au/\">LabShare</a> 
					has been keeping us very busy over the past several months. Three working groups have been set
					up - one dealing with technical development, another to continue research on pedagogy and the 
					last to look at the consortium structure. Our nation-wide survey of all the faculties of 
					engineering is almost complete and analysis of the data sets has commenced. The first release
					of the software used to coordinate the real-time management system, which actually provides 
					access to the experiments is due next month. A related project to establish a world-wide network 
					of remote laboratories was formalised in January with the establishment of the 
					<a href=\"https://wikis.mit.edu/confluence/display/GOLC/Home\">Global Online Laboratory Consortium
					(GOLC)</a>."),
			
			array ("header" => "Previous News",
				"info" => "<b>June, 2009</b><p> The \"LabShare\" project has been created to coordinate the nation-wide
				  Remote Laboratory project announced below. It will have its own administration and its web presence will 
				  be completed soon. In other news, two members of the UTS:Engineering Remote Labs team will be attending 
				  a meeting at MIT later this month to discuss the emergence of a global Remote Laboratory sharing 
				  initiative."));

			
	public function getNews()
	{
		return $this->news;	
	}
}
