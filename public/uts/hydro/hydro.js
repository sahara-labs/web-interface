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
	case 1: // -- Visualisation ---------------------------
		this.widgets.push(new LoadPressureSliderWidget(this),
						  new LEDPanelWidget(this));
		break;
	case 2: // -- Power -----------------------------------
		this.widgets.push(new PressureSliderWidget(this));
		break;
	case 3:
		break;
	case 4:
		break;
	case 5:
		break;
	case 0: // -- Mode selector ---------------------------
	default:
		this.widgets.push(new SelectorWidget(this));
		break;
	}
	
	for (i in this.widgets) this.widgets[i].init();
};

Hydro.prototype.repaint = function() {
	var i;
	for (i in this.widgets) this.widgets[i].repaint();
	
	if (this.debug) this.updateDebug();
};

/* ============================================================================
 * == Readings service.                                                      ==
 * ============================================================================ */
Hydro.prototype.paramsInit= function() {
	var thiz = this;
	$.get('/primitive/json/pc/' + this.PCONTROLLER + '/pa/getParams',
		null,
		function(response) {
			var i;
			for (i in response)
			{
				switch (response[i].name)
				{
				case 'pump': thiz.pump = parseInt(response[i].value, 10); break;
				case 'load': thiz.load = parseInt(response[i].value, 10); break;
				}
			}
		thiz.ready = true;
		thiz.clearOverlay();
	});
};

Hydro.prototype.valuesRequest = function() {
	var thiz = this;
	$.get('/primitive/json/pc/' + this.PCONTROLLER + '/pa/getValues', 
		null, 
		function(response) {
			thiz.valuesReceived(response);
	});
};

Hydro.prototype.valuesReceived = function(values) {
	var thiz = this, i, n;
	if (typeof values != "object")
	{
		/* Error occurred. */
		this.raiseError("Values response errored");
		setTimeout(function(){
			thiz.valuesRequest();
		}, 10000);
		return;
	}

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
		thiz.valuesRequest();
	}, 5000);
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
function HydroWidget(hydroinst) 
{
	this.hydro = hydroinst;
	this.canvas = $("#hydro");
}
HydroWidget.prototype.init = function() { };
HydroWidget.prototype.repaint = function() { };
HydroWidget.prototype.destroy = function() { };
HydroWidget.prototype.draggable = function(selector) {
	$(selector).addClass('hydrodrag')
		.draggable({
			handle: 'p',
			opacity: 0.6,
			stack: '.hydrodrag'
		});
};

/* == Selector widget to choose display mode. ================================= */
function SelectorWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
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
	var hydroinst = this.hydro;
	$('.modesel').click(function() {
		hydroinst.changeMode($(this).attr('id'));
	});
};
SelectorWidget.prototype.destroy = function() {
	$("#hydroselector").remove();
};

/* == Slider sets pump pressure using a slider. =============================== */
function SliderWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	this.paction = 'setPump';
	this.callback = function (response) { };
}
SliderWidget.prototype = new HydroWidget;
SliderWidget.prototype.init = function() {
	this.val = hydro.pump;
	var i, html =
		'<div id="slidercont" class="hydropanel ui-corner-all">' +
			'<div class="hydropaneltitle">' +
				'<p><span class="ui-icon ui-icon-gear"></span>Pump</p>' +
			'</div>' +
			'<div id="sliderinner">' +
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
		
	
		html +=	'</div>' +
			'</div>' +
			'<div id="sliderval">Value: <span>' + this.val + '</span> %</div>' +
		'</div>';
	this.canvas.append(html);
	
	var thiz = this;
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
			$.get("/primitive/json/pc/" + hydro.PCONTROLLER + "/pa/" + thiz.paction + "/pressure/" + ui.value,
				   null,
				   thiz.callback
			);
		}
	});
	
	this.slider = $("#slider");
	this.slider.children(".ui-slider-handle").css('width', 30)
		.css("left", "-11px");
	this.slider.children(".ui-slider-range").removeClass("ui-widget-header")
		.css("background-color", "#EFEFEF");
	this.sliderVal = $("#sliderval span");
	
	this.draggable("#slidercont");
};
SliderWidget.prototype.repaint = function() {
	if (this.val != hydro.pump)
	{
		this.slider.slider("value", hydro.pump);
		this.sliderVal.empty().append(hydro.pump);
	}
	return this;
};
SliderWidget.prototype.destroy = function() {
	this.slider.slider("destory");
	$("#slidercont").remove();
};
SliderWidget.prototype.response = function(vals) {
	if (typeof vals != "object")
	{
		this.hydro.raiseError("Failed");
		return false;
	}
	
	// TODO values parse
	
	this.hydro.repaint();
	return true;
};

/* == Pressure slider which sets pump pressure. =============================== */
function PressureSliderWidget(hydroinst)
{
	var thiz = this;
	SliderWidget.call(this, hydroinst);
	this.paction = 'setPump';
	this.callback = function(response) {
		thiz.response(response);
	};
}
PressureSliderWidget.prototype = new SliderWidget;

/* == Pressure slider which also sets load based on pressure.  ================ */
function LoadPressureSliderWidget(hydroinst)
{
	var thiz = this;
	SliderWidget.call(this, hydroinst);
	this.paction = 'pressureLoad';
	this.callback = function(response) {
		if (!thiz.response(response)) return;
		for (i in response)
		{
			if (response[i].name == "newload" && !isNaN(parseInt(response[i].value)))
			{
				thiz.hydro.load = parseInt(response[i].value);
				thiz.hydro.repaint();
			}
		}
	};
}
LoadPressureSliderWidget.prototype = new SliderWidget;

/* == LED Panel displays load. ================================================ */
function LEDPanelWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	this.NUM_LEDS = 4;
	this.onLeds = this.hydro.load;
}
LEDPanelWidget.prototype = new HydroWidget;
LEDPanelWidget.prototype.init = function() {
	var i, s, html = 
		"<div id='ledpanel' class='hydropanel ui-corner-all'>" +
			"<div class='hydropaneltitle'>" +
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
	this.draggable("#ledpanel");
};
LEDPanelWidget.prototype.repaint = function() {
	if (this.onLeds != this.hydro.load)
	{
		this.onLeds = this.hydro.load;
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
};
LEDPanelWidget.prototype.destroy = function() {
	$("#ledpanel").remove();
};


function round(num, pts)
{
	return Math.round(num * Math.pow(10, pts)) / Math.pow(10, pts);
}
