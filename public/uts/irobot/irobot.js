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
IRobot.MODE_CONTROLLER   = "OpModeController";
IRobot.MANUAL_CONTROLLER = "DrivingRobotController";
IRobot.NAV_CONTROLLER    = "NavigationRobotController";

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
	
	this.determineMode();
};

IRobot.prototype.determineMode = function() {
	var thiz = this;
	$.get(
		"/primitive/json/pc/" + IRobot.MODE_CONTROLLER + "/pa/getMode",
		null,
		function (resp) {
			if (typeof resp != "object")
			{
				/* Probably logged out. */
				// FIXME 
//				window.location.reload();
				return;
			}
				
			thiz.displayMode(parseInt(resp.value));
		}
	);
};

/**
 * Changes the page mode.
 * 
 * @param mode mode number
 */
IRobot.prototype.displayMode = function(mode) {
	var thiz = this;
	if (mode == 4)
	{
		/* If in mode transition, keep polling to determine whether the mode
		 * is ready to be used. */
		setTimeout(function() { thiz.determineMode(); }, 2000);
	}
	else
	{
		/* This is to tickle the server so we are not timed out because of no
		 * activity. */
		setTimeout(function() { thiz.determineMode();}, 30000);
	}
		
	if (this.mode == mode) return;
	
	this.log("Changing display mode to " + mode);
	
	/* Tear down old mode. */
	this.modeSelector.clearSelected();
	while (this.widgets.length > 0) this.widgets.pop().destroy();
		
	switch (mode)
	{
	case 0: // No mode set.
		break;
	
	case 1: // Manual mode
		this.widgets.push(new DPad(this));
		this.widgets.push(new Ranger(this));
		this.widgets.push(new OnboardCamera(this));
		this.widgets.push(new OverheadCamera(this));
		break;
		
	case 2: // Logging mode
		var nav = new Nav(this),
			ds = new LogDataSets(this);
		
		this.widgets.push(nav);
		this.widgets.push(new NavControl(this, nav, ds));
		this.widgets.push(ds);
		this.widgets.push(new OverheadCamera(this));
		break;
		
	case 3: // Code upload mode
		this.log("Code mode not implemented", IRobot.WARN);
		break;
		
	case 4: // Mode transition mode.
		this.log("Waiting for mode transition to complete.", IRobot.DEBUG);
		// FIXME mode transition overlay
		break;

	default:
		this.log(IRobot.ERROR, "Unknown mode: " + mode);
	}
	
	this.mode = mode;
	
	var i = 0;
	for (i in this.widgets) this.widgets[i].init();
	this.modeSelector.setSelected(mode);
};

IRobot.prototype.changeMode = function(mode) {
	this.displayMode(4); // Mode transition mode.
	
	$.post(
			"/primitive/json/pc/" + IRobot.MODE_CONTROLLER + "/pa/setMode",
			{
				mode: mode
			},
			function (resp) {
				if (typeof resp != "object")
				{
					/* Probably logged out. */
					window.location.reload();
					return;
				}
					
				var i = 0;
				for (i in resp)
				{
					if (i.name == "mode") thiz.displayMode(parseInt(i.value));
				}
			}
		);
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
IWidget.prototype.pageAppend = function(contents, classes) {
	if (!classes) classes = "";
	var html = "<div id='" + this.wid + "' class='widget-box mode-" + this.control.mode + " " + classes + "'>" +
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
		thiz.control.changeMode(parseInt($(this).attr("id").substr(4)));
	});
};

ModeSelector.prototype.setSelected = function(mode) {
	this.$w.children("#mode" + mode).addClass("active");
};

ModeSelector.prototype.clearSelected = function() {
	this.$w.children("a.active").removeClass("active");
};

function TransitionOverlay(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "t-overlay";
}
TransitionOverlay.prototype = new IWidget;

