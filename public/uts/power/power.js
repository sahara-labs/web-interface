/**
 * Power Systems Lab interface.
 */

function PowerLab(id)
{
	this.$canvas = $("#" + id);
	this.$spinner = $("#backing-working");
	
	this.mode = undefined;	
	this.widgets = [];
	
	this.data = {};
	this.working = undefined;
}

PowerLab.prototype.init = function() {
	/* We won't display anything until we know what mode is running. */
	var m = new ModeLoading(this);
	m.init();
	
	this.widgets.push(m);
	
	/* Start data retrieval. */
	this.requestData();
};

PowerLab.prototype.setMode = function(mode) {
	var o;
	
	/* Clear up previous mode. */
	this.$canvas.removeClass("lab0 lab1 lab2");
	while (o = this.widgets.pop()) o.destroy();
	
	/* Setup the elements in the new mode. */
	switch (this.mode = parseInt(mode))
	{
	case 0: // Lab selection
		this.setTitle("Power System Lab");
		this.widgets.push(new SwitchMode(this));
		break;
	
	case 1: // Lab 1 mode
		this.setTitle("Isolated Single Generator Operation");
		this.widgets.push(new BackButton(this));
		
		/* --- Controls --------------------------------------------------------------------------------------- */
		/* Generator on / off. */
		o = new Button(this, "g-on", "G", "circ-button");
		o.clicked = function() {
			if (this.isOn)
			{
				/* Turning generator off. */
				if (this.control.data["gcb-on"] == "true")
				{
					/* INTERLOCK: Stopping generator with loads busbar closed (GCB on). */
					this.addMessage("Open load busbar before stopping generator.", "error", 420, 160, "top-center");
					return;
				}
			}
			else
			{
				/* Turning generator on. */
				var t = parseInt(this.control.data["trans-line"]);
				if (!(t == 1 || t == 2))
				{
					/* INTERLOCK: Transmission mode must be set before turning on generator. */
					this.addMessage("Choose one of the transmission models before starting generator.", "error",
							100, 65, "right");
					return;
				}
				
				if (this.control.data["gcb-on"] == "true")
				{
					/* INTERLOCK: Starting generator with loads busbar open (GCB on). 
					 * NOTE: the interface sequencing should prohibt this ever occurring. */
					this.addMessage("Open load busbar before starting generator.", "error", 420, 160, "top-center");
					return;
				}
			}
			
			this.control.setWorking(true);
			this.setOn(!this.isOn);
			this.isChanging = true;
			
			var thiz = this;
			this.control.post("setGen", { on: this.isOn }, function(err) {
				/* Server side validation failed. */
				thiz.isChanging = false;
				thiz.setOn(!thiz.isOn);
				thiz.addMessage(err, "error", 9, 150, "top-left");
				thiz.control.setWorking(false);
			});
		};
		this.widgets.push(o);
		
		/* CB1 indicator. */
		o = new Button(this, "cb1-on",    "CB1");
		o.clicked = function() {
			this.addMessage("This is only an indicator. It will update automatically.", "info", 40, 140, "top-center");
		};
		this.widgets.push(o);
		
		/* GCB load bus. */
		o = new Button(this, "gcb-on", "GCB");
		o.clicked = function() {
			if (this.isOn)
			{
				/* Turning GCB off. */
				var interlockFailed = false;
				if (this.control.data["r-load"] == "true")
				{
					/* INTERLOCK: Inhibit deactivation of load busbar if loads are running. */
					this.addMessage("Turn off load before closing load busbar.", "error", 400, 75, "right");
					interlockFailed = true;
				}
				if (this.control.data["l-load"] == "true")
				{
					/* INTERLOCK: Inhibit deactivation of load busbar if loads are running. */
					this.addMessage("Turn off load before closing load busbar.", "error", 400, 135, "right");
					interlockFailed = true;
				}
				if (this.control.data["c-load"] == "true")
				{
					/* INTERLOCK: Inhibit deactivation of load busbar if loads are running. */
					this.addMessage("Turn off load before closing load busbar.", "error", 400, 195, "right");
					interlockFailed = true;
				}
				
				if (interlockFailed) return;
			}
			else 
			{
				/* Turning GCB on. */
				if (this.control.data["g-on"] == "false")
				{
					/* INTERLOCK: Inhibit activation of load busbar if generator off. */
					this.addMessage("Turn on generator before opening load busbar.", "error", 10, 150, "top-left");
					return;
				}
			}
			
			this.control.setWorking(true);
			this.setOn(!this.isOn);
			this.isChanging = true;
			
			var thiz = this;
			this.control.post("setGCB", { on: this.isOn }, function(err) {
				/* Server side validation failed. */
				thiz.isChanging = false;
				thiz.setOn(!thiz.isOn);
				thiz.addMessage(err, "error", 420, 162, "top-center");
				thiz.control.setWorking(false);
			});
		};
		this.widgets.push(o);
		
		/* Load buttons. */
		var r = new Button(this, "r-load", "R Load", "load-button"), 
			l = new Button(this, "l-load", "L Load", "load-button"),
			c = new Button(this, "c-load", "C Load", "load-button");
		r.clicked = l.clicked = c.clicked = function() {
			if (!this.isOn && this.control.data["gcb-on"] == "false")
			{
				/* INTERLOCK: Inhibit turning on of a load if the load bus bar is open. */
				this.addMessage("Close busbar before turning on a load.", "error", 420, 160, "top-center");
				return;
			}
			
			this.control.setWorking(true);
			this.setOn(!this.isOn);
			this.isChanging = true;
			
			var thiz = this;
			this.control.post("setLoad", { load: this.id, on: this.isOn }, function(err) {
				thiz.isChanging = false;
				thiz.setOn(!thiz.isOn);
				thiz.addMessage(err, "error", 400, thiz.id == "r-load" ? 75 : thiz.id == "l-load" ? 135 : 195, "right");
				thiz.control.setWorking(false);
			});
		};
		this.widgets.push(r);
		this.widgets.push(l);
		this.widgets.push(c);
		
		/* Transmission model button. */
		o = new ExclusiveButton(this, "trans-line", {
			1: "Trans. Model 1",
			2: "Trans. Model 2"
		});
		o.clicked = function(id) {
			var val = parseInt(id.substr(id.lastIndexOf('-') + 1));
			if (val == this.currentVal)                   // INTERLOCK: A transmission line must always be selected
				this.addMessage("Transmission line already on.", "info", 450, val == 1 ? 65 : 140, "left");
			else if (this.control.data["g-on"] == "true") // INTERLOCK: Inhibit activation of trans line which gen running
				this.addMessage("Turn generator off before changing tranmission lines.", "error", 10, 150, "top-left");
			else
			{
				this.control.setWorking(true);
				this.isChanging = true;
				this.setOn(val);
				
				var thiz = this;
				this.control.post("setTransModel", { model: val}, function(err) {
					/* Server side validation failed. */
					thiz.isChanging = false;
					thiz.setOn(val == 1 ? 2 : 1);
					thiz.addMessage(err, "error", 450, val == 1 ? 65 : 140, "left");
					thiz.control.setWorking(false);
				});
			}
		};
		this.widgets.push(o);
		
		/* Open loop button. */
		o = new Button(this, "closed-loop", "Closed Loop Control");
		o.clicked = function() {
			var setVolt = parseFloat(this.control.data["set-voltage"]);

			if (this.control.data["g-on"] == "true")
			{
				/* INTERLOCK: Inhibit switching to open loop if the generator is on. */
				this.addMessage("Turn generator off before turning closed loop control " + (this.isOn ? "off." : "on."), 
						"error", 10, 150, "top-left");
			}
			else if (setVolt < 210 && !this.isOn)
			{
				/* INTERLOCK: Minimum generator voltage is 210 volts in closed loop control. */
				this.addMessage("Increase generator to 210V before turning closed loop control on.", 
						"error", -88, 725, "left");
			}
			else if (setVolt > 250 && !this.isOn)
			{
				/* INTERLOCK: Maximum generator voltage is 250 volts in closed loop control. */
				this.addMessage("Decrease generator to 250V before turning closed loop control on.", 
						"error", -7, 725, "left");
			}
			else
			{	
				this.control.setWorking(true);
				this.isChanging = true;
				this.setOn(!this.isOn);
				
				var thiz = this;
				this.control.post("setClosedLoop", { on: this.isOn }, function(err) {
					/* Server side validation failed. */
					thiz.isChanging = false;
					thiz.setOn(!thiz.isOn);
					thiz.addMessage(err, "error", 375, 660, "left");
					thiz.control.setWorking(false);
				});
			}
		};
		this.widgets.push(o);
			
		/* --- Meters ---------------------------------------------------------------------------------------- */
		this.widgets.push(new LCD(this, "active-power",     "Active Power",   "W",   1, "teal-color"));
		this.widgets.push(new LCD(this, "apparent-power",   "Apparent Power", "VA",  1, "green-color"));
		this.widgets.push(new LCD(this, "ln-voltage",       "L - N Voltage",  "V",   1, "teal-color"));		
		this.widgets.push(new LCD(this, "reactive-power",   "Reactive Power", "Var", 1, "red-color"));
		this.widgets.push(new LCD(this, "active-factor",    "Active Factor",  "%",   2, "yellow-color"));
		this.widgets.push(new LCD(this, "line-frequency",   "Line Frequency", "Hz",  1, "red-color"));
		this.widgets.push(new LCD(this, "line-current",     "Line Current",   "A",   3, "yellow-color"));
		this.widgets.push(new LCD(this, "active-power-3",   "Active Power",   "W",   1, "teal-color"));
		this.widgets.push(new LCD(this, "apparent-power-3", "Apparent Power", "VA",  1, "green-color"));
		this.widgets.push(new LCD(this, "ln-voltage-3",     "L - N Voltage",  "V",   1, "teal-color"));
		this.widgets.push(new LCD(this, "reactive-power-3", "Reactive Power", "Var", 2, "red-color"));
		this.widgets.push(new LCD(this, "active-factor-3",  "Active Factor",  "%",   3, "yellow-color"));
		this.widgets.push(new LCD(this, "line-current-3",   "Line Current",   "A",   3, "red-color"));
		
		/* Set voltage indicator and buttons. */
		o = new LCD(this, "set-voltage",      "Set Voltage",    "V",   1, "yellow-color");
		this.widgets.push(o);
		o = new UpDownButton(this, "set-voltage-buttons", o, 0.1);
		o.checkRange = function(val) {
			if       (val < 200 || (this.control.data["closed-loop"] == "true" && val < 210)) return -1; // INTERLOCK: Value too small
			else if (val > 270 || (this.control.data["closed-loop"] == "true" && val > 250)) return 1;   // INTERLOCK: Value too large     
			else return 0; // Value in range
		};
		this.widgets.push(o);

		/* Set frequency indicator and buttons. */
		o = new LCD(this, "set-frequency",    "Set Frequency",  "Hz",  1, "teal-color");
		this.widgets.push(o);
		o = new UpDownButton(this, "set-frequency-buttons", o, 0.1);
		o.checkRange = function(val) {
			if (val < 45) return -1;      // INTERLOCK: Value too small
			else if (val > 55) return 1; // INTERLOCK: Value too large
			else return 0;               // Value in range
		};
		this.widgets.push(o);
		
		/* Default settings button. */
		o = new Button(this, "default-settings", "Default Settings");
		o.setOn = function(on) { };
		o.clicked = function() {
			var thiz = this, i = 0;
			
			/* Updated the displayed values. */
			this.control.data["set-voltage"] = "240";
			this.control.data["set-frequency"] = "50";
			for (i in this.control.widgets)
			{
				if (this.control.widgets[i].id == 'set-voltage' || this.control.widgets[i].id == "set-frequency") 
					this.control.widgets[i].update(this.control.data);
			}
			
			/* Tell server to update. */
			this.control.post("defaultSettings", null, function(err) {
				thiz.addMessage(err, "error", 105, 830, "left");
			});
		};
		this.widgets.push(o);
		
		/* --- Miscellaneous things on the page. */
		this.widgets.push(new Graphics(this));
		this.widgets.push(new Camera(this));
		break;
		
	case 2:
		this.setTitle("Generator / Mains Parallel Operation");
		this.widgets.push(new BackButton(this));
		
		/* --- Controls ------------------------------------------------------- */
		/* Generator. */
		o = new Button(this, "g-on", "G", "circ-button");
		this.widgets.push(o);
		
		/* CB1 indicator. */
		o = new Button(this, "cb1-on",    "CB1");
		o.clicked = function() {
			this.addMessage("This is only an indicator. It will update automatically.", "info", -130, 275, "top-center");
		};
		this.widgets.push(o);
		
		/* MCB relay. */
		o = new Button(this, "mcb-on", "MCB");
		this.widgets.push(o);http://slashdot.org/
		
		/* GCB relay. */
		o = new Button(this, "gcb-on", "GCB");
		this.widgets.push(o);
		
		/* Transmission line 1. */
		o = new Button(this, "trans-line-1", "Trans Line 1");
		this.widgets.push(o);
		
		/* Load button. */
		o = new Button(this, "load-on", "Load 74.23+j104");
		this.widgets.push(o);
		
		/* --- Meters. -------------------------------------------------------- */
		this.widgets.push(new LCD(this, "q-var",     "Q (VAR)", null, 0, "amber-color"));
		this.widgets.push(new LCD(this, "power-wat", "P (W)",   null, 0, "amber-color"));
		
		/* Power Meter 1. */
		this.widgets.push(new LCD(this, "line-current",   "L1 Current",     "A",   3, "yellow-color"));
		this.widgets.push(new LCD(this, "apparent-power", "Apparent Power", "VA",  0, "yellow-color"));
		this.widgets.push(new LCD(this, "reactive-power", "Reactive Power", "Var", 0, "yellow-color"));
		this.widgets.push(new LCD(this, "active-factor",  "Active Factor",  "%",   2, "yellow-color"));
		this.widgets.push(new LCD(this, "active-power",   "Active Power",   "KW",  2, "yellow-color"));
		
		/* Power Meter 3. */
		this.widgets.push(new MultiLCD(this, "gcb-line-frequency", "Frequency (Hz)",    { 'freq-ml': 'ML', 'freq-g1': 'G1' }, 1, "teal-color"));
		this.widgets.push(new MultiLCD(this, "gcb-ln-voltage",     "L - N Voltage (V)", { 'volt-ml': 'ML', 'volt-g1': 'G1' }, 1, "teal-color"));
		
		/* Power Meter 2. */
		this.widgets.push(new LCD(this, "active-power-2",   "Active Power",   "W",   0, "red-color"));
		this.widgets.push(new LCD(this, "reactive-power-2", "Reactive Power", "Var", 0, "red-color"));
		this.widgets.push(new LCD(this, "apparent-power-2", "Apparent Power", "VA",  0, "red-color"));
		this.widgets.push(new LCD(this, "active-factor-2",  "Active Factor",  "%",   2, "red-color"));
		this.widgets.push(new LCD(this, "ln-voltage-2",     "L - N Voltage",  "V",   1, "red-color"));
		this.widgets.push(new LCD(this, "line-current-2",   "Line Current",   "A",   2, "red-color"));
		
		/* Set power factor indicator and buttons. */
		o = new LCD(this, "pow-factor",     "PF:0.80-0.995",  "%",   3, "yellow-color");
		this.widgets.push(o);
		o = new UpDownButton(this, "pow-factor-buttons", o, 0.1);
		o.checkRange = function(val) {
			// TODO Check power factor allowed range.
			return 0;
		};
		this.widgets.push(o);
		
		/* Set kilowatt indicator and buttons. */
		o = new LCD(this, "kilo-watt",      "KW: 0.8-1.7",    "KW",  2, "yellow-color");
		this.widgets.push(o);
		o = new UpDownButton(this, "kilo-watt-buttons", o, 0.1);
		o.checkRange = function(val) {
			// TODO Check kilo watt allowed range.
			return 0;
		};
		this.widgets.push(o);
		
		/* Default settings button. */
		o = new Button(this, "default-settings-2", "Default Settings");
		o.setOn = function(on) { };
		this.widgets.push(o);
		
		/* --- Miscellanous elements. ----------------------------------------- */
		this.widgets.push(new Graphics(this));
		this.widgets.push(new Camera(this));
		break;
		
	default:
		throw "Unknown power lab mode " + mode;
		break;
	}
	
	/* Tell each widget to render. */
	this.$canvas.addClass("lab" + this.mode);
	for (o in this.widgets) this.widgets[o].init();
	
	this.setWorking(false);
};

