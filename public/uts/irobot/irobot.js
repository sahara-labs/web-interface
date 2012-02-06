/**
 * iRobot rig interface.
 * 
 * @author Michael Diponio
 * @date 13th February 2011
 */

/* ----------------------------------------------------------------------------
 * -- Page Control                                                           --
 * ---------------------------------------------------------------------------- */

/**
 * The iRobot page. 
 */
function IRobot(id)
{
	/** Canvas widget. */
	this.$canvas = $("#" + id);
	
	/** The iRobot rig operating mode. */
	this.mode = 0;
	this.modeSelector = new ModeSelector(this);
	
	/** The list of widgets that are displayed on the page. */
	this.widgets = [];
	
	/* Log level. */
	this.logLevel = 0;
}

/* IRobot constants. */
IRobot.MANUAL_CONTROLLER = "TestRobotController";

IRobot.LOGOFF = 4;
IRobot.ERROR  = 3;
IRobot.WARN   = 2;
IRobot.INFO   = 1;
IRobot.DEBUG  = 0;

/**
 * Initialises the page. If no mode is stored in the page hash, the mode
 * selector is displayed.
 */
IRobot.prototype.init = function() {
	this.modeSelector.init();
	
	var hashMode = window.location.hash;
	if (hashMode && hashMode.length == 3)
	{
		var mode = parseInt(hashMode.substr(2));
		this.displayMode(0 < mode && mode <= 3 ? mode : 0);
	}
};

/**
 * Changes the page mode.
 * 
 * @param mode mode number
 */
IRobot.prototype.displayMode = function(mode) {
	var i = 0;
	
	this.log("Changing display mode to " + mode);
	
	/* Destroy the existing widgets. */
	for (i in this.widgets) this.widgets[i].destroy();
	
	switch (mode)
	{
	case 1: // Manual mode
		this.widgets.push(new DPad(this));
		this.widgets.push(new Ranger(this));
		break;
		
	case 2: // Logging mode
		this.log("Logging mode not implemented", IRobot.ERROR);
		break;
		
	case 3: // Code upload mode
		this.log("Code mode not implemented", IRobot.ERROR);
		break;

	default:
		this.log(IRobot.ERROR, "Unknown mode: " + mode);
	}
	
	this.mode = mode;
	window.location.hash = "m" + this.mode;
	this.modeSelector.setSelected(mode);
	for (i in this.widgets) this.widgets[i].init();
};

IRobot.prototype.setSpeed = function(speed, yaw, cb) {
	$.post(
		"/primitive/json/pc/" + IRobot.MANUAL_CONTROLLER + "/pa/control",
		{
			speed: speed,
			yaw: yaw
		},
		function(resp) {
			if (typeof resp != "object")
			{
				this.log("Set speed response error: " + resp, IRobot.ERROR);
				return;
			}

			if (cb) cb.call(resp);
		}
	);
};


IRobot.prototype.log = function(message, lvl) {
	if (typeof console == "undefined") return;
	
	if (!lvl) lvl = 0;
	if (lvl < this.logLevel) return;
	
	switch (lvl)
	{
	case 0:
		console.debug(message);
		break;
	case 1:
		console.info(message);
		break;
	case 2:
		console.warn(message);
		break;
	case 3: 
		console.error(message);
		break;
	}
};

/* ----------------------------------------------------------------------------
 * -- Widget base.                                                           --
 * ---------------------------------------------------------------------------- */

/**
 * Base of page widget.
 */
function IWidget(control)
{
	/** The page control object. */
	this.control = control;
		
	/** The widget name. */
	this.wid = "";
	
	/** The widget jQuery object. */
	this.$w = null;
}

/**
 * Initialises the widget which paints it onto the canvas. 
 */
IWidget.prototype.init = function() {	
	this.pageControl.log(this.wid + " has no init method", IRobot.ERROR);
};

/**
 * Destroys the widget by removing the widget from the canvas and clearing all 
 * event handlers. 
 */
IWidget.prototype.destroy = function () {
	this.$w.remove();
};

/**
 * Appends contents to the robot canvas.
 * 
 * @param contents page contents
 */
IWidget.prototype.pageAppend = function(contents) {
	var html = "<div id='" + this.wid + "' class='widget-box'>";
	
	if (this.title)
	{
		//html += "<div id='robot-widget-title>" + this.title + "</div>";
	}
	html += contents + "</div>";
	
	this.control.$canvas.append(html);
	this.$w = this.control.$canvas.find("#" + this.wid);
};

