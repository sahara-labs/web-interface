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
	if (this.mode == mode) return;
	
	this.log("Changing display mode to " + mode);
	
	/* Tear down old mode. */
	this.modeSelector.clearSelected();
	while (this.widgets.length > 0) this.widgets.pop().destroy();
		
	switch (mode)
	{
	case 1: // Manual mode
		this.widgets.push(new DPad(this));
		this.widgets.push(new Ranger(this));
		this.widgets.push(new OnboardCamera(this));
		this.widgets.push(new OverheadCamera(this));
		break;
		
	case 2: // Logging mode
		this.log("Logging mode not implemented", IRobot.WARN);
		break;
		
	case 3: // Code upload mode
		this.log("Code mode not implemented", IRobot.WARN);
		break;

	default:
		this.log(IRobot.ERROR, "Unknown mode: " + mode);
	}
	
	this.mode = mode;
	window.location.hash = "m" + this.mode;
	
	var i = 0;
	for (i in this.widgets) this.widgets[i].init();
	this.modeSelector.setSelected(mode);
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
	var html = "<div id='" + this.wid + "' class='widget-box'>" +
				contents;
	
	if (this.title)
	{
		html += "<div class='widget-title'>" + this.title + "</div>";
	}
	html += "</div>";
	
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
	
	html += "<div class='float-clear'></div>";
	
	/* Border boxes. */
	html +=	"<div id='mode-sel-border'></div>" +
			"<div id='mode-sel-border-clear'></div>";
		   
	this.pageAppend(html);
	
	var thiz = this;
	this.$w.children("a").click(function() {
		thiz.control.displayMode(parseInt($(this).attr("id").substr(4)));
	});
};

ModeSelector.prototype.setSelected = function(mode) {
	this.$w.children("#mode" + mode).addClass("active");
};

ModeSelector.prototype.clearSelected = function() {
	this.$w.children("a.active").removeClass("active");
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
	
	this.title = "Scanning Laser Range Finder";
	
	/* Ranger configuration. */
	this.minRange = 0;
	this.maxRange = 0;
	this.rangerRes = 0;
	this.minAngle = 0;
	this.maxAngle = 0;
	this.angularRes = 0;
	
	/* Ranger data. */
	this.scan = [];
	
	/* Canvas context. */
	this.ctx;
	this.width = this.height = 300;
	this.xo = this.width / 2;
	this.yo = this.height / 2;
	this.pxPerM = this.width / 12;
	this.rotation = Math.PI / 2;
	
	/* Translation. */
	this.mouseDown = false;
	this.movX = 0;
	this.movY = 0;
	
	/* Stop signal for the main loop. */
	this.mainLoopEnd = false;
}
Ranger.prototype = new IWidget;

