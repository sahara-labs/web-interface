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
			if(m == 0)
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
		var cs = new CodeUploadStatus(this),
			ov = new OverheadCamera(this),
			gr = new CodeUploadGraphics(this);
		this.widgets.push(new CodeUpload(this, cs, gr));
		this.widgets.push(cs);
		this.widgets.push(gr);
		this.widgets.push(new DPad(this));
		
		ov.width = 320;
		ov.height = 240;
		this.widgets.push(ov);
		this.widgets.push(new OverheadCameraControl(this));
		break;
		
	case 4: // Mode transition mode.
		this.log("Waiting for mode transition to complete.", IRobot.DEBUG);
		this.widgets.push(new TransitionOverlay(this));
		break;

	default:
		this.log(IRobot.ERROR, "Unknown mode: " + mode);
	}
	
	this.mode = mode;
	
	var i = 0;
	for (i in this.widgets) this.widgets[i].init();
	this.modeSelector.setSelected(mode);
	
	resizeFooter();
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
	this.control.log(this.wid + " has no init method", IRobot.ERROR);
};

IWidget.prototype.switchTo = function(tab) {
	/* Bottom tab selected option. */
	$("#" + this.wid + " .widget-tab").removeClass("widget-tab-selected");
	$("#tab-" + tab).addClass("widget-tab-selected");
	
	/* Tab contents. */
	$("#" + this.wid + " .widget-tab-panel").hide();
	$("#" + this.wid + "-" + tab).show();
};

/**
 * Destroys the widget by removing the widget from the canvas and clearing all 
 * event handlers. 
 */
IWidget.prototype.destroy = function () {
	if (this.$w) this.$w.remove();
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
	
	if (this.tabs)
	{
		html += "<div class='widget-tab-bar'>";
		
		var i = 0, classes;
		for (i in this.tabs)
		{
			classes = ["widget-tab"];
			if (i == 0)	classes.push("first-tab");
			if (i == this.tabs.length - 1) classes.push("last-tab");
			
			html += "<div id='tab-" + this.idify(this.tabs[i]) + "' class='" + classes.join(" ") + "'>" + this.tabs[i] + "</div>";
		}
		
		html += "</div>";
	}
	
	html += "</div>";
	
	this.control.$canvas.append(html);
	this.$w = this.control.$canvas.find("#" + this.wid);
	
	if (this.tabs)
	{
		var thiz = this;
		$("#" + this.wid + " .widget-tab").click(function() { thiz.switchTo($(this).attr("id").substr(4)); });
		
		this.switchTo(this.idify(this.tabs[0]));
	}
};