PowerLab.prototype.post = function(action, data, errCallback, finCallback) {
	$.post(
			"/primitive/json/pc/PowerController/pa/" + action,
			data,
			function(resp) { 
				if (errCallback && typeof resp == "string" && resp.indexOf("FAILED") == 0) errCallback(resp.substr(7));
				if (finCallback) finCallback();
			}
	);
};

PowerLab.prototype.setWorking = function(working) {
	/* No need to set the same state we are already in. */
	if (this.working == working) return;
	
	var i = 0;
	
	if (this.working = working)
	{
		this.$spinner.show();
	}
	else
	{
		this.$spinner.hide();
	}
	
	for (i in this.widgets) this.widgets[i].enable(!working);
};

PowerLab.prototype.requestData = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/json/pc/PowerController/pa/data",
		cache: false,
		success: function(packet) {
			if (typeof packet!= "object") 
			{
				/* User is probably logged out. */
				window.location.reload();
				return;
			}
			
			var data = {}, i = 0;
			
			/* Key the variables into a hash table. */
			for (i in packet) data[packet[i].name] = packet[i].value;
			
			/* If the mode is not the displayed mode, switch it. */
			if (data['lab'] != thiz.mode) thiz.setMode(data['lab']);

			/* Provide data to each of the versions. */
			thiz.data = data;
			for (i in thiz.widgets) thiz.widgets[i].update(data);
			
			setTimeout(function() { thiz.requestData(); }, 3000);
		},
		error: function() {
			setTimeout(function() { thiz.requestData(); }, 10000);
		}
	});
};

