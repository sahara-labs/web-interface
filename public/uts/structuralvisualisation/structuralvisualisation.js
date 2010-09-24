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
var verticalState = new Array(0,0,0,0,0,0,0,0,0);
var horizontalState = new Array(0,0,0,0,0,0,0,0,0);
var data;

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
}

/* Initialise the values for the model from the config read at the rig client */
function initConfig(param)
{
	data = param;
	for (j=0; j<=maxModel; j++)
	{
		models[j] = new ModelInfo("INACTIVE");
	}

	for (var i in param)
	{
		var modelData = param[i].name.split("_");
		var forceData = param[i].value.split(",");

		if (modelData[1] == "LABEL")			models[modelData[0]].label = param[i].value;
		if (modelData[1] == "DESCRIPTION")		models[modelData[0]].description = param[i].value;
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

	for (var mod in models)
	{
		//Dodgy - just see if model configured
		if (models[mod].label != "INACTIVE")
		{
			$("#SVradio ul").append(
				'<li><input type="radio" name="modelRadio" value="' + mod + '" style="vertical-align: middle; margin: 0px;"/>'
					+  models[mod].label + '<br/></li>' 
			);
		};
		
		if (mod == modelState)
		{
			setState(mod);
		}
	};
}
function checkState(param)
{
	alert(param);
}

function setState(stateID)
{
	//document.SVRadio.modelRadio[stateID].checked = true;
	document.getElementById("modelcontent").lastChild.replaceWholeText(models[stateID].description); 
	if (verticalState[stateID] != 0)	document.getElementById("vforcecontent").lastChild.replaceWholeText(models[stateID].VForceDescription);
	if (verticalState[stateID] != 0)	document.getElementById("hforcecontent").lastChild.replaceWholeText(models[stateID].HForceDescription);

}
function setIO(i)
{
	if (io[i] == 0)
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
	}
	//TODO
	//Send value
	
}