Ranger.prototype.init = function() {
	
	var html = "<canvas id='ranger' width='" + this.width + "' height='" + this.height + "'></canvas>",
	    i = 0;
	
	/* Top zoom bar0 */
	html += "<div id='zoom-bar' class='bar'>" +	
				"<div id='zoom-post-l' class='zoom-post'></div>" +
				"<div id='zoom-arr-left'></div>" +
				"<div id='zoom-bar-containment'>" +
					"<div id='zoom-bar-indicator' class='bar-indicator'>";
	for (i = 15; i >= 0; i--)
	{
		html += 	"<span id='zoom-bar-ind" + i + "' class='zoom-bar-ind bar-ind' " +
						" style='width:" + (i * 5/4) + "px'></span>";
	}
	
				
	html += 		"</div>" +
				"</div>" + 
				"<div id='zoom-post-r' class='zoom-post'></div>" +
				"<div id='zoom-arr-line'></div>" +
				"<div id='zoom-arr-right'></div>" +
				"<div id='zoom-label'>1m</div>" +
			"</div>";
	
	/* Right rotation bar. */
	html += "<div id='rot-bar' class='bar'>" +	
				"<div id='rot-bar-containment'>" +
					"<div id='rot-bar-indicator' class='bar-indicator'>";
	for (i = 15; i >= 0; i--)
	{
		html += 	"<span id='rot-bar-ind" + i + "' class='rot-bar-ind bar-ind' " +
						" style='height:" + (i * 5/4) + "px;margin-top:" + ((15 - (i * 5/4)) / 2) + "px'></span>";
	}
					
	html += 		"</div>";

	for (i = 0; i < 5; i++)
	{
		html += "<div class='rot-label-post' style='top:" + (i * 46 + 7) + "px'>" + (i* 90) + "&deg;</div>";
	}
	
	html += 	"</div>" +
			"</div>";
	
	this.pageAppend(html);
	
	var thiz = this;
	
	/* Translation moves the origin, moving the displayed region. */
	$("#ranger")
		.mousedown(function(evt) { 
			thiz.mouseDown = true;
			thiz.movX = evt.pageX;
			thiz.movY = evt.pageY;
		});
	
	$(document)
		.bind('mousemove.ranger', function(evt) {
			if (!thiz.mouseDown) return;
			thiz.xo -= thiz.movX - evt.pageX;
			thiz.movX = evt.pageX;
			thiz.yo -= thiz.movY - evt.pageY;
			thiz.movY = evt.pageY;
			
			thiz.drawFrame();
		})
		.bind('mouseup.ranger', function() { thiz.mouseDown = false; });
	
	/* Zoom bar increases the pixels per metre, zooming in. */
	$("#zoom-bar-indicator").
		draggable({
			axis: 'x',
			containment: 'parent',
			handle: '.zoom-bar-ind',
			drag: function(evt, ui) {
				var left = ui.position.left;
				if (left < 5) left = 5; // Don't allow the size to drop too far
				
				/* Change the indicator displays. */
				$(this).parent()  // Containment
					/* Post right */
					.next().css("left", left + 149)
					/* Arrow line. */
					.next().css("width", left - 10)
					/* Arrow right. */
					.next().css("left", left + 139)
					/* Label. */
					.next().css({
						"left": left / 2 + 150,
						"top": -(left > 60 ? 10 : 20)
					});
				
				/* The zoom is a function of pixel per metre. */
				thiz.pxPerM = left;
				thiz.drawScan();
			}
		})
		.hover(function() {
				$(this).children(".bar-ind").addClass("bar-ind-hover");
			},
			function() {
				$(this).children(".bar-ind").removeClass("bar-ind-hover");
			}
		);
	
	/* Rotation bar changes the angle of the display with respect to the page. */
	$("#rot-bar-indicator").draggable({
			axis: 'y',
			containment: 'parent',
			handle: '.zoom-bar-ind',
			drag: function(evt, ui) {
				var height = ui.position.top;
				
				thiz.rotation = (height / 181 * 360 * Math.PI / 180) + Math.PI / 2;
				thiz.drawFrame();
			}
		})
		.hover(function() {
				$(this).children(".bar-ind").addClass("bar-ind-hover");
			},
			function() {
				$(this).children(".bar-ind").removeClass("bar-ind-hover");
			}
		);
	
	this.ctx = ($("#ranger")[0]).getContext("2d");
	if (this.ctx)
	{
		this.ctx.font = "12px sans-serif";
		this.ctx.fillText("Connecting...", this.xo - 40, this.yo);
		
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
	
	if (this.minRange == 0 && !this.mainLoopEnd)
	{
		/* Invalid data. */
		var thiz = this;
		setTimeout(function() {
			thiz.getConf();
		}, 5000);
	}
	else if (!this.mainLoopEnd)
	{
		this.mainLoop();
	}
};

Ranger.prototype.mainLoop = function() {
	if (this.mainLoopEnd) return;
	
	var thiz = this;
	$.ajax({
		url: "/primitive/json/pc/" + IRobot.MANUAL_CONTROLLER + "/pa/ranger",
		success: function (resp) {
			if (typeof resp != "object")
			{
				window.location.reload();
				return;
			}
				
			thiz.drawFrame(eval(resp.value));
			
			setTimeout(function() {
				thiz.mainLoop();
			}, 100);
		},
		error: function(xhr, status, err) {
			thiz.control.log("Failed to obtain ranger scan, with status: " + status + ". Trying again in 1 second.",
					IRobot.WARN);
			setTimeout(function() {
				thiz.mainLoop();
			}, 1000);
		}
	});
};

Ranger.prototype.drawFrame = function(scan) {
	
	this.ctx.clearRect(0, 0, this.width, this.height);
	
	/* Grid lines and such. */
	this.drawSkeleton();
		
	/* Draw garnished details. */
	this.drawDetails();
	
	/* Ranger data. */
	this.drawScan(scan);
};

Ranger.prototype.drawSkeleton = function() {
	var i;
	
	/* Grid lines. */
	this.ctx.strokeStyle = "#AAAAAA";
	this.ctx.lineWidth = 2;
	this.ctx.moveTo(this.xo, 0);
	this.ctx.lineTo(this.xo, this.height);
	this.ctx.moveTo(0, this.yo);
	this.ctx.lineTo(this.width, this.yo);
	this.ctx.stroke();
	
	this.ctx.strokeStyle = "#DDDDDD";
	this.ctx.lineWidth = 0.75;
	
	for (i = this.xo; i > 0; i -= this.pxPerM)
	{
		/* Horizontal left of the origin. */
		this.ctx.moveTo(this.xo - i, 0);
		this.ctx.lineTo(this.xo - i, this.height);
	}
	
	for (i = this.pxPerM; i < this.width - this.xo; i += this.pxPerM)
	{
		/* Horizontal right of the origin. */
		this.ctx.moveTo(this.xo + i, 0);
		this.ctx.lineTo(this.xo + i, this.height);
	}
	
	for (i = this.yo; i > 0; i -= this.pxPerM)
	{
		/* Vertical above the origin. */
		this.ctx.moveTo(0, this.yo - i);
		this.ctx.lineTo(this.width, this.yo - i);
	}

	for (i = this.pxPerM; i < this.height - this.yo; i += this.pxPerM)
	{
		/* Vertical below the origin. */
		this.ctx.moveTo(0, this.yo + i);
		this.ctx.lineTo(this.width, this.yo + i);
	}
	
	this.ctx.stroke();
};

Ranger.prototype.drawScan = function(scan){
	var i = 0, s,
		r = this.minAngle - this.rotation, 
		radius = this.maxRange * this.pxPerM,
		xd, yd;
	
	if (scan) this.scan = scan; // Drawing new frame because of new data.
	else scan = this.scan;      // Drawing a frame some other reason so use last scan
	
	this.ctx.strokeStyle = "#BA0000";
	this.ctx.lineWidth = 0.5;
	this.ctx.fillStyle = "rgba(255, 40, 40, 0.75)";
	this.ctx.beginPath();
	this.ctx.moveTo(this.xo, this.yo);
	
	if (scan[0] == 0.0)
	{
		/* The range is infinite so a line is drawn to the start of the arc. */
		this.ctx.lineTo(this.xo - radius * Math.sin(this.minAngle - Math.PI / 2 - this.rotation), 
						this.yo + radius * Math.cos(this.minAngle - Math.PI / 2 - this.rotation));
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

Ranger.prototype.drawDetails = function() {
	/* Direction arrows. */
	var size = 20;
	this.ctx.save();
	this.ctx.translate(this.xo, this.yo);
	this.ctx.rotate(-this.rotation);
	
	
	this.ctx.beginPath();
	this.ctx.moveTo(this.xo - 2 * size - this.xo, this.yo - size / 4 - this.yo);
	this.ctx.lineTo(this.xo - 2 * size - this.xo, this.yo + size / 4 - this.yo);
	this.ctx.lineTo(this.xo + size - this.xo, this.yo + size / 4 - this.yo);
	this.ctx.lineTo(this.xo + size - this.xo, this.yo + size / 1.5 - this.yo);
	this.ctx.lineTo(this.xo + 3 * size - this.xo, this.yo - this.yo);
	this.ctx.lineTo(this.xo + size - this.xo, this.yo - size / 1.5 - this.yo);
	this.ctx.lineTo(this.xo + size - this.xo, this.yo - size / 4 - this.yo);
	this.ctx.lineTo(this.xo - 2 * size - this.xo, this.yo - size / 4 - this.yo);
	this.ctx.closePath();
	

	this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
	this.ctx.fill();
	
	this.ctx.restore();
	
};

Ranger.prototype.destroy = function() {
	this.mainLoopEnd = true;
	$(document).unbind("mousemove.ranger mouseup.ranger");
	this.$w.remove();
};

/* ----------------------------------------------------------------------------
 * -- On board camera                                                        --
 * ---------------------------------------------------------------------------- */
function OnboardCamera(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "obcamera-panel";
	this.title = "Onboard Camera";
}
OnboardCamera.prototype = new IWidget;

OnboardCamera.prototype.init = function() {
	
	this.pageAppend("Onboard Loading...");
};

function OverheadCamera(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "ovcamera-panel";
	this.title = "Overhead Camera";
}
OverheadCamera.prototype = new IWidget;

OverheadCamera.prototype.init = function() {
	this.pageAppend("Overhead Loading...");
};