PowerLab.prototype.isWorking = function() {
	return this.working;
};

PowerLab.prototype.setTitle = function(title) {
	this.$canvas.find("backing-title").empty().append(title);
};

/** --------------------------------------------------------------------------- 
 *  -- Base widget                                                           -- 
 *  --------------------------------------------------------------------------- */
function Widget(control) 
{
	this.id = null;
	this.title = null;
	this.$w = null;

	this.control = control;
}

/**
 * Adds the widget to the page.
 */
Widget.prototype.init = function() {
	throw "Widget init not defined.";
};

/**
 * Receives data from the server. 
 *
 * @param data data object
 */
Widget.prototype.update = function(data) { };

/**
 * Enables / Disables the widget.
 * 
 * @param enable whether the widget should be enabled or disabled
 */
Widget.prototype.enable = function(enable) { };

/**
 * Removes the widget from the page.
 */
Widget.prototype.destroy = function() {
	if (this.$w) this.$w.remove();
};

/**
 * Adds a message to the page.
 * 
 * @param message the message to display
 * @param type the message type, 'error', 'info'
 * @param left left absolute coordinate
 * @param top top absolute coordinate
 * @param pos the arrow position, 'left', 'right', 'top', 'bottom'
 */
Widget.prototype.addMessage = function(message, type, left, top, pos) {
	var $box, i, aniIn, bs = 1, up = true, html = 
		"<div class='message-box message-box-" + type + " message-box-in1' style='left:" + left + "px; top:" + top + "px'>" +
			"<div class='message-box-text'>" + message + "</div>" +
			"<div class='message-box-arrow message-box-arrow-" + pos + "'>";
	
	for (i = 0; i < 8; i++)
	{
		html += "<div class='message-box-arrow-line message-box-arrow-line" + i + "'></div>";
	}
	
	html += "</div>" +
		"</div>";
	
	$box = this.$w.after(html).next();
		
	/* Throb box shadow around message box. */
	aniIn = setInterval(function() {
		if (bs == 0 || bs == 12) up = !up;
		$box.css("box-shadow", "0 0 " + (up ? bs++ : bs--) + "px #EEEEEE");
	}, 120);
	
	/* Remove box on click. */
	$box.click(function() {
		clearInterval(aniIn);
		$box.remove();
	});
};

