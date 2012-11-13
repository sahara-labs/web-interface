/**
 * Wave Tank /basic/ user interface. 
 */

/* Timestamp of last data update. */
var dataUpdate = undefined;

var isPumpOn = false;
function setPump()
{
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
	
}

function setDigitalOut(num)
{
	alert("Set digital output " + num);
}

function setAnalogOutputs()
{
	alert("Set analog outputs");
}

function dataUpdate(data)
{
	
}

function command(action, params)
{
}