IWidget.prototype.idify = function(id) {
	return id.split(" ").join("").toLowerCase();
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

/* ----------------------------------------------------------------------------
 * -- Widget to provide a spinner when changing modes.                       --
 * ---------------------------------------------------------------------------- */

function TransitionOverlay(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "t-overlay";
	this.dots = 0;
	
	this.isDestroyed = false;
}
TransitionOverlay.prototype = new IWidget;

TransitionOverlay.prototype.init = function() {
	this.pageAppend(
		"<div class='ui-state-secondary ui-corner-all'>" +
			"<span class='ui-icon ui-icon-clock'></span>" +
			"Please wait <span id='load-dots'>. </span>" + 
		"</div>"
	);
	
	this.updateDots();
};

TransitionOverlay.prototype.updateDots = function() {
	var thiz = this, i, dt = "";
	
	for (i = 0; i < this.dots; i++)
	{
		dt += ". ";
	}
	
	$("#load-dots").empty().append(dt);
	
	if (this.dots == 3) this.dots = 0;
	else this.dots++;

	if (!this.isDestroyed) setTimeout(function() {
		thiz.updateDots();
	}, 750);
};

TransitionOverlay.prototype.destroy = function() {
	this.isDestroyed = true;
	this.$w.remove();
};

/* ----------------------------------------------------------------------------
 * -- Widget that displays a warning message.                                --
 * ---------------------------------------------------------------------------- */
function WarningMessage(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "warning-message";
}
WarningMessage.prototype = new IWidget;

WarningMessage.prototype.init = function() {
	this.pageAppend(
		"<div class='ui-state-error ui-corner-all'>" +
			"<span class='ui-icon ui-icon-alert'></span>" +
			"Code upload is not yet implemented." +
		"</div>"
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
	
	this.loadAlpha = undefined;
	this.loadBeta = undefined;
	this.loadGamma = undefined;
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
	
	
	/* For browsers that support device orientation. */
	// TODO Eventually touch device orientation support
//	window.addEventListener("deviceorientation", function(event) {
//		if (!thiz.loadAlpha) thiz.loadAlpha = event.alpha;
//		if (!thiz.loadBeta) thiz.loadBeta = event.beta;
//		if (!thiz.loadGamma) thiz.loadGamma = event.gamma;
//		
//		/* Speed is a tilt forward or back. */
//		if (event.beta > thiz.loadBeta + 15 && thiz.speed != -thiz.vel)
//		{
//			if (thiz.speed != 0) thiz.fingerRelease("south");
//			thiz.fingerPress("north");
//		}
//		else if (event.beta < thiz.loadBeta - 15 && thiz.speed != thiz.vel)
//		{
//			if (thiz.speed != 0) thiz.fingerRelease("north");
//			thiz.fingerPress("south");
//		}
//		else
//		{
//			if (thiz.speed != 0) thiz.fingerRelease(thiz.speed > 0 ? "north" : "south");
//		}
//		
//		/* Rotations is turn. */
//		if (event.alpha > thiz.loadAlpha + 15 && thiz.yaw != thiz.vel)
//		{
//			if (thiz.yaw != 0) thiz.fingerRelease("east");
//			thiz.fingerPress("west");
//		}
//		else if (event.alpha  < thiz.loadAlpha - 15 && thiz.yaw != -thiz.vel)
//		{
//			if (thiz.yaw != 0) thiz.fingerRelease("west");
//			thiz.fingerPress("east");
//		}
//		else
//		{
//			if (thiz.yaw != 0) thiz.fingerRelease(thiz.yaw> 0 ? "east" : "west");
//		}
//		
//	}, true);
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
	
	var html = "",
	    i = 0,
	    thiz = this;
	
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
	
	var canvas = getCanvas("ranger", this.width, this.height);
	this.$w.prepend(canvas);
	
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
	
	if (canvas.getContext)
	{
		this.ctx = canvas.getContext("2d");
		this.ctx.font = "12px sans-serif";
		if (this.ctx.fillText) this.ctx.fillText("Connecting...", this.xo - 40, this.yo);
		
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
		cache: false,
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
			setTimeout(function() {
				thiz.setRunning(typeof resp == "object" && resp.value == "true");
				thiz.settingStatus = false;
			}, 2000);
		}
	);
};

NavControl.prototype.mainLoop = function() {
	var thiz = this;
	
	$.ajax({
		url: "/primitive/json/pc/" + IRobot.NAV_CONTROLLER + "/pa/packet",
		cache: false,
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
	this.pageAppend("<div id='nav-status'> </div>");
	this.canvas = getCanvas("nav", this.width, this.height); 
	this.$w.prepend(this.canvas);
	
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
	
	this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
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
	if (this.ctx.strokeText) this.ctx.strokeText("Start here", x - 25, y + 40);
	
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
	
	this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
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
	$("#log-ds-enable span").text(this.logging ? "Logging On" : "Logging Off");
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
					"Generate datasets by turning logging on then starting navigation." +
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
	
	this.mode = OverheadCamera.UNKNOWN_MODE;
	this.pos  = { x: 0, y: 0 };
	this.boxVert = 2.2;
	
	this.xo = this.width / 2;
	this.yo = this.height / 2;
	
	this.isMoving = false;
}
OverheadCameraControl.prototype = new Nav;

OverheadCameraControl.CONTROLLER = "OverheadCameraController";
OverheadCameraControl.UNKNOWN_MODE = 0;
OverheadCameraControl.AUTO_MODE = 1;
OverheadCameraControl.MAN_MODE = 2;

OverheadCameraControl.prototype.init = function() {
	this.pageAppend(
		"<div id='ov-control-buttons'>" +
			"<div id='ov-control-man' class='ov-control-button'>Manual</div>" +  
			"<div id='ov-control-auto' class='ov-control-button'>Auto</div>" +  
			"<div style='clear:left;'></div>" +
		"</div>"
	);

	this.canvas = getCanvas("ov-control-canvas", this.width, this.height);
	this.$w.append(this.canvas);
	
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
	
	var thiz = this;
	$.get(
		"/primitive/json/pc/" + OverheadCameraControl.CONTROLLER + "/pa/status",
		null,
		function(resp) {
			thiz.parseStatus(resp);
			/* Now we have determined the current mode, we can set up the event
			 * handler for the mode switch buttons */
			thiz.$w.find(".ov-control-button").click(function() {
				thiz.setMode($(this).attr("id") == "ov-control-auto" ? 
								OverheadCameraControl.AUTO_MODE : 
								OverheadCameraControl.MAN_MODE);
			});
		}
	);
};

OverheadCameraControl.prototype.setMode = function(mode) {
	/* No need to do anything if we are already at the correct mode. */
	if (this.mode == mode) return;
	
	$.post(
		"/primitive/json/pc/" + OverheadCameraControl.CONTROLLER + "/pa/setMode",
		{ mode: mode }
	);
	
	this.displayMode(mode);
};

OverheadCameraControl.prototype.displayMode = function(mode) {
	/* No need to do anything if we are already at the correct mode. */
	if (this.mode == mode) return;
	
	this.$w.find(".active").removeClass("active");
	switch (this.mode = mode)
	{
	case OverheadCameraControl.AUTO_MODE:
		$("#ov-control-auto").addClass("active");
		this.requestStatus();
		break;
		
	case OverheadCameraControl.MAN_MODE:
		$("#ov-control-man").addClass("active");
		break;
	}
};

OverheadCameraControl.prototype.requestStatus = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/json/pc/" + OverheadCameraControl.CONTROLLER + "/pa/status",
		cache: false,
		success: function(resp) {
			thiz.parseStatus(resp);
		},
		error: function() { setTimeout(function() { thiz.requestStatus(); }, 20000); }
	});
};