/** 
 * Remove all messages from the page.
 */
Widget.prototype.removeMessages = function() {
	this.control.$canvas.find(".message-box").remove();
};

/** ---------------------------------------------------------------------------
 *  -- Widget for loading between modes.                                     --
 *  --------------------------------------------------------------------------- */
function ModeLoading(control) 
{
	Widget.call(this, control);
}

ModeLoading.prototype = new Widget;

ModeLoading.prototype.init = function() {
	this.control.$canvas.append("<div id='mode-loading'.>Please wait...</div>");
	this.$w = $("#mode-loading");
};

/** ---------------------------------------------------------------------------
 *  -- Widget for switching modes                                            --
 *  --------------------------------------------------------------------------- */
function SwitchMode(control) 
{
	Widget.call(this, control);
}

SwitchMode.prototype = new Widget;

SwitchMode.prototype.init = function() {
	this.control.$canvas.append(
		"<ul id='lab-selection'>" +
			"<li id='lab-select-1' class='button green-color'>Lab 1: Isolated Single Generator Operation</li>" +
			"<li id='lab-select-2' class='button green-color'>Lab 2: Generator / Mains Parallel Operation</li>" +
		"</ul>"
	);
	
	this.$w = $("#lab-selection");
	
	var thiz = this;
	this.$w.children("li").click(function() { thiz.clicked(this); });
};

SwitchMode.prototype.clicked = function(n) {
	/* Stop duplicate button clicks when an operation is running. */
	if (this.control.isWorking()) return;
	this.control.setWorking(true);
	
	/* Give the appearance of not being able to be clicked. */
	$(n).toggleClass("green-color red-color");
	
	this.control.post("setLab", { 
		'new-mode': $(n).attr('id') == 'lab-select-1' ? 1 : 2
	});
};

SwitchMode.prototype.enable = function(enable) {
	if (enable)
	{
		this.$w.children("li").removeClass("button-disabled");
	}
	else
	{
		this.$w.children("li").addClass("button-disabled");
	}
	
};

/** ---------------------------------------------------------------------------
 *  -- LCD Widget                                                            --
 *  --------------------------------------------------------------------------- */
function LCD(control, id, title, units, scale, cclass) 
{
	Widget.call(this, control);
	
	this.id = id;
	this.title = title;
	this.units = units;
	this.scale = scale;
	this.cclass = cclass;
	this.maskServer = false;
	
	this.value = undefined;
	this.digits = [ undefined, undefined, undefined, undefined ];
}

LCD.prototype = new Widget;

LCD.prototype.init = function() {
	this.control.$canvas.append(
		"<div id='" + this.id + "' class='lcd-box'>" +
			"<div class='lcd-title " + this.cclass + "'>" + this.title + "</div>" +
			"<div class='lcd-value'>" +
				this.getLCDHtml() + 
			"</div>" +
			(this.units ? "<div class='lcd-unit'>" + this.units + "</div>" : '') +
		"</div>"
	);

	this.$w = $("#" + this.id);
	this.setValue(0);
};

