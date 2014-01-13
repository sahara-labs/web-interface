/**
 * Shake Table web interface.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @author Jesse Charlton <jesse.charlton@uts.edu.au>
 * @date 1/6/2013
 */

/* ============================================================================ 
 * == Global variables.                                           ==
 * ============================================================================ */
Globals.COOKIE_PREFIX = "shaketable";
Globals.CONTROLLER    = "ShakeTableController";
Globals.THEME         = Globals.THEMES.flat;

/* ============================================================================
 * == Shake Table page control.                                              ==
 * ============================================================================ */

/**
 * This object controls the interface.
 * 
 * @param id container to add this interface to
 */
function ShakeTableControl(id) 
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
    this.duration = 10;

    /** The period in milliseconds. */
    this.period = 100;
};

/** 
 * Sets up this interface.
 */
ShakeTableControl.prototype.setup = function() {
	/* Graph to display tank levels. */
	this.widgets.push(new Graph("graph-displacement", {
	    title: "Displacement Levels",
	    windowed: true,
	    closeable: true,
	    draggable: true,
	    shadeable: true,
	    resizable: true,
	    expandable: true,
	    width: 420,
	    height: 325,
	    left: 355,
	    top: 420,
	    fields: {
	        'disp-graph-1': 'Level 1',
	        'disp-graph-2': 'Level 2',
	        'disp-graph-3': 'Level 3'
	    },
	    minValue: -60,
	    maxValue: 60,
	    duration: 10,
	    yLabel: "Displacement (mm)",
	    fieldCtl: false,
	    autoCtl: false,
	    durationCtl: false,
	    traceLabels: false,
	}));

    /* Add mimic to page. */
    this.widgets.push(new MimicWidget(this.$container, 'Diagram', ''));

	/* Add camera to page. */
    this.widgets.push(new CameraStream("camera-stream", {
        windowed: true,
        draggable: true,
        closeable: true,
        shadeable: true,
        resizable: true,
        expandable: true,
        left: -5,
        top: 5,
        videoWidth: 320,
        videoHeight: 240,
        swfParam: 'camera-swf',
        mjpegParam: 'camera-mjpeg',
        title: "Camera"
    }));

	/* Controls. */
    this.widgets.push(new Container("controls-container", {
        windowed: true,
        title: "Controls",
        draggable: true,
        closeable: true,
        shadeable: true,
        left: 50,
        top: 420,
        widgets: [
            new Switch("switch-motor-on", {
                field: "motor-on", 
                action: "setMotor",
                label: "Motor",
                
             }),
             new Switch("switch-coils-on", {
                 field: "coils-on",
                 action: "setCoils",
                 label: "Dampening",
             }),
             new Slider("slider-motor-speed", {
                 field: "motor-speed",
                 action: "setMotor",
                 max: 8,
                 precision: 2,
                 label: "Motor Frequency",
                 units: "Hz",
                 vertical: false,
             })
        ],
        layout: new FlowLayout({
            padding: 5,
            size: 320,
            vertical: false,
            center: true,
        })
    }));
    
    this.widgets.push(new Container("resizing-container", {
       windowed: true,
       title: "Resizing",
       draggable: true,
       closeable: true,
       shadeable: true,
       expandable: true,
       resizable: true,
       top: 150,
       left: -200,
       widgets: [
           new Spacer("sp-1", {
               border: "black",
               color: "red",
               round: false,
               width: 100,
               height: 50
           }),
           new Spacer("sp-2", {
               border: "black",
               color: "green",
               round: false,
               width: 100,
               height: 50
           }),
           new Spacer("sp-3", {
               border: "black",
               color: "yellow",
               round: false,
               width: 200,
               height: 75
           }),
       ],
       layout: new BoxLayout({
           padding: 10,
           vertical: true,
           align: BoxLayout.ALIGN.center
       })
    }));

	/* Display manager to allow things to be shown / removed. */
	this.display = new Container("shake-container", {
	    widgets: this.widgets
	});
	
	/* Error display triggered if error occurs. */
	this.errorDisplay = new GlobalError();
};

/** 
 * Runs the interface. 
 */
ShakeTableControl.prototype.run = function() {
	/* Render the page. */
	this.display.init(this.$container);

	/* Start acquiring data. */
	this.acquireLoop();
};