/* ----------------------------------------------------------------------------
 * -- Widget to select a mode.                                               --
 * ---------------------------------------------------------------------------- */
function ModeSelector(pc)
{
	IWidget.call(this, pc);	
	this.wid = "mode-sel";
	
	this.modes = [
        'Manual',
        'Logging',
        'Upload'
	];
}
ModeSelector.prototype = new IWidget;

ModeSelector.prototype.init = function() {
	var html = "", i = 0;
	
	for (i in this.modes)
	{
		html += "<a id='mode" + (parseInt(i) + 1) + "'>" + this.modes[i] + "</a>";
	}
	this.pageAppend(html + "<div class='float-clear'></div>");
	
	var thiz = this;
	this.$w.children("a").click(function() {
		thiz.control.displayMode(parseInt($(this).attr("id").substr(4)));
	});
};

ModeSelector.prototype.setSelected = function(mode) {
	// FIXME Change selected mode
};

/* ----------------------------------------------------------------------------
 * -- D-Pad widget to move the robot around.                                 --
 * ---------------------------------------------------------------------------- */
function DPad(pc)
{
	IWidget.call(this, pc);	
	this.wid = "dpad";

	this.pressed = [];
	
	this.speed = 0.0;
	this.yaw = 0.0;
	
	this.vel = 0.5;
	
	this.ping;
	this.setTs = 0;
}
DPad.prototype = new IWidget;

DPad.prototype.init = function() {
	this.pageAppend(
		"<div id='north-finger' class='dpad-finger'><span></span></div>" + 
		"<div id='east-finger' class='dpad-finger'><span></span></div>" + 
		"<div id='south-finger' class='dpad-finger'><span></span></div>" + 
		"<div id='west-finger' class='dpad-finger'><span></span></div>" + 
		"<div id='pad-center'><span></span></div>"
	);
	
	var thiz = this;
	this.$w.children(".dpad-finger")
		.mousedown(function() {
			var id = $(this).attr("id");
			thiz.fingerPress(id.substring(0, id.indexOf("-")), this);
		})
		.bind("mouseup mouseleave", function() {
			var id = $(this).attr("id");
			thiz.fingerRelease(id.substring(0, id.indexOf("-")), this);
		});
	
	$(document).bind("keydown.dpad", function(evt) {
		switch (evt.which)
		{
		case 38:  // Up arrow
		case 87:  // W
		case 119: // w
			thiz.fingerPress("north");
			break;
			
		case 39:  // Right arrow
		case 68:  // D
		case 100: // d
			thiz.fingerPress("east");
			break;
			
		case 40:  // Down arrow
		case 83:  // S
		case 115: // s
			thiz.fingerPress("south");
			break;
			
		case 37:  // Left arrow
		case 65:  // A
		case 97:  // a
			thiz.fingerPress("west");
			break;
		}
	});
	
	$(document).bind("keyup.dpad", function(evt) {
		switch (evt.which)
		{
		case 38:  // Up arrow
		case 87:  // W
		case 119: // w
			thiz.fingerRelease("north");
			break;
			
		case 39:  // Right arrow
		case 68:  // D
		case 100: // d
			thiz.fingerRelease("east");
			break;
			
		case 40:  // Down arrow
		case 83:  // S
		case 115: // s
			thiz.fingerRelease("south");
			break;
			
		case 37:  // Left arrow
		case 65:  // A
		case 97:  // a
			thiz.fingerRelease("west");
			break;
		}
	});
};

DPad.prototype.actionOccurred = function() {
	
	/* Calculate new speed. */
	this.speed = 0.0;
	this.yaw = 0.0;
	if (this.pressed["north"]) this.speed += this.vel;
	if (this.pressed["east"]) this.yaw += -this.vel;
	if (this.pressed["south"]) this.speed += -this.vel;
	if (this.pressed["west"]) this.yaw += this.vel;

	/* Clear any existing pinging. */
	if (this.ping) clearTimeout(this.ping);
	
	this.setSpeed();
};

DPad.prototype.setSpeed = function() {
	var thiz = this;
	this.setTs = new Date().getTime();
	this.control.setSpeed(this.speed, this.yaw, function(r) { thiz.movePing(r); });
};

DPad.prototype.movePing = function(resp) {
	/* Nothing to do here. */
	if (this.speed == 0.0 && this.yaw == 0.0) return;
	
	var ts = new Date().getTime();
	if ((ts - this.setTs) > 200)
	{
		/* Send another update. */
		this.setSpeed();
	}
	else 
	{
		var thiz = this;
		this.ping = setTimeout(function() {
			thiz.movePing();
		}, 205 - (ts - this.setTs));
	}
};