LCD.prototype.getLCDHtml = function() {
	return (
	  		"<div class='ssd-digit ssd-digit-5'>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-1'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-2'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-3'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-4'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-5'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-6'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-7'></div>" +
			"</div>" +
			(this.scale == 4 ? "<div class='ssd-dot'></div>" : '') + 
			"<div class='ssd-digit ssd-digit-4'>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-1'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-2'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-3'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-4'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-5'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-6'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-7'></div>" +
			"</div>" +
			(this.scale == 3 ? "<div class='ssd-dot'></div>" : '') +
			"<div class='ssd-digit ssd-digit-3'>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-1'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-2'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-3'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-4'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-5'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-6'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-7'></div>" +
			"</div>" +
			(this.scale == 2 ? "<div class='ssd-dot'></div>" : '') +
			"<div class='ssd-digit ssd-digit-2'>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-1'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-2'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-3'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-4'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-5'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-6'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-7'></div>" +
			"</div>" +
			(this.scale == 1 ? "<div class='ssd-dot'></div>" : '') +
			"<div class='ssd-digit ssd-digit-1'>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-1'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-2'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-3'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-4'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-5'></div>" +
				"<div class='ssd-seg ssd-vert-seg ssd-seg-6'></div>" +
				"<div class='ssd-seg ssd-horz-seg ssd-seg-7'></div>" +
			"</div>" +
			(this.scale == 0 ? "<div class='ssd-dot'></div>" : '')
	);
};

LCD.prototype.update = function(data) {
	if (data[this.id] != undefined && !this.maskServer)
	{
		this.setValue(parseFloat(data[this.id]));
	}
};

LCD.prototype.setValue = function(num) {
	/* We don't need to change the value to an identical value. */
	if (num == this.value) return;
	this.value = num;
	
	var i, clearDigit = 6, isNegative = false;
	num = Math.floor(num * Math.pow(10, this.scale));
	
	/* Handle negative values. */
	if (num < 0)
	{
		isNegative = true;
		num = Math.abs(num);
	}
	
	for (i = 1; i <= 5; i++)
	{
		if (i - 1 > this.scale && num == 0)
		{
			/* Clear the SSD. */
			this.setDigit(i, 10);
			
			/* We want to store the first clear digit in case we have to add
			 * a negative value symbol. */
			if (i < clearDigit) clearDigit = i;
		}
		else
		{
			this.setDigit(i, num > 0 ? num % 10 : 0);
		}
		
		num = Math.floor(num / 10);
	}
	
	if (isNegative)
	{
		if (clearDigit < 6)
		{
			/* Negative symbol fits. */
			this.setDigit(clearDigit, -1);
		}
		else if (this.scale > 0)
		{
			/* The negative symbol does not fit, so we will reduce the 
			 * scale to make the number fit. */
			this.$w.find(".ssd-dot").remove();
			this.$w.find(".ssd-digit-" + this.scale).after("<div class='ssd-dot'></div>");
			this.scale--;
			
			num = this.value;
			this.value = 0;			
			this.setValue(num);
		}
		else
		{
			/* Unable to fit negative symbol, error out. */
			// FIXME 
//			throw "Unable to add negative symbol of value of " + this.title + ", value: " + this.value + 
//					", scale: " + this.scale;
		}
	}
};

LCD.prototype.setDigit = function(digit, val) {
	if (this.digits[digit] == val) return;
		
	this.digits[digit] = val;
	var mask, i = 0, $n;
	
	switch (val)
	{
	case -1:
		mask = [false, false, false, false, false, false, true];
		break;
	case 0:
		mask = [true,  true,  true,  true,  true,  true,  false];
		break;
	case 1:
		mask = [false, true,  true,  false, false, false, false];
		break;
	case 2:
		mask = [true,  true,  false, true,  true,  false, true];
		break;
	case 3:
		mask = [true,  true,  true,  true,  false, false, true];
		break;
	case 4:
		mask = [false, true,  true,  false, false, true,  true];
		break;
	case 5:
		mask = [true,  false, true,  true,  false, true,  true];
		break;
	case 6:
		mask = [true, false, true,  true,  true,  true,  true];
		break;
	case 7: 
		mask = [true,  true,  true,  false, false, false, false];
		break;
	case 8:
		mask = [true,  true,  true,  true,  true,  true,  true];
		break;
	case 9:
		mask = [true,  true,  true,  false, false, true,  true];
		break;
	case 10:
		mask = [false, false, false, false, false, false, false];
		break;
	default:
		throw "Invalid SSD digit " + val;
	}
	
	for (i = 0; i < 7; i++)
	{
		$n = this.$w.find('.ssd-digit-' + digit + " .ssd-seg-" + (i + 1));
		if (mask[i])
		{
			if (!$n.hasClass("ssd-seg-on")) $n.addClass("ssd-seg-on");
		}
		else
		{
			$n.removeClass("ssd-seg-on");
		}
	}
};

/** ---------------------------------------------------------------------------
 *  -- Multi LCD Widget                                                      --
 *  --------------------------------------------------------------------------- */
function MultiLCD(control, id, title, fields, scale, cclass)
{
	LCD.call(this, control, id, title, null, scale, cclass);
	
	this.fields = fields;
	this.lcds = {};
}
MultiLCD.prototype = new LCD;

MultiLCD.prototype.init = function() {
	var f = 0, html = 
		"<div id='" + this.id + "' class='lcd-box multi-lcd-box'>" +
			"<div class='lcd-title " + this.cclass +  "'>" + this.title + "</div>";
	
	for (f in this.fields) 
	{
		html += "<div class='multi-lcd-label'>" + this.fields[f] + "</div>" +
				"<div id='" + f + "' class='lcd-value'>" +
					this.getLCDHtml() +
				"</div>";
	}
	
	html += 
		"</div>";
	
	this.control.$canvas.append(html);
	this.$w = $("#" + this.id);
	
	for (f in this.fields)
	{
		this.lcds[f] = new LCD(this.constructor, f, null, null, this.scale, null);
		this.lcds[f].$w = this.$w.find("#" + f);
		this.lcds[f].setValue(0);
	}
};

MultiLCD.prototype.update = function(data) {
	var f = 0;
	for (f in this.fields)
	{
		if (data[f] != undefined && !this.maskServer)
		{
			this.lcds[f].setValue(parseFloat(data[f]));
		}
	}
};

/** ---------------------------------------------------------------------------
 *  -- Button Widget                                                         --
 *  --------------------------------------------------------------------------- */
