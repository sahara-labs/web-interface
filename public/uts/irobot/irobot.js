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
				return;
			}
			var m = parseInt(resp.value);
			if (m == 0)
			{
				thiz.changeMode(1);
			}		
			else thiz.displayMode(m);
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
		this.widgets.push(new OverheadCameraControl(this));
		break;
		
	case 2: // Logging mode
		var nav = new Nav(this),
			ds = new LogDataSets(this);
		
		this.widgets.push(nav);
		this.widgets.push(new NavControl(this, nav, ds));
		this.widgets.push(ds);
		this.widgets.push(new OverheadCamera(this));
		this.widgets.push(new OverheadCameraControl(this));
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
			if (typeof resp == "object" && cb)
			{
				cb.call(resp);
			}
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
		.bind("mousedown touchstart", function() {
			var id = $(this).attr("id");
			thiz.fingerPress(id.substring(0, id.indexOf("-")), this);
		})
		.bind("mouseup touchend mouseleave touchleave", function() {
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
	this.globalFrame = false;
	
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
	
	/* Global frame enable / disable. */
	html += "<div id='global-frame-enable'>" +
				"<span class='ui-icon ui-icon-refresh disabled'></span>" +
			"</div>";
	
	/* Top zoom bar. */
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
	$("#zoom-bar-indicator").draggable({
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
	}).hover(function() {
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
		handle: '.rot-bar-ind',
		drag: function(evt, ui) {
			var height = ui.position.top;
			
			if (thiz.globalFrame)
			{
				/* Manually rotating ranger will drop global frame rotation. */
				thiz.globalFrame = false;
				$("#global-frame-enable span").addClass("disabled");
			}
			
			thiz.rotation = (height / 181 * 2 * Math.PI) + Math.PI / 2;
			thiz.drawFrame();
		}
	}).hover(function() {
			$(this).children(".bar-ind").addClass("bar-ind-hover");
		},
		function() {
			$(this).children(".bar-ind").removeClass("bar-ind-hover");
		}
	);
	
	/* Toggle ranger global frame. */	
	$("#global-frame-enable").click(function () {
		thiz.globalFrame = !thiz.globalFrame;
		if (thiz.globalFrame) $(this).children("span").removeClass("disabled"); 
		else $(this).children("span").addClass("disabled");
	});
	
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
			if (typeof resp == "object")
			{
				thiz.parseConf(resp);
			}
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
				
			var s = [], a = 0, i = 0;
			for (i in resp)
			{
				switch (resp[i].name)
				{
				case 'ranger':
					s = eval(resp[i].value);
					break;
				case 'direction':
					a= parseFloat(resp[i].value);
					break;
				}
			}
			
			thiz.drawFrame(s, a);
			
			setTimeout(function() {
				thiz.mainLoop();
			}, 500);
		},
		error: function(xhr, status, err) {
			thiz.control.log("Failed to obtain ranger scan, with status: " + status + ". Trying again in 1 second.",
					IRobot.WARN);
			setTimeout(function() {
				thiz.mainLoop();
			}, 2000);
		}
	});
};

