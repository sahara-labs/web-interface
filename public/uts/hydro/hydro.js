/**
 * Hydro rig interface.
 * 
 * @author Michael Diponio
 * @date 13th February 2011
 */

function Hydro() {
	/* -- Constants ------------------------------------ */
	this.PCONTROLLER = "HydroController";
	this.STATIC_LOAD = 4;
	
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
Hydro.prototype.debug = false;

/* Whether the page is ready for interaction. */
Hydro.prototype.ready = false;

Hydro.prototype.init = function() {
	
	/* Restore state if stored. */
	var stateMode = window.location.hash;
	if (stateMode && stateMode.indexOf("exp") == 1)
	{
		this.displayMode(stateMode.substr(4));
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
	
	this.addOverlay("Initalising");
	this.paramsInit();
	this.valuesRequest();
};

Hydro.prototype.changeExperiment = function() {
	$("body").append(
		"<div id='changeexperiment' title='Change Experiment'>" +
			"<div class='ui-state-primary'>Are you sure you want to change experiment?</div>" +
			"<div class='ui-state-highlight ui-corner-all'>" +
				"<span class='ui-icon ui-icon-info'></span>" +
				"This will reset the rig but you will not be removed from the rig." +
			"</div>" +
		"<div>"
	);
	
	var thiz  = this;
	$("#changeexperiment").dialog({
		modal: true,
		resizable: false,
		width: 400,
		buttons: {
			Yes: function() {
				if (thiz.pump == 0 && thiz.flowrate < 0.1)
				{
					thiz.displayMode(0);
					$(this).dialog("close").remove();
				}
				
				var func, diag = $('div[aria-labelledby="ui-dialog-title-changeexperiment"]')
					.css("width", 150);
				diag.css("left", parseInt(diag.css("left")) + 125);
				diag.children(".ui-dialog-titlebar").hide();
				diag.children(".ui-dialog-buttonpane").hide();
				$(this).html(
						"<div id='rigresetting'>" +
							"<img src='/images/ajax-loading.gif' alt=' ' /><br />" +
							"Resetting..." +
						"</div>"
				);
				
				
				thiz.setPressure(0);
				thiz.setLoad(0);

				var func;
				setTimeout(func = function() {
					if (thiz.pump == 0 && thiz.flowrate < 0.1)
					{
						thiz.displayMode(0);
						$("#changeexperiment").dialog("close").remove();
					}
					else setTimeout(func, 500);
				}, 500);

			},
			No: function() {
				$(this).dialog("close").remove();
			}
		}
	});
};

Hydro.prototype.displayMode = function(modenum) {
	var i;
	
	this.mode = modenum;
	
	/* Set hash location for state persistance. */
	window.location.hash = "exp" + modenum;
	
	/* Clear the existing display. */
	while (this.widgets.length > 0) this.widgets.pop().destroy();
	
	if (modenum != 0)
	{
		/* Most views have the camera. */
		this.widgets.push(new CameraWidget(this));
		
		$(".hydrobutton").show();
	}
	
	switch (parseInt(modenum))
	{
	case 1: // -- The Basics 1 -----------------------------
		this.setLoad(0);
		this.widgets.push(new ScaledLoadPressureSliderWidget(this),
						  new LEDPanelWidget(this));
		break;
	case 2: // -- The Basics 2 -----------------------------
		this.setLoad(0);
		this.widgets.push(new ScaledLoadPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new FlowGaugeWidget(this),
						  new LEDPanelWidget(this));
		break;
	case 3: // -- Turn On the Lights -----------------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledLoadPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new FlowGaugeWidget(this));
		break;
	case 4: // -- Electrical Power -------------------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new FlowGaugeWidget(this),
						  new VoltageGaugeWidget(this),
						  new CurrentGaugeWidget(this));
		break;
	case 5: // -- Electrical Energy ------------------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new FlowGaugeWidget(this),
						  new VoltageGaugeWidget(this),
						  new CurrentGaugeWidget(this));
		break;
	case 6: // -- Water Flow and its Effects ---------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledPressureSliderWidget(this),
						  new FlowGaugeWidget(this),
						  new VoltageGaugeWidget(this),
						  new CurrentGaugeWidget(this));
		break;
	case 7: // -- Energy Interconversion ------------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new FlowGaugeWidget(this),
						  new VoltageGaugeWidget(this),
						  new CurrentGaugeWidget(this));
		break;
	case 8: // -- Energy Transformation --------------------
		this.setLoad(this.STATIC_LOAD);
		this.widgets.push(new ScaledPressureSliderWidget(this),
						  new RpmMeterWidget(this),
						  new PowerGaugeWidget(this));
		break;
	case 9: // -- Torque 9 --------------------------------- 
		this.widgets.push(new ScaledPressureSliderWidget(this),
				          new LoadSetterWidget(this),
				          new RpmMeterWidget(this),
				          new TorqueGaugeWidget(this),
				          new VoltageGaugeWidget(this),
				          new CurrentGaugeWidget(this),
				          new PowerGaugeWidget(this));
		break;
	case 10: // -- The Effect of Output Resistance ----------
		this.widgets.push(new ScaledPressureSliderWidget(this),
				          new LoadSetterWidget(this),
				          new RpmMeterWidget(this),
				          new VoltageGaugeWidget(this),
				          new CurrentGaugeWidget(this),
				          new PowerGaugeWidget(this));
		break;
	case 0: // -- Mode selector ---------------------------
	default:
		$(".hydrobutton").hide();
		this.widgets.pop();
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