function Button(control, id, text, cclass) 
{
	Widget.call(this, control);
	
	this.id = id;
	this.text = text;
	this.isOn = undefined;
	this.isChanging = false;
	this.cclass = cclass ? cclass : '';
}

Button.prototype = new Widget;

Button.prototype.init = function() {
	this.control.$canvas.append(
		"<div id='" + this.id + "' class='button button-unknown-state " + this.cclass + "'>" +
			this.text + " &nbsp;&nbsp;&nbsp;" +
		"</div>" 
	);
	
	var thiz = this;
	this.$w = $("#" + this.id).click(function() {
		if (thiz.control.working) return;
		thiz.removeMessages();
		thiz.clicked();
	});
	
	this.setOn(false);
};

Button.prototype.clicked = function() { alert(this.id + " clicked"); };

Button.prototype.setOn = function(on) {
	if (this.isOn === on) return;
	
	if (this.isOn = on)
	{
		this.$w.removeClass("button-unknown-state button-off-state").addClass("button-on-state");
		this.$w.empty().append(this.text + " On&nbsp;");
	}
	else 
	{
		this.$w.removeClass("button-unknown-state button-on-state").addClass("button-off-state");
		this.$w.empty().append(this.text + " Off");
	}
};

Button.prototype.enable = function(enabled) {
	if (enabled)
	{
		this.$w.removeClass("button-disabled");
	}
	else
	{
		this.$w.addClass("button-disabled");
	}
};


Button.prototype.update = function(data) {
	if(data[this.id] == undefined) return;
	
	var on = data[this.id] == "true";
	if (this.isChanging && on != this.isOn) return; // Masking server update
	else if (this.isChanging)                       // Server acknowledged update
	{
		this.isChanging = false;
		this.control.setWorking(false);
	}
	else if (on != this.isOn) this.setOn(on);      // Server has correct status
};

/** ---------------------------------------------------------------------------
 *  -- Exclusive Button Widget                                               --
 *  --------------------------------------------------------------------------- */
function ExclusiveButton(control, id, buttons)
{
	Widget.call(this, control);
	
	this.id = id;
	this.buttons = buttons;
	
	this.currentVal = undefined;
	this.isChanging = false;
}

ExclusiveButton.prototype = new Widget;

ExclusiveButton.prototype.init = function() {
	var i = 0, thiz = this, html = 
		"<div id='" + this.id + "' class='exclusive-button'>";
	
	for (i in this.buttons) 
	{
		html += 
			"<div id='" + this.id + "-button-" + i + "' class='button button-unknown-state'>" +
				this.buttons[i] + " &nbsp;&nbsp;&nbsp;" +
			"</div>";
	}
	
	html += "</div>";
	
	this.control.$canvas.append(html);
	this.$w = $("#" + this.id);
	
	this.$w.children(".button").click(function() { 
		if (thiz.control.working) return;
		thiz.removeMessages(); 
		thiz.clicked($(this).attr("id")); 
	});
	
	this.setOn(0);
};

ExclusiveButton.prototype.clicked = function(id) { alert(id + " has been clicked."); };

ExclusiveButton.prototype.setOn = function(val) {
	if (this.currentVal === val) return;
	
	this.currentVal = val;
	var $ch = this.$w.children(".button").removeClass("button-unknown-state button-on-state button-off-state"),
		$n = $("#" + this.id + "-button-" + val),
		t;

	if ($n.length != 0)
	{
		$ch = $n.siblings();
		
		t = $n.text();
		$n.addClass("button-on-state")
		  .html(t.substr(0, t.length - 3) + "On&nbsp;");
	}
	
	$ch.each(function() {
		t = $(this).text();
		$(this).addClass("button-off-state")
			   .text(t.substr(0, t.length - 3) + "Off");
	});
};

ExclusiveButton.prototype.enable = function (enable) {
	if (enable)
	{
		this.$w.children(".button").removeClass("button-disabled");
	}
	else
	{
		this.$w.children(".button").addClass("button-disabled");
	}
};

ExclusiveButton.prototype.update = function(data) {
	if (typeof data[this.id] == "undefined") return; // Server is not provided data for this variable.
	
	var val = parseInt(data[this.id]);
	
	if (this.isChanging && val != this.currentVal) return; // Masking page state whist waiting for server state change
	else if (this.isChanging)                              // Server acknowledged change
	{
		this.isChanging = false;  
		this.control.setWorking(false);
	}
	else if (val != this.currentVal) this.setOn(val);      // Matching server state
};

/** ---------------------------------------------------------------------------
 *  -- Up / Down Buttons                                                     --
 *  --------------------------------------------------------------------------- */
function UpDownButton(control, id, lcd, delta)
{
	Widget.call(this, control);
	
	this.id = id;
	this.lcd = lcd;
	this.delta = delta;
	
	/* Change variables. */
	this.startVal = undefined;
	this.isChanging = false;
	this.numChanged = 0;
	this.increasing = false;
}
UpDownButton.prototype = new Widget;

UpDownButton.prototype.init = function() {
	this.control.$canvas.append(
		"<div id='" + this.id + "' class='up-down-buttons'>" +
			"<div class='up-button button'>+</div>" +
			"<div class='down-button button'>-</div>" +
		"</div>" 
	);
	
	this.$w = $("#" + this.id);
	
	var thiz = this;
	this.$w.children(".button").mousedown(function() {
		/* Page working. */
		if (thiz.control.working) return;
		
		thiz.removeMessages();
		
		thiz.isChanging = true;
		thiz.numChanged = 0;
		thiz.startVal = thiz.lcd.value;
		thiz.increasing = $(this).hasClass("up-button");
		thiz.lcd.maskServer = true;
		thiz.changeVal();
	});
	
	this.$w.children(".button").bind("mouseup mouseout", function() {
		thiz.isChanging = false;	
	});
};