Ranger.prototype.drawFrame = function(scan, alpha) {
	if (this.globalFrame) 
	{
		/* If in global frame, adjust the position of the rotation
		 * indicator otherwise ignored global frame. */
		this.rotation = alpha;
		$("#rot-bar-indicator").css("top", Math.abs((this.rotation - Math.PI / 2) * 181 / (2 * Math.PI)) + "px");
	}
	
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
			if (!thiz.hasStatus || (!thiz.settingStatus && thiz.isRunning != running))
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
 v* -- Navigation map and paths                                               --                       
 * ---------------------------------------------------------------------------- */
function Nav(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "nav-panel";
	this.title = "Navigation";
	
	/* Interface custimisation. */
	this.doDragMove = true;
	this.doCovSet = true;
	
	/* DOM objects. */
	this.canvas = null;
	this.map = null;
	
	/* Canvas context. */
	this.ctx = null;
	
	/* Canvas dimensions. */
	this.width = 644;
	this.height = 333;
	
	/* Offset from page. */
	this.offX = 0;
	this.offY = 0;
	
	/* Current mouse position. */
	this.mouse = { x: 0, y: 0 };
		
	/* Scalaing factors between player coords and canvas coords. */
	this.pxPerM = 100; 			 // From the player mapfile driver configuration
	this.xo = this.width / 2;    // Player uses the center as origin
	this.yo = this.height / 2;
	this.r = 0.25 * this.pxPerM; // Robot radius
	this.startPose = { x: 1.3, y: 0.8, a: Math.PI * 5 / 4 };
	
	/* Interface states. */
	this.isRunning = false;
	this.isLocalized = false;
	
	/* Move states: 
	 * 	0 -> No moving, 
	 * 	1 -> moving pose, 
	 * 	2 -> setting pose covariance,
	 * 	3 -> setting yaw, 
	 * 	4 -> setting yaw covaraince, 
	 * 	5 -> setting covariance. */
	this.moveState = 0;      
	
	/* Player provided positions. */
	this.pose = { x: 0, y: 0, a: 0 };
	this.goal = { x: 0, y: 0, a: 0 };
	this.path = [ ];
	
	/* Moved position. */
	this.movePose = { x: 0, y: 0, a: 0, cx: Nav.DEFAULT_COV, cy: Nav.DEFAULT_COV, ca: Nav.DEFAULT_ACOV };
	
	/* Absolute drag positions. */
	this.dragX = 0;
	this.dragY = 0;
	
	/* Drag handles. */
	this.dragHandles = new Array;
	this.isDragHandling = false;
}
Nav.prototype = new IWidget;

Nav.DEFAULT_COV = 1;
Nav.DEFAULT_ACOV = Math.PI / 6;

Nav.prototype.init = function() {
	this.pageAppend("<canvas id='nav' width='" + this.width + "' height='" + this.height + "'></canvas>" +
					"<div id='nav-status'> </div>");
	
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
				.bind('mouseup', function (evt)  { thiz.moveStop(evt); });
		
		this.offX = $c.offset().left;
		this.offY = $c.offset().top;
	}
};

Nav.prototype.draw = function(moveFrame) {
	/* If we are dragging the robot we don't want the actual
	 * pose to overwrite the drag pose 	 */
	if (this.moveState > 0 && !moveFrame) return;
	
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.drawSkeleton();
	this.drawStartPoseRobot();
	this.drawGoal();
	this.drawPath();
	this.drawRobot(moveFrame);
};

Nav.prototype.drawSkeleton = function() {	
	var i;
	
	/* Grid lines. */
	this.ctx.save();
	this.ctx.beginPath();
	for (i = this.xo; i > 0; i -= this.pxPerM)                         // East horizontal lines
	{
		this.ctx.moveTo(i, 0);
		this.ctx.lineTo(i, this.height);
	}
	
	for (i = this.xo + this.pxPerM; i < this.width; i += this.pxPerM)  // West horizontal lines
	{
		this.ctx.moveTo(i, 0);
		this.ctx.lineTo(i, this.height);
	}
	
	for (i = this.yo; i > 0; i -= this.pxPerM)                         // North vertical lines
	{
		this.ctx.moveTo(0, i);
		this.ctx.lineTo(this.width, i);
	}
	
	for (i = this.yo + this.pxPerM; i < this.height; i += this.pxPerM) // South vertical lines
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
	
	this.ctx.moveTo(1.46 * this.pxPerM, 0);
	this.ctx.lineTo(1.46 * this.pxPerM, 0.61 * this.pxPerM);
	
	this.ctx.moveTo(3.47 * this.pxPerM, 0);
	this.ctx.lineTo(3.47 * this.pxPerM, 1.20 * this.pxPerM);
	
	this.ctx.moveTo(1.45 * this.pxPerM, this.height);
	this.ctx.lineTo(1.45 * this.pxPerM, 2.32 * this.pxPerM);
	this.ctx.lineTo(2.46 * this.pxPerM, 2.32 * this.pxPerM);
	this.ctx.lineTo(2.46 * this.pxPerM, 1.82 * this.pxPerM);
	
	this.ctx.moveTo(4.95 * this.pxPerM, this.height);
	this.ctx.lineTo(4.95 * this.pxPerM, 1.82 * this.pxPerM);
	this.ctx.closePath();
	
	this.ctx.strokeStyle = "#AAAAAA";
	this.ctx.shadowColor = "#606060";
	this.ctx.shadowBlur = 1;
	this.ctx.lineWidth = Math.ceil(2 * this.pxPerM / 100) + 0.1;
	this.ctx.lineCap = "round";
	this.ctx.stroke();
	this.ctx.restore();
};

