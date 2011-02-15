/**
 * Hydro rig interface.
 * 
 * @author Michael Diponio
 * @date 13th February 2011
 */

function Hydro() {
	/* -- Constants ------------------------------------ */
	this.PCONTROLLER = "HydroController";
	
	/* -- Variables ------------------------------------ */
	/* Currently displayed mode. */
	this.mode = 0;
	
	/* Experiment variables. */
	this.pump = 0;
	this.load = 0;
	this.power = 0.0;
	this.voltage = 0.0;
	this.current = 0.0;
	this.torque = 0.0;
	this.rpm = 0.0;
	this.flowrate = 0.0;
	this.pressure = 0.0;
	
	this.widgets = [];
	
}

/* Display debug information. */
Hydro.prototype.debug = true;

/* Whether the page is ready for interaction. */
Hydro.prototype.ready = false;
Hydro.prototype.init = function() {
	
	/* Restore state if stored. */
	var stateMode = window.location.hash;
	if (stateMode && stateMode.indexOf("exp") == 1)
	{
		this.changeMode(stateMode.substr(1));
	}
	else
	{
		this.displayMode(0);
	}
	
	if (this.debug)
	{
		$('#hydrodebugpanel').show();
		this.updateDebug();
	}
	
	this.addOverlay();
	this.paramsInit();
	this.valuesRequest();
};

Hydro.prototype.changeMode = function(mode) {
	window.location.hash = mode;
	this.displayMode(mode.substr(3));
	
	if (this.debug) this.updateDebug();
};

Hydro.prototype.displayMode = function(modenum) {
	var i;
	
	/* Clear the existing display. */
	while (this.widgets.length > 0) this.widgets.pop().destroy();

	switch (parseInt(modenum))
	{
	case 1:
		this.widgets.push(pressureSliderWidget = new PressureSliderWidget('pressureLoad', function(response) {
			if (typeof response != "object") hydro.raiseError("Failed");
			for (i in response) if (response[i].name == "newload" && !isNaN(parseInt(response[i].value))) hydro.load = parseInt(response[i].value);
		}).init());
		this.widgets.push(ledPanel = new LEDPanelWidget().init());
		break;
	case 2:
		break;
	case 3:
		break;
	case 4:
		break;
	case 5:
		break;
	case 0: // -- Mode selector ------------------------
	default:
		this.widgets.push(selectorWidget = new SelectorWidget().init());
		break;
	}
};

Hydro.prototype.repaint = function() {
	var i;
	for (i in this.widgets) this.widgets[i].repaint();
};

/* ============================================================================
 * == Readings service.                                                      ==
 * ============================================================================ */
Hydro.prototype.paramsInit= function() {
	$.get('/primitive/json/pc/' + this.PCONTROLLER + '/pa/getParams',
		null,
		function(response) {
			var i;
			for (i in response)
			{
				switch (response[i].name)
				{
				case 'pump': hydro.pump = parseInt(response[i].value, 10); break;
				case 'load': hydro.load = parseInt(response[i].value, 10); break;
				}
			}
		hydro.ready = true;
		hydro.clearOverlay();
	});
};

Hydro.prototype.valuesRequest = function() {
	$.get('/primitive/json/pc/' + this.PCONTROLLER + '/pa/getValues', 
		null, 
		function(response) {
			hydro.valuesReceived(response);
	});
};

Hydro.prototype.valuesReceived = function(values) {
	if (typeof values != "object")
	{
		/* Error occurred. */
		this.raiseError("Values response errored");
		setTimeout(function(){
			hydro.valuesRequest();
		}, 10000);
		return;
	}
	
	var i, n;
	for (i in values)
	{
		switch (values[i].name)
		{
		case "power":
			this.power = round(parseFloat(values[i].value, 10), 2);
			break;
		case "voltage":
			this.voltage = round(parseFloat(values[i].value, 10), 2);
			break;
		case "current":
			this.current = round(parseFloat(values[i].value, 10), 2);
			break;
		case "torque":
			this.torque = round(parseFloat(values[i].value, 10), 2);
			break;
		case "rpm":
			this.rpm = round(parseFloat(values[i].value, 10), 2);
			break;
		case "pressure":
			this.pressure = round(parseFloat(values[i].value, 10), 2);
			break;
		case "rate":
			this.flowrate = round(parseFloat(values[i].value, 10), 2);
			break;
		}
	}
	
	if (this.debug) this.updateDebug();
	this.repaint();
	
	setTimeout(function(){
		hydro.valuesRequest();
	}, 1000);
};

/* ============================================================================
 * == Utility & debug.                                                       ==
 * ============================================================================ */
Hydro.prototype.addOverlay = function() {
	$('body').append(
		'<div id="hydrooverlay">' +
			'<div id="hydrooverlaywarning">' +
				'Please wait...' +
			'</div>' +
		'</div>'
	);
};

Hydro.prototype.clearOverlay = function() {
	$('#hydrooverlay').remove();
	this.repaint();
};

Hydro.prototype.raiseError = function(error) {
	// TODO error
//	alert(error);
};

Hydro.prototype.updateDebug = function() {
	if (!this.debug) return;
	
	$('#hydrodebug').empty().append(
		   '<div>Mode: ' + this.mode + '</div>' +
		   '<div>Pump: ' + this.pump + '</div>' + 
		   '<div>Load: ' + this.load + '</div>' + 
		   '<div>Power: ' + this.power + '</div>' + 
		   '<div>Voltage: ' + this.voltage + '</div>' + 
		   '<div>Current: ' + this.current + '</div>' + 
		   '<div>Torque: ' + this.torque + '</div>' + 
		   '<div>RPM: ' + this.rpm + '</div>' + 
		   '<div>Flow rate: ' + this.flowrate + '</div>' + 
		   '<div>Pressure: ' + this.pressure + '</div>'
	);
};