ShakeTableControl.prototype.acquireLoop = function() {
	var thiz = this;

	$.ajax({
		url: "/primitive/mapjson/pc/" + Globals.CONTROLLER + "/pa/dataAndGraph",
		data: {
		    period: this.period,
			duration: this.duration,
			from: 0,     // For now we are just asked for the latest data
		},
		success: function(data) {
			thiz.processData(data);
			setTimeout(function() { thiz.acquireLoop(); }, 1000);
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
ShakeTableControl.prototype.processData = function(data) {
	/* A data packet may specify an error so we make need to make this into an 
	 * error message. */

	/* AJAX / Primitive / validation error. */
	if (!(data['success'] == undefined || data['success'])) return this.errorData(data['errorReason']);

	/* Hardware communication error. */
	if (data['system-err'] != undefined && data['system-err']) return this.errorData('Hardware communication error.');

	/* Seems like a good packet so it will be forwarded to the display to
	 * render its contents and any error states will be cleared. */
	if (this.dataError)
	{
		this.dataError = false;
		this.display.unblur();
		this.errorDisplay.clearError();
	}
	
	this.display.consume(data);
};

/**
 * Processes an errored communication. 
 * 
 * @param msg error message
 */
ShakeTableControl.prototype.errorData = function(msg) {    
	if (!this.dataError)
	{
	    /* Going into errored state, display error message. */
		this.dataError = true;
		this.display.blur();
	}

	this.errorDisplay.displayError(msg);
};

/* ============================================================================
 * == Mimic Widget.                                                          ==
 * ============================================================================ */

/**
 * Mimic Widget. This widget creates and controls the Shake Table Mimic.
 */
function MimicWidget()
{
    Widget.call(this, "shaker-mimic", {
        title: "Shake Table Model",
        windowed: true,
        resizable: true,
        preserveAspectRation: true,
        minWidth: 320,
        minHeight: 410,
        closeable: true,
        shadeable: true,
        expandable: true,
        draggable: true,
        left: 355,
        top: 5,
    });
    
    /** Model dimensions in mm. */
    this.model = {
        levelWidth: 200,      // Width of the model
        armWidth: 70,         // Width of the stroke arm connecting the motor to the model
        motorRadius: 10,      // Radius of the motor
        wallHeight: 120,      // Height of the walls
        levelHeight: 30,      // Height of the levels
        trackHeight: 20,      // Height of the track
        trackWidth: 300,      // Width of track
        carHeight: 10,        // Height of carriage
        carWidth: 120,        // Width of carriage
        maxDisp: 60,          // Maximum displacement of the diagram
        baseDisp: 0.7         // Displacement of the base when the motor is on
    };
    
    /** Whether this mimic represents a 2DOF or a 3DOF widget. */
    this.is3DOF = true;
    
    /** Number of levels in the model. */
    this.numberLevels = this.is3DOF ? 4 : 3;
    
    /** Millimeters per pixel. */
    this.mmPerPx = 1.475;
    
    /** The width of the diagram in pixels. */
    this.width = undefined;

    /** The height of the diagram in pixels. */
    this.height = undefined;
    
    /** The period in milliseconds. */
    this.period = 100;
    
    /** Canvas context. */
    this.ctx = null;

    /** Amplitude of displacement in mm. */
    this.amp = [ 0, 0, 0, 0 ];
    
    /** Angular frequency r/s. */
    this.w = 0;
    
    /** Offsets of levels. */
    this.o = [ 0, 0, 0, 0 ];
        
    /** Frame count. */
    this.fr = 0;
    
    /** Motor frequency. */
    this.motor = 0;
    
    /** Coil power percentages. */
    this.coils = [ undefined, undefined, undefined ];
    
    /** Center line. */
    this.cx = undefined;
    
    /** Animation interval. */
    this.animateInterval = undefined;
}
MimicWidget.prototype = new Widget;

MimicWidget.ANIMATE_PERIOD = 50;

MimicWidget.prototype.init = function($container) {
    var canvas, thiz = this;
    
    if (this.window.width)
    {
        this.mmPerPx = 320 / this.window.width * 1.475;
    }

    /* The width of the canvas diagram is the width of the building model plus 
     * the maximum possible displacement. */
    this.width = this.px(this.model.levelWidth + this.model.maxDisp * 2) + this.px(100);
    this.height = this.px(this.model.levelHeight * (this.is3DOF ? 4 : 3) + 
            this.model.wallHeight * (this.is3DOF ? 3: 2) + this.model.trackHeight + this.model.carHeight);
    this.cx = this.width / 2;
    
    /* Box. */
    this.$widget = this._generate($container, "<div class='mimic'></div>");
    this.$widget.css("height", "auto");
    
    /* Canvas to draw display. */
    canvas = Util.getCanvas(this.id + "-canvas", this.width, this.height);
    this.$widget.find(".mimic").append(canvas);
    this.ctx = canvas.getContext("2d");
    this.ctx.translate(0.5, 0.5);

    /* Draw initial frame of zero position. */
    this.drawFrame([0, 0, 0, 0]);
    
    this.boxWidth = this.$widget.width();
   
    /* Start animation. */
    this.animateInterval = setInterval(function() { thiz.animationFrame(); }, MimicWidget.ANIMATE_PERIOD);
};

MimicWidget.prototype.consume = function(data) {
    var i, l, peaks = [], level, range;
    
    /* We need to find a list of peaks for each of the levels. */
    for (l = 1; l <= this.numberLevels; l++)
    {
        if (!$.isArray(data["disp-graph-" + l])) continue;

        /* To find peaks we are searching for the values where the preceding value is
         * not larger than the subsequent value. */
        level = [ ];
        for (i = data["disp-graph-" + l].length - 2; i > 1; i--)
        {
            if (data["disp-graph-" + l][i] > data["disp-graph-" + l][i + 1] && 
                    data["disp-graph-" + l][i] >= data["disp-graph-" + l][i - 1])
            {
                level.push(i);
                
                /* We only require a maximum of 5 peaks. */
                if (level.length == 5) break;
            }
        }
        
        /* If we don't have the requiste number of peaks, don't update data. */ 
        while (level.length < 5) return;
        
        peaks.push(level);
        
        /* Amplitude is a peak value. The amplitude we are using will the median
         * of the last 3 peaks. */
        this.amp[l] = this.medianFilter([ data["disp-graph-" + l][level[0]], 
                                          data["disp-graph-" + l][level[1]], 
                                          data["disp-graph-" + l][level[2]] ]); 
    }
    
    /* Amplitude for the base is fixed at 0.7 mm but only applies if the motor
     * is active. */
    this.amp[0] = data['motor-on'] ? this.model.baseDisp : 0;
    
    /* Angular frequency is derived by the periodicity of peaks. */
    range =  this.medianFilter([ peaks[0][0] - peaks[0][1],
                                 peaks[0][1] - peaks[0][2],
                                 peaks[0][2] - peaks[0][3],
                                 peaks[0][3] - peaks[0][4] ]);
    this.w = isFinite(i = 2 * Math.PI * 1 / (0.1 * range)) != Number.Infinity ? i : 0;
    
    /* Phase if determined based on the difference in peaks between the level
     * one and upper levels. */
    for (l = 2; l <= this.numberLevels - 1; l++)
    {
        this.o[l] = 2 * Math.PI * this.medianFilter([ peaks[l - 1][0] - peaks[0][0],
                                                      peaks[l - 1][1] - peaks[0][1],
                                                      peaks[l - 1][2] - peaks[0][2],
                                                      peaks[l - 1][3] - peaks[0][3] ]) / range;
    }
    
    /** Coil states. */
    if (this.is3DOF)
    {
        /* The 3DOF is either on or off. */
        for (i = 0; i < this.coils.length; i++) this.coils[i] = data['coils-on'] ? 100 : 0;
    }
    else
    {
        // TODO 2DOF coils
    }
    
    /* Motor details. */
    this.motor = data['motor-on'] ? data['motor-speed'] : 0;
};

/**
 * Runs a median filter on the algorithm.
 */
MimicWidget.prototype.medianFilter = function(data) {
    data = data.sort(function(a, b) { return a - b; });
    return data[Math.round(data.length / 2)];
};

MimicWidget.prototype.animationFrame = function() {
    var disp = [], i;
    
    this.fr++;
    for (i = 0; i < this.numberLevels; i++)
    {
        disp[i] = this.amp[i] * Math.sin(this.w * MimicWidget.ANIMATE_PERIOD / 1000 * this.fr + this.o[i]);
    }
    
    this.drawFrame(disp, disp[0] > 0 ? (this.w * MimicWidget.ANIMATE_PERIOD / 1000 * this.fr) : 0);
};

/**
 * Animates the mimic.
 * 
 * @param disp displacements of each level in mm
 * @param motor motor rotation
 */
MimicWidget.prototype.drawFrame = function(disp, motor) {

    /* Store the current transformation matrix. */
    this.ctx.save();

    /* Use the identity matrix while clearing the canvas to fix I.E not clearing. */
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);

    /* Restore the transform. */
    this.ctx.restore();

    this.drawTrackCarriageMotor(disp[0], motor);
    
    var l, xVert = [], yVert = [];

    /* Levels. */
    for (l = 0; l < this.numberLevels; l++)
    {
        xVert.push(this.cx - this.px(this.model.levelWidth / 2 + disp[l]));
        yVert.push(this.height - this.px(this.model.trackHeight + this.model.carHeight) - 
                this.px(this.model.levelHeight * (l + 1)) - this.px(this.model.wallHeight * l));
        
        /* Coil. */
        if (l > 0) this.drawCoil(yVert[l] + this.px(this.model.levelHeight / 2), this.coils[l - 1]);
        
        /* Mass. */
        this.drawLevel(xVert[l], yVert[l], l);
    }
    
    /* Arm vertices. */
    for (l = 0; l < xVert.length - 1; l++)
    {
        this.drawVertex(xVert[l], yVert[l], xVert[l + 1], yVert[l + 1] + this.px(this.model.levelHeight));
        this.drawVertex(xVert[l] + this.px(this.model.levelWidth), yVert[l], 
                xVert[l + 1] + this.px(this.model.levelWidth), yVert[l + 1] + this.px(this.model.levelHeight));
    }
    
    this.drawGrid();
};

/** The widget of the coil box in mm. */
MimicWidget.COIL_BOX_WIDTH = 26;

/**
 * Draws a coil. 
 * 
 * @param y the vertical position of coil
 * @param pw coil power
 */
MimicWidget.prototype.drawCoil = function(y, pw) {
    var gx = this.width - this.px(20), gy;
    
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(this.cx, y);
    this.ctx.lineTo(gx, y);
    
    this.ctx.moveTo(gx, y - this.px(this.model.levelHeight) / 2);
    this.ctx.lineTo(gx, y + this.px(this.model.levelHeight / 2));
    
    for (gy = y - this.px(this.model.levelHeight) / 2; 
            gy <= y + this.px(this.model.levelHeight) / 2; gy += this.px(this.model.levelHeight) / 4)            
    {
        this.ctx.moveTo(gx, gy);
        this.ctx.lineTo(this.width, gy + this.px(5));
    }
    
    this.ctx.stroke();
    
    
    this.ctx.fillStyle = pw === undefined ? "#CCCCCC" : pw > 0 ? "#50C878" : "#ED2939";
    this.ctx.fillRect(this.width - this.px(55), y - this.px(MimicWidget.COIL_BOX_WIDTH / 2), 
            this.px(MimicWidget.COIL_BOX_WIDTH), this.px(MimicWidget.COIL_BOX_WIDTH));
    this.ctx.strokeRect(this.width - this.px(55), y - this.px(MimicWidget.COIL_BOX_WIDTH / 2), 
            this.px(MimicWidget.COIL_BOX_WIDTH), this.px(MimicWidget.COIL_BOX_WIDTH));
    
    this.ctx.fillStyle = "#000000";
    this.ctx.font = this.px(13) + "px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("C", this.width - this.px(55 - this.px(MimicWidget.COIL_BOX_WIDTH / 2)), y);
    
};

MimicWidget.prototype.drawVertex = function(x0, y0, x1, y1) {
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.stroke();
};

/**
 * Draws a level box from the top left position. 
 * 
 * @param x x coordinate
 * @param y y coordinate
 * @param l level number
 */
MimicWidget.prototype.drawLevel = function(x, y, l) {
    this.ctx.fillStyle = "#548DD4";
    this.ctx.fillRect(x, y, this.px(this.model.levelWidth), this.px(this.model.levelHeight));
    
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x, y, this.px(this.model.levelWidth), this.px(this.model.levelHeight));
    
    if (l > 0)
    {
        this.ctx.fillStyle = "#000000";
        this.ctx.font = this.px(13) + "px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("M" + l, x + this.px(this.model.levelWidth) / 2, y + this.px(this.model.levelHeight / 2));
    }
};

/**
 * Draws the track, carriage and motor.
 *  
 * @param d0 displacement of base level
 * @param motor motor rotation
 */
MimicWidget.prototype.drawTrackCarriageMotor = function(d0, motor) {
    var tx = this.cx - this.px(this.model.trackWidth / 2), 
        ty = this.height - this.px(this.model.trackHeight), 
        mx, my, mr;
    
    /* Track. */
    this.ctx.fillStyle = "#AAAAAA";
    this.ctx.fillRect(tx, ty, this.px(this.model.trackWidth), this.px(this.model.trackHeight));
    
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(tx, ty, this.px(this.model.trackWidth), this.px(this.model.trackHeight));
    
    this.ctx.beginPath();
    this.ctx.moveTo(tx, ty + this.px(this.model.trackHeight) / 2 - 1);
    this.ctx.lineTo(tx + this.px(this.model.trackWidth), ty + this.px(this.model.trackHeight) / 2 - 1);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    /* Carriage. */
    this.ctx.fillStyle = "#666666";
    this.ctx.fillRect(this.cx - this.px(this.model.levelWidth / 4 + 10) - this.px(d0), ty - this.px(10), this.px(20), this.px(20));
    this.ctx.fillRect(this.cx + this.px(this.model.levelWidth / 4 - 10) - this.px(d0), ty - this.px(10), this.px(20), this.px(20));
    this.ctx.strokeStyle = "#222222";
    this.ctx.strokeRect(this.cx - this.px(this.model.levelWidth / 4 + 10) - this.px(d0), ty - this.px(10), this.px(20), this.px(20));
    this.ctx.strokeRect(this.cx + this.px(this.model.levelWidth / 4 - 10) - this.px(d0), ty - this.px(10), this.px(20), this.px(20));
    
    mx = this.px(40);
    my = this.height - this.px(44);
    mr = this.px(20);
    
    /* Arm. */    
    this.ctx.beginPath();
    this.ctx.moveTo(mx - this.px(8 + d0), my - this.px(15));
    this.ctx.lineTo(mx + this.px(8 - d0), my - this.px(15));
    this.ctx.lineTo(mx + this.px(8 - d0), my - this.px(5));
    this.ctx.lineTo(this.cx, my - this.px(5));
    this.ctx.lineTo(this.cx, my + this.px(5));
    this.ctx.lineTo(mx + this.px(8 - d0), my + this.px(5));
    this.ctx.lineTo(mx + this.px(8 - d0), my + this.px(15));
    this.ctx.lineTo(mx - this.px(8 + d0), my + this.px(15));
    this.ctx.closePath();
    
    this.ctx.fillStyle = "#AAAAAA";
    this.ctx.fill();
    this.ctx.clearRect(mx - this.px(2.5 + d0), my - this.px(9), this.px(5), this.px(18));
    this.ctx.strokeStyle = "#333333";
    this.ctx.stroke();
    this.ctx.strokeRect(mx - this.px(2.5 + d0), my - this.px(9), this.px(5), this.px(18));
    
    /* Motor. */
    this.ctx.save();
    
    
    this.ctx.globalCompositeOperation = "destination-over";
    
    /* Couple between the motor and the arm. */
    this.ctx.beginPath();
    this.ctx.arc(mx, my - this.px(d0), this.px(4), 0, 2 * Math.PI);
    this.ctx.fillStyle = "#222222";
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(mx, my, mr, -Math.PI / 18 + motor, Math.PI / 18 + motor, false);
    this.ctx.arc(mx, my, mr, Math.PI - Math.PI / 18 + motor, Math.PI + Math.PI / 18 + motor, false);
    this.ctx.closePath();
    this.ctx.strokeStyle = "#333333";
    this.ctx.stroke();
    this.ctx.fillStyle = "#999999";
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(mx, my, mr, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#666666";
    this.ctx.fill();
    this.ctx.strokeStyle = "#333333";
    this.ctx.stroke();

    this.ctx.restore();
    
    
};

MimicWidget.GRID_WIDTH = 50;

/**
 * Draws a grid.
 */
MimicWidget.prototype.drawGrid = function() {
    var d, dt = this.px(MimicWidget.GRID_WIDTH);
       
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-over";
    
    /* Grid lines. */
    this.ctx.beginPath();
    for (d = this.cx - dt; d > 0; d -= dt) this.stippleLine(d, 0, d, this.height);
    for (d = this.cx + dt; d < this.width - dt; d+= dt) this.stippleLine(d, 0, d, this.height);    
    for (d = dt; d < this.height; d += dt) this.stippleLine(0, d, this.width, d);
    this.ctx.strokeStyle = "#AAAAAA";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    /* Units. */    
    this.ctx.beginPath();
    this.ctx.moveTo(this.px(22), 0);
    this.ctx.lineTo(this.px(22), dt);
    
    this.ctx.moveTo(this.px(10), this.px(10));
    this.ctx.lineTo(dt + this.px(10), this.px(10));
    this.ctx.strokeStyle = "#555555";
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.px(22), 0);
    this.ctx.lineTo(this.px(22 + 2.5), this.px(5));
    this.ctx.lineTo(this.px(22 - 2.5), this.px(5));
    this.ctx.closePath();
    this.ctx.fillStyle = "#555555";
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.px(22), dt);
    this.ctx.lineTo(this.px(22 + 2.5), dt - this.px(5));
    this.ctx.lineTo(this.px(22 - 2.5), dt - this.px(5));
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.px(10), this.px(10));
    this.ctx.lineTo(this.px(15), this.px(7.5));
    this.ctx.lineTo(this.px(15), this.px(12.5));
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.px(10) + dt, this.px(10));
    this.ctx.lineTo(this.px(5) + dt, this.px(7.5));
    this.ctx.lineTo(this.px(5) + dt, this.px(12.5));
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.font = this.px(10) + "px sans-serif";
    this.ctx.fillText(MimicWidget.GRID_WIDTH + "mm", this.px(40), this.px(20));
    
    /* Center line. */
    this.ctx.beginPath();
    this.ctx.moveTo(this.cx, 0);
    this.ctx.lineTo(this.cx, this.height);
    this.ctx.moveTo(0, this.height / 2);
    this.ctx.strokeStyle = "#555555";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    
    this.ctx.restore();
};