Hydro.prototype.resetPosition = function() {
	for (i in this.widgets) this.widgets[i].posReset();
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

	this.values(values);
	
	if (this.debug) this.updateDebug();
	this.repaint();
	
	setTimeout(function(){
		thiz.valuesRequest();
	}, 1500);
};

Hydro.prototype.values = function(values) {
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
};

/* ============================================================================
 * == Rig control.                                                           ==
 * ============================================================================ */
Hydro.prototype.setPressure = function(val) {
	var thiz = this;
	this.pump = val;
	$.get("/primitive/json/pc/" + this.PCONTROLLER + "/pa/setPump/pressure/" + val,
		   null,
		   function(response) {
				if (typeof response == 'object')
				{
					thiz.values(response);
					thiz.repaint();
				}
				else thiz.raiseError("Failed response");
			}
	);
};

Hydro.prototype.setLoad = function(val) {
	this.load = val;
	var thiz = this;
	$.get("/primitive/json/pc/" + this.PCONTROLLER + "/pa/setLoad/load/" + val,
		null,
		function(response) {
			if (typeof response == 'object')
			{
				thiz.values(response);
				thiz.repaint();
			}
			else thiz.raiseError("Failed response");
		}
	);
};

Hydro.prototype.setPressureLoad = function(val) {
	var thiz = this;
	this.pump = val;
	$.get("/primitive/json/pc/" + this.PCONTROLLER + "/pa/pressureLoad/pressure/" + val,
		   null,
		   function(response) {
			if (typeof response == 'object')
			{
				thiz.values(response);
				for (i in response)
				{
					if (response[i].name == "newload" && !isNaN(parseInt(response[i].value)))
					{
						thiz.load = parseInt(response[i].value);
						thiz.repaint();
					}
				}
				thiz.repaint();
			}
			else thiz.raiseError("Failed response");		
		}
	);
};

/* ============================================================================
 * == Accessors and Setters.                                                 ==
 * ============================================================================ */
Hydro.prototype.getMode = function() {
	return this.mode;
};

/* ============================================================================
 * == Utility & debug.                                                       ==
 * ============================================================================ */
Hydro.prototype.addOverlay = function(message) {
	this.isOverlayDeployed = true;
	
//	$('body').append(
//		'<div id="hydrooverlaycontainer">' +
//			'<div id="hydrooverlay"> </div>' +
//			'<div id="hydrooverlaywarning">' +
//				'<img src="/images/ajax-loading.gif" alt=" " /><br />' +
//				(message ? message : 'Please wait...') +
//			'</div>' +
//		'</div>'
//	);
//	
//	var body = $("body"),
//	    height = body.height(),
//	    width = body.width();
//	
//	$("#hydrooverlay").css({
//		width: width,
//		height: height
//	});
//	
//	$("#hydrooverlaywarning").css({
//		top: height / 2 - 125,
//		left: width / 2 - 75
//	});
};

Hydro.prototype.clearOverlay = function() {
	this.isOverlayDeployed = false;
//	$('#hydrooverlaycontainer').remove();
//	this.repaint();
};

Hydro.prototype.raiseError = function(error, level) {
	if (typeof console == "undefined") return;
	
	switch (level)
	{
	case 'DEBUG':
		console.debug("Hydro debug: " + error);
		break;
	
	case 'INFO':
		console.info("Hydro Info: " + error);
		break;
	
	case 'WARN':
		console.warn("Hydro Warn: " + error);
		break;
		
	case 'ERR':
	default:
		console.error("Hydro Err: " + error);		
	}
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
	
	this.jqEle;
	
	this.defaultCoords = "0x0";
}
HydroWidget.prototype.init = function() { };
HydroWidget.prototype.postInit = function() {
	this.draggable();
	this.defaultCoords = parseInt(this.jqEle.css("left")) + "x" + parseInt(this.jqEle.css("top"));
	this.setPos(getHydroCookie(this.jqEle.attr("id") + "_M" + this.hydro.getMode()));
};
HydroWidget.prototype.repaint = function() { };
HydroWidget.prototype.draggable = function() {
	var thiz = this;
	this.jqEle.addClass('hydrodrag')
		.draggable({
			handle: 'p',
			opacity: 0.6,
			stack: '.hydrodrag',
			stop:function() { thiz.posMoved(); }
		});
};
HydroWidget.prototype.posMoved = function() {
	setHydroCookie(this.jqEle.attr("id") + "_M" + this.hydro.getMode(), 
			parseInt(this.jqEle.css("left")) + "x" + parseInt(this.jqEle.css("top")));
	
	resizeFooter();
};
HydroWidget.prototype.posReset = function() {
	this.setPos(this.defaultCoords);
	setHydroCookie(this.jqEle.attr("id") + "_M" + this.hydro.getMode(), this.defaultCoords);
};
HydroWidget.prototype.setPos = function(pos) {
	if (!pos || pos == "") return;
	
	var coords = pos.split("x");
	
	if (coords.length == 2)
	{
		this.jqEle.css({
			"left": parseInt(coords[0]) + "px",
			"top": parseInt(coords[1]) + "px"
		});
	}
	else this.hydro.raiseError("Provided position for widget " + this.jqEle.attr("id") + " has incorrect format.", "WARN");
	
	resizeFooter();
};
HydroWidget.prototype.destroy = function() {
	this.jqEle.remove();
};