Nav.prototype.drawStartPoseRobot = function() {
	if (this.isRunning) return;
	
	/* Robot coords are relative to the orgin in the centre of diagram. */
	var x = this.xo + this.startPose.x * this.pxPerM,
		y = this.yo - this.startPose.y * this.pxPerM,
		a = this.startPose.a + Math.PI / 2;

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.arc(x, y, this.r, 0, Math.PI * 2);
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a + Math.PI / 6), y + this.r * Math.cos(a + Math.PI / 6));
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a - Math.PI / 6), y + this.r * Math.cos(a - Math.PI / 6));
		
	this.ctx.closePath();
	
	this.ctx.strokeStyle = "#888888";
	this.ctx.globalAlpha = 0.5;
	this.ctx.lineWidth = 2;
	this.ctx.fillStyle = "#EEEEEE";

	this.ctx.fill();
	this.ctx.stroke();
	
	this.ctx.lineWidth = 0.5;
	this.ctx.font = "10pt sans-serif";
	this.ctx.strokeText("Start here", x - 25, y + 40);
	
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
	
	if (this.moveState > 0)
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

Nav.prototype.drawCovBox = function() {
	var bw = this.movePose.cx * this.pxPerM,
		bh = this.movePose.cy * this.pxPerM,
		bx = this.xo + this.movePose.x * this.pxPerM - bw / 2,
		by = this.yo - this.movePose.y * this.pxPerM - bh / 2;

	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.rect(bx, by, bw, bh);
	this.ctx.closePath();

	this.ctx.globalAlpha = 0.25;
	this.ctx.globalCompositeOperation = "destination-over";
	this.ctx.fillStyle = "#D8E2EA";
	this.ctx.strokeStyle = "#BBBBBB";
	this.ctx.fill();
	this.ctx.stroke();
	this.ctx.restore();
	
	/* Resize handles. */
	this.dragHandles.length = 0;
	this.drawDragHandle(bx, by);
	this.drawDragHandle(bx + bw, by);
	this.drawDragHandle(bx + bw, by + bh);	
	this.drawDragHandle(bx, by + bh);
	
	this.drawMeasurement(bx, by, bh, false);
	this.drawMeasurement(bx, by + bh, bw, true);
};

Nav.prototype.drawRotationSelector = function(x, y) {
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(this.mouse.x, this.mouse.y);
	
	this.ctx.strokeStyle = "#333333";
	this.ctx.lineWidth = 2;
	this.ctx.globalAlpha = 0.7;
	this.ctx.shadowBlur = 10;
	this.ctx.shadowColor = "#666666";
	
	this.ctx.stroke();
	this.ctx.closePath();
	this.ctx.restore();
};