MimicWidget.STIPPLE_WIDTH = 10;

/**
 * Draws a stippled line. 
 * 
 * @param x0 begin x coordinate
 * @param y0 begin y coordinate
 * @param x1 end x coordinate 
 * @param y1 end y coordinate
 */
MimicWidget.prototype.stippleLine = function(x0, y0, x1, y1) {
    var p;
    
    if (x0 == x1) // Horizontal line
    {
        p = y0 - MimicWidget.STIPPLE_WIDTH;
        while (p < y1)
        {
            this.ctx.moveTo(x0, p += MimicWidget.STIPPLE_WIDTH);
            this.ctx.lineTo(x0, p += MimicWidget.STIPPLE_WIDTH);
        }
    }
    else if (y0 == y1) // Vertical line
    {
        p = x0 - MimicWidget.STIPPLE_WIDTH;
        while (p < x1)
        {
            this.ctx.moveTo(p += MimicWidget.STIPPLE_WIDTH, y0);
            this.ctx.lineTo(p += MimicWidget.STIPPLE_WIDTH, y0);
        }
    }
    else // Diagonal
    {
        throw "Diagonal lines not implemented.";
    }
};

/**
 * Converts a pixel dimension to a millimetre dimension.
 * 
 * @param px pixel dimension
 * @return millimetre dimension
 */