UpDownButton.prototype.changeVal = function() {
	var newVal, thiz = this;
	if (!this.isChanging)
	{
		/* Update server with value. */
		this.control.post("setValue", 
				{ type: this.lcd.id, val: this.lcd.value }, 
				function (err) {
					thiz.addMessage(err, "error", thiz.$w.position().left - 15, thiz.$w.position().top + 55, "top-center");
				}, 
				function() {
					/* Button released, server update, server values should be consistent. */
					thiz.lcd.maskServer = false;
				}
		);
		return;
	}
	
	/* The nwe val is calculated with a scaling so the reate of change increases
	 * the longer the button is pressed. */
	newVal = this.lcd.value + 0.1 * (this.increasing ? 1 : -1) * (100 + this.numChanged * 2) / 100;
	
	/* We want to round the value to the closet decimal value. */
	newVal = Math.round(newVal * Math.pow(10, this.lcd.scale)) / Math.pow(10, this.lcd.scale);
	
	if (this.checkRange(newVal) != 0)
	{
		/* The max / min values should be round values. */
		newVal = Math.round(newVal);
		this.lcd.setValue(newVal);
		
		/* If the value is out of range, a message is provided to the user and 
		 * the last acceptable value is provided to the server. */
		if (this.increasing) this.addMessage(this.lcd.value + " is the maximum allowed value.", "error", 
				this.$w.position().left + 70, this.$w.position().top + 10, "left"); 
		else				  this.addMessage(this.lcd.value + " is the minimum allowed value.", "error", 
				this.$w.position().left + 150, this.$w.position().top + 10, "left");
		
		/* Trigger server send of values. */
		this.isChanging = false;
		
		/* If we were already at the limit, we don't need to send the balue again. */ 
		if (this.startVal != newVal) this.changeVal();
	}
	else
	{
		/* Value OK, keep ticking new values. */
		this.lcd.setValue(newVal);
		this.numChanged++;
		
		setTimeout(function() {
			thiz.changeVal();
		}, 100);
	}
};

/** 
 * Checks a value to ensure it is in an acceptable range. Returns 0 if the value 
 * is in range, -1 if the value is less than or at the low limit or 1 if the value
 * is greater than or at the high limit.
 */
UpDownButton.prototype.checkRange = function(val) { return 0; };

UpDownButton.prototype.enable = function(enable) { 
	if (enable)
	{
		this.$w.children(".button").removeClass("button-disabled");
	}
	else
	{
		this.$w.children(".button").addClass("button-disabled");
	}
};

/** ---------------------------------------------------------------------------
 *  -- Back Button                                                           --
 *  --------------------------------------------------------------------------- */
function BackButton(control)
{
	Widget.call(this, control);
}

BackButton.prototype = new Widget;

BackButton.prototype.init = function() {
	this.control.$canvas.append(
			"<div id='back-button' class='button'>" +
				"<span class='ui-icon ui-icon ui-icon-arrowthick-1-w'></span>" +
				"Back" + 
			"</div>" 
	);
	
	this.$w = $("#back-button");
	
	var thiz = this;
	this.$w.click(function() { thiz.clicked(); });
};

BackButton.prototype.clicked = function() {
	this.removeMessages();
	if (this.control.isWorking()) return;
	
	/* Interlock validation. */
	if (this.control.data['g-on'] == 'true')
	{
		this.addMessage("The generator must be turned off before changing labs.", 'error', 57, 92, 'left');
	}
	else
	{
		this.control.setWorking(true);
		this.control.post("setLab", { 'new-mode': 0 });
	}
};

BackButton.prototype.enable = function(enable) {
	if (enable)
	{
		this.$w.removeClass("button-disabled");
	}
	else
	{
		this.$w.addClass("button-disabled");
	}
};


/** ---------------------------------------------------------------------------
 *  -- Lab 1 Graphics                                                        --
 *  --------------------------------------------------------------------------- */
function Graphics(control)
{
	Widget.call(this, control);
}

Graphics.prototype = new Widget;