OverheadCameraControl.prototype.parseStatus = function(status) {
	if (typeof status == "object") 
	{
		var i = 0;
		for (i in status)
		{
			switch (status[i].name)
			{
			case 'mode':
				this.displayMode(parseInt(status[i].value));
				break;
				
			case 'x':
				this.pos.x = -parseFloat(status[i].value);
				break;
				
			case 'y':
				this.pos.y = -parseFloat(status[i].value);
				break;
			}
		}
		this.draw();
	}
	
	if (this.mode == OverheadCameraControl.AUTO_MODE)
	{
		var thiz = this;
		setTimeout(function() {
			thiz.requestStatus();
		}, 5000);
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
	
	if (this.mode == OverheadCameraControl.AUTO_MODE)
	{
		/* If we are in auto mode and there has been an explicit move, than 
		 * the mode is automatically changed to manual. */
		this.setMode(OverheadCameraControl.MAN_MODE);
	}
	
	/* We need to make sure the mouse is clicking on the camera FOV. */
	this.ctx.beginPath();
	this.ctx.rect(this.xo + (this.pos.x - this.boxVert / 2) * this.pxPerM, 
				  this.yo + (this.pos.y - this.boxVert / 2) * this.pxPerM, 
				  this.boxVert * this.pxPerM, this.boxVert * this.pxPerM);
	this.ctx.closePath();
	
	if (typeof this.ctx.isPointInPath != "undefined" && 
		!this.ctx.isPointInPath(e.pageX - this.offX, e.pageY - this.offY)) return;
	
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
		"/primitive/json/pc/" + OverheadCameraControl.CONTROLLER + "/pa/setPosition",
		{
			x: this.pos.x,
			y: -this.pos.y
		}
	);
};

/* ----------------------------------------------------------------------------
 * -- Code Upload Buttons                                                    --
 * ---------------------------------------------------------------------------- */
function CodeUpload(pc, status, graphics)
{
	IWidget.call(this, pc);
	
	this.wid = "code-upload-buttons";
	
	this.$uploadDialog;
	this.$uploadTarget;
	
	this.hasStatus = false;
	this.isUploading;
	this.isRunning = false;
	this.isKilling = false;
	
	this.status = status;
	this.graphics = graphics;
	
	this.lastDown = 0;
}
CodeUpload.prototype = new IWidget;

CodeUpload.prototype.init = function() {	 
	 this.pageAppend(
		 	"<div id='upload-button' class='commonbutton disabled'>" +
		 		"<img src='/uts/irobot/images/run.png' alt=' ' /><br />" +
		 		"Build & Run" +
		 	"</div>" +
		 	"<div id='kill-button' class='commonbutton disabled'>" +
		 		"<img src='/uts/irobot/images/kill.png' alt=' ' /><br />" +
		 		"Kill Program" +
		 	"</div>" +
		 	"<div id='random-walk-button' class='commonbutton disabled'>" +
		 		"<img src='/uts/irobot/images/random_walk.png' alt=' ' /><br />" +
		 		"Random Walk" +
		 	"</div>"
	 );
	 
	 /* Empty the upload target. */
	 this.$uploadTarget = $("#code-upload-target").empty();
	 
	 var thiz = this;
	 $("#code-upload-buttons .commonbutton").click(function () { thiz.handleClick($(this).attr("id")); });
	 
	 /* Determine start status. */
	 this.getStatus();
	 
	 $(document).bind("keydown.terminate", function(event) {
		 /* If the last two key presses are Ctrl-C, terminate the application. */
		 if (thiz.lastDown == 17 && event.which == 67) thiz.kill();
		 thiz.lastDown = event.which;
	 });
};

CodeUpload.prototype.handleClick = function(id) {
	if (!this.hasStatus) return;
	
	switch (id)
	{
	case "upload-button":
		this.displayUpload();
		break;
		
	case "kill-button":
		this.kill();
		break;
	
	default:
		alert("No button handling for " + id);
		break;
	}
};

CodeUpload.prototype.displayUpload = function() {
	if (this.isRunning) return;
	
	var thiz = this;
	$("body").append(
		"<div id='upload-dialog'>" +
			"<p>Upload a code archive to be extracted, built and run.</p>" +
			"<div class='saharaform'>" +		
				"<form id='code-upload-form' action='/batch/torigclient' target='" + this.$uploadTarget.attr("name") + "' " +
						"method='post' enctype='multipart/form-data'>" +
					"<label form='code-archive'>Code archive:</label>" +
					"<input type='file' id='code-archive' name='file' />" +
				"</form>" +
				"<div id='code-upload-err' class='ui-state-error ui-corner-all'>" +
					"<span class='ui-icon ui-icon-alert' />" +
					"<p></p>" +
				"</div>" + 
				"<label for='command-args'>Launch arguments:</label>" +
				"<input type='text' id='command-args' />" +		
			"</div>" +
		"</div>"
	);

	/* We need to disable the termianl so it won't be greedy with keypresses. */ 
	this.status.enable(false);
	
	this.$uploadDialog = $("#upload-dialog").dialog({
		autoOpen: true,
		title: "Code Upload",
		width: 400,
		modal: true,
		resizable: false,
		buttons: {
			'Upload': function() { 
				if (thiz.isRunning) thiz.status.enable(true);
				thiz.startUpload(); 
			},
			'Cancel': function() { 
				if (thiz.isRunning) thiz.status.enable(false);
				$(this).dialog("close"); 
			}
		},
		close:   function() { $(this).dialog("destroy"); $("#upload-dialog").remove(); },
	});
};

