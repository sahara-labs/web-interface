/**
 * Nexys rig scripting.
 * 
 * @author Michael Diponio
 */

var io = new Array(8);
var ty = new Array(8);

function uploadBitStream()
{
	var width = $("body").width();
	var height = $("body").height();
	
	var file = $("#bitstreamuploadformfile").val();
	
	resetIO();
	disableFPGAButtons();
	addFPGAMessage("Started programming FPGA with bitstream file " + file + ".");
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
	performPrimitiveJSON('NexysController', 'getDataByte', { addr: '0' }, restoreIO, null);
	
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
			$("#io" + (7 - i)).css('background-color', '#62E877');
			$("#io" + (7 - i) + " img").attr('src', '/uts/nexys/images/' + (ty[7 - i] == 'P' ? 'push-on.png' :'on.png'));
		}
	}
}

function setIO(i)
{
	if (io[i] == 0)
	{
		if (ty[i] == 'S') addFPGAMessage("Switch " + i + " turned on.");
		else addFPGAMessage("Push button " + i + " pressed.");
		
		io[i] = 1;
		$("#io" + (7 - i)).css('background-color', '#62E877');
		$("#io" + (7 - i) + " img").attr('src', '/uts/nexys/images/' + (ty[7 - i] == 'P' ? 'push-on.png' :'on.png'));
	}
	else
	{
		if (ty[i] == 'S') addFPGAMessage("Switch " + i + " turned off.");
		else addFPGAMessage("Push button " + i + " released.");
		
		io[i] = 0;
		$("#io" + (7 - i)).css('background-color', '#ED8686');
		$("#io" + (7 - i) + " img").attr('src', '/uts/nexys/images/' + (ty[7 - i] == 'P' ? 'push-off.png' :'off.png'));
	}
	
	var val = 0;
	for (var i = 0; i < 8; i++)
	{
		val += io[i] * Math.pow(2, i);
	}

	performPrimitiveJSON('NexysController', 'setDataByte', { 
		addr: '0',
		value: val
	});
}

function clearIO(i)
{
	if (io[i] == 0) return;
	
	io[i] = 0;
	$("#io" + i).css('background-color', '#ED8686');
	$("#io" + i + " img").attr('src', '/uts/nexys/images/' + (ty[7 - i] == 'P' ? 'push-off.png' :'off.png'));

	if (ty[i] == 'S') addFPGAMessage("Switch " + i + " turned off.");
	else addFPGAMessage("Push button " + i + " released.");

	
	var val = 0;
	for (var i = 0; i < 8; i++)
	{
		val += io[i] * Math.pow(2, i);
	}
	
	performPrimitiveJSON('NexysController', 'setDataByte', {
		addr: '0',
		value: val
	});
}

function checkDemoLoadedStart()
{
	setTimeout(checkDemoLoaded, 2000);
}

function checkDemoLoaded()
{
	performPrimitiveJSON('NexysController', 'isDemoLoaded', null, checkDemoLoadedCallback);
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

function resetIO()
{
	for (var i = 0; i < 8; i++)
	{
		io[i] = 0;
		$("#io" + i).css('background-color', '#ED8686');
		$("#io" + i + " img").attr('src', '/uts/nexys/images/' + (ty[i] == 'P' ? 'push-off.png' :'off.png'));
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

function registerSubmit() 
{
	var params = {}, $input = $("#registerval"), val, i, c;
	
	/* Address. */
	params.addr = parseInt($("#registeraddr option:selected").attr("value"));
	
	if ((val = $input.val()) == '')
	{
		/* No value supplied. */
		registerError("No value to send.");
		return;
	}
	else if (val.indexOf("0b") === 0 && val.length > 2)
	{
		/* Binary value entered. */
		val = val.substr(2);
		
		/* Make sure we have enough characters. */
		if (val.length != 8)
		{
			registerError("The register byte must be eight bits.");
			return;
		}
		
		/* Validate characters in string. */
		for (i = 0; i < val.length; i++)
		{
			if (!(val.charAt(i) == '0' || val.charAt(i) == '1'))
			{
				registerError("Invalid binary format, character '" + val.charAt(i) + "' not allowed.");
				return;
			}
		}
		
		params.value = parseInt(val, 2); 
	}
	else if (val.indexOf("0x") === 0 && val.length > 2)
	{
		/* Hexadecimal value entered. */
		val = val.substr(2);
		
		/* Validate characters in string. */
		for (i = 0; i < val.length; i++)
		{
			if (!(((c = val.charCodeAt(i)) >= 48 && c < 58) || // Decimal numbers.
				  (c >= 65 && c < 71) ||                       // A to F
				  (c >= 97 && c < 103)))                       // a to f
			{
				registerError("Invalid hexadecimal format, character '" + val.charAt(i) + "' not allowed.");
				return;
			}
		}
		
		params.value = parseInt(val, 16);
	}
	else
	{
		/* (Possibly) decimal value. */
		for (i = 0; i < val.length; i++)
		{
			if ((c = val.charCodeAt(i)) < 48 || c > 57)
			{
				registerError("Invalid decimal format, character '" + val.charAt(i) + "' not allowed.");
				return;
			}
		}
		
		params.value = parseInt(val);
	}
	
	/* Range check. */
	if (params.value < 0 || params.val > 255)
	{
		registerError("Invalid value, it must be between 0 and 255.");
		return;
	}
	
	/* Send data. */
	performPrimitiveJSON('NexysController', 'setDataByte', params);
	
	/* The button bar may be changed if register 0 has been changed. */
	if (params.addr == 0)
	{
		resetIO();
		restoreIO(params);
	}
}

function registerError(m)
{
	alert(m);
}