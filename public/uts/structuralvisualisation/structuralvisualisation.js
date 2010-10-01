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
 * @date 6th September 2010
 */

var modelState = 2;
var maxModel = 4;
var verticalState = new Array(1,1,1,1,0,0,0,0,0);
var horizontalState = new Array(0,0,0,0,1,1,1,1,1);
var HORIZONTAL_DEFAULT = "No horizontal force applied (0 Newtons)";
var VERTICAL_DEFAULT = "No vertical force applied (0 Newtons)";

//Array with the model data in it

var models = new Array();

function ModelInfo(label)
{
	this.label = label;
	this.description = null;
	this.HForce = null;
	this.HForceLabel = null;
	this.HForceDescription = null;
	this.VForce = null;
	this.VForceLabel = null;
	this.VForceDescription = null;
	this.Camera = 1;
}

/* Initialise the values for the model from the config read at the rig client */
function initConfig(param)
{
	for (j=0; j<=maxModel; j++)
	{
		models[j] = new ModelInfo("INACTIVE");
	}

	// Get the data from the param 
	for (var i in param)
	{
		var modelData = param[i].name.split("_");
		var forceData = param[i].value.split(",");

		if (modelData[1] == "LABEL")			models[modelData[0]].label = param[i].value;
		if (modelData[1] == "DESCRIPTION")		models[modelData[0]].description = param[i].value;
		if (modelData[1] == "CAMERA")			models[modelData[0]].camera = param[i].value;
		if (modelData[1] == "HORIZONTAL")
		{
			models[modelData[0]].HForce = modelData[3];
			for (force in forceData)
			{
				var fdata = forceData[force].split("=");
				if (fdata[0].indexOf("LABEL") != -1) 		models[modelData[0]].HForceLabel = fdata[1];
				if (fdata[0].indexOf("DESCRIPTION") != -1) 	models[modelData[0]].HForceDescription = fdata[1];
			}
		}
		if (modelData[1] == "VERTICAL")
		{
			models[modelData[0]].VForce = modelData[3];
			for (force in forceData)
			{
				var fdata = forceData[force].split("=");
				if (fdata[0].indexOf("LABEL") != -1) 		models[modelData[0]].VForceLabel = fdata[1];
				if (fdata[0].indexOf("DESCRIPTION") != -1) 	models[modelData[0]].VForceDescription = fdata[1];
			}
		}
	};

	// Model
	for (var mod in models)
	{
		//Set up Models to Select
		//Dodgy - just see if model configured
		if (models[mod].label != "INACTIVE")
		{
			//TODO - Change from 'in-line' onClick to jQuery
			$("#SVradio ul").append(
				'<li> <input type="radio" name="modelRadio" value="' + mod + '" style="vertical-align: middle; margin: 0px;" onClick="setState(' 
					+ mod + ')"/> <label>' +  models[mod].label + '</label><br/></li>' 
			);
		};
		
		if (mod == modelState)
		{
			document.modelForm.modelRadio[mod-1].checked=true;
			setState(mod);
		}
	};
	

}

//Sets the descriptions, values and labels for the forces and models for the model selected 
function setState(stateID)
{
	//Set Model Description for this state
	$("#modelcontent").empty().append(models[stateID].description); 
	$("#vforce0:last-child").append(models[stateID].VForceLabel);
	$("#hforce0 img").empty().append(models[stateID].HForceLabel);

	//Set force description for the state if force is applied
	if (verticalState[stateID] != 0)
	{
		$("#vforcecontent").empty().append(models[stateID].VForceDescription);
	}
	else
	{	
		$("#vforcecontent").empty().append(VERTICAL_DEFAULT);
	}
	
	if (horizontalState[stateID] != 0)
	{
		$("#hforcecontent").empty().append(models[stateID].HForceDescription);
	}
	else
	{
		$("#hforcecontent").empty().append(HORIZONTAL_DEFAULT);
	}

	setCamera(stateID);

}


function setCamera(stateID)
{
	// TODO - clean up so more 'intelligent'
	if(models[stateID].camera == 1)
	{
		//Enable Camera 1
		$("#camselect1").attr("disabled",false);
		$("#camformat1").removeClass('disableselect');
		$("#camerapanel1").css('margin-left','195px');

		//Disable Camera 2
		$("#camselect2").attr("disabled",true);
		$("#camformat2").addClass("disableselect");
		$("#camerapanel2").css('margin-top','-330px');
		$("#camerapanel2").css('margin-left','3000px');
	}
	else
	{
		//Enable Camera 2
		$("#camselect2").attr("disabled",false);
		$("#camformat2").removeClass('disableselect');
		$("#camerapanel2").css('margin-left','195px');
		$("#camerapanel2").css('margin-top','-330px');

		//Disable Camera 1
		$("#camselect1").attr("disabled",true);
		$("#camformat1").addClass("disableselect");
		$("#camerapanel1").css('margin-left','3000px');
	}
	
	//Set position of Camera
	
}
function setIO(i)
{
	/*if (io[i] == 0)
	{
		addSVMessage("Force " + i + " turned on.");
		
		io[i] = 1;
		$("#vforce" + i).css('background-color', '#62E877');
		$("#vforce" + i + " img").attr('src', '/uts/fpga/images/' + 'switchdown.png');
	}
	else
	{
		addSVMessage("Force " +  i + " turned off.");
		
		io[i] = 0;
		$("#vforce" + i).css('background-color', '#ED8686');
		$("#vforce" + i + " img").attr('src', '/uts/fpga/images/' + 'switchup.png');
	}
	
	var val = 0;
	for (var i = 0; i < 8; i++)
	{
		val += io[i] * Math.pow(2, i);
	}*/
	//TODO
	//Send value
	
}
