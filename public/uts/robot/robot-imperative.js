/**
 * Robot Javascript.
 *
 * @author Michael Diponio
 * @date 27th April 2015
 */

/* ----------------------------------------------------------------------------
 * -- AMCL display widget.                                                   --
 * ---------------------------------------------------------------------------- */

/**
 * AMCL widget provides a display with the AMCL map, AMCL pose estimation and 
 * particle list. It also also the AMCL initial pose estimation to be set to 
 * initialise AMCL.
 * 
 * @constructor
 * @param {string} id widget identifier
 * @param {object} config configuration object
 * @config {string} [initalPoseField] data field which has the AMCL initial pose
 * @config {string} [poseField] data field which has the AMCL pose estimate
 * @config {string} [particlesField] data field which has the particles poses
 */

function AMCL(id, config)
{
	Widget.call(this, id, config);
	
	/* DOM objects. */
	this.canvas = null;
	
	/* Canvas context. */
	this.ctx = null;
	
	/* Canvas dimensions. */
	this.width = 644;
	this.height = 333;
	
	/* Offsets for event handling. */
	this.offX = undefined;
	this.offY = undefined;
		
	/* Scaling factors between units and canvas pixels. */
	this.pxPerM = 100; 			 // From the map configuration
	this.xo = this.width  / 2;                 // Origin is at the lower left pixel
	this.yo = this.height / 2;
	this.tho = Math.PI / 2;      // 90 deg. rotation offset
	this.r = 0.25 * this.pxPerM; // Robot radius
	
	/* AMCL provided positions. */
	this.initialPose = [];
	this.pose = [];
	this.particles = [];	
	
	/* Setting initial pose variables. */
	this.isSettingPose = false;	
	this.setInitialPose = [];
	this.mouse = { x: 0, y: 0};
}
AMCL.prototype = new Widget;

AMCL.prototype.init = function($container) {
	
    this.$widget = this._generate($container, "");
	
	this.canvas = Util.getCanvas("nav", this.width, this.height); 
	this.$widget.children(".window-content").prepend(this.canvas);
	
	if (this.canvas.getContext)
	{
		this.ctx = this.canvas.getContext("2d");
		this.draw();
	}
	else
	{
		alert("Using this interface requires a modern browser.");
	}

	var thiz = this,
	    $c = $(this.canvas)
				.mousedown(function(evt) { thiz.poseStart(evt); })
				.bind('mouseup', function (evt)  { thiz.poseStop(evt); });
		
	this.offX = $c.offset().left;
	this.offY = $c.offset().top;	
};

AMCL.prototype.consume = function(data) {
    if ($.isArray(data[this.config.initialPoseField]))
    {
        this.initialPose = data[this.config.initialPoseField];
        this.initialPose[2] -= Math.PI;
    }
    if ($.isArray(data[this.config.poseField])) this.pose = data[this.config.poseField];
    if ($.isArray(data[this.config.particlesField])) this.particles = data[this.config.particlesField];
    
    this.draw();
};

AMCL.prototype.draw = function(poseDraw) {
	/* If the inital pose is being set, the frame should not be updated as 
	 * will clear the pose set. */
	if (this.isSettingPose && !poseDraw) return;
	
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.drawSkeleton();

	this.drawInitialPose();
	this.drawPose();
	this.drawParticles();	
};

AMCL.prototype.drawSkeleton = function() {	
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

AMCL.prototype.drawInitialPose = function() {
    if (this.initialPose.length > 0)    
        this.drawRobot(this.initialPose, "grey", 0.5);
};

AMCL.prototype.drawPose = function() {
    if (this.pose.length > 0)
        this.drawRobot(this.pose, "red", 1);
};


AMCL.prototype.drawRobot = function(pos, color, opacity) {		
	/* Robot coords are relative to the orgin in the centre of diagram. */
	var x = this.xo - pos[0] * this.pxPerM,
		y = this.yo + pos[1] * this.pxPerM,
		a = pos[2] + this.tho;

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a + Math.PI / 6), y + this.r * Math.cos(a + Math.PI / 6));
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + this.r * Math.sin(a - Math.PI / 6), y + this.r * Math.cos(a - Math.PI / 6));
		
	this.ctx.shadowBlur = 3;
	this.ctx.shadowColor = "#AAAAAA";
	
	this.ctx.strokeStyle = "#000000";
	this.ctx.globalAlpha = opacity;
	this.ctx.lineWidth = 2;
	this.ctx.fillStyle = color;


	this.ctx.fill();
	this.ctx.stroke();

	this.ctx.restore();
};

