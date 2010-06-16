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
 * @date 8th April 2010
 */

class UTS_Contacts
{
	 /**
     * Array of contact information. The structure is an associative array
     * containing role => contact information.
     * The contact information is an associative array containing the desired 
     * contact information. This array can contain any key => values as desired.
     */
		
	private	$allContacts = array("Operational" => array("Contact Name:" => "Michel de la Villefromoy",
										  "Contact Phone:" => "(02) 9514 2406",
										  "Contact Address:" => "UTS Building 1",
										  "" => "CB01.23.16",
										  "Contact Email:" => "<a href=\"mailto:mville@eng.uts.edu.au\">Michel de la Villefromoy</a>"),
							 "Technical" => array("Contact Name:" => "Tania Machet",
										  "Contact Phone:" => "(02) 9514 2975",
										  "Contact Address:" => "UTS Building 1",
										  "" => "CB01.23.16",
										  "Contact Email:" => "<a href=\"mailto:tania.machet@eng.uts.edu.au\">Tania Machet</a>"));
										  
	public function getContacts()
	{
		return $this->allContacts;	
	}
}
