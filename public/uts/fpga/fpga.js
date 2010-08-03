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
 * @date 1st August 2010
 */

var io = new Array(8);
var ty = new Array(8);

function initIO(types)
{
	performPrimitiveJSON('FPGAController', 'getDataByte', null, restoreIO, null);
	
	for (var i = 0; i < 8; i++)
	{
		io[i] = 0;
		$("#io" + i).css('background-color', '#ED8686');
		ty[i] = types.charAt(i);
	}
}

function restoreIO(resp)
{
	if (typeof resp != "object")
	{
		// alert(resp);
	}
	
	var val = resp.value;
	
	for (var i = 0; i < 8; i++)
	{
		if (val & Math.pow(2, i))
		{
			io[i] = 1;
			$("#io" + i).css('background-color', '#62E877');
			$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttondown.png' :'switchdown.png'));
		}
	}
}

function setIO(i)
{
	if (io[i] == 0)
	{
		io[i] = 1;
		$("#io" + i).css('background-color', '#62E877');
		$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttondown.png' :'switchdown.png'));
	}
	else
	{
		io[i] = 0;
		$("#io" + i).css('background-color', '#ED8686');
		$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttonup.png' :'switchup.png'));
	}
	
	var val = 0;
	for (var i = 0; i < 8; i++)
	{
		val += io[i] * Math.pow(2, i);
	}
	
	var params = new Object;
	params.value = val;
	performPrimitiveJSON('FPGAController', 'setDataByte', params);
}

function checkDemoLoadedStart()
{
	setTimeout(checkDemoLoaded, 2000);
}

function checkDemoLoaded()
{
	performPrimitiveJSON('FPGAAuxController', 'isDemoUploaded', null, checkDemoLoadedCallback);
}

function checkDemoLoadedCallback(data)
{
	if (typeof data != "object")
	{
		// alert(data);
	}
		
	if (data.value == 'true')
	{
		performPrimitiveClearOverlay();	
	}
	else
	{
		setTimeout(checkDemoLoaded, 2000);
	}
}

function resetIO()
{
	for (var i = 0; i < 8; i++)
	{
		io[i] = 0;
		$("#io" + i).css('background-color', '#ED8686');
		$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttonup.png' :'switchup.png'));
	}
}