AMCL.prototype.drawParticles = function() {
    if (this.particles.length == 0) return;
    
    var i, x, y, th, x1, y1;
    for (i = 0; i < this.particles.length; i += 3)
    {
        x = this.xo - this.particles[i] * this.pxPerM;
        y = this.yo + this.particles[i + 1] * this.pxPerM;
        th = this.particles[i + 2];
        
        this.ctx.moveTo(x1 = x - 15 * Math.cos(th), y1 = y - 15 * Math.sin(th));
        this.ctx.lineTo(x + 15 * Math.cos(th), y + 15 * Math.sin(th));
        
        this.ctx.moveTo(x + 5 * Math.cos(th + Math.PI / 6), y + 5 * Math.sin(th + Math.PI / 6));
        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x + 5 * Math.cos(th - Math.PI / 6), y + 5 * Math.sin(th - Math.PI / 6));
    }
    
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
};

AMCL.prototype.poseFrame = function() {
    this.draw(true);
	this.drawRobot(this.setInitialPose, "green", 0.9);
	
	/* Rotation arrow. */
	var x1 = this.xo - this.setInitialPose[0] * this.pxPerM,
	    y1 = this.yo + this.setInitialPose[1] * this.pxPerM,
	    a = this.tho + this.setInitialPose[2],
	    x2 = x1 + 100 * Math.sin(a),
	    y2 = y1 + 100 * Math.cos(a);
	
	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.moveTo(x1, y1);
	this.ctx.lineTo(x2, y2);
	
	this.ctx.moveTo(x2, y2);
	this.ctx.lineTo(x1 + 75 * Math.sin(a - Math.PI / 18), y1 + 75 * Math.cos(a - Math.PI / 18));
	
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x1 + 75 * Math.sin(a + Math.PI / 18), y1 + 75 * Math.cos(a + Math.PI / 18));
    
    this.ctx.strokeStyle = "#000000";
    this.ctx.globalAlpha = 1;
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 3;
    this.ctx.shadowColor = "#AAAAAA";
    this.ctx.stroke();
    this.ctx.restore();
};

AMCL.prototype.poseStart = function(e) {
    this.isSettingPose = true;
    
    this.mouse.x = e.pageX;
    this.mouse.y = e.pageY;
    
    /* Clicking on the map sets the initial POSE. */
    this.setInitialPose[0] = (this.xo + this.offX - e.pageX) / this.pxPerM;
    this.setInitialPose[1] = (this.yo + e.pageY -this.height - this.offY) / this.pxPerM;
    this.setInitialPose[2] = 0;

    this.poseFrame();
    
    var thiz = this;
	$(this.canvas).bind("mousemove", function(evt) { thiz.poseRotate(evt); });
};

AMCL.prototype.poseRotate = function(e) {	
    /* Moving the mouse rotates the position. */
    this.setInitialPose[2] = Math.atan2(this.mouse.y - e.pageY, e.pageX - this.mouse.x);
    this.poseFrame();
};

AMCL.prototype.poseStop = function(e) {
    $(this.canvas).unbind("mousemove");
    
    var thiz = this;
    
    this._postControl(
        this.config.action,
        {
            x: this.setInitialPose[0],
            y: this.setInitialPose[1],
            th: this.setInitialPose[2] + Math.PI
        },
        function(data) {
            thiz.isSettingPose = false;
            thiz.consume(data);
        }
    );
};



AMCL.prototype.destroy = function() {
	Widget.prototype.destroy.call(this);
};

/* ----------------------------------------------------------------------------
 * -- D-Pad widget to move the robot around.                                 --
 * ---------------------------------------------------------------------------- */