TransitionOverlay.prototype.init = function() {
	this.pageAppend(
		"<img src='/uts/irobot/images/large_spinner.gif' alt='loading' />" +
		"Loading..."
	);
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
	
	var canvas = $("#ranger")[0];
	if (canvas.getContext)
	{
		this.ctx = canvas.getContext("2d");
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
	
	if (this.angularRes == 0 && !this.mainLoopEnd)
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
 * -- Navigiation control                                                    --
 * ---------------------------------------------------------------------------- */
function NavControl(pc, nav, ds)
{
	IWidget.call(this, pc);
	this.wid = "nav-control-container";
	
	this.nav = nav;
	this.ds = ds;
	
	this.hasStatus = false;
	this.settingStatus = false;
	this.stopMainLoop = false;
	
	this.isRunning = false;
	this.isLocalized = false;
}
NavControl.prototype = new IWidget;

NavControl.prototype.init = function() {
	this.pageAppend(
			"<div id='nav-control-button' class='commonbutton'>" +
				"<img src='/uts/irobot/images/spinner.gif' alt='s' /><br />" + 
				"Please wait..." +
			"</div>" +
			"<div id='nav-led-bar'>" +
				"<div id='running-led' class='led red-led'></div>" +
				"<div class='nav-led-label'>Running</div>" +
				"<div id='loc-led' class='led red-led'></div>" +
				"<div class='nav-led-label'>Localised</div>" +
			"</div>",
			"leftpush"
	);
	
	var thiz = this;
	$(("#nav-control-button")).click(function() { thiz.clicked(); });
	
	this.mainLoop();
};

NavControl.prototype.destroy = function() {
	this.stopMainLoop = true;
	this.$w.remove();
};

NavControl.prototype.clicked = function() {
	if (!this.hasStatus || this.settingStatus)
	{
		/* Still waiting for status to determine what we need to do. */
		return;
	}
	
	this.settingStatus = true;
	
	var thiz = this, html;
	
	if (this.isRunning)
	{
		html = "<img src='/uts/irobot/images/spinner.gif' alt='s' /><br />" + 
				"Stopping...";
	}
	else
	{
		html = "<img src='/uts/irobot/images/spinner.gif' alt='s' /><br />" + 
			   "Starting...";
	}
	
	$("#nav-control-button").html(html);

	$.post(
		"/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/" + (this.isRunning ? "stop" : "start"),
		null,
		function(resp) {
			thiz.setRunning(typeof resp == "object" && resp.value == "true");
			thiz.settingStatus = false;
		}
	);
};

NavControl.prototype.mainLoop = function() {
	var thiz = this;
	
	$.ajax({
		url: "/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/packet",
		success: function(resp) {
			if (typeof resp != "object")
			{
				/* Probably session timeout. */
				window.location.reload();
				return;
			}
			
			/* Check we haven't shutdown. */
			if (thiz.stopMainLoop) return;
			
			thiz.nav.path = [];
			
			/* Parse response values. */
			var i = 0, running = false, localized = false, files = [], tmp;
			for (i in resp)
			{
				switch (resp[i].name)
				{
				case 'running':
					running = thiz.nav.isRunning = "true" == resp[i].value;
					break;
					
				case 'localized':
					localized = thiz.nav.isLocalized = "true" == resp[i].value;
					break;
					
				case 'pose':
					thiz.nav.pose = thiz.parseTuple(resp[i].value);
					break;
				
				case 'goal':
					thiz.nav.goal = thiz.parseTuple(resp[i].value);
					break;
					
				case 'logging':
					thiz.ds.setLogging("true" == resp[i].value);
					break;
					
				default:
					if (resp[i].name.indexOf("wp-") === 0)
					{
						thiz.nav.path[parseInt(resp[i].name.substr(3))] = thiz.parseTuple(resp[i].value);
					}
					else if (resp[i].name.indexOf("lf-") === 0)
					{
						tmp = resp[i].value.split("=", 2);
						files[parseInt(resp[i].name.substr(3))] = {
							name: tmp[0],
							ready: tmp.length > 0 ? tmp[1] == "true" : false
						};
					}
					else
					{
						thiz.control.log("Unknown navigation field: " + resp[i].name);
					}
				}
			}
			
			/* Update nav control status. */
			if (!thiz.hasStatus || thiz.isRunning != running)
			{
				thiz.hasStatus = true;
				thiz.setRunning(running);
			}
			
			if (thiz.isLocalized != localized) thiz.setLocalized(localized);
			
			/* Draw new nav map frame. */
			thiz.nav.draw();
			
			thiz.ds.setFiles(files);
			
			/* Next packet update in 1000. */
			setTimeout(function() { thiz.mainLoop(); }, 1000);
		},
		error: function(xhr, err) {
			thiz.control.log("Failed making navigiatin data packet request with error: " + err, IRobot.WARN);
			
			if (!thiz.stopMainLoop) setTimeout(function() { thiz.mainLoop(); }, 2000);
		}
	});
};

NavControl.prototype.parseTuple = function(t) {
	var p = t.split(",");
	
	return {
		x: parseFloat(p[0]),
		y: parseFloat(p[1]),
		a: parseFloat(p[2])
	};
};

NavControl.prototype.setRunning = function(running) {
	this.isRunning = running;
	
	if (this.isRunning)
	{
		html = "<img src='/uts/irobot/images/stop.png' alt='s' /><br />" + 
				"Stop";
		$("#running-led").removeClass("red-led").addClass("green-led");
	}
	else
	{
		html = "<img src='/uts/irobot/images/start.png' alt='s' /><br />" + 
			   "Start";
		$("#running-led").removeClass("green-led").addClass("red-led");
	}
	
	$("#nav-control-button").html(html);
};

NavControl.prototype.setLocalized = function(localized) {
	this.isLocalized = localized;
	if (this.isLocalized)
	{
		$("#loc-led").removeClass("red-led").addClass("green-led");
	}
	else
	{
		$("#loc-led").removeClass("green-led").addClass("red-led");
	}
};

/* ----------------------------------------------------------------------------
 * -- Navigation map and paths                                               --                       
 * ---------------------------------------------------------------------------- */
function Nav(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "nav-panel";
	this.title = "Navigation";
	
	this.canavs = null;
	this.width = 644;
	this.height = 333;
	this.offX = 0;
	this.offY = 0;
	
	this.ctx = null;
	this.map = null;
	
	this.pxPerM = 100; // From the player mapfile driver configuration
	this.xo = this.width / 2;
	this.yo = this.height / 2;
	this.r = 0.25 * this.pxPerM;
	
	this.isRunning = false;
	this.isLocalized = false;
	this.pose = {
		x: 0,
		y: 0,
		a: 0
	};
	
	this.goal = {
		x: 0,
		y: 0,
		a: 0
	};
	this.path = [ ];
	
	this.movePose = this.pose;
	this.doDragMove = true;
	this.isDragging = false;
	this.dragX = 0;
	this.dragY = 0;
	this.isYawSetting = false;
	this.isSettingPose = false;
}
Nav.prototype = new IWidget;

Nav.prototype.init = function() {
	this.pageAppend("<canvas id='nav' width='" + this.width + "' height='" + this.height + "'></canvas>");
	
	this.canvas = $("#nav")[0];
	if (this.canvas.getContext)
	{
		this.ctx = this.canvas.getContext("2d");
		this.draw();
	}
	else
	{
		alert("Using this interface requires a modern browser.");
	}
	
	if (this.doDragMove)
	{
		var thiz = this,
			$c = $(this.canvas)
				.mousedown(function(evt) { thiz.moveStart(evt); })
				.bind('mouseleave mouseup', function (evt)  { thiz.moveStop(evt); });
		
		this.offX = $c.offset().left;
		this.offY = $c.offset().top;
	}
		
};

Nav.prototype.draw = function(moving) {
	/* If we are dragging the robot we don't want the actual
	 * pose to overwrite the drag pose 	 */
	if ((this.isDragging || this.isYawSetting || this.isSettingPose) && !moving) return;
	
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.drawFrame();
	this.drawGoal();
	this.drawPath();
	this.drawRobot(moving);
};

Nav.prototype.drawFrame = function() {	
	var i;
	
	/* Grid lines. */
	this.ctx.save();
	this.ctx.beginPath();
	for (i = this.xo; i > 0; i -= this.pxPerM) // East horizontal lines
	{
		this.ctx.moveTo(i, 0);
		this.ctx.lineTo(i, this.height);
	}
	
	for (i = this.xo + this.pxPerM; i < this.width; i += this.pxPerM) // West horizontal lines
	{
		this.ctx.moveTo(i, 0);
		this.ctx.lineTo(i, this.height);
	}
	
	for (i = this.yo; i > 0; i -= this.pxPerM) // North vertical lines
	{
		this.ctx.moveTo(0, i);
		this.ctx.lineTo(this.width, i);
	}
	
	for (i = this.yo + this.pxPerM; i < this.height; i += this.pxPerM) 	// South vertical lines
	{
		this.ctx.moveTo(0, i);
		this.ctx.lineTo(this.width, i);
	}
	this.ctx.closePath();
	
	this.ctx.strokeStyle = "#DDDDDD";
	this.ctx.lineWidth = 0.75;
	this.ctx.stroke();
	this.ctx.restore();
	
	/* Origin marker. */
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.moveTo(this.xo - 6, this.yo - 6);
	this.ctx.lineTo(this.xo + 6, this.yo + 6);
	
	this.ctx.moveTo(this.xo + 6, this.yo - 6);
	this.ctx.lineTo(this.xo - 6, this.yo + 6);
	
	this.ctx.moveTo(this.xo, 0);
	this.ctx.lineTo(this.xo, this.height);
	
	this.ctx.moveTo(0, this.yo);
	this.ctx.lineTo(this.width, this.yo);
	this.ctx.closePath();
	
	this.ctx.strokeStyle = "#AAAAAA";
	this.ctx.lineWidth = 1;
	this.ctx.stroke();
	this.ctx.restore();
	
	/* Maze walls. */
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.moveTo(0, 0);
	this.ctx.lineTo(this.width, 0);
	this.ctx.lineTo(this.width, this.height);
	this.ctx.lineTo(0, this.height);
	this.ctx.lineTo(0, 0);
	
	this.ctx.moveTo(146, 0);
	this.ctx.lineTo(146, 61);
	
	this.ctx.moveTo(347, 0);
	this.ctx.lineTo(347, 120);
	
	this.ctx.moveTo(145, this.height);
	this.ctx.lineTo(145, 232);
	this.ctx.lineTo(246, 232);
	this.ctx.lineTo(246, 182);
	
	this.ctx.moveTo(495, this.height);
	this.ctx.lineTo(495, 182);
	this.ctx.closePath();
	
	this.ctx.strokeStyle = "#AAAAAA";
	this.ctx.shadowColor = "#606060";
	this.ctx.shadowBlur = 1;
	this.ctx.lineWidth = 2;
	this.ctx.lineCap = "round";
	this.ctx.stroke();
	this.ctx.restore();
};

Nav.prototype.drawRobot = function(moving) {
	if (!this.isRunning) return;
	
	/* Robot coords are relative to the orgin in the centre of diagram. */
	var x = this.xo + (moving ? this.movePose.x : this.pose.x) * this.pxPerM,
		y = this.yo - (moving ? this.movePose.y : this.pose.y) * this.pxPerM,
		a = (moving ? this.movePose.a : this.pose.a) + Math.PI / 2;

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.arc(x, y, this.r, 0, Math.PI * 2);
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a + Math.PI / 6), y + this.r * Math.cos(a + Math.PI / 6));
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a - Math.PI / 6), y + this.r * Math.cos(a - Math.PI / 6));
		
	this.ctx.closePath();
	
	if (this.isDragging || this.isYawSetting|| this.isSettingPose)
	{
		this.ctx.shadowBlur = 10;
		this.ctx.shadowColor = "#666666";
	}
	else
	{
		this.ctx.shadowBlur = 3;
		this.ctx.shadowColor = "#AAAAAA";
	}
	
	this.ctx.strokeStyle = "#333333";
	this.ctx.globalAlpha = 0.7;
	this.ctx.lineWidth = 2;
	this.ctx.fillStyle = "#EA3D3D";


	this.ctx.fill();
	this.ctx.stroke();

	this.ctx.restore();
};

