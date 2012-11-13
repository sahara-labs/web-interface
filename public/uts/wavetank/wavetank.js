/**
 * Wave Tank /basic/ user interface. 
 */

/* Timestamp of last data update. */
var dataUpdate = undefined;

var isPumpOn = false;
function setPump()
{
	/* Disable control until first server update. */
	if (!dataUpdate) return;
	
	isPumpOn = !isPumpOn;
	$("#controls0 img").attr("src", "/uts/wavetank/images/" + (isPumpOn ? "on" : "off" ) + ".png");
	command("setPump", {on : isPumpOn});
}

var isInverterOn = false;
function setInverter()
{
	if (!dataUpdate) return;
	
	isInverterOn = !isInverterOn;
	$("#controls1 img").attr("src", "/uts/wavetank/images/" + (isInverterOn ? "on" : "off") + ".png");
	command("setInverter", {on: isInverterOn});
}

var paddleSpeed = 0;
function setPaddle()
{
	if (!dataUpdate) return;
	
	var speed = parseFloat($("#paddle").val());
	if (isNaN(speed))
	{
		alert("Must be a double value.");
		return;
	}
	
	paddleSpeed = speed;
	command("setPaddle", {speed: speed});
}

var douts = [false, false, false, false, false, false, false, false];
function setDigitalOut(num)
{
	if (!dataUpdate) return;
	
	douts[num] = !douts[num];
	$("#dout" + num + " img").attr("src", "/uts/wavetank/images/" + (douts[num] ? "on_small" : "off_small") + ".png");
	command("setDigialOutput", {chan: num, val: douts[num]});
}

var aouts = [0, 0, 0, 0, 0, 0, 0, 0];
function setAnalogOutputs()
{
	if (!dataUpdate) return;
	var i = 0, val;
	
	for (i in aouts)
	{
		val = parseFloat($("#analog-out-" + i).val());
		if (isNaN(val))
		{
			alert("Must be a double value.");
			return;
		}
		
		if (val != aouts[i])
		{
			aouts[i] = val;
			command("setAnalogOutput", {chan: i, val: val});
		}
	}
}

function dataUpdate(data, isUpdate)
{
	var k = '';
	
	for (k in data)
	{
		switch (k)
		{
		case 'pump':
			var pump = "true" == data[k];
			if (!dataUpdate || pump != isPumpOn)
			{
				isPumpOn = pump;
				$("#controls0 img").attr("src", "/uts/wavetank/images/" + (isPumpOn ? "on" : "off" ) + ".png");
			}
			break;
			
		case 'inverter':
			var inv = "true" == data[k];
			if (!dataUpdate || inv != isInverterOn)
			{
				isInverterOn = inv;
				$("#controls1 img").attr("src", "/uts/wavetank/images/" + (isInverterOn ? "on" : "off") + ".png");
			}
			break;
			
		case 'paddle':
			$("#paddle").val(data[k]);
			break;
			
		case 'din':
			
			break;
			
		case 'ain':
			
			break;
			
		case 'dout':
			
			break;
			
		case 'aout':
			
			break;
		}
	}
	
	if (data.length > 0) dataUpdate = new Date().getTime();
	
	if (isUpdate)
	{
		/* Schedule next update. */
		setTimeout(function() {
			$.get(
					"/primitive/json/pc/WaveTankController/pa/data",
					null,
					function (resp) {
						if (typeof resp == "object") dataUpdate(resp);
					}
			);
		}, 3000);
	}
}

function command(action, params)
{
	$.post(
		"/primitive/json/pc/WaveTankController/pa/" + action,
		params,
		function (resp) {
			if (typeof resp == "object") dataUpdate(resp);
		}
	);
}