CodeUpload.prototype.startUpload = function() {
	if (this.isUploading) return;
	this.isUploading = true;
	
	/* Clear any previous state. */
	this.status.clear();
	
	/* Quick sanity check. */
	var file = $("#code-archive").val(), thiz = this;

	if (!$.browser.opera && (file.length == 0 || !file.indexOf(".zip") > 0))
	{
		$("#code-upload-err").show()
			.children("p")
				.empty()
				.append("Uploaded file is not valid. Ensure it has a '.zip' file extension.");
		this.isUploading = false;
		return;
	}
	
	/* Give the user the option of stoppong page navigation. */
	window.onbeforeunload = function(e) {
		var str = "Navigating away from this page will cancel the upload of your code.";
		
		/* IE pre 8 & and Firefox pre 4 (according MDN). */
		e = e || window.event;
		if (e) e.returnValue = str;

		return str;
	};

	/* Tear down dialog. */
	this.$uploadDialog
		.dialog("option", {
			closeOnEscape: false,
			width: 100
		})
		.hide()
		.prev().hide()
		.next().next().hide();
	
	/* Add a spinner. */
	this.$uploadDialog.parent()
		.css("left", parseInt(this.$uploadDialog.parent().css("left")) + 100)
		.append(
			"<div id='code-upload-spinner'>" +
				"<img src='/uts/irobot/images/spinner.gif' alt='' /><br />" +
				"Uploading..." +
			"</div>"
		);
		
	/* Set args. */
	$.post(
		"/primitive/json/pc/CodeUploadController/pa/setArgs",
		{ args: $("#command-args").val() }
	);
	
	/* Upload archive. */
	$("#code-upload-form").submit();
	
	/* Start polling the target frame for upload status. */
	setTimeout(function() { thiz.checkIfUploaded(); }, 1000);
};

CodeUpload.prototype.checkIfUploaded = function() {
	var text = this.$uploadTarget.contents().text(), thiz = this;
	
	if (text == "")
	{
		/* File still uploading. */
		setTimeout(function() { thiz.checkIfUploaded(); }, 1000);
	}
	else 
	{
		this.isUploading = false;
		
		this.$uploadTarget.empty();
		window.onbeforeunload = null;
		
		if (text.indexOf("error;") == 0 || text.indexOf("false;") == 0)
		{
			/* Something failed in the initial upload. */
			$("#code-upload-err").show()
				.children("p")
					.empty()
					.append(text.substring(text.indexOf(";") + 1));
			
			/* Restore dialog. */
			this.$uploadDialog.parent()
				.css("left", parseInt(this.$uploadDialog.parent().css("left")) - 100);
			
			this.$uploadDialog
				.dialog("option", {
					closeOnEscape: true,
					width: 400
				})
				.show()
				.prev().show()
				.next().next().show();
			
			$("#code-upload-spinner").remove();
		}
		else
		{
			this.setRunning(true);
			this.$uploadDialog.dialog("close");
			setTimeout(function() { thiz.getStatus(); }, 2000);
		}
	}
};

CodeUpload.prototype.getStatus = function() {
	var thiz = this;
	$.ajax({
		url: "/batch/status",
		cache: false,
		success: function (r) { 
			if (typeof r != "object") window.location.reload();
			
			/* Display of statuses. */
			thiz.status.setStdOut(r.stdout);
			
			if (r.state == "IN_PROGRESS")
			{
				/* If the execution is not complete we keep polling the response. */
				thiz.setRunning(true);
				setTimeout(function() { thiz.getStatus(); }, 2000);
			}
			else
			{
				/* Restore the page because code is no longer running. */
				thiz.setRunning(false);
			}
		},
		error: function() { setTimeout(function() { thiz.getStatus(); }, 5000); }
	});
};

CodeUpload.prototype.kill = function() {
	if (!this.isRunning) return;
	this.isKilling = true;
	var thiz = this;
	
	$("#kill-button").empty().addClass("disabled")
		.append(
			"<img src='/uts/irobot/images/spinner.gif' alt=' ' /><br />" +
			"Killing..."
	);
	
	$.post(
		"/batch/abort",
		null,
		function (resp) {
			if (typeof resp != "object") return;
			thiz.setRunning(resp.success);
		}
	);
};

CodeUpload.prototype.setRunning = function(running) {		
	if (running && !this.isRunning)
	{
		this.isRunning = true;
		$("#upload-button").empty().addClass("disabled")
			.append(
				"<img src='/uts/irobot/images/spinner.gif' alt=' ' /><br />" +
				"Running..."	
		);
		
		$("#kill-button").removeClass("disabled");
		this.graphics.enable(true);
		this.status.enable(true);
	}
	else if (!running && (this.isRunning || !this.hasStatus))
	{
		this.isRunning = false;
		$("#upload-button").empty().removeClass("disabled")
			.append(
				"<img src='/uts/irobot/images/run.png' alt=' ' /><br />" +
				"Build & Run"
		);
			
		if (this.isKilling)
		{
			$("#kill-button").empty().append(
				"<img src='/uts/irobot/images/kill.png' alt=' ' /><br />" +
				"Kill Program"
			);
		}
		else $("#kill-button").addClass("disabled");
		this.graphics.enable(false);
		this.status.enable(false);
	}
	
	this.hasStatus = true;
};

CodeUpload.prototype.destroy = function() {
	$(document).unbind("keydown.terminate");
	if (this.$w) this.$w.remove();
};


/* ----------------------------------------------------------------------------
 * -- Code Upload Status.                                                    --
 * ---------------------------------------------------------------------------- */