/* == Selector widget to choose display mode. ================================= */
function SelectorWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	this.NUM_MODES = 10;
	this.MODE_LABELS = ['Selector', 
	                    'The Basics 1',
	                    'The Basics 2',
	                    'Turn on the Lights',
	                    'Electrical Power',
	                    'Electrical Energy',
	                    'Water Flow and its Effects',
	                    'Energy Interconversion',
	                    'Energy Transformation',
	                    'Torque',
	                    'The Effect of Output Resistance'];
	this.MODE_IMGS =   ['',
	                    'selvis',
	                    'selvis',
	                    'selpower',
	                    'selcurrvolt',
	                    'selpower2',
	                    'selswitches',
	                    'selvis',
	                    'selvis',
	                    'selvis',
	                    'selvis'];
}
SelectorWidget.prototype = new HydroWidget;
SelectorWidget.prototype.init = function() {
	var s = 1,
		html = '<div id="hydroselector"><ul>';
	    	
		for ( ; s <= this.NUM_MODES; s++) html +=
					'<li><a id="exp' + s + '" class="modesel">' +
						'<img src="/uts/hydro/images/' + this.MODE_IMGS[s] + '.png" alt="img" />' +
						s + '. ' + this.MODE_LABELS[s] +
					'</a></li>';
	
	    html += '</ul></div>';

	this.canvas.append(html);
	var hydroinst = this.hydro;
	$('.modesel').click(function() {
		hydroinst.displayMode($(this).attr('id').substr(3));
	});
	
	this.jqEle = $("#hydroselector");
};