Nav.prototype.drawGoal = function() {
	if (!(this.isRunning && this.isLocalized)) return;
	this.drawWayPoint(this.xo + this.goal.x * this.pxPerM, this.yo - this.goal.y * this.pxPerM, 25);
};

Nav.prototype.drawPath = function() {
	if (!this.isRunning || this.path.length == 0) return;
	
	var num = this.path.length, x, y, i, wp, pts = {};
	
	this.ctx.save();
	this.ctx.beginPath();
	
	for (i = 0; i < num; i++)
	{
		wp = this.path[i];
		
		x = this.xo + wp.x * this.pxPerM;
		y = this.yo - wp.y * this.pxPerM;
		
		pts[x] = y;
		
		if (i == 0) this.ctx.moveTo(x, y);
		else        this.ctx.lineTo(x, y);
	}
	
	this.ctx.strokeStyle = "#EA3D3D";
	this.ctx.lineWidth = 3;
	this.ctx.stroke();
	this.ctx.restore();
	
	for (i in pts) this.drawWayPoint(i, pts[i]);
};

Nav.prototype.drawWayPoint = function(x, y, sz) {
	if (!sz) sz = 15;
	
	this.ctx.save();
	this.ctx.beginPath();
	
	x = parseInt(x);
	y = parseInt(y);
	
	this.ctx.moveTo(x - sz, y - sz);
	this.ctx.lineTo(x + sz, y - sz);
	this.ctx.lineTo(x, y + sz);
	this.ctx.lineTo(x - sz, y - sz);
	
	this.ctx.closePath();
	
	this.ctx.globalAlpha = 0.7;
	this.ctx.strokeStyle = "#333333";
	this.ctx.lineWidth = 2;
	this.ctx.fillStyle = "#EA3D3D";

	this.ctx.fill();
	this.ctx.stroke();
	
	this.ctx.restore();
};