function CodeUploadStatus(pc)
{
	IWidget.call(this, pc);
	
	this.wid = "code-status";
	this.tabs = ["Verify", "Compile", "Terminal"];
	
	this.$verify = null;
	this.$compile = null;
	this.$stdout = null;
	this.stdOutScoll = null;
	
	this.verifySize = 0;
	this.compileSize = 0;
	this.stdOutLines = 0;
	this.stdOutLast = '';
	
	this.$cursor = null;
	this.cursorBlinkIt = null;
	this.termBuf = '';
	this.termActive = false;
	
	this.progRunning = false;
	this.stop = false;
}
CodeUploadStatus.prototype = new IWidget;

CodeUploadStatus.prototype.init = function() {
	this.pageAppend(
		"<div id='code-status-verify' class='widget-tab-panel'>" +
			"<div id='run-verify'></div>" +
		"</div>" +
		"<div id='code-status-compile' class='widget-tab-panel'>" +
			"<div id='run-compile'></div>" +
		"</div>" +
		"<div id='code-status-terminal' class='widget-tab-panel'>" +
			"<div id='run-stdout'>" +
				"<ul>" +
					"<li id='terminal-input'>" +
						"<div id='terminal-input-cursor' class='terminal-input-cell'></div>" +
						"<div id='terminal-input-send'>&gt;</div>" +
						"<div id='terminal-input-clear'></div>" +
					"</li>" +
				"</ul>" +
			"</div>" +
		"</div>"
	);
	
	this.$verify = $("#run-verify");
	this.$compile = $("#run-compile");
	this.$stdout = $("#terminal-input");
	
	this.stdOutScoll = $("#run-stdout")[0];
	
	$("#code-status").resizable({
		minWidth: this.$w.width(),
		minHeight: this.$w.height()
	});
	
	var thiz = this;
	
	this.$cursor = $("#terminal-input-cursor");
	this.cursorBlinkIt = setInterval(function() {
		if (thiz.progRunning) thiz.$cursor.toggleClass("cursor-active");
	}, 500);
	
	$(document).bind("keypress.terminal", function(event) {
		
		if (thiz.progRunning && thiz.termActive)
		{
			thiz.terminalKey(event.which);

			/* We are stopping this event bubble because the terminal is 
			 * intercepting all the key press interrupts. */
			event.stopImmediatePropagation();
			return false;
		}
	});
	
	$(document).bind("keydown.terminal", function(event) {
		if (thiz.progRunning && thiz.termActive)
		{
			/* Stopping event handlers firing because the terminal is greedy. */
			event.stopImmediatePropagation();
			
			if (event.which == 8)
			{
				/* Backspace, removes the last character from the buffer. */
				thiz.$cursor.prev().remove();
				thiz.termBuf = thiz.termBuf.substr(0, thiz.termBuf.length - 1);
			}

			return false;
		}
	});
	
	$("#terminal-input-send").click(function() {
		thiz.sendTerminal();
	});
};

CodeUploadStatus.prototype.terminalKey = function(code) {
	/* Terminal is only active if a program is running and the terminal is in
	 * focus. */
	if (!(this.progRunning && this.termActive)) return;
	
	switch (code)
	{
	case 13: // Enter key has been pressed so send along the input 
		this.sendTerminal();
		break;
		
	case 8: // Backspace removes the last enter field
		/* This is being performed used a keydown event as some browsers 
		 * (Chrome, IE) do not provide it as a keypress event. */
		break;	
		
	default: // The rest of the characters are terminal input
		var char = String.fromCharCode(code);
		this.termBuf += char;
		this.$cursor.before("<div class='terminal-input-cell'>" + this.quote(char) + "</div>");
		break;
	}
};

CodeUploadStatus.prototype.sendTerminal = function() {
	if (!this.progRunning) return;
	$.post(
		"/primitive/echo/pc/CodeUploadController/pa/stdin",
		{
			'in': this.termBuf
		}
	);
	
	this.termBuf = '';
	this.$cursor.siblings().not("#terminal-input-send").remove();
};

CodeUploadStatus.TERMINATOR_VERIF_START = "__*~#START_INIT_TERMINATOR#~*__";
CodeUploadStatus.TERMINATOR_VERIF_COMP  = "__*~#INIT_STDOUT_TERMINATOR#~*__";
CodeUploadStatus.TERMINATOR_COMP_RUN    = "__*~#COMP_RUN_TERMINATOR#~*__";

CodeUploadStatus.prototype.setStdOut = function(stdout) {
	if (!stdout) return;
	
	var verifStart, compStart = -1, stdoutStart = -1;
	 
	/* The output format has three sections, verification, compiliation and 
	 * program output seperated by terminators. It is also rolling and may not
	 * contain each section as oldest output is removed from the output stream. */
	
	if ((verifStart = stdout.indexOf(CodeUploadStatus.TERMINATOR_VERIF_START)) != -1)
	{
		verifStart += CodeUploadStatus.TERMINATOR_VERIF_START.length;
		if ((compStart = stdout.indexOf(CodeUploadStatus.TERMINATOR_VERIF_COMP)))
		{
			this.appendVerify(stdout.substring(verifStart, compStart));
		}
		else 
		{
			this.appendVerify(stdout.substring(verifStart));
			return;
		}
	}

	if (compStart > 0 || (compStart = stdout.indexOf(CodeUploadStatus.TERMINATOR_VERIF_COMP)) != -1)
	{
		compStart += CodeUploadStatus.TERMINATOR_VERIF_COMP.length;
		if ((stdoutStart = stdout.indexOf(CodeUploadStatus.TERMINATOR_COMP_RUN)) != -1)
		{
			this.appendCompile(stdout.substring(compStart, stdoutStart));
		}
		else
		{
			this.appendCompile(stdout.substring(compStart));
			return;
		}
	}
	
	if (stdoutStart > 0 || (stdoutStart = stdout.indexOf(CodeUploadStatus.TERMINATOR_COMP_RUN)) != -1)
	{
		stdoutStart += CodeUploadStatus.TERMINATOR_COMP_RUN.length;
		this.appendStdOut(stdout.substring(stdoutStart));
	}
	
	if (verifStart == -1 && compStart == -1 && stdoutStart == -1)
	{
		/* All the terminators have been overritten. */
		this.appendStdOut(stdout);
	}
};