/* == Camera widget. ========================================================= */
function CameraWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	/* Default camera properties. */
	this.width = 320;
	this.height = 240;
	
	this.positions = [];
	
	this.deployed = '';
}
CameraWidget.prototype = new HydroWidget;
CameraWidget.prototype.init = function() {
	var thiz = this,
		html = '<div id="hydrocamera" class="hydropanel ui-corner-all">' +
			      '<div class="hydropaneltitle" class="hydrodrag">' +
			         '<p>' +
			            '<span class="ui-icon ui-icon-video"></span>Camera' +
			         '</p>' +
			      '</div>' +
			      '<div id="hydrocamerastream">' +
			    	   '<div class="loadinggif">' +
			      	       '<img src="/uts/hydro/images/loading.gif" alt="L" />' +
			      	   '</div>' +
			      '</div>' +
			      '<div id="hydrocamerabuttons">' +
			      '</div>' +
			   '</div>';

	this.canvas.append(html);
	$("#hydrocamerastream").css({
		width: this.width,
		height: this.height
	});
	
	this.jqEle = $("#hydrocamera");
	
	this.jqEle.resizable({
		minHeight: 386,
		maxHeight: 626,
		minWidth: 320,
		maxWidth: 640,
		ghost: true,
		aspectRatio: true,
		stop: function(event, ui) {
			thiz.resize(ui.size.width, ui.size.height);
		}
	});
	
	this.postInit();
	
	$.get('/primitive/json/pc/CameraController/pa/details', 
		null, 
		function(response) {
		thiz.draw(response);
	});
	
	
};
CameraWidget.prototype.draw = function(resp) {
	if (typeof resp != "object") 
	{
		this.hydro.raiseError('Unable to load cameras details.');
		return;
	}
	
	var i, html, thiz = this;
	
	for (i in resp)
	{
		switch(resp[i].name)
		{
		case 'mpeg':
			this.video = resp[i].value;
			break;
		case 'mjpeg':
			this.mjpeg = resp[i].value;
			break;
		default:
			this.positions.push(resp[i].value);
			break;
		}
	}
	
	/* Deploy buttons. */
	html = '<div id="hydrocamformats">' +
               '<div class="camheader">Formats</div>';
	
	if (!$.browser.msie) html += '<div id="imagesbutton" class="camerabutton">MJPEG</div>';
	
	html +=    '<div id="videobutton"  class="camerabutton">ASF</div>' +
		   '</div>' +
		   
		   '<div id="hydrocampositions">' +
               '<div class="camheader">Positions</div>';;
	
	for (i in this.positions)
	{
		html += '<div class="positionbutton camerabutton">' + this.positions[i] + '</div>';
	}
	
	html += '</div>' +
		   '<div style="clear:both"></div>';
		   
	
	$("#hydrocamerabuttons").append(html);
	
	/* Event listeners. */
	if (!$.browser.msie) $("#imagesbutton").click(function() { thiz.deployImages(); });
	$("#videobutton").click(function() { thiz.deployVideo(); });
	$("#hydrocamerabuttons .positionbutton").click(function() {
		$("#hydrocampositions .selectedbutton").removeClass("selectedbutton");
		$(this).addClass("selectedbutton");
		thiz.move($(this).text()); 
	});
	
	/* Default deployment. */
	this.deployImages();
};
CameraWidget.prototype.deployImages = function() {
	this.deployed = 'mjpeg';
	
	$("#hydrocamformats .selectedbutton").removeClass("selectedbutton");
	$("#imagesbutton").addClass("selectedbutton");
	
	var $hydroCam = $("#hydrocamerastream");
	$hydroCam.empty();
	
	if ($.browser.msie)
	{
		/* Internet explorer does not display motion JPEG a Java applet is 
		 * deployed to stream it. */
		$hydroCam.append(
				'<applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" ' + 
						'width="' + this.width + '" height="' + this.height + '">' +
					'<param name="url" value="' + url + '"/>' +
					'<param name="accessories" value="none"/>' +
				'</applet>'
		);
	}
	else
	{
		/* Other browsers can play motion JPEG natively. */
		$hydroCam.append(
				"<img style='width:" + this.width + "px;height:" + this.height + "px' " +
						"src='" + this.mjpeg + "?" + new Date().getTime() + "' alt='&nbsp;'/>"
		);
	}
};
CameraWidget.prototype.deployVideo = function() {
	this.deployed = 'asf';
	
	$("#hydrocamformats .selectedbutton").removeClass("selectedbutton");
	$("#videobutton").addClass("selectedbutton");
	$("#hydrocamerastream").empty().html(
			"<object " +
			"	classid='CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95' " +
			"	codebase='http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab' " +
			"	standby='Loading Microsoft Windows Media Player...' " +
			"	type='application/x-oleobject' " +
			"	width='" + this.width + "' " +
			"	height='" + this.height + "' >" +
			"		<param name='fileName' value='" + this.video + "'>" +
			"		<param name='animationatStart' value='1'>" +
			"		<param name='transparentatStart' value='1'>" +
			"		<param name='autoStart' value='1'>" +
			"		<param name='ShowControls' value='0'>" +
			"		<param name='ShowDisplay' value='0'>" +
			"		<param name='ShowStatusBar' value='0'>" +
			"		<param name='loop' value='0'>" +
			"		<embed type='video/x-ms-asf-plugin' " +
			"			pluginspage='http://microsoft.com/windows/mediaplayer/en/download/' " +
			"			showcontrols='0' " +
			"			showtracker='1' " +
			"			showdisplay='0' " +
			"			showstatusbar='0' " +
			"			videoborder3d='0' " +
			"			width='" + this.width + "' " +
			"			height='" + this.height + "' " +
			"			src='" + this.video + "' " +
			"			autostart='1' " +
			"			loop='0' /> " +
			"</object>");
};
CameraWidget.prototype.move = function(pos) {
	$.get('/primitive/json/pc/CameraController/pa/move/position/' + pos);
};
CameraWidget.prototype.resize = function(width, height) {
	this.width = width;
	this.height = height - 146 ;
	
	switch(this.deployed) 
	{
	case 'mjpeg':
		this.deployImages();
		break;
	case 'asf':
		this.deployVideo();
		break;
	}
};

/* == Slider sets pump pressure using a slider. =============================== */
function SliderWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	this.setter = function (val) { };
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
	
	this.jqEle = $("#slidercont");
	
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
			thiz.setter.call(thiz.hydro, ui.value);
		}
	});
	
	this.slider = $("#slider");
	this.slider.children(".ui-slider-handle").css('width', 30)
		.css("left", "-11px")
		.css("cursor", "row-resize");
	
	this.slider.children(".ui-slider-range").removeClass("ui-widget-header")
		.css("background-color", "#EFEFEF")
		.css("overflow", "hidden")
		.css("width", "10px");
	this.sliderVal = $("#sliderval span");
	
	this.postInit();
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

/* == Pressure slider which sets pump pressure. =============================== */
function PressureSliderWidget(hydroinst)
{
	SliderWidget.call(this, hydroinst);
	
	this.setter = this.hydro.setPressure;
}
PressureSliderWidget.prototype = new SliderWidget;