Nav.prototype.moveStart = function(e) {
	if (!this.isRunning) return;
	
	/* If we are not running or already moving, don't allow it again. */
	if (this.isDragging || this.isYawSetting || this.isSettingPose) return;
	
	/* Determine whether we are in the robot radius. */
	if (Math.abs(e.pageX - this.offX - this.xo - this.pose.x * this.pxPerM) > this.r || 
		Math.abs(e.pageY - this.offY - this.yo + this.pose.y * this.pxPerM) > this.r) return;

	this.isDragging = true;
	
	var thiz = this;
	$(this.canvas).bind("mousemove", function (evt) {
		thiz.move(evt);
	});
	
	this.movePose = this.pose;
	this.dragX = e.pageX;
	this.dragY = e.pageY;
};

Nav.prototype.move = function(e) {
	if (this.isDragging)
	{
		this.movePose.x -= (this.dragX - e.pageX) / this.pxPerM;
		this.dragX = e.pageX;
		this.movePose.y += (this.dragY - e.pageY) / this.pxPerM;
		this.dragY = e.pageY;
		
		this.draw(true);
	}
	else if (this.isYawSetting)
	{
		var x0 = this.xo + this.movePose.x * this.pxPerM,
			y0 = this.yo - this.movePose.y * this.pxPerM,
			x1 = e.pageX - this.offX,
			y1 = e.pageY - this.offY;
		
		/* We want to robot rotation to follow the mouse. */
		this.movePose.a = Math.atan2(x1 - x0, y1 - y0) - Math.PI / 2;
		
		this.draw(true);
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(x0, y0);
		this.ctx.lineTo(x1, y1);
		
		this.ctx.strokeStyle = "#333333";
		this.ctx.lineWidth = 2;
		this.ctx.globalAlpha = 0.7;
		this.ctx.shadowBlur = 10;
		this.ctx.shadowColor = "#666666";
		
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	}
};