CodeUploadStatus.prototype.appendVerify = function(text) {
	if (this.verifySize >= text.length) return;
	
	if (this.verifySize == 0) this.switchTo("verify");
	
	var tasks = text.split("---"), task, i = 0, j = 0, p, s, wa,
		html = '<ul class="status-tasks">';
	
	for (i in tasks)
	{
		task = tasks[i];
		if (task == "") continue;
		
		if (task.indexOf("[OK]") > 0) s = 'task-success';
		else s = task.indexOf("[Failed]") == -1 ? 'task-inprogress' : 'task-failure';
		
		html += "<li class='status-task " + s + "'>" +
					"<div class='status-name'>" +
						"<span class='ui-icon ui-icon-triangle-1-e'></span>";

		if ((p = task.indexOf('[')) == -1)
		{
			html += task;
		}
		else
		{
			html += task.substr(0, p);
			if ((s = task.slice(p)).indexOf("[Failed]") == 0)
			{
				/* Error occured, should have an error reason. */
				html += "</div>" +
						"<div class='task-failure-reason'>" +
							"Code verification failed because: " + 
							s.substr(s.indexOf(']') + 1) +
							"<p class='task-failure-help'>If you think this is a system error please use the " +
							"'Contact Support' button for help.</p>";
			}
			else if (s.indexOf("[OK]") != 0)
			{
				html += "<div class='task-warning-list'>" +
							"<ul>";
				
				/* Warnings or information. */
				wa = s.split(/\s*\[\s*/);
				for (j in wa)
				{
					/* Junk data or end of list. */
					if (!(wa[j].indexOf("W]") == 0 || wa[j].indexOf("I]") == 0)) continue;
					
					html += "<li class='task-info-" + (wa[j].indexOf("W") == 0 ? 'warn' : 'info') + "'>" +
								wa[j].substr(wa[j].indexOf(']') + 1) +
							"</li>";
				}
				
				html +=   "</ul>" +
						"</div>";
			}	
		}
		
		html +=		"</div>" + 
				"</li>";
	}
	
	html += "</ul>";
	
	this.verifySize = text.length;
	this.$verify.empty().append(html);
	
	$("#run-verify .status-task").click(function() {		
		$(this).find(".task-warning-list").slideToggle();
		$(this).find("span.ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s");
	});
};

CodeUploadStatus.prototype.appendCompile = function(text) {	
	if (this.compileSize >= text.length) return;
	
	/* Switch to tab if we have content. */
	if (this.compileSize == 0) this.switchTo('compile');
	
	this.compileSize = text.length;	
	this.$compile.empty().append("<pre>" + this.quote(text) + "</pre>");
};

CodeUploadStatus.prototype.appendStdOut = function(text) {
	var lines, pos = 0, i = 0, html = '', k;
	
	if ((pos = text.indexOf(this.stdOutLast)) == -1)
	{
		this.$stdout.siblings().remove();
		this.stdOutLines = 0;
	}
	else
	{
		text = text.substr(pos + this.stdOutLast.length);
	}

	if (this.stdOutLines == 0) 
	{
		this.switchTo("terminal");
	}
		
	lines = text.split("\n");
	for (i in lines)
	{
		if (lines[i] == '') continue;
		html += "<li>" + this.quote(lines[i]) + "</li>";	
	}
	
	/* We want to insert the output lines immediately before the 
	 * terminal input line.*/
	this.$stdout.before(html);
	this.stdOutLines += lines.length - 1;
	
	k = lines.length;
	do
	{
		this.stdOutLast = lines[k - 3] + "\n" + lines[lines.length - 2] + "\n" + lines[lines.length - 1];
	}
	while (k > 3 && this.stdOutLast == '');
	
	/* We want the terminal to scroll to the latest content. */
	this.stdOutScoll.scrollTop = this.stdOutLines * 50;

	/* Limit the number of lines on the page ot sto the browser
	 * from running out of memory. */
	while (this.stdOutLines > 100)
	{
		this.$stdout.siblings(":first").remove();
		this.stdOutLines--;
	}
};

CodeUploadStatus.prototype.quote = function(text) {
	return text.replace("&", "&amp;")
			   .replace(">", "&gt;")
			   .replace("<", "&lt;")
			   .replace(' ', "&nbsp;");
};

CodeUploadStatus.prototype.clear = function() {
	this.$verify.empty();
	this.verifySize = 0;
	this.$compile.empty();
	this.compileSize = 0;
	this.$stdout.siblings().remove();
	this.stdOutLines = 0;
};

CodeUploadStatus.prototype.enable = function(enabled) {
	this.progRunning = enabled;
};

CodeUploadStatus.prototype.switchTo = function(tab) {
	$("#" + this.wid + " .widget-tab").removeClass("widget-tab-selected");
	$("#tab-" + tab).addClass("widget-tab-selected");

	$("#" + this.wid + " .widget-tab-panel").hide();
	$("#" + this.wid + "-" + tab).show();
	
	this.termActive = tab == "terminal";
};

CodeUploadStatus.prototype.destroy = function () {
	clearInterval(this.cursorBlinkIt);
	$(document).unbind("keypress.terminal");
	$(document).unbind("keydown.terminal");
	if (this.$w) this.$w.remove();
};

/* ----------------------------------------------------------------------------
 * -- Code upload graphics display.                                          --
 * ---------------------------------------------------------------------------- */
function CodeUploadGraphics(pc) 
{
	IWidget.call(this, pc);
	
	this.wid = "code-upload-graphics-box";
	this.title = "Graphics Display";
	
	this.ctx = null;
	this.width = 0;
	this.height = 0;
	this.currentFID= -1;
	
	this.offX = 0;
	this.offY = 0;
	
	this.enabled = false;
	this.resizeEnabled = false;
}
CodeUploadGraphics.prototype = new IWidget;

CodeUploadGraphics.prototype.init = function() {
	this.pageAppend(
		"<div id='code-upload-graphics'>" +
			"<p>Upload a program using the graphical libraries to display graphics.</p>" +
		"</div>"
	);

	this.getFrame();
};

CodeUploadGraphics.prototype.getFrame = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/echo/pc/CodeUploadController/pa/getGraphicsFrame",
		cache: false,
		success: function (data) { 
			thiz.parseFrame(data);
			if (thiz.enabled) setTimeout(function() { thiz.getFrame(); }, 1000);
		},	
		error:   function() {
			setTimeout(function() { thiz.getFrame(); }, 2000); 
		}
	});
};

