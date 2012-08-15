/**
 * Power Systems Lab interface.
 */

function PowerLab(id)
{
	this.$canvas = $("#" + id);
	
	this.mode = 0;
	this.widgets = [];
}

PowerLab.prototype.init = function() {
	this.setMode(1);
};

PowerLab.prototype.setMode = function(mode) {
	var o;
	
	/* Clear up previous mode. */
	this.$canvas.removeClass("lab0 lab1 lab2");
	while (o = this.widgets.pop()) o.destroy();
	
	/* Setup the elements in the new mode. */
	switch (this.mode = mode)
	{
	case 1: // Lab 1 mode
		/* --- Buttons --------------------------------------------------------------------------------------- */
		this.widgets.push(new Button(this.$canvas, "g-button",      "G",      "circ-button"));
		this.widgets.push(new Button(this.$canvas, "cb1-button",    "CB1"));
		this.widgets.push(new Button(this.$canvas, "gcb-button",    "GCB"));
		this.widgets.push(new Button(this.$canvas, "load-r-button", "R Load", "load-button"));
		this.widgets.push(new Button(this.$canvas, "load-l-button", "L Load", "load-button"));
		this.widgets.push(new Button(this.$canvas, "load-c-button", "C Load", "load-button"));
		this.widgets.push(new ExclusiveButton(this.$canvas, "trans-model", {
			1: "Trans. Model 1",
			2: "Trans. Model 2"
		}));
		
		/* --- Meters ---------------------------------------------------------------------------------------- */
		this.widgets.push(new LCDWidget(this.$canvas, "active-power",     "Active Power",   "W",   3, "teal-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "apparent-power",   "Apparent Power", "VA",  3, "green-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "ln-voltage",       "L - N Voltage",  "V",   3, "teal-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "set-voltage",      "Set Voltage",    "V",   3, "yellow-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "reactive-power",   "Reactive Power", "Var", 3, "red-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "active-factor",    "Active Factor",  "%",   3, "yellow-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "line-frequency",   "Line Frequency", "Hz",  3, "red-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "set-frequency",    "Set Frequency",  "Hz",  3, "teal-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "line-current",     "Line Current",   "A",   3, "yellow-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "active-power-2",   "Active Power",   "W",   3, "teal-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "apparent-power-2", "Apparent Power", "VA",  3, "green-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "ln-voltage-2",     "L - N Voltage",  "V",   3, "teal-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "reactive-power-2", "Reactive Power", "Var", 3, "red-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "active-factor-2",  "Active Factor",  "%",   3, "yellow-color"));
		this.widgets.push(new LCDWidget(this.$canvas, "line-frequency-2", "Line Frequency", "Hz",  3, "red-color"));
		
		/* --- Miscellaneous things on the page. */
		this.widgets.push(new Graphics(this.$canvas));
		
		break;
		
	default:
		throw Exception("Unknown power lab mode");
		break;
	}
	
	/* Tell each widget to render. */
	this.$canvas.addClass("lab" + this.mode);
	for (o in this.widgets) this.widgets[o].init();
};

/** --------------------------------------------------------------------------- 
 *  -- Base widget                                                           -- 
 *  --------------------------------------------------------------------------- */
function Widget($canvas) 
{
	this.id = null;
	this.title = null;
	this.$w = null;
	
	this.$canvas = $canvas;
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
 * Removes the widget from the page.
 */
Widget.prototype.destroy = function() {
	if (this.$w) this.$w.remove();
};

/** ---------------------------------------------------------------------------
 *  -- LCD Widget                                                            --
 *  --------------------------------------------------------------------------- */
function LCDWidget($canvas, id, title, units, scale, cclass) 
{
	Widget.call(this, $canvas);
	
	this.id = id;
	this.title = title;
	this.units = units;
	this.scale = scale;
	this.cclass = cclass;
}

LCDWidget.prototype = new Widget;

LCDWidget.prototype.init = function() {
	this.$canvas.append(
		"<div id='" + this.id + "' class='lcd-box'>" +
			"<div class='lcd-title " + this.cclass + "'>" + this.title + "</div>" +
			"<div class='lcd-value'> </div>" +
			"<div class='lcd-unit'>" + this.units + "</div>" +
		"</div>"
	);
	
	this.$w = $("#" + this.id);
	this.setValue(0);
};

LCDWidget.prototype.setValue = function(val) {
	// TODO
};

/** ---------------------------------------------------------------------------
 *  -- Button Widget                                                         --
 *  --------------------------------------------------------------------------- */
function Button($canvas, id, text, cclass) 
{
	Widget.call(this, $canvas);
	
	this.id = id;
	this.text = text;
	this.isOn = undefined;
	this.isActive = false;
	this.cclass = cclass ? cclass : '';
}

Button.prototype = new Widget;

Button.prototype.init = function() {
	this.$canvas.append(
		"<div id='" + this.id + "' class='button button-unknown-state " + this.cclass + "'>" +
			this.text + " &nbsp;&nbsp;&nbsp;" +
		"</div>" 
	);
	
	var thiz = this;
	this.$w = $("#" + this.id)
				.click(function() { thiz.clicked(); });
	
	this.setOn(false);
};

Button.prototype.clicked = function() {
	// TODO
	alert(this.id + " clicked");
};

Button.prototype.setValue = function(val) {
	// TODO
};

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

Button.prototype.setActive = function(active) {
	// TODO 
};

/** ---------------------------------------------------------------------------
 *  -- Exclusive Button Widget                                               --
 *  --------------------------------------------------------------------------- */
function ExclusiveButton($canvas, id, buttons)
{
	Widget.call(this, $canvas);
	
	this.id = id;
	this.buttons = buttons;
	
	this.currentVal = undefined;
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
	
	this.$canvas.append(html);
	this.$w = $("#" + this.id);
	
	this.$w.children(".button").click(function() { thiz.clicked($(this).attr("id")); });
	
	this.setOn(0);
};

ExclusiveButton.prototype.clicked = function(id) {
	// TODO
	alert(id + " clicked");
};

ExclusiveButton.prototype.setOn = function(val) {
	if (this.currentVal === val) return;
	
	this.currentVal = val;
	var $ch = this.$w.children(".button").removeClass("button-unknown-state button-on-state button-off-state"),
		$n = $("#" + this.id + "-button-" + val),
		t;

	
	if ($n.length != 0)
	{
		$ch = $n.sibling();
		
		t = $n.text();
		$n.addClass("button-on-state")
		  .text(t.substr(0, t.length - 3) + "On&nbsp;");
	}
	
	$ch.each(function() {
		t = $(this).text();
		$(this).addClass("button-off-state")
			   .text(t.substr(0, t.length - 3) + "Off");
	});
};

ExclusiveButton.prototype.setActive = function (active) {
	// TODO
};



/** ---------------------------------------------------------------------------
 * -- Graphics                                                               --
 * ---------------------------------------------------------------------------- */
function Graphics($canvas)
{
	Widget.call(this, $canvas);
	
	this.ids = [
	    'graphics-pm1',
	    'graphics-pm1-line-t',
	    'graphics-pm1-line-t-to-b',
	    'graphics-pm1-line-b',
	    'graphics-pm1-g-to-cb1',
	    'graphics-pm1-g-to-pm1',
	    'graphics-pm2',
	    'graphics-pm2-line',
	    'graphics-bus2',
	    'graphics-bus2-to-pm2',
	    'graphics-load-bus1',
	    'graphics-load-bus2'
	];
}

Graphics.prototype = new Widget;

Graphics.prototype.init = function()  {
	this.$canvas.append(
		"<div id='graphics-pm1' class='graphics label-box label-head'>Power Meter 1</div>" +
		"<div id='graphics-pm1-line-t' class='graphics h-line'></div>" +	
		"<div id='graphics-pm1-line-t-to-b' class='graphics v-line'></div>" +	
		"<div id='graphics-pm1-line-b' class='graphics h-line'></div>" +	
		"<div id='graphics-g-to-cb1' class='graphics h-line'></div>" +
		"<div id='graphics-g-to-pm1' class='graphics v-line'></div>" +
		
		"<div id='graphics-pm2' class='graphics label-box label-head'>Power Meter 2</div>" +
		"<div id='graphics-pm2-line' class='graphics h-line'></div>" +
		
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
		"<div id='graphics-default-set-freq' class='graphics v-line'></div>" +
		"<div id='graphics-default-to-button' class='graphics v-line'></div>"
	);
};

Graphics.prototype.destroy = function() {
	var i = 0;
	for (i in this.ids) $("#" + this.ids[i]).remove();
};