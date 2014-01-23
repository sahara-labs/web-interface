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
        led: true,
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
/*
    o = new Slider("slider-1", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        label: "Horizontal Slider",
        vertical: false,
        windowed: false,
        min: 0,
        max: 20,
        scales: 10,
        dimension: 180
    });
    this.widgets.push(o);

    o = new Slider("slider-2", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        vertical: true,
        label: "Flow two",
        min: 0,
        max: 20,
        scales: 10,
        windowed: false,
        dimension: 180
    });
    this.widgets.push(o);

    o = new Slider("slider-3", {
        field: "pump-on",
        action: "setPump",
        icon: "pump",
        draggable: true,
        vertical: true,
        label: "Flow one",
        min: 0,
        max: 20,
        scales: 10,
        windowed: false,
        dimension: 180
    });
    this.widgets.push(o);
*/
    o = new RotarySwitch("rotary-1", {
        field: "pump-on",
        title: "Water Level",
        action: "setPump",
        icon: "pump",
        draggable: true,
        windowed: true,
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

    o = new RotarySwitch("rotary-2", {
        field: "pump-on",
        title: "Water Flow",
        action: "setPump",
        icon: "pump",
        draggable: true,
        windowed: true,
        values: [
            {label: "1", value: 1},
            {label: "2", value: 2},
            {label: "3", value: 3},
            {label: "4", value: 4},
            {label: "5", value: 5},
            {label: "6", value: 6},
            {label: "7", value: 7},
            {label: "8", value: 8},
            {label: "9", value: 9},
            {label: "10", value: 10}
        ],
        radius: 70,
        color: "white"
    });
    this.widgets.push(o);

    o = new RotarySwitch("rotary-3", {
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
        color: 'white'
    });
    this.widgets.push(o);

    o = new Knob("knob-2", {
    	action: "setPump",
        label: "Knob Metal",
        draggable: true,
        style: "metal",
        max: 200,
        min: 100,
        units: 'rad',
        labelVertical: false,
        windowed: false,
        radius: 65,
    });
    this.widgets.push(o);

    o = new Knob("knob-3", {
    	action: "setPump",
        label: "Knob Black",
        draggable: true,
        style: "black",
        min: 10,
        max: 50,
        labelVertical: false,
        units: 'rpm',
        tooltip: 'Select a value.',
        windowed: false,
        radius: 65,
    });
    this.widgets.push(o);
    
    o = new Knob("knob-1", {
    	action: "setPump",
        label: "Knob Widget",
        draggable: true,
        style: "white",
        max: 360,
        units: 'deg',
        windowed: true,
        radius: 70,
    });
    this.widgets.push(o);
    
    o = new Button("button-1", {
    	action: "setPump",
        label: "Start Machine",
        draggable: true,
        windowed: false,
        overlay: true,
        circular: false,
        color: '#59835E',
        clickColor: '#03D61B'
    });
    this.widgets.push(o);
    
    o = new Button("button-2", {
    	action: "setPump",
        label: "Stop Machine",
        draggable: true,
        windowed: false,
        circular: false,
        overlay: true,
        color: '#B13333',
        clickColor: '#FF5252'
    });
    this.widgets.push(o);
    
    o = new Button("button-3", {
    	action: "setPump",
        label: "Mode 1",
        draggable: true,
        windowed: false,
        circular: false,
        overlay: false,
        color: '#747474',
        clickColor: '#464646'
    });
    this.widgets.push(o);

    o = new Button("button-4", {
    	action: "setPump",
        label: "Mode 2",
        draggable: true,
        windowed: false,
        circular: false,
        overlay: false,
        color: '#747474',
        clickColor: '#464646'
    });
    this.widgets.push(o);

    o = new Button("button-5", {
    	action: "setPump",
        label: "Mode 3",
        draggable: true,
        windowed: false,
        circular: false,
        overlay: false,
        color: '#747474',
        clickColor: '#464646'
    });
    this.widgets.push(o);

    o = new PushButton("button-6", {
    	action: "setPump",
        label: "Push Button",
        draggable: true,
        windowed: true,
        color: '#747474',
        clickColor: '#464646'
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