Nav.ACOV_CONE_RADIUS = 100;
Nav.prototype.drawCovCone = function() {
	var x0 = this.xo + this.movePose.x * this.pxPerM,
		y0 = this.yo - this.movePose.y * this.pxPerM,
		cx0 = x0 + Nav.ACOV_CONE_RADIUS * Math.sin(Math.PI / 2 + this.movePose.a - this.movePose.ca / 2),
		cy0 = y0 + Nav.ACOV_CONE_RADIUS * Math.cos(Math.PI / 2 + this.movePose.a - this.movePose.ca / 2),
		cx1 = x0 + Nav.ACOV_CONE_RADIUS * Math.sin(Math.PI / 2 + this.movePose.a + this.movePose.ca / 2),
		cy1 = y0 + Nav.ACOV_CONE_RADIUS * Math.cos(Math.PI / 2 + this.movePose.a + this.movePose.ca / 2),
		i = 0;
	
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.moveTo(x0, y0);
	this.ctx.lineTo(cx0, cy0);
	
	for (i = 0; i < 100; i++)
	{
		this.ctx.lineTo(
				x0 + Nav.ACOV_CONE_RADIUS * Math.sin(Math.PI / 2 + this.movePose.a - this.movePose.ca / 2 + this.movePose.ca * i / 100),
				y0 + Nav.ACOV_CONE_RADIUS * Math.cos(Math.PI / 2 + this.movePose.a - this.movePose.ca / 2 + this.movePose.ca * i / 100));
	}
	
	this.ctx.lineTo(x0, y0);
	this.ctx.closePath();
	
	this.ctx.globalAlpha = 0.25;
	this.ctx.globalCompositeOperation = "destination-over";
	this.ctx.lineWidth = 2;
	this.ctx.fillStyle = "#D8E2EA";
	this.ctx.strokeStyle = "#BBBBBB";
	this.ctx.fill();
	this.ctx.stroke();
	
	this.ctx.globalAlpha = 0.7;
	this.ctx.globalCompositeOperation = "source-over";
	this.ctx.strokeStyle = "#606060";
	this.ctx.lineWidth = 0.5;
	this.ctx.strokeText(mathRound(this.movePose.ca * 180 / Math.PI, 2) + " degrees",
			x0 + Nav.ACOV_CONE_RADIUS / 2 * Math.sin(Math.PI / 2 + this.movePose.a),
			y0 + Nav.ACOV_CONE_RADIUS / 2 * Math.cos(Math.PI / 2 + this.movePose.a));
	
	this.ctx.restore();
	
	this.dragHandles.length = 0;
	this.drawDragHandle(cx0, cy0);
	this.drawDragHandle(cx1, cy1);
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

Nav.HANDLE_SIZE = 8;
Nav.prototype.drawDragHandle = function(x, y) {
	this.dragHandles.push({x: x, y: y});
	
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.rect(x - Nav.HANDLE_SIZE / 2, y - Nav.HANDLE_SIZE / 2, Nav.HANDLE_SIZE, Nav.HANDLE_SIZE);
	this.ctx.closePath();
	
	if (this.ctx.isPointInPath(this.mouse.x, this.mouse.y))
	{
		/* Mouse hover. */
		this.ctx.fillStyle = "#606060";
		this.ctx.shadowBlur = 7;
		this.ctx.shadowColor = "#606060";
	}
	else
	{
		this.ctx.fillStyle = "#DDDDDD";
		this.ctx.shadowBlur = 5;
		this.ctx.shadowColor = "#AAAAAA";
	}
	
	this.ctx.strokeStyle = "#606060";
	this.ctx.strokeWidth = 1.5;
	
	this.ctx.stroke();
	this.ctx.fill();
	this.ctx.restore();
};

Nav.prototype.isInDragHandles = function() {
	var i = 0;
	for (i in this.dragHandles) 
	{
		if (this.isInDragHandle(this.dragHandles[i].x, this.dragHandles[i].y)) return true;
	}
};

Nav.prototype.isInDragHandle = function(x, y) {
	return (this.mouse.x > x - Nav.HANDLE_SIZE / 2 && this.mouse.x <= x + Nav.HANDLE_SIZE / 2 && 
			this.mouse.y > y - Nav.HANDLE_SIZE / 2 && this.mouse.y <= x + Nav.HANDLE_SIZE / 2);
};

Nav.prototype.drawMeasurement = function(x, y, d, horiz) {
	var len = 20, line = 10, lw = 1, arrowri = 8, arrowrun = 20;
	
	this.ctx.save();
	this.ctx.beginPath();
	
	if (horiz)
	{
		this.ctx.moveTo(x + lw, y);
		this.ctx.lineTo(x + lw, y + len);
		this.ctx.moveTo(x + lw, y + line);
		this.ctx.lineTo(x + d - lw, y + line);
		this.ctx.moveTo(x + d - lw, y);
		this.ctx.lineTo(x + d - lw, y + len);
		
		/* Arrow heads. */
		this.ctx.moveTo(x + lw, y + line);
		this.ctx.lineTo(x + lw + arrowrun, y + line + arrowri);
		this.ctx.moveTo(x + d - lw, y + line);
		this.ctx.lineTo(x + d - lw - arrowrun, y + line + arrowri);
	}
	else
	{
		this.ctx.moveTo(x, y + lw);
		this.ctx.lineTo(x - len, y + lw);
		this.ctx.moveTo(x - line, y + lw);
		this.ctx.lineTo(x - line, y + d - lw);
		this.ctx.moveTo(x, y + d - lw);
		this.ctx.lineTo(x - len, y + d - lw);
		
		/* Arrow heads. */
		this.ctx.moveTo(x - line, y + lw);
		this.ctx.lineTo(x - line - arrowri, y + lw + arrowrun);
		this.ctx.moveTo(x - line, y + d - lw);
		this.ctx.lineTo(x - line - arrowri, y + d - lw - arrowrun);
	}
	
	this.ctx.closePath();
	
	this.ctx.globalAlpha = 0.7;
	this.ctx.globalCompositeOperation = "destination-over";
	this.ctx.strokeStyle = "#BBBBBB";
	this.ctx.lineWidth = lw;
	this.ctx.stroke();
	
	if (horiz)
	{
		this.ctx.strokeText(mathRound(this.movePose.cx, 2) + " m", x + d / 2 - 8, y + line * 2 + 5);
	}
	else
	{
		this.ctx.strokeText(mathRound(this.movePose.cy, 2) + " m", x - line * 2 - 15, y + d / 2);
	}
	
	this.ctx.restore();
};

Nav.prototype.moveStart = function(e) {
	/* Check whether we are doing a draging move. */
	this.mouse.down = true;
	if (this.isInDragHandles())
	{
		this.isDragHandling = true;;
	}
	
	/* If we are not running or already moving, don't allow it again. */
	if (!this.isRunning || this.moveState > 0) return;
	
	/* Determine whether we are in the robot radius. */
	if (Math.abs(e.pageX - this.offX - this.xo - this.pose.x * this.pxPerM) > this.r || 
		Math.abs(e.pageY - this.offY - this.yo + this.pose.y * this.pxPerM) > this.r) return;
	
	var thiz = this;
	$(this.canvas).bind("mousemove", function (evt) {
		thiz.move(evt);
	});
	
	this.moveState = 1;
	
	this.movePose.x = this.pose.x;
	this.movePose.y = this.pose.y;
	this.movePose.a = this.pose.a;
	this.movePose.cx = this.movePose.cy = Nav.DEFAULT_COV;
	this.movePose.ca = Nav.DEFAULT_ACOV;
	
	this.dragX = e.pageX;
	this.dragY = e.pageY;
	
	this.updateStatus("setting position");
};

Nav.prototype.move = function(e) {
	this.mouse.x = e.pageX - this.offX;
	this.mouse.y = e.pageY - this.offY;
	
	switch (this.moveState)
	{
	case 1: // Setting position
		this.movePose.x -= (this.dragX - e.pageX) / this.pxPerM;
		this.movePose.y += (this.dragY - e.pageY) / this.pxPerM;
		this.dragX = e.pageX;
		this.dragY = e.pageY;
		this.draw(true);
		break;
		
	case 2: // Setting position covariance
		if (this.isDragHandling)
		{
			this.movePose.cx = Math.abs(this.xo + this.movePose.x * this.pxPerM - this.mouse.x) / this.pxPerM * 2;
			this.movePose.cy = Math.abs(this.yo - this.movePose.y * this.pxPerM - this.mouse.y) / this.pxPerM * 2;
		}
		
		this.draw(true);
		this.drawCovBox();
		break;

	case 3: // Setting yaw
		var x0 = this.xo + this.movePose.x * this.pxPerM,
			y0 = this.yo - this.movePose.y * this.pxPerM;
		
		/* We want to robot rotation to follow the mouse. */
		this.movePose.a = Math.atan2(x0 - this.mouse.x, y0 - this.mouse.y) + Math.PI / 2;
		if (this.movePose.a < 0) this.movePose.a += Math.PI * 2;
		
		this.draw(true);
		this.drawRotationSelector(x0, y0);
		break;
	
	case 4: // Setting yaw covariance
		if (this.isDragHandling)
		{
			this.movePose.ca = Math.abs(
					(Math.atan2(
						this.xo + this.movePose.x * this.pxPerM - this.mouse.x, 
						this.yo - this.movePose.y * this.pxPerM - this.mouse.y) + Math.PI / 2 - this.movePose.a	) * 2);
			if (this.movePose.ca > Math.PI) this.movePose.ca = Math.PI;
		}
		
		this.draw(true);
		this.drawCovCone();
		break;
	}
};

Nav.prototype.moveStop = function(e) {
	this.mouse.down = false;
	
	var thiz = this;
	
	switch (this.moveState)
	{
	case 1: // Setting position complete
		if (this.doCovSet)
		{
			this.draw(true);
			this.drawCovBox();
			this.moveState++;
			this.updateStatus("setting position covariance");
		}
		else
		{
			/* Jumping over the covariance step. */
			this.moveState += 2;
			this.updateStatus("setting yaw");
		}
		break;
		
	case 2: // Setting position covariance complete or dragging size
		if (!(this.isDragHandling || this.isInDragHandles()))
		{
			this.moveState++;
			
			var x0 = this.xo + this.movePose.x * this.pxPerM,
				y0 = this.yo - this.movePose.y * this.pxPerM;

			this.movePose.a = Math.atan2(x0 - this.mouse.x, y0 - this.mouse.y) + Math.PI / 2;
			if (this.movePose.a < 0) this.movePose.a += Math.PI * 2;

			this.draw(true);
			this.drawRotationSelector(x0, y0);
			this.updateStatus("setting yaw");
		}
		else 
		{
			/* Completed covariance box dragging. */
			this.isDragHandling = false;
		}
		break;

	case 3: // Setting yaw complete
		if (this.doCovSet)
		{
			this.moveState++;
			
			this.draw(true);
			this.drawCovCone();
			this.updateStatus("setting yaw covariance");
			break;
		}
		else
		{
			this.moveState += 2;
			/* Falls through to next case. */
			this.updateStatus("transmitting pose");
		}
		
	case 4: // Setting yaw covariance complete
		if (!(this.isDragHandling || this.isInDragHandles()))
		{
			$(this.canvas).unbind('mousemove');
			$.post(
				"/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/setPose",
				this.movePose,
				function(resp) {
					setTimeout(function() {
						thiz.moveState = 0;
						thiz.updateStatus("");
					}, 500);
				}
			);
			
			this.moveState++;
			this.updateStatus("transmitting pose");
		}
		else 
		{
			this.isDragHandling = false;
		}
		break;
		
	default:
		break;
	}

};

Nav.prototype.updateStatus = function(message) {
	var $ns = $("#nav-status").empty();
	
	if (message != "")
	{
		$ns.append("(" + message + ")");
	}
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
	
	this.displayFormat = null;
	
	this.lastHeartBeat = 0;
}
CameraWidget.prototype = new IWidget;

CameraWidget.prototype.init = function() {
	this.pageAppend(
			"<div id='" + this.cameraBox + "' class='camera-box'>" +
			"</div>" +
			"<div class='format-finger flash-finger'>F</div>" +
			"<div class='format-finger mjpeg-finger'>J</div>"
	);
	
	var thiz = this;
	
	$.get(
		"/session/attributebridge",
		{
			attribute: this.prop
		},
		function (resp) {
			if (typeof resp != "object")
			{
				window.location.reload();
				return;
			}
			
			var pts = resp.value.split(","), i = 0, p;			
			for (i in pts)
			{
				p = pts[i].indexOf("=");
				thiz.urls[$.trim(pts[i].substring(0, p))] = $.trim(pts[i].substring(p + 1));
			}
			
			thiz.deployDefault();
		}
	);
	
	this.$w.children(".format-finger").click(function() {		
		var t = $(this).text();
		if (t == 'F' && typeof thiz.urls.swf != "undefined")
		{
			document.cookie = thiz.wid + "=swf";
			thiz.deploy("swf");
		}
		else if (t == 'J' && typeof thiz.urls.mjpeg != "undefined")
		{
			document.cookie = thiz.wid + "=mjpeg";
			thiz.deploy("mjpeg");
		}
	});
};

CameraWidget.prototype.deployDefault = function() {
	var format = this.getStoredFormat();
	
	if (format == "")
	{
		/* Choose based on browser. */
		format = /Mobile|mobi/i.test(navigator.userAgent) ? 'mjpeg' : 'swf';
	}
	
	this.deploy(format);
};

CameraWidget.prototype.deploy = function(format) {
	/* Remove the current format. */
	this.$w.children(".camera-box").empty();
	
	this.$w.children(".selected").removeClass("selected");
	switch (this.displayFormat = format)
	{
	case 'swf':
		this.deploySWF();
		this.$w.children(".flash-finger").addClass("selected");
		break;
		
	case 'flv':
		this.deployFLV();
		this.$w.children(".flash-finger").addClass("selected");
		break;
		
	case 'mjpeg':
		this.deployMJpeg();
		this.$w.children(".mjpeg-finger").addClass("selected");
		break;
		
	default:
		document.cookie = this.wid + "=;";
		this.control.log("Unknown format '" + format + "', choosing default.", IRobot.ERROR);
		break;
	}
};

CameraWidget.prototype.deployMJpeg = function() {
	if (!this.urls.mjpeg)
	{
		this.control.log("Unable to deploy MJPEG stream because no MJPEG URL is set.", IRobot.ERROR);
		return;
	}
	
	/* Remove the current format. */
	this.$w.children(".camera-box").empty();
	
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
	else if ($.browser.mozilla)
	{
		var img = new Image(), thiz = this;
		img.alt = " ";
		img.style.height = this.height;
		img.style.width = this.width;
		img.onload = function() {
			thiz.lastHeartBeat = new Date().getTime();
		};
		img.src = this.urls.mjpeg;
		
		$("#" + this.cameraBox).append(img);
		
		this.lastHeartBeat = new Date().getTime();
		this.mozMJpegCOP();
	}
	else
	{
		$("#" + this.cameraBox).append(
			"<img src='" + this.urls.mjpeg + "' alt='video' style='height:" + this.height + "px;width:" + this.width + "px;'/>"
		);
	}
};

CameraWidget.prototype.mozMJpegCOP = function() {
	if (this.displayFormat == 'mjpeg' && new Date().getTime() - this.lastHeartBeat > 2000)
	{
		/* Need to redeploy. */
		this.deployMJpeg();
	}
	else if (this.displayFormat == 'mjpeg')
	{		
		var thiz = this;
		setTimeout(function() {
			thiz.mozMJpegCOP();
		}, 2000);
	}
};

CameraWidget.prototype.deploySWF = function() {
	if (!this.urls.swf)
	{
		this.control.log("Unable to deploy SWF stream because no SWF URL is set.", IRobot.ERROR);
		return;
	}
	
	this.$w.children(".camera-box").empty();
	
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
	if (!this.urls.flv)
	{
		this.control.log("Unable to deploy FLV stream because no FLV URL is set.", IRobot.ERROR);
		return;
	}
	
	var player = flowplayer(this.cameraBox, 
		{
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

CameraWidget.prototype.getStoredFormat = function() {
	var cookies = document.cookie.split('; ');
	for (i in cookies)
	{
		var c = cookies[i].split('=', 2);
		if (c[0] == this.wid)
		{
			return c[1];
		}
	}
	return "";
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
	
	this.prop = "iRobot_Onboard_Camera";
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
	
	this.prop = "iRobot_Overhead_Camera";
}
OverheadCamera.prototype = new CameraWidget;

/* ----------------------------------------------------------------------------
 * -- Over head camera control                                               --
 * ---------------------------------------------------------------------------- */
function OverheadCameraControl(pc)
{
	Nav.call(this, pc);
	
	this.wid = "ov-control-box";
	this.title = "Camera Control";
		
	this.scale= this.width / 166;
	this.width = Math.ceil(this.width / this.scale);
	this.height = Math.ceil(this.height / this.scale);
	this.pxPerM /= this.scale;
	
	this.mode = -1;
	this.pos  = { x: 0, y: 0 };
	this.boxVert = 2.2;
	
	this.xo = this.width / 2;
	this.yo = this.height / 2;
	
	this.isMoving = false;
}
OverheadCameraControl.prototype = new Nav;

OverheadCameraControl.UNKNOWN_MODE = 0;
OverheadCameraControl.AUTO_MODE = 1;
OverheadCameraControl.MAN_MODE = 2;

OverheadCameraControl.prototype.init = function() {
	this.pageAppend(
		"<div id='ov-control-buttons'>" +
			"<div id='ov-control-man' class='ov-control-button'>Manual</div>" +  
			"<div id='ov-control-auto' class='ov-control-button'>Auto</div>" +  
			"<div style='clear:left;'></div>" +
		"</div>" +
		"<canvas id='ov-control-canvas' width='" + this.width + "' height='" + this.height + "'></canvas>"
	);

	this.canvas = $("#ov-control-canvas")[0];
	if (this.canvas.getContext)
	{
		this.ctx = this.canvas.getContext("2d");
		this.draw();
		
		var thiz = this,
			$c = $(this.canvas)
					.mousedown(function(evt) { thiz.moveStart(evt); })
					.bind('mouseup mouseleave', function(evt) { thiz.moveStop(evt); });
		
		this.offX = $c.offset().left;
		this.offY = $c.offset().top;
	}
	else
	{
		alert("Using this interface requires a modern browser.");
	}
};

OverheadCameraControl.prototype.draw = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.drawSkeleton();
	this.drawCameraFOV();
};

OverheadCameraControl.prototype.drawCameraFOV = function() {
	this.ctx.save();
	
	this.ctx.beginPath();
	
	this.ctx.rect(this.xo + (this.pos.x - this.boxVert / 2) * this.pxPerM, 
				  this.yo + (this.pos.y - this.boxVert / 2) * this.pxPerM, 
				  this.boxVert * this.pxPerM, this.boxVert * this.pxPerM);
	
	this.ctx.closePath();
	
	if (this.isMoving)
	{
		this.ctx.shadowBlur = 10;
		this.ctx.shadowColor = "#666666";
		this.ctx.globalAlpha = 0.7;
	}
	else
	{
		this.ctx.shadowBlur = 3;
		this.ctx.shadowColor = "#AAAAAA";
		this.ctx.globalAlpha = 0.5;
	}
	
	this.ctx.strokeStyle = "#666666";
	this.ctx.lineWidth = 1;
	this.ctx.fillStyle = "#EA3D3D";

	this.ctx.fill();
	this.ctx.stroke();
	
	this.ctx.restore();
};

OverheadCameraControl.prototype.moveStart = function(e) {
	if (this.isMoving) return;
	
	/* We need to make sure the mouse is clicking on the camera FOV. */
	this.ctx.beginPath();
	this.ctx.rect(this.xo + (this.pos.x - this.boxVert / 2) * this.pxPerM, 
				  this.yo + (this.pos.y - this.boxVert / 2) * this.pxPerM, 
				  this.boxVert * this.pxPerM, this.boxVert * this.pxPerM);
	this.ctx.closePath();
	if (!this.ctx.isPointInPath(e.pageX - this.offX, e.pageY - this.offY)) return;
	
	this.isMoving = true;
	
	var thiz = this;
	$(this.canvas).bind("mousemove", function(evt) { thiz.move(evt); });
	
	this.dragX = e.pageX;
	this.dragY = e.pageY;
	this.draw();
};

OverheadCameraControl.prototype.move = function(e) {
	if (!this.isMoving) return;
	
	this.pos.x += (e.pageX - this.dragX) / this.pxPerM;
	this.pos.y += (e.pageY - this.dragY) / this.pxPerM;
	this.dragX = e.pageX;
	this.dragY = e.pageY;
	
	/* Constrain the FOV to the mase perimeter. */
	if (this.pos.x - this.boxVert / 2 < -this.width / 2 / this.pxPerM)
	{
		this.pos.x = -this.width / 2 / this.pxPerM + this.boxVert / 2;
	}
	else if (this.pos.x + this.boxVert / 2 > this.width / 2 / this.pxPerM)
	{
		this.pos.x = this.width / 2 / this.pxPerM - this.boxVert / 2;
	}
	
	if (this.pos.y - this.boxVert / 2 < -this.height / 2 / this.pxPerM)
	{
		this.pos.y = -this.height / 2 / this.pxPerM + this.boxVert / 2;
	}
	else if (this.pos.y + this.boxVert / 2 > this.height / 2 / this.pxPerM)
	{
		this.pos.y = this.height / 2 / this.pxPerM - this.boxVert / 2;
	}
	
	this.draw();
};

OverheadCameraControl.prototype.moveStop = function(e) {
	if (!this.isMoving) return;
	
	this.isMoving = false;
	$(this.canvas).unbind("mousemove");
	
	this.draw();
	
	$.get(
		"/primitive/json/pc/OverheadCameraController/pa/setPosition",
		{
			x: this.pos.x,
			y: -this.pos.y
		}
	);
};


/* ----------------------------------------------------------------------------
 * -- Utility functions                                                      --
 * ---------------------------------------------------------------------------- */
function mathRound(num, places) 
{
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

