/**
 * Wave Tank user interface. 
 * 
 * @author Michael Diponio
 * @date 18th November 2013
 */

/* Globals overrides. */
Globals.COOKIE_PREFIX = "wavetank";
Globals.CONTROLLER    = "WaveTankController";
Globals.THEME         = Globals.THEMES.skeuo;

function WaveTank(id) 
{ 
    /** Display Manager. */
    this.display = undefined;

    /** Widgets. */
    this.widgets = [ ];

    /** Container. */
    this.$container = $('#' + id);

    /** Occurs if there is a data error. */
    this.dataError = false;
    
    /** Global error display. */
    this.errorDisplay = undefined;
    
    /** The number of seconds this graph displays. */
    this.duration = 60;

    /** The period in milliseconds. */
    this.period = 100;
};

/** 
 * Sets up this interface.
 */
WaveTank.prototype.setup = function() {
    var o;

    o = new RotarySwitch("rotary-Label", {
        field: "pump-on",
        action: "setPump",
        label: "Rotary Switch",
        icon: "pump",
        draggable: true,
        values: ['one','two','three','four','five','six','seven','eight','nine','ten'],
        radius: 70
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-Larger", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        values: ['ON','OFF'],
        radius: 70,
        colour: "white"
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-small", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        values: ['1','2','3','4','5','6'],
        radius: 50,
        colour: 'white'
    });
    this.widgets.push(o);

    o = new Switch("switch-1", {
        field: "pump-on",
        action: "setPump",
        label: "Silver",
        icon: "pump",
        draggable: true,
        tooltip: "Turn on pump",
        stickColor: "silver",
        vertical: true
    });
    this.widgets.push(o);

    o = new Switch("switch-2", {
        field: "pump-on",
        action: "setPump",
        label: "Black",
        icon: "pump",
        draggable: true,
        tooltip: "Turn on pump",
        stickColor: "black",
        vertical: true
    });
    this.widgets.push(o);
    
    o = new Switch("switch-3", {
        field: "pump-on",
        action: "setPump",
        label: "Red",
        icon: "pump",
        draggable: true,
        tooltip: "Turn on pump",
        stickColor: "red",
        vertical: true
    });
    this.widgets.push(o);

    o = new Switch("switch-4", {
        field: "pump-on",
        action: "setPump",
        label: "Pump",
        icon: "pump",
        draggable: true,
        tooltip: "Turn on pump",
        vertical: false
    });
    this.widgets.push(o);
   
    this.widgets.push(new LED("led-1", {
        field: "pump-on",
        label: "Pump",
        draggable: true,
        ledBelow: true
    }));
};

/** 
 * Runs the interface. 
 */
WaveTank.prototype.run = function() {
    /* Render the page. */
    var i = 0;
    for (i in this.widgets)
    {
        this.widgets[i]._loadState();
        this.widgets[i].init(this.$container);
        
    }
    
    /* Start acquiring data. */
    this.acquireLoop();
};

WaveTank.prototype.acquireLoop = function() {
    var thiz = this;

    $.ajax({
        url: "/primitive/mapjson/pc/" + Globals.CONTROLLER + "/pa/data",
        data: {
            period: this.period,
            duration: this.duration,
            from: 0,     // For now we are just asked for the latest data
        },
        success: function(data) {
            thiz.processData(data);
            setTimeout(function() { thiz.acquireLoop(); }, 10000);
        },
        error: function(data) {
            thiz.errorData('Connection error.');
            setTimeout(function() { thiz.acquireLoop(); }, 10000);
        }
    });
};

/**
 * Processes a successfully received data packet.  
 * 
 * @param data data packet
 */
WaveTank.prototype.processData = function(data) {
    var i = 0;
    for (i in this.widgets) this.widgets[i].consume(data);
//    /* A data packet may specify an error so we make need to make this into an 
//     * error message. */
//
//    /* AJAX / Primitive / validation error. */
//    if (!(data['success'] == undefined || data['success'])) return this.errorData(data['errorReason']);
//
//    /* Hardware communication error. */
//    if (data['system-err'] != undefined && data['system-err']) return this.errorData('Hardware communication error.');
//
//    /* Seems like a good packet so it will be forwarded to the display to
//     * render its contents and any error states will be cleared. */
//    if (this.dataError)
//    {
//        this.dataError = false;
//        this.display.unblur();
//        this.errorDisplay.destroy();
//    }
//    
//    this.display.consume(data);
};

/**
 * Processes an errored communication. 
 * 
 * @param msg error message
 */
WaveTank.prototype.errorData = function(msg) {    
//    if (!this.dataError)
//    {
//        /* Going into errored state, display error message. */
//        this.dataError = true;
//        this.display.blur();
//        
//        this.errorDisplay.error = msg;
//        this.errorDisplay.init();
//    }
//    else if (this.errorData && this.errorDisplay.error != msg)
//    {
//        /* Error has changed, update the error display. */
//        this.errorDisplay.error = msg;
//        this.errorDisplay.destroy();
//        this.errorDisplay.init();
//    }
};