/**
 * DPad widget provides the ability to move a robot around in 2d.
 * 
 * @constructor
 * @param {string} id widget identifier
 * @param {object} config configuration object
 * @config {string} [action] server action to call when depressed
 * @config {string} [speedField] field to set with speed
 * @config {string} [yawField] field to set with yaw rate
 * @config {double} [velocity] velocity to set when depressed (default 0.5)
 */
function DPad(id, config)
{
    Widget.call(this, id, config); 
    
    if (this.config.action === undefined) throw "Option not set.";
    if (this.config.speedField === undefined) throw "Option not set.";
    if (this.config.yawField === undefined) throw "Option not set.";
    if (this.config.velocity === undefined) this.config.velocity = 0.5;

    this.pressed = [];
    
    this.speed = 0.0;
    this.yaw = 0.0;
    
    this.vel = this.config.velocity;
    
    this.ping;
    this.setTs = 0;
    
    this.loadAlpha = undefined;
    this.loadBeta = undefined;
    this.loadGamma = undefined;
}

DPad.prototype = new Widget;

DPad.prototype.init = function($container) {
    this.$widget = this._generate($container, 
        "<div id='north-finger' class='dpad-finger'><span></span></div>" + 
        "<div id='east-finger' class='dpad-finger'><span></span></div>" + 
        "<div id='south-finger' class='dpad-finger'><span></span></div>" + 
        "<div id='west-finger' class='dpad-finger'><span></span></div>" + 
        "<div id='pad-center'><span></span></div>"
    );
    
    var thiz = this;
    this.$widget.children(".dpad-finger")
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
    var thiz = this, params = { };
    this.setTs = new Date().getTime();
    
    params[this.config.speedField] = this.speed;
    params[this.config.yawField] = this.yaw;
    this._postControl(
        this.config.action,
        params,
        function(r) {
            thiz.movePing();
        }
    );
};

DPad.prototype.movePing = function() {
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
        }, 1000 - (ts - this.setTs));
    }
};

DPad.prototype.fingerPress = function(dir, e) {
    /* This event can be doubly called from holding down keydown keys. */
    if (this.pressed[dir]) return;
    
    this.pressed[dir] = true;
    
    /* Change display to pressed mode. */
    if (!e) e = $("#" + dir + "-finger");
    $(e).addClass("pressed");
    
    this.actionOccurred();
};

DPad.prototype.fingerRelease = function(dir, e) {
    /* This event can be doubly called from mouseup/mouseleave events. */
    if (!this.pressed[dir]) return;
    
    this.pressed[dir] = false;
    
    if (!e) e = $("#" + dir + "-finger");
    $(e).removeClass("pressed");
    
    this.actionOccurred();
};

DPad.prototype.destroy = function () {
    $(document).unbind("keydown.dpad keyup.dpad");

    Widget.prototype.destroy.call(this);
};
 

/* ----------------------------------------------------------------------------
 * -- Ranger display.                                                        --
 * ---------------------------------------------------------------------------- */

/**
 * Ranger to display a laser scan.
 * 
 * @param {string} id widget ID
 * @param {object} config configuration object
 */
function Ranger(id, config)
{
	Widget.call(this, id, config);

	
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
Ranger.prototype = new Widget;

Ranger.prototype.init = function($container) {
	
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
	
	this.$widget = this._generate($container, html)
	
	var canvas = Util.getCanvas("ranger", this.width, this.height);
	this.$widget.children(".window-content")
	    .css("overflow", "visible")
	    .prepend(canvas);
	    
	
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
	}
	else
	{
		alert("Using this rig requires a modern browser!");
	}
};

Ranger.prototype.consume = function(data) {
    
    this.minRange = data["laser-range-min"];
    this.maxRange = data["laser-range-max"];
    this.maxAngle = data["laser-angle-min"];
    this.minAngle = data["laser-angle-max"];
    this.angularRes = data["laser-angle-increment"];
    

    this.drawFrame(data["laser"]);
};

Ranger.prototype.drawFrame = function(scan) {
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

Ranger.prototype.drawScan = function(scan) {
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
	
	Widget.prototype.destroy.call(this);
};