DPad.prototype.fingerPress = function(dir, e) {
	/* This event can be doubly called from holding down keydown keys. */
	if (this.pressed[dir]) return;
	
	this.control.log("DPad press on dir: " + dir);
	this.pressed[dir] = true;
	
	/* Change display to pressed mode. */
	if (!e) e = $("#" + dir + "-finger");
	$(e).addClass("pressed");
	
	this.actionOccurred();
};

DPad.prototype.fingerRelease = function(dir, e) {
	/* This event can be doubly called from mouseup/mouseleave events. */
	if (!this.pressed[dir]) return;
	
	this.control.log("DPad release on dir: " + dir);
	this.pressed[dir] = false;
	
	if (!e) e = $("#" + dir + "-finger");
	$(e).removeClass("pressed");
	
	this.actionOccurred();
};

DPad.prototype.destroy = function () {
	$(document).unbind("keydown.dpad keyup.dpad");
	this.$w.remove();
};

/* ----------------------------------------------------------------------------
 * -- Ranger display.                                                        --
 * ---------------------------------------------------------------------------- */
function Ranger(pc)
{
	IWidget.call(this, pc);
	this.wid = "ranger-panel";
	
	this.title = "Ranging Laser";
	
	/* Ranger configuration. */
	this.minRange = 0;
	this.maxRange = 0;
	this.rangerRes = 0;
	this.minAngle = 0;
	this.maxAngle = 0;
	this.angularRes = 0;
	
	/* Canvas context. */
	this.ctx;
	this.width = this.height = 300;
	this.xo = this.width / 2;
	this.yo = this.height / 2;
	this.pxPerM = this.width / 12;
}
Ranger.prototype = new IWidget;

Ranger.prototype.init = function() {	
	this.pageAppend(
		"<canvas id='ranger' width='" + this.width + "' height='" + this.height + "'></canvas>"
	);
	
	this.ctx = ($("#ranger")[0]).getContext("2d");
	if (this.ctx)
	{
		this.getConf();
	}
	else
	{
		alert("Using this rig requires a modern browser!");
	}
};

Ranger.prototype.getConf = function() {
	var thiz = this;
	$.get(
		"/primitive/json/pc/" + IRobot.MANUAL_CONTROLLER + "/pa/rangerConf",
		null,
		function (resp) {
			if (typeof resp != "object")
			{
				window.location.reload();
				return;
			}
				
			thiz.parseConf(resp);
		}
	);
};

Ranger.prototype.parseConf = function(conf) {
	for (i in conf)
	{
		switch (conf[i].name)
		{
		case 'rangeres': 
			this.rangerRes = parseFloat(conf[i].value);
			break;
		case 'minrange':
			this.minRange = parseFloat(conf[i].value);
			break;
		case 'maxrange':
			this.maxRange = parseFloat(conf[i].value);
			break;
		case 'minangle':
			this.minAngle = Math.abs(parseFloat(conf[i].value));
			break;
		case 'maxangle':
			this.maxAngle = parseFloat(conf[i].value);
			break;
		case 'angularres':
			this.angularRes = parseFloat(conf[i].value);
			break;
		}
	}
	
	if (this.minRange == 0)
	{
		/* Invalid data. */
		var thiz = this;
		setTimeout(function() {
			thiz.getConf();
		}, 1000);
	}
	else
	{
		this.mainLoop();
	}
};

Ranger.prototype.mainLoop = function() {
	var thiz = this;
	$.get(
		"/primitive/json/pc/" + IRobot.MANUAL_CONTROLLER + "/pa/ranger",
		null,
		function (resp) {
			if (typeof resp != "object")
			{
				window.location.reload();
				return;
			}
				
			thiz.drawFrame(eval(resp.value));
			
			setTimeout(function() {
				thiz.mainLoop();
			}, 100);
		}
	);
};

Ranger.prototype.drawFrame = function(scan) {
	
	this.ctx.clearRect(0, 0, this.width, this.height);
	
	/* Grid lines and such. */
	this.drawSkeleton();
	
	/* Ranger data. */
	this.drawScan(scan);
	
	/* Draw puck. */
//	this.drawPuck();
};