/* == Pressure Slider which interpolates 0 to 100% PP to mean 55% to 100%. ==== */
function ScaledPressureSliderWidget(hydroinst)
{
	SliderWidget.call(this, hydroinst);
	
	this.setter = this.scaledSlide; 
};
ScaledPressureSliderWidget.prototype = new SliderWidget;
ScaledPressureSliderWidget.prototype.scaledSlide = function(val) {
	if (val < 5)
	{
		/* Lower threshold. */
		this.setPressure(0);
	}
	else
	{
		this.setPressure(Math.floor(val / 2) + 50);
	}
};
ScaledPressureSliderWidget.prototype.repaint = function() {
	/* Don't need repainting on this widget. */
};

/* == Pressure slider which also sets load based on pressure.  ================ */
function LoadPressureSliderWidget(hydroinst)
{
	SliderWidget.call(this, hydroinst);
	this.setter = this.hydro.setPressureLoad;
}
LoadPressureSliderWidget.prototype = new SliderWidget;

/* == Pressure Slider which interpolates 0 to 100% PP to mean 55% to 100%. ==== */
function ScaledLoadPressureSliderWidget(hydroinst)
{
	SliderWidget.call(this, hydroinst);
	
	this.setter = this.scaledSlide; 
};
ScaledLoadPressureSliderWidget.prototype = new SliderWidget;
ScaledLoadPressureSliderWidget.prototype.scaledSlide = function(val) {
	if (val < 5)
	{
		/* Lower threshold. */
		this.setPressureLoad(0);
	}
	else
	{
		this.setPressureLoad(Math.floor(val / 2) + 50);
	}
};
ScaledLoadPressureSliderWidget.prototype.repaint = function() {
	/* Don't need repainting on this widget. */
};

/* Load setter. =============================================================== */
function LoadSetterWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	this.val = this.hydro.load;
}
LoadSetterWidget.prototype = new HydroWidget;
LoadSetterWidget.prototype.init = function() {
	var i, html = 
		"<div id='loadsetterpanel' class='hydropanel ui-corner-all'>" +
			"<div class='hydropaneltitle'><p>" +
				"<span class='hydroicon hydroiconload'></span>" +
				"Load" +
			"</p></div>" +
			"<div class='loadsetterinner'>" +
				"<div id='loadsetter'> </div>" +
				"<div id='loadticks'>";

	for (i = 0; i <= 4; i++) html += 	
					"<div class='loadtick'>" +
						"<span class='ui-icon ui-icon-arrowthick-1-n'> </span>" + i +
					"</div>";

	html += 	"</div>" +
			"<div>" +
		"</div>";
	
	this.canvas.append(html);
	
	this.jqEle = $("#loadsetterpanel");
	
	var thiz = this;
	this.ls = $("#loadsetter").slider({
		orientation: "horizontal",
		min: 0,
		max: 4,
		value: this.val,
		stop: function(evt, ui) {
			thiz.hydro.setLoad.call(thiz.hydro, ui.value);
		}
	});
	
	this.ls.children(".ui-slider-handle").css('height', 30)
		.css("cursor", "col-resize");
	
	this.postInit();
};
LoadSetterWidget.prototype.repaint = function() {
	if (this.val != this.hydro.load)
	{
		this.val = this.hydro.load;
		this.ls.slider("option", "value", this.val);
	}
};
LoadSetterWidget.prototype.destroy = function() {
	$("#loadsetterpanel").remove();
};

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
	
	this.jqEle = $("#ledpanel");
	this.postInit();
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