CodeUploadGraphics.prototype.parseFrame = function(frame) {
	if (typeof frame != "string") return;
	
	var doc, gui, fid, height, width, e, thiz = this;
	
	/* Parse frame XML to DOM Document. */
    if (window.DOMParser)
    {
    	doc = new DOMParser().parseFromString(frame, "text/xml");
    }
    else if (window.ActiveXObject)
    {
    	doc = new ActiveXObject("Microsoft.XMLDOM");
        doc.async = "false";
        doc.loadXML(frame);
    }
    else
    {
    	this.control.log("Unable to parse graphics XML - no DOM parser.", IRobot.ERROR);
    	return;
    }
	
    gui = doc.documentElement;
	if (!(fid = gui.getAttribute("frame")))
	{
		/* No frame identifer so empty frame. */
		// FIXME Clearing the frame causes flicker.
		return;
	}
	else if (this.currentFID == (fid = parseInt(fid)))
	{
		/* Same frame as that rendered. No need to render again. */
		return;
	}
	
	/* Rendering a new frame. */
	this.currentFID = fid;
	if ((height = parseInt(gui.getAttribute("height"))) != this.height | 
		(width  = parseInt(gui.getAttribute("width")))  != this.width)
	{
		/* Either first load or frame resized so we need to deploy new canvas. */
		var canvas = getCanvas("graphics-canvas", this.width = width, this.height = height);
		$("#code-upload-graphics").empty().append(canvas);
		this.ctx = canvas.getContext("2d");
		
		this.offX = $(canvas).offset().left;
		this.offY = $(canvas).offset().top;
		
		$(canvas).click(function(evt) { thiz.click(evt); });
		
		/* If the canvas size is greater than the bounding box size, we
		 * we make the bounding box resizable. */
		if (this.height > this.$w.height() || this.width > this.$w.width() && !this.resizeEnabled)
		{
			this.$w.resizable({
				minWidth: this.$w.width(),
				minHeight: this.$w.height()
			});
			this.resizeEnabled = true;
		}
	}
	
	this.clearFrame();
	
	if ((e = gui.getElementsByTagName("map")).length == 1)   this.renderMap(e[0]);
	if ((e = gui.getElementsByTagName("grid")).length == 1)  this.renderGrid(e[0]);
	if ((e = gui.getElementsByTagName("frame")).length == 1) this.renderFrame(e[0]);
};

CodeUploadGraphics.prototype.renderMap = function(map) {
	/* The map is black lines 2 lines long. */
	this.ctx.save();
	this.ctx.strokeStyle = "#000000";
	this.ctx.lineWidth = 2;
	this.render(map, false);
	this.ctx.restore();
};

CodeUploadGraphics.prototype.renderGrid = function(grid) {
	/* The grid is a pixel grey. */
	this.ctx.save();
	this.ctx.strokeStyle = "#AAAAAA";
	this.ctx.lineWidth = 1;
	
	var e, xs, ys, xe, ye, p, sz = 4, dash;
	for (e = grid.firstChild; e != null; e = e.nextSibling)
	{
		xs = parseFloat(e.getAttribute("xs"));
		ys = parseFloat(e.getAttribute("ys"));
		xe = parseFloat(e.getAttribute("xe"));
		ye = parseFloat(e.getAttribute("ye"));
		
		this.ctx.beginPath();
		dash = false;
	
		if (ys == ye)
		{
			/* Horizontal lines. */
			for (p = xs; p <= xe; p += sz)
			{
				if (dash) this.ctx.lineTo(p, ys);
				else      this.ctx.moveTo(p, ys);
				dash = !dash;
			}
		}
		else
		{
			/* Vertical lines. */
			for (p = ys; p <= ye; p += sz)
			{
				if (dash) this.ctx.lineTo(xs, p);
				else      this.ctx.moveTo(xs, p);
				dash = !dash;
			}
		}
		
		this.ctx.closePath();
		this.ctx.stroke();
	}
	
	this.ctx.restore();
};

