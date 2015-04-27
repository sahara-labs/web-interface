/**
 * Robot Javascript.
 *
 * @author Michael Diponio
 * @date 27th April 2015
 */

/* ----------------------------------------------------------------------------
 * -- D-Pad widget to move the robot around.                                 --
 * ---------------------------------------------------------------------------- */

/**
 * DPad widget provides the ability to move a robot around in 2d.
 * 
 * @constructor
 * @param {string} id data identifier
 * @param {object} config configuration object
 * @param {string} [action] server action to call when depressed
 * @param {string} [speedField] field to set with speed
 * @param {string} [yawField] field to set with yaw rate
 * @param {double} [velocity] velocity to set when depressed (default 0.5)
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
    
    
    /* For browsers that support device orientation. */
    // TODO Eventually touch device orientation support
//  window.addEventListener("deviceorientation", function(event) {
//      if (!thiz.loadAlpha) thiz.loadAlpha = event.alpha;
//      if (!thiz.loadBeta) thiz.loadBeta = event.beta;
//      if (!thiz.loadGamma) thiz.loadGamma = event.gamma;
//      
//      /* Speed is a tilt forward or back. */
//      if (event.beta > thiz.loadBeta + 15 && thiz.speed != -thiz.vel)
//      {
//          if (thiz.speed != 0) thiz.fingerRelease("south");
//          thiz.fingerPress("north");
//      }
//      else if (event.beta < thiz.loadBeta - 15 && thiz.speed != thiz.vel)
//      {
//          if (thiz.speed != 0) thiz.fingerRelease("north");
//          thiz.fingerPress("south");
//      }
//      else
//      {
//          if (thiz.speed != 0) thiz.fingerRelease(thiz.speed > 0 ? "north" : "south");
//      }
//      
//      /* Rotations is turn. */
//      if (event.alpha > thiz.loadAlpha + 15 && thiz.yaw != thiz.vel)
//      {
//          if (thiz.yaw != 0) thiz.fingerRelease("east");
//          thiz.fingerPress("west");
//      }
//      else if (event.alpha  < thiz.loadAlpha - 15 && thiz.yaw != -thiz.vel)
//      {
//          if (thiz.yaw != 0) thiz.fingerRelease("west");
//          thiz.fingerPress("east");
//      }
//      else
//      {
//          if (thiz.yaw != 0) thiz.fingerRelease(thiz.yaw> 0 ? "east" : "west");
//      }
//      
//  }, true);
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
 