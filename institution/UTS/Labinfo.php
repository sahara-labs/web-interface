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
	public function getLabinfo()
	{
		$Images["1"] = array( "filename" => "uts/images/IPR.jpg",
				"alt" => "UTS",
				"title" => "UTS Inclined Plane Rig");
		
		$Images["2"] = array( "filename" => "uts/images/IPR_close.jpg",
				"alt" => "UTS",
				"title" => "Inclined Plane Blocks");

		$Images["3"] = array( "filename" => "uts/images/ShakeTable_1.jpg",
				"alt" => "UTS",
				"title" => "2 Degree-of-Freedom Shaker Table");

		$Images["4"] = array( "filename" => "uts/images/ShakeTable_3.jpg",
				"alt" => "UTS",
				"title" => "Shaker Table Rigs");
		
		$Images["5"] = array( "filename" => "uts/images/ShakeTable_close.jpg",
				"alt" => "UTS",
				"title" => "3 Degree-of-Freedom Shaker Table");
		
		$Images["6"] = array( "filename" => "uts/images/Coldfire.jpg",
				"alt" => "UTS",
				"title" => "Coldfire Rig");

		$Images["7"] = array( "filename" => "uts/images/CoupledTank.jpg",
				"alt" => "UTS",
				"title" => "Coupled Tank Rig");

		$Images["8"] = array( "filename" => "uts/images/FPGA_1.jpg",
				"alt" => "UTS",
				"title" => "Single FPGA Rig");

		$Images["9"] = array( "filename" => "uts/images/LoadedBeam_1.jpg",
				"alt" => "UTS",
				"title" => "Single Loaded Beam Rig");
		
		$Images["10"] = array( "filename" => "uts/images/LoadedBeam_2.jpg",
				"alt" => "UTS",
				"title" => "Loaded Beam Rigs");

		$Images["11"] = array( "filename" => "uts/images/PLC_1.jpg",
				"alt" => "UTS",
				"title" => "Single PLC Rig");

		$Images["12"] = array( "filename" => "uts/images/PLC_2.jpg",
				"alt" => "UTS",
				"title" => "PLC Rigs");

		$Images["13"] = array( "filename" => "uts/images/RL_outside.jpg",
				"alt" => "UTS",
				"title" => "Remote Laboratory");

		$Images["14"] = array( "filename" => "uts/images/RL_inside.jpg",
				"alt" => "UTS",
				"title" => "Remote Laboratory");

		$Images["15"] = array( "filename" => "uts/images/RL_tanks.jpg",
				"alt" => "UTS",
				"title" => "Remote Laboratory");

		return $Images;	
	}
}