/* == Gauge display a value. ================================================== */
var gac = 0;
function GaugeWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	this.WIDTH = 172;
	this.STEP_SIZE = 3;
	this.ANIME_PERIOD = 33;
	
	this.id = "gauge" + gac++;

	this.currentVal = 0;
	this.animeVal = 0;
	this.isAnime = false;
	
	/* Animation values. */
	this.isAnime = false;
	this.cr = 0.0;
	this.dr = 0.0;
	
	/* Browser detection. */
	this.browser = "unknown";

	if      ($.browser.mozilla) this.browser = 'moz';
	else if ($.browser.webkit) this.browser = 'webkit';
	else if ($.browser.msie && parseInt($.browser.version) >= 9) this.browser = 'msie9';
	else if ($.browser.msie) this.browser = 'msie';
	else if ($.browser.opera && parseInt($.browser.version) >= 11) this.browser = 'opera';
}
GaugeWidget.prototype = new HydroWidget;
GaugeWidget.prototype.init = function() {
	if ($("#gaugecontainer").length != 1)
	{
		this.canvas.append("<div id='gaugecontainer'> </div>");
	}
	
	var s = '' + this.animeVal;
	if (s.indexOf('.') == -1) s += '.00';
	else while (s.length - s.indexOf('.') < 3) s += '0';
	
	$("#gaugecontainer").append(
		"<div id='" + this.id + "' class='gauge hydropanel ui-corner-all'>" +
			"<div class='hydropaneltitle'><p>" +
				"<span class='hydroicon " + this.icon + "'> </span>" +
				this.name +
			"</p></div>" +
			"<div class='gaugeinner'>" +
				"<div class='gaugetick'><img src='/uts/hydro/images/tick.png' alt='T' /></div>" +
				"<div class='gaugekeystone'><img src='/uts/hydro/images/keystone.png' alt='k' /></div>" +
				"<div class='gaugegrad gaugegradmin'><img src='/uts/hydro/images/gradh.png' alt='k' /></div>" +
				"<div class='gaugegrad gaugegradne'><img src='/uts/hydro/images/gradne.png' alt='k' /></div>" +
				"<div class='gaugegrad gaugegradmid'><img src='/uts/hydro/images/gradv.png' alt='k' /></div>" +
				"<div class='gaugegrad gaugegradnw'><img src='/uts/hydro/images/gradnw.png' alt='k' /></div>" +
				"<div class='gaugegrad gaugegradmax'><img src='/uts/hydro/images/gradh.png' alt='k' /></div>" +
				"<div class='gaugegradlabel gaugegradlabelmin'>" + this.minVal + "</div>" +
				"<div class='gaugegradlabel gaugegradlabelmid'>" + round((this.maxVal - this.minVal) / 2, 2) + "</div>" +
				"<div class='gaugegradlabel gaugegradlabelmax'>" + this.maxVal + "</div>" +
				"<div class='gaugevalouter'>" +
					"<span class='gaugeval'>" + s + "</span> " + this.units +
				"</div>" +
			"</div>" + 
		"</div>"
	);
	
	this.id = "#" + this.id;	
	this.tick = $(this.id + " .gaugetick");
	this.tickVal = $(this.id + " .gaugeval");
	this.dr = this.cr = this.getValue() / (this.maxVal - this.minVal) * 180 - 90;
	this.rotate(this.dr);
	
	this.jqEle = $(this.id);
	
	if ((s = $("#gaugecontainer .gauge").length) > 3)
	{
		this.canvas.css("height", 550 + (s - 3) * 160);
		resizeFooter();	
	}
	
	this.postInit();
};
GaugeWidget.prototype.repaint = function() {
	if (this.currentVal != this.getValue())
	{
		/* Gauge display. */
		this.currentVal = this.getValue();
		this.dr = this.currentVal / (this.maxVal - this.minVal) * 180 - 90;
		if (!this.isAnime)
		{
			this.isAnime = true;
			this.animate();
		}
	}
};
GaugeWidget.prototype.destroy = function() {
	if (this.st) clearTimeout(this.st);
	
	$(this.id).remove();
	var w, gc = $("#gaugecontainer");
	if ((w = parseInt(gc.css("width"))) == this.WIDTH)
	{
		gc.remove();
		gac = 0;
	}
	else 
	{
		gc.css("width", w - this.WIDTH);
		gac--;
	}
	
	if ((s = $("#gaugecontainer .gauge").length) <= 3)
	{
		this.canvas.css("height", 550);
		resizeFooter();
	}
};
GaugeWidget.prototype.animate = function() {
	if (this.dr == this.cr)
	{
		this.isAnime = false;
		return;
	}
	else if (this.dr > this.cr)
	{
		if (this.dr - this.cr > this.STEP_SIZE)
		{
			this.cr += this.STEP_SIZE;
			var thiz = this;
			this.st = setTimeout(function(){
				thiz.animate();
			}, this.ANIME_PERIOD);
		}
		else
		{
			this.isAnime = false;
			this.cr = this.dr; 
		}
	}
	else
	{
		if (this.cr - this.dr > this.STEP_SIZE)
		{
			this.cr -= this.STEP_SIZE;
			var thiz = this;
			this.st = setTimeout(function(){
				thiz.animate();
			}, this.ANIME_PERIOD);
		}
		else
		{
			this.isAnime = false;
			this.cr = this.dr; 
		}
	}
	
	/* Work backwords to find the interpolated value. */
	var s = '' + round((this.cr + 90) / 180 * (this.maxVal - this.minVal), 2);
	if (s.indexOf('.') == -1) s += '.00';
	else while (s.length - s.indexOf('.') < 3) s += '0';
	
	this.tickVal.html(s);
	this.rotate(this.cr);
};
GaugeWidget.prototype.rotate = function(deg) {
	switch (this.browser)
	{
	case "moz":
		this.tick.css("-moz-transform", "rotate(" + deg + "deg)");
		break;
	case "webkit":
		this.tick.css("-webkit-transform", "rotate(" + deg + "deg)");
		break;
	case "opera":
		this.tick.css("-o-transform", "rotate(" + deg + "deg)");
		break;
	case "msie9":
		this.tick[0].style.msTransform = "rotate(" + deg + "deg)";
		break;
	case "msie":
		var rad = deg * Math.PI / 180,
			a = parseFloat(parseFloat(Math.cos(rad)).toFixed(8)),
			b = parseFloat(parseFloat(Math.sin(rad)).toFixed(8)),
			c = -b, 
			d = a;
		
		this.tick.css("filter", "progid:DXImageTransform.Microsoft.Matrix(" +
						"M11=" + a + ", M12=" + c + ", " +
						"M21=" + b + ", M22=" + d + ", " +
						"SizingMethod='auto expand'" +
					   ")");
		
		var i, j,
		    m = [
		         [a, c, 0],
		         [b, d, 0],
		         [0, 0, 1]
		    ],
			to = [
			     [4],
			     [60],
			     [1]
			], tc = [],
			fo = [
			     [0],
			     [0],
			     [1]
			], fc = [];
		
		for (i in m)
		{
			var tp = 0, fp = 0;
			for (j in m[i])
			{
				tp += m[i][j] * to[j];
				fp += m[i][j] * fo[j];
			}
			tc.push(tp);
			fc.push(fp);
		}
		
		if (0 <= deg && deg < 90)
		{
			this.tick.css({
				left: (70 - 60 * b + (fc[0] - fo[0][0] - (tc[0] - to[0]))) + 'px', 
				top: (45 + fc[1] - fo[1][0] - (tc[1] - to[1][0])) + 'px'
			});
		}
		else if (90 <= deg && deg < 180)
		{
			this.tick.css({
				left: (70 - 60 * b + (fc[0] - fo[0][0] - (tc[0] - to[0]))) + 'px', 
				top: (45 + 65 * a + fc[1] - fo[1][0] - (tc[1] - to[1][0])) + 'px'
			});
		}
		else if (180 <= deg && deg < 270)
		{
			this.tick.css({
				left: (70 + (fc[0] - fo[0][0] - (tc[0] - to[0]))) + 'px', 
				top: (45 + 65 * a + fc[1] - fo[1][0] - (tc[1] - to[1][0])) + 'px'
			});
		}
		else
		{
			this.tick.css({
				left: (70 + (fc[0] - fo[0][0] - (tc[0] - to[0]))) + 'px', 
				top: (45 + fc[1] - fo[1][0] - (tc[1] - to[1][0])) + 'px'
			});
		}

		break;
	default:
		this.tick.css("transform", "rotate(" + deg + "deg)");
		break;
	}
};