CodeUploadGraphics.prototype.renderFrame = function(frame) {
	this.render(frame, true);
};

CodeUploadGraphics.prototype.render = function(content, colorize) {
	var element, ppoint, fx, fy;
	for (element = content.firstChild; element != null; element = element.nextSibling)
	{
		/* We are only interested in elements. */
		if (element.nodeType != 1) continue;
				
		this.ctx.save();
		if (colorize && element.getAttribute("c"))
		{
			/* Set the desired color. */
			switch (parseInt(element.getAttribute("c")))
			{
			case 0: // White
				this.ctx.fillStyle = this.ctx.strokeStyle = "#FFFFFF";
				break;
			case 1: // Green
				this.ctx.fillStyle = this.ctx.strokeStyle = "#00FF00";
				break;
			case 2: // Red
				this.ctx.fillStyle = this.ctx.strokeStyle = "#FF0000";
				break;
			case 3: // Blue
				this.ctx.fillStyle = this.ctx.strokeStyle = "#0000FF";
				break;
			case 4: // Yellow
				this.ctx.fillStyle = this.ctx.strokeStyle = "#FCE700";
				break;
			case 5: // Grey
				this.ctx.fillStyle = this.ctx.strokeStyle = "#AAAAAA";
				break;
			case 6: // Black
				this.ctx.fillStyle = this.ctx.strokeStyle = "#000000";
				break;
			default:
				this.control.log("Unknown color: " + element.getAttribute("c"), IRobot.ERROR);
			}
		}
		
		if (element.nodeName != "point") this.ctx.beginPath();
		
		switch (element.nodeName)
		{
		case 'line':
			this.ctx.moveTo(parseInt(element.getAttribute("xs")), parseInt(element.getAttribute("ys")));
			this.ctx.lineTo(parseInt(element.getAttribute("xe")), parseInt(element.getAttribute("ye")));
			break;
			
		case 'point':
			this.ctx.fillRect(parseInt(element.getAttribute("x")), parseInt(element.getAttribute("y")), 1, 1);
			break;
			
		case 'rect':
			this.ctx.rect(parseInt(element.getAttribute("x")), parseInt(element.getAttribute("y")), 
						  parseInt(element.getAttribute("w")), parseInt(element.getAttribute("h")));
			break;
			
		case 'circle':
			this.ctx.arc(parseInt(element.getAttribute("x")), parseInt(element.getAttribute("y")), 
						 parseInt(element.getAttribute("r")), 0, Math.PI * 2, true);
			break;
			
		case 'arc':
			this.ctx.arc(parseInt(element.getAttribute("x")), parseInt(element.getAttribute("y")), 
						 parseInt(element.getAttribute("r")), parseFloat(element.getAttribute("s")),
						 parseFloat(element.getAttribute("e")), false);
			break;
			
		case 'path':
			fy = fx = -1;

			for (ppoint = element.firstChild; ppoint != null; ppoint = ppoint.nextSibling)
			{
				/* The only child elements of a path are ppoint elements. */
				if (ppoint.nodeName != "ppoint") continue;
				
				if (fx == -1) 
				{	
					this.ctx.moveTo(fx = parseInt(ppoint.getAttribute("x")), fy = parseInt(ppoint.getAttribute("y"))); 
				}
				else this.ctx.lineTo(parseInt(ppoint.getAttribute("x")), parseInt(ppoint.getAttribute));
			}
			
			/* After adding at the points we need to close up the path. */
			this.ctx.lineTo(fx, fy);
			break;
			
		case 'text':
			this.ctx.strokeStyle = "#000000";
			this.ctx.strokeText(element.textContent, parseFloat(element.getAttribute("x")), 
								parseFloat(element.getAttribute("y")));
			break;
		}
		
		if (element.nodeName != "point")
		{
			this.ctx.closePath();

			/* Determine whether this element needs to be stroked or filled. */
			if (element.getAttribute("f") && element.getAttribute("f") == 't')
			{
				this.ctx.fill();
			}  
			else
			{
				this.ctx.stroke();
			}
		}
		this.ctx.restore();
	}
};

CodeUploadGraphics.prototype.click = function(evt) {
	if (!this.enabled) return;
	
	$.post(
		"/primitive/json/pc/CodeUploadController/pa/registerGraphicsClick",
		{
			clickX: evt.pageX - this.offX,
			clickY: evt.pageY - this.offY
		}
	);
};

CodeUploadGraphics.prototype.clearFrame = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
};

CodeUploadGraphics.prototype.enable = function(enabled) {
	if (this.enabled = enabled)
	{
		/* If running and previously not running, get a frame. */
		this.getFrame();
	}
};

/* ----------------------------------------------------------------------------
 * -- Utility functions                                                      --
 * ---------------------------------------------------------------------------- */

function getCanvas(id, width, height)
{
	var canvas = document.createElement("canvas");
	canvas.setAttribute("id", id);
	canvas.setAttribute("width", width);
	canvas.setAttribute("height", height);
	
	if (typeof G_vmlCanvasManager != "undefined")
	{
		/* Hack to get canvas setup on IE6 to 8 which don't support canvas
		 * natively. */
		G_vmlCanvasManager.initElement(canvas);
	}
	
	return canvas;
}

function mathRound(num, places) 
{
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