Nav.prototype.moveStop = function(e) {
	var thiz = this;
	
	if (this.isDragging)
	{
		/* Drag complete, next is setting yaw. */
		this.isDragging = false;
		this.isYawSetting = true;
		
		$(this.canvas).bind("mouseup.yaw", function(evt) { thiz.moveStop(evt); });
	}
	else if (this.isYawSetting)
	{
		/* Move and yaw set complete. */
		this.isYawSetting = false;
		$(this.canvas).unbind('mousemove mouseup.yaw');
		
		/* Move and yaw set complete, send pose. */
		this.isSettingPose = true;
		
		$.post(
			"/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/setPose",
			this.movePose,
			function(resp) {
				setTimeout(function() {
					thiz.finishMove();
				}, 500);
			}
		);
	}
};

Nav.prototype.finishMove = function() {
	this.isSettingPose = false;
};

Nav.prototype.destroy = function() {
	this.$w.remove();
};


/* ----------------------------------------------------------------------------
 * -- Log data list                                                          --
 * ---------------------------------------------------------------------------- */
function LogDataSets(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "log-ds-container";
	this.title = "Data Sets";
	
	this.files = { };
	this.hasFiles = false;
	this.fileOp = false;
	
	this.logging = false;
	this.settingStatus = false;
}
LogDataSets.prototype = new IWidget;