Graphics.prototype.init = function()  {
	var html = '';
	
	switch (this.control.mode)
	{
	case 1:
		html = 
			"<div id='graphics-pm1' class='graphics label-box label-head'>Power Meter 1</div>" +
			"<div id='graphics-pm1-line-t' class='graphics h-line'></div>" +	
			"<div id='graphics-pm1-line-t-to-b' class='graphics v-line'></div>" +	
			"<div id='graphics-pm1-line-b' class='graphics h-line'></div>" +	
			"<div id='graphics-g-to-cb1' class='graphics h-line'></div>" +
			"<div id='graphics-g-to-pm1' class='graphics v-line'></div>" +
			
			"<div id='graphics-pm2' class='graphics label-box label-head'>Power Meter 2</div>" +
			"<div id='graphics-pm2-line' class='graphics h-line'></div>" +
			
			"<div id='graphics-cb1-to-transformer' class='graphics h-line'></div>" +
			"<div id='graphics-transformer' class='graphics-nobg'></div>" +
			"<div id='graphics-transformer-to-bus1' class='graphics h-line'></div>" +		
			
			"<div id='graphics-bus1-l' class='graphics v-line'></div>" +
			"<div id='graphics-bus1-r' class='graphics v-line'></div>" +
			"<div id='graphics-bus1' class='graphics label-box'>BUS 1</div>" +
			
			"<div id='graphics-bus1-to-trans1' class='graphics h-line'></div>" +
			"<div id='graphics-bus1-to-trans2' class='graphics h-line'></div>" +
			"<div id='graphics-trans1-to-bus2' class='graphics h-line'></div>" +
			"<div id='graphics-trans2-to-bus2' class='graphics h-line'></div>" +
			
			"<div id='graphics-bus2-l' class='graphics v-line'></div>" +
			"<div id='graphics-bus2-r' class='graphics v-line'></div>" +
			"<div id='graphics-bus2-to-gcb' class='graphics h-line'></div>" +
			"<div id='graphics-bus2' class='graphics label-box'>BUS 2</div>" +
			
			"<div id='graphics-gcb-to-load-bus' class='graphics h-line'></div>" +
			"<div id='graphics-load-l' class='graphics v-line'></div>" +
			"<div id='graphics-load-r' class='graphics v-line'></div>" +
			"<div id='graphics-load-bus-load1' class='graphics h-line'></div>" +
			"<div id='graphics-load-bus-load2' class='graphics h-line'></div>" +
			"<div id='graphics-load-bus-load3' class='graphics h-line'></div>" +
			
			"<div id='graphics-set-voltage-line' class='graphics h-line'></div>" + 
			"<div id='graphics-set-voltage-to-lcd' class='graphics v-line'></div>" +
			"<div id='graphics-set-freq-line' class='graphics h-line'></div>" + 
			"<div id='graphics-set-freq-to-lcd' class='graphics v-line'></div>" +
			
			"<div id='graphics-default-settings' class='graphics h-line'></div>" +
			"<div id='graphics-default-set-voltage' class='graphics v-line'></div>" +
			"<div id='graphics-default-set-voltage-arrow' class='graphics-nobg arrow-head'></div>" +
			"<div id='graphics-default-set-freq' class='graphics v-line'></div>" +
			"<div id='graphics-default-set-freq-arrow' class='graphics-nobg arrow-head'></div>" +
			"<div id='graphics-default-to-button' class='graphics v-line'></div>" +
			
			"<div id='graphics-gen-details' class='graphics-details label-box'>P=2.2KW I=3A</div>" +
			"<div id='graphics-trans-details' class='graphics-details label-box'>1:1</div>";
		break;
	case 2:
		html =
			"<div id='graphics-g-to-cb1-2' class='graphics h-line'></div>" +
			"<div id='graphics-cb1-to-trans-2' class='graphics h-line'></div>" +
			"<div id='graphics-trans-2' class='graphics-nobg'></div>" +
			"<div id='graphics-trans-details-2' class='graphics-details label-box'>1:1</div>" +
			"<div id='graphics-gen-details-2' class='graphics-details label-box'>P=2.2KW I=3A</div>" +
			"<div id='graphics-trans-to-gcb-2' class='graphics h-line'></div>" +
			"<div id='graphics-transline-to-gcb-2' class='graphics h-line'></div>" +
			
			"<div id='graphics-voltage-alert-to-mcb-2' class='graphics v-line'></div>" +
			"<div id='graphics-voltage-alert-2' class='graphics-nobg label-box'>415V Utility</div>" +
			"<div id='graphics-mcb-to-busbar-2' class='graphics v-line'></div>" +
			"<div id='graphics-busbar-to-gcb-2' class='graphics v-line'></div>" +
			"<div id='graphics-busbar-mcb-gcb-2' class='graphics h-line'></div>" +
			
			"<div id='graphics-pm1-label-2' class='graphics label-box label-head'>Power Meter 1</div>" +
			"<div id='graphics-pm1-lower-2' class='graphics h-line'></div>" +
			"<div id='graphics-pm1-lower-to-higher-2' class='graphics v-line'></div>" +
			"<div id='graphics-pm1-higher-2' class='graphics h-line'></div>" +
			"<div id='graphics-pm1-higher-2-to-meter-2' class='graphics v-line'></div>" +
			"<div id='graphics-pm1-meter-2' class='graphics h-line'></div>" +
			"<div id='graphics-meter-to-gcb-2' class='graphics v-line'></div>" +
		
			"<div id='graphics-pm3-label-2' class='graphics label-box label-head'>Power Meter 3?</div>" +
			"<div id='graphics-pm3-2' class='graphics h-line'></div>" +
			"<div id='graphics-pm3-to-gcb-2' class='graphics v-line'></div>" +
			
			"<div id='graphics-gcb-to-load-top-2' class='graphics h-line'></div>" +
			"<div id='graphics-gcb-to-load-vert-2' class='graphics v-line'></div>" +
			"<div id='graphics-pm2-label-2' class='graphics label-box label-head'>Power Meter 2</div>" +
			"<div id='graphics-pm2-2' class='graphics h-line'></div>" +
			"<div id='graphics-pm2-to-load-up-2' class='graphics v-line'></div>" +
			"<div id='graphics-pm2-to-load-2' class='graphics h-line'></div>" +
			
			"<div id='graphics-set-voltage-line-2' class='graphics h-line'></div>" + 
			"<div id='graphics-set-voltage-to-lcd-2' class='graphics v-line'></div>" +
			"<div id='graphics-set-freq-line-2' class='graphics h-line'></div>" + 
			"<div id='graphics-set-freq-to-lcd-2' class='graphics v-line'></div>" +
			"<div id='graphics-default-settings-2' class='graphics h-line'></div>" +
			"<div id='graphics-default-set-voltage-2' class='graphics v-line'></div>" +
			"<div id='graphics-default-set-voltage-arrow-2' class='graphics-nobg arrow-head'></div>" +
			"<div id='graphics-default-set-freq-2' class='graphics v-line'></div>" +
			"<div id='graphics-default-set-freq-arrow-2' class='graphics-nobg arrow-head'></div>" +
			"<div id='graphics-default-to-button-2' class='graphics v-line'></div>";
		break;
	}
	this.control.$canvas.append(html);
};

Graphics.prototype.destroy = function() {
	this.control.$canvas.children(".graphics, .graphics-nobg, .graphics-details").remove();
};

/** ---------------------------------------------------------------------------
 *  -- Camera Display                                                        --
 *  --------------------------------------------------------------------------- */
function Camera(control) 
{
	Widget.call(this, control);
}
Camera.prototype = new Widget;

Camera.prototype.init = function() {
	/* Button to open camera dialog. */
	this.control.$canvas.append(
			"<div id='camera-button' class='button'>" +
				"<span class='ui-icon ui-icon-video'></span>" +
				"Cameras" + 
			"</div>" 
	);
	
	this.$w = $("#camera-button");
	
	var thiz = this;
	this.$w.click(function() { thiz.clicked(); });
};

Camera.prototype.clicked = function() {
	alert("TODO Implement cameras");
	// TODO Implement camera dialog. 
};

Camera.prototype.deploy = function() {
	// TODO camera deployment
};

Camera.prototype.undeploy = function() {
	// TODO camera removal
};