/* == Power gauge. ============================================================ */
function PowerGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Power";
	this.icon = "hydroiconpower";
	this.units = 'W';
	
	this.minVal = 0;
	this.maxVal = 5;
}
PowerGaugeWidget.prototype = new GaugeWidget;
PowerGaugeWidget.prototype.getValue = function() {
	return this.hydro.power;
};

/* == Current gauge. ========================================================== */
function CurrentGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Current";
	this.icon = "hydroiconcurrent";
	this.units = "A";
	
	this.minVal = 0;
	this.maxVal = 3;
}
CurrentGaugeWidget.prototype = new GaugeWidget;
CurrentGaugeWidget.prototype.getValue = function() {
	return this.hydro.current;
};

/* == Voltage gauge. ========================================================== */
function VoltageGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Voltage";
	this.icon = "hydroiconvoltage";
	this.units = "V";

	this.minVal = 0;
	this.maxVal = 5;
}
VoltageGaugeWidget.prototype = new GaugeWidget;
VoltageGaugeWidget.prototype.getValue = function() {
	return this.hydro.voltage;
};

/* == Flow rate gauge. ======================================================== */
function FlowGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Flow Rate";
	this.icon = "hydroiconflow";
	this.units = "L/min";
	
	this.minVal = 0;
	this.maxVal = 50;
}
FlowGaugeWidget.prototype = new GaugeWidget;
FlowGaugeWidget.prototype.getValue = function() {
	return this.hydro.flowrate;
};

/* == Torque gauge. =========================================================== */
function TorqueGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Torque";
	this.icon = "hydroicontorque";
	this.units = "N-m (?)";
	
	this.minVal = 0;
	this.maxVal = 5;
	
}
TorqueGaugeWidget.prototype = new GaugeWidget;
TorqueGaugeWidget.prototype.getValue = function() {
	return this.hydro.torque;
};

/* == Pressure gauge. ========================================================= */
function PressureGaugeWidget(hydroinst)
{
	GaugeWidget.call(this, hydroinst);
	
	this.name = "Pressure";
	this.icon = "hydroiconpressure";
	this.units = "kPa";
	
	this.minVal = 0;
	this.maxVal = 40;
}
PressureGaugeWidget.prototype = new GaugeWidget;
PressureGaugeWidget.prototype.getValue = function() {
	return this.hydro.pressure;
};