MimicWidget.prototype.mm = function(px) {
    return px * this.mmPerPx;
};

/**
 * Converts a millimetre dimension to a pixel dimension.
 * 
 * @param mm millimetre dimension
 * @return pixel dimension
 */
MimicWidget.prototype.px = function(mm) {
    return mm / this.mmPerPx;
};

MimicWidget.prototype.resized = function(width, height) {
    if (this.animateInterval)
    {
        clearInterval(this.animateInterval);
        this.animateInterval = undefined;
    }

    height -= 63;
    this.$widget.find("canvas").attr({
        width: width,
        height: height
    });
    
    this.ctx.fillStyle = "#FAFAFA";
    this.ctx.fillRect(0, 0, width, height);
};

MimicWidget.prototype.resizeStopped = function(width, height) {
    this.mmPerPx *= this.boxWidth / width;
    
    this.width = this.px(this.model.levelWidth + this.model.maxDisp * 2) + this.px(100);
    this.cx = this.width / 2;

    this.height = this.px(this.model.levelHeight * (this.is3DOF ? 4 : 3) + 
            this.model.wallHeight * (this.is3DOF ? 3: 2) + this.model.trackHeight + this.model.carHeight);

    this.boxWidth = width;

    this.$widget.find("canvas").attr({
        width: this.width,
        height: this.height
    });
    this.$widget.css("height", "auto");

    if (!this.animateInterval) 
    {
        var thiz = this;
        this.animateInterval = setInterval(function() { thiz.animationFrame(); }, MimicWidget.ANIMATE_PERIOD);
    }
};

MimicWidget.prototype.destroy = function() {
    clearInterval(this.animateInterval);
    this.animateInterval = undefined;
    
    Widget.prototype.destroy.call(this);
};