/* ============================================================================
 * == Page widgets.                                                          ==
 * ============================================================================ */
function HydroWidget() 
{
	this.canvas = $("#hydro");
}
HydroWidget.prototype.init = function() { return this; };
HydroWidget.prototype.repaint = function() { return this; };
HydroWidget.prototype.destroy = function() { return this; };

/* == Selector widget to choose display mode. ================================= */
function SelectorWidget()
{
	HydroWidget.call(this);
	
	this.NUM_MODES = 5;
	this.MODE_LABELS = ['Selector', 
	                    'Visualisation', 
	                    'Power',
	                    'Current & Voltage',
	                    'Power Redux',
	                    'Switches'];
	this.MODE_IMGS =   ['',
	                    'selvis',
	                    'selpower',
	                    'selcurrvolt',
	                    'selpower2',
	                    'selswitches'];
}
SelectorWidget.prototype = new HydroWidget;
SelectorWidget.prototype.init = function() {
	var s = 1,
		html = '<div id="hydroselector"><ul>';
	    	
		for ( ; s <= this.NUM_MODES; s++) html +=
					'<li><a id="exp' + s + '" class="modesel">' +
						'<img src="/uts/hydro/images/' + this.MODE_IMGS[s] + '.png" alt="img" />' +
						this.MODE_LABELS[s] +
					'</a></li>';
	
	    html += '</ul></div>';

	this.canvas.append(html);
	$('.modesel').click(function() {
		hydro.changeMode($(this).attr('id'));
	});
	return this;
};
SelectorWidget.prototype.destroy = function() {
	$("#hydroselector").remove();
	return this;
};

/* == Slider sets pump pressure using a slider. =============================== */
function PressureSliderWidget(pa, cb)
{
	HydroWidget.call(this);
	this.paction = pa;
	this.callback = cb;
}
PressureSliderWidget.prototype = new HydroWidget;
PressureSliderWidget.prototype.init = function() {
	this.val = hydro.pump;
	var i, html =
		'<div id="slidercont">' +
			'<div id=slidertitle>Pump:</div>' +
			'<div id="slider"> </div>' +
			'<div id="sliderleg">';
		for (i = 0; i <= 10; i++)
		{
			html += 
				'<div class="slidertick">' +
					'<span class="ui-icon ui-icon-arrowthick-1-w"> </span>' +
					(i < 10 ? (100 - i * 10) + ' %'  : 'Off') +
				'</div>';
		}
		
	
		html +=
			'</div>' +
			'<div id="sliderval">Value: <span>' + this.val + '</span> %</div>' +
		'</div>';
	this.canvas.append(html);
	
	$("#slider").slider({
		orientation: "vertical",
		min: 0,
		max: 100,
		value: this.val,
		range: "min",
		slide: function(event, ui) {
			$("#sliderval span").empty().append(ui.value);
		},
		stop: function(event, ui) {
			hydro.pump = ui.value;
			$.get("/primitive/json/pc/" + hydro.PCONTROLLER + "/pa/" + pressureSliderWidget.paction + "/pressure/" + ui.value,
				   null,
				   pressureSliderWidget.callback
			);
		}
	});
	
	this.slider = $("#slider");
	this.slider.children(".ui-slider-handle").css('width', 30)
		.css("left", "-11px");
	this.slider.children(".ui-slider-range").removeClass("ui-widget-header")
		.css("background-color", "#EFEFEF");
	this.sliderVal = $("#sliderval span");
	
	return this;
};
PressureSliderWidget.prototype.repaint = function() {
	if (this.val != hydro.pump)
	{
		this.slider.slider("value", hydro.pump);
		this.sliderVal.empty().append(hydro.pump);
	}
	return this;
};
PressureSliderWidget.prototype.destroy = function() {
	this.slider.slider("destory");
	$("#slidercont").remove();
	return this;
};

/* == LED Panel displays load. ================================================ */
function LEDPanelWidget()
{
	HydroWidget.call(this);
	
	this.NUM_LEDS = 4;
	this.onLeds = hydro.load;
}
LEDPanelWidget.prototype = new HydroWidget;
LEDPanelWidget.prototype.init = function() {
	var i, s, html = 
		"<div id='ledpanel' class='ui-corner-all'>" +
			"<div id='ledpaneltitle'>" +
				"<p><span class='ui-icon ui-icon-lightbulb'></span> Lights</p>" +
			"</div>" +
			"<div id='ledpanelinner'>";
		for (i = 1; i <= this.NUM_LEDS; i++)
		{
			s = (i <= this.onLeds ? "on" : "off");
			html += 
				"<div class='led'>" +
					"<img src='/uts/hydro/images/led" + s + ".png' alt='" + s + "' />" +
				"</div>";
		}
	html += "</div>" +
		"</div>";
	this.canvas.append(html);
	this.panel = $("#ledpanelinner");
	return this;
};
LEDPanelWidget.prototype.repaint = function() {
	if (this.onLeds != hydro.load)
	{
		this.onLeds = hydro.load;
		var i, html = '';
		for (i = 1; i <= this.NUM_LEDS; i++)
		{
			s = (i <= this.onLeds ? "on" : "off");
			html += 
				"<div class='led'>" +
					"<img src='/uts/hydro/images/led" + s + ".png' alt='" + s + "' />" +
				"</div>";
		}
		this.panel.empty().append(html);
	}
	
	return this;
};
LEDPanelWidget.prototype.destroy = function() {
	$("#ledpanel").remove();
	return this;
};


function round(num, pts)
{
	return Math.round(num * Math.pow(10, pts)) / Math.pow(10, pts);
}