LogDataSets.prototype.BASE_PATH = "robot";

LogDataSets.prototype.init = function() {
	this.pageAppend(
			"<div id='log-ds-enable' class='commonbutton'>" +
				"<div id='log-led' class='led red-led'></div>" +
				"<span>Not Logging</span>" +
			"</div>" +
			"<div id='log-ds'>" +

			"</div>",
			"leftpush"
	);

	var thiz = this;
	$("#log-ds-enable").click(function() { thiz.clicked(); });
};

LogDataSets.prototype.clicked = function() {
	if (this.settingStatus) return;
	
	this.setLogging(!this.logging);
	this.settingStatus = true;
	
	var thiz = this;
	$.post(
		"/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/setLogging",
		{ log: this.logging },
		function(resp) {
			if (typeof resp != "object")
			{
				window.location.reload();
				return;
			}
			
			thiz.settingStatus = false;
		}
	);
};

LogDataSets.prototype.setLogging = function(logging) {
	/* We don't want to LED to flicker when setting status. */
	if (this.settingStatus) return;
	
	this.logging = logging;
	$("#log-led")
		.removeClass((this.logging ? "red" : "green") + "-led")
		.addClass((this.logging ? "green" : "red") + "-led");
	$("#log-ds-enable span").text(this.logging ? "Logging" : "Not Logging");
};

LogDataSets.prototype.setFiles = function(files) {
	/* We may get an inconsistent state when files are being delete so block
	 * updates until the op is complete. */
	if (this.fileOp) return;
	
	files.reverse();
	if (files.length > 0)
	{
		var html = "<ul id='log-ds-files'>", i = 0 , f, thiz = this;
		for (i in files)
		{
			f = files[i];
			
			html += "<li>";
			
			if (f.ready)
			{
				html += 
					"<a class='ds-ready plaina' href='/home/download/file/" + f.name + ".zip'>" +
						"<span class='ui-icon ui-icon-circle-arrow-s'></span>" +
						f.name +
					"</a>" +
					"<div class='ds-delete' title='" + f.name + "'>" +
						"<span class='ui-icon ui-icon-trash'></span>" +
					"</div>" +
					"<div style='clear:left'></div>";				
			}
			else
			{
				html +=
					"<div class='ds-not-ready'>" +
						"<span class='not-ready ui-icon ui-icon-clock'></span>" + f.name + 
					"</div>";
			}
			
			html += "</li>";
		}
		
		html += "</ul>";

		$("#log-ds").empty().append(html);
		$("#log-ds .ds-delete").click(function() {
			thiz.deleteFile($(this).attr("title"), this);
		});
	}
	else if (files.length != this.files.length || !this.hasFiles)
	{
		$("#log-ds").empty().append(
				"<div class='no-ds'>" +
					"Generate datasets by first enabling logging then starting navigation." +
				"</div>"
		);
	}
	
	this.files = files;
	this.hasFiles = true;
};

LogDataSets.prototype.deleteFile = function (file, node) {
	this.fileOp = true;
	
	$(node).parent().remove();
	
	$.post(
		"/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/deleteDataset",
		{
			file: file
		},
		function () {
			this.fileOp = false;
			this.hasFiles = false;
		}
	);
};

/* ----------------------------------------------------------------------------
 * -- Camera widget base                                                     --
 * ---------------------------------------------------------------------------- */
function CameraWidget(pc)
{
	IWidget.call(this, pc);
	
	this.urls = {};
	this.width = 320,
	this.height = 240;
}
CameraWidget.prototype = new IWidget;

CameraWidget.prototype.init = function() {
	this.pageAppend(
			"<div id='" + this.cameraBox + "' class='camera-box'>" +
				"<div class='camera-text'>Loading...</div>" +
			"</div>"
	);
	
//	$.get(
//		"/session/attributebridge",
//		{
//			attribute: this.prop
//		},
//		function (resp) {
//			if (typeof resp != "object")
//			{
//				window.location.reload();
//				return;
//			}
//			
//			var ps = resp.value.split(";"), i = 0, p;
//			for (i in ps)
//			{
//				p = ps[i].indexOf(":");
//				
//				
//			}
//		}
//	);
	
	// FIXME
	if (this.urls.swf)
	{
		this.deploySWF();
	}
};