/* == Meter. ================================================================== */
function MeterWidget(hydroinst)
{
	HydroWidget.call(this, hydroinst);
	
	this.HEIGHT = 300;
	this.STEP_SIZE = 5;
	this.ANIME_PERIOD = 33;

	this.val = 0;
	this.cval = 0;
	this.dval = 0;
	
	this.isAnime = false;
}
MeterWidget.prototype = new HydroWidget;
MeterWidget.prototype.init = function() {
	this.val = this.getValue();
	this.dval = this.cval = this.val / (this.maxVal - this.minVal) * this.HEIGHT;
	
	var html = "<div id='" + this.id + "' class='meter hydropanel ui-corner-all'>" +
					"<div class='hydropaneltitle'><p>" +
					"	<span class='hydroicon " + this.icon + "'></span>" +
						this.name +
					"</p></div>" +
					"<div class='meterinner'>" +
						"<div class='metercol' style='height:" + this.HEIGHT + "px'>" +
							"<div class='metershe'></div>" +
							"<div class='meterind'>" +
								"<img src='/uts/hydro/images/marrow.png' alt='a' />" +
							"</div>" +
						"</div>" +
						"<div class='meterleg'>";
	
	for (i = 0; i <= 10; i++)
	{
		html += 
			'<div class="metertick">' +
				((this.maxVal - this.minVal) - i * (this.maxVal - this.minVal) / 10) +
				'<span class="ui-icon ui-icon-arrowthick-1-w"> </span>' +
			'</div>';
	}

	html +=		"</div>" + // meterleg
				"<div class='metervalouter' style='top:" + (this.HEIGHT + 20) + "px'>" +
					"<span class='meterval'>" + this.val + "</span> " + this.units + 
				"</div>" +
			"</div>" +
		"</div>";
	
	this.canvas.append(html);
	
	this.id = "#" + this.id;
	this.jqEle = $(this.id);
	this.ind = $(this.id + " .meterind");
	this.she = $(this.id + " .metershe");
	this.metv = $(this.id + " .meterval");
	this.move(this.dval);
	
	this.postInit();
};
MeterWidget.prototype.repaint = function() {
	if (this.val != this.getValue())
	{
		this.val = this.getValue();
		this.dval = this.val / (this.maxVal - this.minVal) * this.HEIGHT;
		if (!this.isAnime)
		{
			this.isAnime = true;
			this.animate();
		}
	}
};
MeterWidget.prototype.destroy = function() {
	$(this.id).remove();
};
MeterWidget.prototype.animate = function() {
	if (this.dval == this.cval)
	{
		this.isAnime = false;
		return;
	}
	else if (this.dval > this.cval)
	{
		if (this.dval - this.cval > this.STEP_SIZE)
		{
			this.cval += this.STEP_SIZE;
			var thiz = this;
			this.st = setTimeout(function(){
				thiz.animate();
			}, this.ANIME_PERIOD);
		}
		else
		{
			this.isAnime = false;
			this.cval = this.dval;
		}
	}
	else
	{
		if (this.cval - this.dval > this.STEP_SIZE)
		{
			this.cval -= this.STEP_SIZE;
			var thiz = this;
			this.st = setTimeout(function(){
				thiz.animate();
			}, this.ANIME_PERIOD);
		}
		else
		{
			this.isAnime = false;
			this.cval = this.dval;
		}
	}
	
	this.move(this.cval);
};
MeterWidget.prototype.move = function(val) {
	this.ind.css("bottom", val - 19);
	this.she.css("height", val);
	
	/* Interpolate val back. */
	var ival = Math.floor(val / this.HEIGHT * (this.maxVal - this.minVal));
	this.metv.empty().append(ival);
};

/* == RPM Meter. ============================================================== */
function RpmMeterWidget(hydroinst)
{
	MeterWidget.call(this, hydroinst);
	
	this.minVal = 0;
	this.maxVal = 1100;
	
	this.id = 'rpmmeter';
	this.name = "RPM";
	this.icon = "hydroicontacho";
	this.units = 'r/min';
}
RpmMeterWidget.prototype = new MeterWidget;
RpmMeterWidget.prototype.getValue = function() {
	return this.hydro.rpm;
};

/* ============================================================================
 * == Utility functions.                                                     ==
 * ============================================================================  */
function setHydroCookie(key, value)
{
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 365);
	var cookie = 'Hydro_' + key + '=' + value + ';path=/;expires=' + expiry.toUTCString();

	document.cookie = cookie;
}

function getHydroCookie(key)
{
	var cookies = document.cookie.split('; ');
	var fqKey = 'Hydro_' + key;
	for (i in cookies)
	{
		var c = cookies[i].split('=', 2);
		if (c[0] == fqKey)
		{
			return c[1];
		}
	}
	return "";

}

function round(num, pts)
{
	return Math.round(num * Math.pow(10, pts)) / Math.pow(10, pts);
}
