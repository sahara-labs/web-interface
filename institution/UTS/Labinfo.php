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

class UTS_Labinfo
{
	/** 
	 * The images for the Laboratory Information gallery page.
	 * A list of arrays containing the image information. The image information
	 * is stored as an associative array containing:
	 *   - filename => image filename (from baseUrl)
	 *   - alt => subtitle for image
	 *   - title => title for image    
	 */

		
		private $Images = array (
			array( "filename" => "uts/images/ShakeTable_1.jpg",
				"alt" => "Two Degree-of-Freedom shake table",
				"title" => "Shake Table"),
			array( "filename" => "uts/images/ShakeTable_3.jpg",
				"alt" => "Collection of four shake table rigs",
				"title" => "Shake Table Rigs"),
			array( "filename" => "uts/images/ShakeTable_close.jpg",
				"alt" => "Two Degree-of-Freedom shake table",
				"title" => "Shake Table"),
			array( "filename" => "uts/images/Coldfire.jpg",
				"alt" => "Programmable microcontroller board",
				"title" => "Coldfire Rig"),
			array( "filename" => "uts/images/CoupledTank.jpg",
				"alt" => "Two coupled water tanks used for testing control algorithms",
				"title" => "Coupled Tank Rig"),
			 array( "filename" => "uts/images/FPGA_1.jpg",
				"alt" => "Design, programming and testing using FPGAs",
				"title" => "FPGA Rig"),
 			array( "filename" => "uts/images/LoadedBeam_1.jpg",
				"alt" => "Vertical beam to measure displacement under variable loads",
				"title" => "Vertical Loaded Beam Rig"),
			 array( "filename" => "uts/images/LoadedBeam_2.jpg",
				"alt" => "A vertical and a horizontal loaded beam rig",
				"title" => "Loaded Beam Rigs"),
			 array( "filename" => "uts/images/PLC_1.jpg",
				"alt" => "Allen-Bradley Micrologix PLC",
				"title" => "PLC Rig"),
			array( "filename" => "uts/images/PLC_2.jpg",
				"alt" => "Pneumatic pistons that are controlled via the PLC",
				"title" => "PLC Rigs"),
			 array( "filename" => "uts/images/IPR.jpg",
				"alt" => "Tests coefficients of friction, gravity, static and kinetic friction",
				"title" => "Inclined Plane Rig"),
		    array( "filename" => "uts/images/IPR_close.jpg",
				"alt" => "Blocks of different materials used for the Inclined Plane",
				"title" => "Inclined Plane Blocks"),
			array( "filename" => "uts/images/RL_outside.jpg",
				"alt" => "Collection of rigs hosted at UTS",
				"title" => "Remote Laboratory"),
			array( "filename" => "uts/images/RL_inside.jpg",
				"alt" => "Multiple rigs of each type hosted at UTS",
				"title" => "Remote Laboratory"),
			 array( "filename" => "uts/images/RL_tanks.jpg",
				"alt" => "Collection of rigs hosted at UTS",
				"title" => "Remote Laboratory")
			 );
	
	public function getLabinfo()
	{
		return $this->Images;	
	}
}
