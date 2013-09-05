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

var digitalOut = [false, false, false, false, false, false, false, false];
function setDigitalOut(num)
{
	if (!dataUpdate) return;
	
	digitalOut[num] = !digitalOut[num];
	$("#dout" + num + " img").attr("src", "/uts/wavetank/images/" + (digitalOut[num] ? "on_small" : "off_small") + ".png");
	command("setDigitalOutput", {chan: num, val: digitalOut[num]});
}

var analogOut = [0, 0, 0, 0, 0, 0, 0, 0];
function setAnalogOutputs()
{
	if (!dataUpdate) return;
	var i = 0, val;
	
	for (i in analogOut)
	{
		val = parseFloat($("#analog-out-" + i).val());
		if (isNaN(val))
		{
			alert("Must be a double value.");
			return;
		}
		
		if (val != analogOut[i])
		{
			analogOut[i] = val;
			command("setAnalogOutput", {chan: i, val: val});
		}
	}
}

var digitalIn = [false, false, false, false, false, false, false, false];
var analogIn = [0, 0, 0, 0, 0, 
                0, 0, 0, 0, 0, 
                0, 0, 0, 0, 0, 
                0, 0];

function update(data, isUpdate)
{
	var k = '';
	
	for (k in data)
	{
		switch (data[k].name)
		{
		case 'pump':
			var pump = "true" == data[k].value;
			if (!dataUpdate || pump != isPumpOn)
			{
				isPumpOn = pump;
				$("#controls0 img").attr("src", "/uts/wavetank/images/" + (isPumpOn ? "on" : "off" ) + ".png");
			}
			break;
			
		case 'inverter':
			var inv = "true" == data[k].value;
			if (!dataUpdate || inv != isInverterOn)
			{
				isInverterOn = inv;
				$("#controls1 img").attr("src", "/uts/wavetank/images/" + (isInverterOn ? "on" : "off") + ".png");
			}
			break;
			
		case 'paddle':
			var val = parseFloat(data[k].value);
			if (!dataUpdate || val != paddleSpeed)
			{
				paddleSpeed = val;
				$("#paddle").val(val);
			}
			break;
			
		case 'din':
			var i = 0, din = data[k].value.replace(/[\s*|\[|\]]/g, "").split(","), val;
			for (i in din)
			{
				if (i == 0) din[i] = din[i].substring(1);
				if (i == din.length - 1) din[i] = din[i].substring(0, din[i].length - 1);
				val = din[i].replace(/^\s+|\s+$/g, "").toLowerCase() == "true";
				if (!dataUpdate || val != digitalIn[i])
				{
					digitalIn[i] = val;
					$("#digital-status-" + i).removeClass(val ? 'led-off' : 'led-on')
											.addClass(val ? 'led-on' : 'led-off');
				}
			}
			break;
			
		case 'ain':
			var i = 0, ain = data[k].value.split(","), val;
			for (i in ain)
			{
				if (i == 0) ain[i] = ain[i].substr(1);
				val = decimal(parseFloat(ain[i]));
				if (!dataUpdate || val != analogIn[i])
				{
					analogIn[i] = val;
					$("#analog-input-" + i).empty().append(val);
				}
			}
			break;
			
		case 'dout':
			var i = 0, dout = data[k].value.replace(/[\s*|\[|\]]/g, "").split(","), val;
			for (i in dout)
			{
				val = dout[i] == "true";
				
				if (!dataUpdate || val != digitalOut[i])
				{
					digitalOut[i] = val;
					$("#dout" + i + " img").attr("src", "/uts/wavetank/images/" + (digitalOut[i] ? "on_small" : "off_small") + ".png");
				}
			}
			break;
			
		case 'aout':
			var i = 0, aout = data[k].value.split(","), val;
			for (i in aout)
			{
				if (i == 0) aout[i] = aout[i].substr(1);
				val = decimal(parseFloat(aout[i]));
				if (!dataUpdate || val != analogOut[i])
				{
					analogOut[i] = val;
					$("#analog-out-" + i).val(val);
				}
			}
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
						if (typeof resp == "object") update(resp, true);
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
			if (typeof resp == "object") update(resp);
		}
	);
}

function decimal(val)
{
	val *= 100;
	val = Math.round(val);
	val = val / 100;
	return val;
}