Ranger.prototype.drawSkeleton = function() {
	var i;
	
	/* Grid lines. */
	this.ctx.strokeStyle = "#DDDDDD";
	this.ctx.lineWidth = 1.5;
	this.ctx.moveTo(this.xo, 0);
	this.ctx.lineTo(this.xo, this.height);
	this.ctx.moveTo(0, this.yo);
	this.ctx.lineTo(this.width, this.yo);
	this.ctx.stroke();
	
	this.ctx.lineWidth = 0.75;
	for (i = this.pxPerM; i < this.width; i += this.pxPerM)
	{
		/* Vertical. */
		this.ctx.moveTo(i, 0);
		this.ctx.lineTo(i, this.height);
		
		/* Horizontal. */
		this.ctx.moveTo(0, i);
		this.ctx.lineTo(this.width, i);
	}
	this.ctx.stroke();
	
	/* Draw blind region. */
//	this.ctx.fillStyle = "rgba(200, 200, 200, 0.1)";
//	this.ctx.beginPath();
//	this.ctx.moveTo(this.xo, this.yo);
//	this.ctx.lineTo(0, this.xo + this.width / 2 * Math.tan(Math.PI - this.minAngle));
//	this.ctx.lineTo(0, this.xo - this.width / 2 * Math.tan(Math.PI - this.maxAngle));
//	this.ctx.lineTo(this.xo, this.yo);
//	this.ctx.closePath();
//	this.ctx.fill();
};

Ranger.prototype.drawPuck = function() {
	/* Robot puck at center. */
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.beginPath();
	this.ctx.arc(150, 150, 9, 0, Math.PI * 2, true);
	this.ctx.closePath();
	this.ctx.fill();
	
	this.ctx.lineWidth = 2;
	this.ctx.strokeStyle = "red";
	this.ctx.beginPath();
	this.ctx.arc(150, 150, 10, 0, Math.PI * 2, true);
	this.ctx.closePath();
	this.ctx.stroke();

	this.ctx.fillStyle = "red";
	this.ctx.beginPath();
	this.ctx.moveTo(149, 150);
	this.ctx.arc(150, 150, 10, Math.PI / 4, - Math.PI / 4, true);
	this.ctx.moveTo(149, 150);
	this.ctx.closePath();
	this.ctx.fill();
};

Ranger.prototype.drawScan = function(scan){
	var i = 0, s,
		r = this.minAngle, 
		radius = this.maxRange * this.pxPerM,
		xd, yd;
	
	this.ctx.strokeStyle = "#BA0000";
	this.ctx.lineWidth = 0.5;
	this.ctx.fillStyle = "rgba(255, 40, 40, 0.75)";
	this.ctx.beginPath();
	this.ctx.moveTo(this.xo, this.yo);
	
	if (scan[0] == 0.0)
	{
		/* The range is infinite so a line is drawn to the start of the arc. */
		this.ctx.lineTo(this.xo - radius * Math.sin(this.minAngle - Math.PI / 2), 
						this.yo + radius * Math.cos(this.minAngle - Math.PI / 2));
	}
	
	for (i = 0; i < scan.length; i++)
	{		
		if (scan[i] == 0.0)
		{
			/* Here the range is infinite so we will draw an arc, but we need 
			 * to find the arc end which is up to range end. */
			s = i;
			while (++i < scan.length && scan[i] == 0.0);
			i--;
			this.ctx.arc(this.xo, this.yo, radius, r, r - (i - s) * this.angularRes, true);
			
			r -= (i - s) * this.angularRes;
		}
		else
		{
			xd = scan[i] * this.pxPerM * Math.sin(r - Math.PI / 2);
			yd = scan[i] * this.pxPerM * Math.cos(r - Math.PI / 2);
			
			if (3 * Math.PI / 2 < r && r <= 2 * Math.PI)  // Top left quadrant
			{
				xd = this.xo + xd;
				yd = this.yo - yd;
			}
			else if (Math.PI < r && r <= 3 * Math.PI / 2) // Top right quadrant
			{
				xd = this.xo - xd;
				yd = this.yo - yd;
			}
			else if (Math.PI / 2 < r && r <= Math.PI)      // Bottom right quadrant
			{
				xd = this.xo - xd;
				yd = this.yo + yd;
			}
			else if (r < Math.PI / 2)                      // Bottom left quadrant
			{
				xd = this.xo - xd;
				yd = this.yo + yd;
			}
			
			this.ctx.lineTo(xd, yd);
			r -= this.angularRes;
		}
	}
	
	this.ctx.lineTo(this.xo, this.yo);
	this.ctx.closePath();
	this.ctx.stroke();
	this.ctx.fill();
};