CameraWidget.prototype.deployMJpeg = function() {
	if (!this.urls.mjpeg)
	{
		this.control.log("Unable to deploy MJPEG stream because it is no MJPEG URL is set.", IRobot.ERROR);
		return;
	}
	
	if ($.browser.msie)
	{
		/* Internet Explorer does not support MJPEG streaming so a Java applet 
		 * is streaming. */
		$("#" + this.cameraBox).html(
				'<applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" ' + 
						'width="' + this.width + '" height="' + this.height + '">' +
					'<param name="url" value="' + this.urls.mjpeg + '"/>' +
					'<param name="accessories" value="none"/>' +
				'</applet>'
		);
	}
	else
	{
		$("#" + this.cameraBox).html(
				"<div height:" + (vcameras[id].height + 20) + "px'>" +
				"	<img src='" + this.urls.mjpeg + "?" + new Date().getTime() + "' alt='stream'/>" +
				"</div>"
		);
	}
};

CameraWidget.prototype.deploySWF = function() {
	if ($.browser.msie)
	{
		$("#" + this.cameraBox).html(
				'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
						'width="' + this.width + '" height="' + this.height + '" ' +
						' id="' + this.cameraBox + 'movie" align="middle">' +
					'<param name="movie" value="' + this.urls.swf + '" />' +
					'<a href="http://www.adobe.com/go/getflash">' +
						'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" ' +
								'alt="Get Adobe Flash player"/>' +
					'</a>' +
				'</object>'
		);
	}
	else
	{
		$("#" + this.cameraBox).html(
				 '<object type="application/x-shockwave-flash" data="' + this.urls.swf + '" ' +
				 		'width="' +  this.width  + '" height="' + this.height + '">' +
			        '<param name="movie" value="' + this.urls.swf + '"/>' +
			        '<a href="http://www.adobe.com/go/getflash">' +
		            	'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" ' +
		            			'alt="Get Adobe Flash player"/>' +
		            '</a>' +
		        '</object>'
		);
	}
	
	/* Flash movies have a 16000 frame limit, so after 7 minutes, the movie
	 * is reloaded so it never hits the limit. */
	var thiz = this;
	this.swfTimeout = setTimeout(function() {
		thiz.freshenSWF();
	}, 7 * 60 * 1000);
};

CameraWidget.prototype.freshenSWF = function() {
	this.deploySWF();
};

CameraWidget.prototype.deployFLV = function() {
		var player = flowplayer(this.cameraBox, {
			src: "/swf/flowplayer.swf",
			wmode: 'direct'
		}, 
		{
			autoPlay: true,
			buffering: true,
			playlist: [ 
			    this.urls.flv
			],
			clip: {
				bufferLength: 1
			},
			plugins: {
				controls: null // Disable the control bar
			}
	});

	player.load();
};

/* ----------------------------------------------------------------------------
 * -- On board camera                                                        --
 * ---------------------------------------------------------------------------- */
function OnboardCamera(pc)
{
	CameraWidget.call(this, pc);
	
	this.wid = "obcamera-panel";
	this.title = "Onboard Camera";
	
	this.cameraBox = "obcamera";
	
	this,prop = "iRobot_Onboard_Camera";
}
OnboardCamera.prototype = new CameraWidget;

/* ----------------------------------------------------------------------------
 * -- Over head camera                                                       --
 * ---------------------------------------------------------------------------- */
function OverheadCamera(pc)
{
	CameraWidget.call(this, pc);
	
	this.wid = "ovcamera-panel";
	this.title = "Overhead Camera";
	
	this.cameraBox = "ovcamera";
	this.width = 640;
	this.height = 480;
	
	this,prop = "iRobot_Overhead_Camera";
	
	this.urls = {
		MJPEG: "http://robotmonitor1.eng.uts.edu.au:7070/camera1.mjpg",
		swf:   "http://robotmonitor1.eng.uts.edu.au:7070/camera1.swf",
		flv:   "http://robotmonitor1.eng.uts.edu.au:7070/camera1.flv"
	};
}
OverheadCamera.prototype = new CameraWidget;

