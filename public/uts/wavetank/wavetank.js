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

    o = new Switch("switch-1", {
        field: "pump-on",
        action: "setPump",
        label: "Silver",
        icon: "pump",
        led: true,
        draggable: true,
        stickColor: "silver",
        windowed: false,
        vertical: true
    });
    this.widgets.push(o);

    o = new Switch("switch-2", {
        field: "pump-on",
        action: "setPump",
        label: "Black",
        icon: "pump",
        led: true,
        draggable: true,
        windowed: false,
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
        windowed: false,
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
        windowed: false,
        vertical: false
    });
    this.widgets.push(o);

    this.widgets.push(new LED("led-1", {
        field: "pump-on",
        label: "Pump",
        draggable: true,
        windowed: false,
        ledBelow: true
    }));

    o = new Slider("slider01", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        label: "Short Slider",
        vertical: false,
        windowed: false,
        min: 0,
        max: 20,
        scales: 10,
        dimension: 180
    });
    this.widgets.push(o);

    o = new Slider("slider02", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        vertical: true,
        label: "Long Slider",
        min: 0,
        max: 20,
        scales: 10,
        windowed: false,
        dimension: 180
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-Label", {
        field: "pump-on",
        action: "setPump",
        label: "Rotary Switch",
        icon: "pump",
        draggable: true,
        windowed: false,
        values: [
            {label: "One", value: 1},
            {label: "Two", value: 2},
            {label: "Three", value: 3},
            {label: "Four", value: 4},
            {label: "Five", value: 5},
            {label: "Six", value: 6},
            {label: "Seven", value: 7},
            {label: "Eight", value: 8},
            {label: "Nine", value: 9},
            {label: "Ten", value: 10}
        ],
        radius: 70
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-Larger", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        windowed: false,
        values: [
            {label: "ON", value: 1},
            {label: "OFF", value: 0}
        ],
        radius: 70,
        colour: "white"
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-small", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        windowed: false,
        draggable: true,
        values: [
            {label: "one", value: 1},
            {label: "two", value: 2},
            {label: "three", value: 3},
            {label: "four", value: 4}
        ],
        radius: 50,
        colour: 'white'
    });
    this.widgets.push(o);
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