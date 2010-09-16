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

var modelState = 1;
var maxModel = 4;
var maxVertical = 4;
var maxHorizontal = 4;
var models = new Array();

/* Initialise the values for the model from the config read at the rig client */
function initConfig(param)
{
	for (var i in param)
	{
		if (param[i].name == "MaxModels" ) maxModel = param[i].value;
		if (param[i].name == "MaxHorizontal" ) maxHorizontal = param[i].value;
		if (param[i].name == "MaxVertical" ) maxVertical = param[i].value;

		var modelID = param[i].name.split("_");

		if (modelID[1] == "LABEL")
		{
			models[modelID[0]] = param[i].value;
		};
	};

	for (var mod in models)
	{
		$("#SVradio ul").append(
			'<li><input type="radio" name="model" value="' + mod + '" style="vertical-align: middle; margin: 0px;"/>'
				+  models[mod] + '<br/></li>' 
		);
	};
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
