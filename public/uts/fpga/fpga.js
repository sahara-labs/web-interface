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

function uploadBitStream()
{
	var width = $("body").width();
	var height = $("body").height();
	
	var file = $("#bitstreamuploadformfile").val();
	
	
	disableFPGAButtons();
	addFPGAMessage("Started bitstream of file " + file + ".");
	$("#bitstreamuploadform").submit();
	
	$("#bitstreamupload").dialog('close');

	$("body").append(
		'<div class="ui-widget-overlay bitstreamuploadoverlay" style="width:' + width + 'px;height:' + height + 'px">' +
		'</div>' +
		'<div class="bitstreamuploadoverlaydialog ui-corner-all" style="left:' + Math.floor(width / 2 - 125) + 'px;top:' + 
				+ Math.floor(height / 2 - 40) + 'px">' +
			'<img src="/images/ajax-loading.gif" alt="Loading" />' +
			'<h3>Programming FPGA...</h3>' +
		'</div>'
	);
	
	setTimeout(checkBitstreamPost, 2000);	
}

function checkBitstreamPost()
{
	var response = $("#uploadtarget").contents().text();
	
	if (response == undefined || response == "") // Still waiting for the post response
	{
		setTimeout(checkBitstreamPost, 2000);
		return;
	}
	else if (response == "true") // Correct response
	{
		setTimeout(checkUploadStatus, 2000);
	}
	else // Failed response
	{
		addFPGAMessage('Failed programming FPGA.');
		
		enableFPGAButtons();
		clearBitstreamUploadOverlay();
		
		$("#bitstreamuploaderrormessage").html(response.substr(response.indexOf(';') + 2));
		$("#bitstreamuploaderror").css('display', 'block');
		$("#bitstreamupload").dialog('open');
	}
}

function checkUploadStatus()
{
	/* Getting this far means the upload was successful. */
	$("#bitstreamuploaderrormessage").empty();
	$("#bitstreamuploaderror").css('display', 'none');
	
	$.get(
		'/batch/status',
		null,
		function (data) {
			if (typeof data != "object" || data.state == undefined)
			{
				addFPGAMessage('Failed programming FPGA.');	
				enableFPGAButtons();
				clearBitstreamUploadOverlay();
			}
			
			if (data.state == 'IN_PROGRESS') // Still programming
			{
				setTimeout(checkUploadStatus, 2000);
			}
			else if (data.state == 'FAILED')
			{
				addFPGAMessage('Failed programming FPGA.');	
				enableFPGAButtons();
				clearBitstreamUploadOverlay();
			}
			else if (data.state == 'CLEAR' || data.state == 'COMPLETE')
			{
				addFPGAMessage('Finished programming FPGA.');
				enableFPGAButtons();
				clearBitstreamUploadOverlay();
			}
		}
	);
}

function clearBitstreamUploadOverlay()
{
	$(".bitstreamuploadoverlaydialog").remove();
	$(".bitstreamuploadoverlay").remove();
}

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
	if (typeof resp != "object") return;
	
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
		if (ty[i] == 'S') addFPGAMessage("Switch " + (7 - i) + " turned on.");
		else addFPGAMessage("Push button " + (7 - i) + " pressed.");
		
		io[i] = 1;
		$("#io" + i).css('background-color', '#62E877');
		$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttondown.png' :'switchdown.png'));
	}
	else
	{
		if (ty[i] == 'S') addFPGAMessage("Switch " + (7 - i) + " turned off.");
		else addFPGAMessage("Push button " + (7 - i) + " released.");
		
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

function clearIO(i)
{
	if (io[i] == 0) return;
	
	io[i] = 0;
	$("#io" + i).css('background-color', '#ED8686');
	$("#io" + i + " img").attr('src', '/uts/fpga/images/' + (ty[i] == 'P' ? 'pushbuttonup.png' :'switchup.png'));

	if (ty[i] == 'S') addFPGAMessage("Switch " + (7 - i) + " turned off.");
	else addFPGAMessage("Push button " + (7 - i) + " released.");

	
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
		performPrimitiveClearOverlay();
		enableFPGAButtons();
		addFPGAMessage("Loading demonstration program has failed.");
		return;
	}
		
	if (data.value == 'true')
	{
		performPrimitiveClearOverlay();
		enableFPGAButtons();
		addFPGAMessage("Finished loading demonstration program.");
		
	}
	else
	{
		setTimeout(checkDemoLoaded, 2000);
	}
}

function softResetCallback()
{
	addFPGAMessage("FPGA has been soft reset.");
	enableFPGAButtons();
}

function hardResetCallback()
{
	addFPGAMessage("FPGA has been power cycled.");
	resetIO();
	addFPGAMessage("Input has been reset.");
	enableFPGAButtons();
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

function enableFPGAButtons()
{
	$(".ioclass").addClass('ui-state-enabled')
		.removeClass('ui-state-disabled');
	
	$(".resetclass").addClass('ui-state-enabled')
		.removeClass('ui-state-disabled');
	
	$(".codebuttonclass").addClass('ui-state-enabled')
		.removeClass('ui-state-disabled');

}

function disableFPGAButtons()
{
	$(".ioclass").addClass('ui-state-disabled')
		.removeClass('ui-state-enabled');
	
	$(".resetclass").addClass('ui-state-disabled')
		.removeClass('ui-state-enabled');
	
	$(".codebuttonclass").addClass('ui-state-disabled')
		.removeClass('ui-state-enabled');
}

function addFPGAMessage(m)
{
	$("#operationpanellist").prepend("<li class='newoperation'>" + m + "</li>");
	$("#operationpanellist li:even").removeClass("oplistodd").addClass("oplisteven");
	$("#operationpanellist li:odd").removeClass("oplisteven").addClass("oplistodd");
}