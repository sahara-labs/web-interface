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

class Sahara_DefaultInfo
{
	public function getContacts()
	{
		$allContacts = array("Sahara Technical Contact" => array("Contact Name:" => "Tania Machet",
										  "Contact Phone:" => "(02) 9514 2975",
										  "Contact Address:" => "UTS Building 1",
										  "" => "CB01.23.16",
										  "Contact Email:" => "<a href=\"mailto:tania.machet@eng.uts.edu.au\">Tania Machet</a>"));

		return $allContacts;
	}

	public function getNews()
	{
		$newsHeader1 = "Latest News";

		$newsInfo1 = "<b>March, 2010</b><p> <a href=\"http://www.labshare.edu.au/\">LabShare</a>
			has been keeping us very busy over the past several months. Three working groups have been set
			up - one dealing with technical development, another to continue research on pedagogy and the
			last to look at the consortium structure. Our nation-wide survey of all the faculties of
			engineering is almost complete and analysis of the data sets has commenced. The first release
			of the software used to coordinate the real-time management system, which actually provides
			access to the experiments is due next month. A related project to establish a world-wide network
			of remote laboratories was formalised in January with the establishment of the
			<a href=\"https://wikis.mit.edu/confluence/display/GOLC/Home\">Global Online Laboratory Consortium
			(GOLC)</a>.";

		$newsHeader2 = "Previous News";

		$newsInfo2 = "<b>June, 2009</b><p> The \"LabShare\" project has been created to coordinate the nation-wide
		  Remote Laboratory project announced below. It will have its own administration and its web presence will
		  be completed soon. In other news, two members of the UTS:Engineering Remote Labs team will be attending
		  a meeting at MIT later this month to discuss the emergence of a global Remote Laboratory sharing
		  initiative.";

		$news["1"] = array("header" => $newsHeader1, "info" => $newsInfo1 );
		$news["2"] = array("header" => $newsHeader2, "info" => $newsInfo2 );

		return $news;
	}

	public function getFAQ()
	{
		$FAQ["1"] = array( "question" => "What is Sahara?",
			"answer" => "Sahara is the software used to access remote laboratories anywhere,
			any time.  Sahara is a suite of open source software components that has been developed
			at UTS under the LabShare program. <p>  You are currently using Sahara V1.0. There will
			be further releases and	updates available from our repository at our
			<a href=\"http://sourceforge.net/projects/labshare-sahara/\">
			open source repository</a>. <p> For more information or any questions regarding Sahara,
		 	please use the \"Send Feedback\" tab or the contact details provided.");

		$FAQ["2"] = array( "question" => "So what is a remote laboratory anyway?",
			"answer" => "A remote lab is a set of laboratory apparatus and equipment which is configured
			for remote usage over a network - usually the Internet. As much as possible, in
			setting up a remote laboratory, the goal should be to preserve the same apparatus
			and equipment (with the same limitations and imperfections) as would be used if the students
			were proximate to the equipment as per a conventional laboratory.");

		$FAQ["3"] = array( "question" => "Aren't you taking something away from the experimental side of learning?",
			"answer" => "In some ways yes, and in other ways a remote laboratory adds learning opportunities
			not present in a conventional laboratory. It's not our mission to approach
			an end-point where all laboratories are available in a remote access mode only, as we're
			convinced that an essential part of the laboratory learning experience is facilitated by
			real hands-on, of real equipment and apparatus - perhaps particularly so for \"junior\"
			students who might not have had a great deal of prior experiential learning practice.
			However, there are certainly some situations whereby for \"mid level\" to \"senior\"
			students (in the context of either school or college or university environments) there's
			not a great deal to be gained by continued exposure to equipment and apparatus with which
			they're already quite familiar - particularly in experiment set-up and dismantling
			activities. From the literature, it is clear is that pure computer-based simulation, conventional
			proximate laboratories and remotely accessible laboratories all have complementary benefits.");

		$FAQ["4"] = array("question" => "Why not simplify things even more and just use simulation techniques?",
			"answer" => "Simulation has its place, but should be viewed as a complementary approach to
			remote and proximate laboratories - not as a replacement. There is a wealth of literature
			available that serves a much better comparison than we do here in this FAQ, but a few
			points to note are: The fidelity of simulations (whilst improving all the time) are often
			not adequate, but perhaps what is more important is the notion of student engagement with
			the experimental process - are they as likely to engage with a algorithmic model of reality
			as they are with real hardware that they can observe?");

		return $FAQ;
	}

	public function getLabinfo()
	{
		$Images["1"] = array( "filename" => "uts/images/IPR.jpg",
				"alt" => "UTS",
				"title" => "UTS Inclined Plane Rig");

		$Images["2"] = array( "filename" => "uts/images/IPR_close.jpg",
				"alt" => "UTS",
				"title" => "Inclined Plane Blocks");

		return $Images;
	}
}