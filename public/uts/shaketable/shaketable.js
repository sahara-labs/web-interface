/**
 * Shake Table web interface.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @author Jesse Charlton <jesse.charlton@uts.edu.au>
 * @date 1/6/2013
 */

/* ============================================================================
 * == Shake Table.                                                           ==
 * ============================================================================ */

function ShakeTable(is3DOF)
{
    
    new WebUIApp(is3DOF ? Config3DOF() : Config2DOF()).setup().run();
}

/**
 * 2 degree of freedom (2DOF) Shake Table interface.
 */
function Config2DOF()
{
    return {
        anchor: "#shake-table-anchor",
        controller: "ShakeTableController",
        dataAction: "dataAndGraph",
        dataDuration: 10,
        dataPeriod: 10,
        pollPeriod: 1000,
        windowToggle: true,
        theme: Globals.THEMES.flat,
        cookie: "shaketable",
        widgets: [
            new Container("graphs-container", {
                title: "Graphs",
                reizable: true,
                left: -191,
                top: 540,
                widgets: [
                    new Graph("graph-displacement", {
                      title: "Displacements",
                      resizable: true,
                      fields: {
                          'disp-graph-1': 'Base',
                          'disp-graph-2': 'Level 1',
                          'disp-graph-3': 'Level 2'
                      },
                      minValue: -60,
                      maxValue: 60,
                      duration: 10,
                      yLabel: "Displacement (mm)",
                      fieldCtl: true,
                      autoCtl: false,
                      durationCtl: false,
                      traceLabels: true,
                      width: 832,
                      height: 325,
                    }),
                    new Container("graphs-lissajous-container", {
                        title: "Lissajous",
                        widgets: [
                            new ScatterPlot("graph-lissajous-l0l1", {
                                title: "L0 vs L1",
                                xLabel: "L0 (mm)",
                                yLabel: "L1 (mm)",
                                autoScale: true,
                                vertScales: 5,
                                horizScales: 5,
                                duration: 5,
                                fields: {
                                    'disp-graph-1': 'disp-graph-2'
                                },
                                labels: {
                                    'disp-graph-1': "L0 vs L1",
                                },
                                traceLabels: false,
                            }),
                            new ScatterPlot("graph-lissajous-l0l2", {
                                title: "L0 vs L2",
                                xLabel: "L0 (mm)",
                                yLabel: "L2 (mm)",
                                autoScale: true,
                                vertScales: 5,
                                horizScales: 5,
                                duration: 5,
                                fields: {
                                    'disp-graph-1': 'disp-graph-3'
                                },
                                labels: {
                                    'disp-graph-1': "L0 vs L2",
                                },
                                traceLabels: false
                            }),
                            new ScatterPlot("graph-lissajous-l1l2", {
                                title: "L1 vs L2",
                                xLabel: "L1 (mm)",
                                yLabel: "L2 (mm)",
                                autoScale: true,
                                vertScales: 5,
                                horizScales: 5,
                                duration: 5,
                                fields: {
                                    'disp-graph-2': 'disp-graph-3'
                                },
                                labels: {
                                    'disp-graph-2': "L1 vs L2",
                                },
                                traceLabels: false
                            }),
                        ],
                        layout: new TabLayout({
                            position: TabLayout.POSITION.left,
                            border: 0,
                        })
                    }),
                    new FFTGraph("graph-fft", {
                        title: "FFT",
                        resizable: true,
                        fields: {
                            'disp-graph-1': 'Base',
                            'disp-graph-2': 'Level 1',
                            'disp-graph-3': 'Level 2'
                        },
                        xLabel: "Frequency (Hz)",
                        yLabel: "Amplitude (mm)",
                        horizScales: 5,
                        maxValue: 30,
                        fieldCtl: true,
                        autoScale: true
                    })
                ],
                layout: new TabLayout({
                    position: TabLayout.POSITION.top,
                    border: 10,
                })
            }),
            new MimicWidget(false),
            new CameraStream("camera-stream", {
                resizable: true,
                left: -2,
                top: 5,
                videoWidth: 320,
                videoHeight: 240,
                swfParam: 'camera-swf',
                mjpegParam: 'camera-mjpeg',
                title: "Camera"
            }),
            new Container("controls-container", {
                title: "Controls",
                resizable: false,
                left: -2,
                top: 335,
                widgets: [
                     new Slider("slider-motor-speed", {
                         field: "motor-speed",
                         action: "setMotor",
                         max: 8,
                         precision: 2,
                         label: "Motor Frequency",
                         units: "Hz",
                         vertical: false,
                     }),                      
                     new Slider("slider-coil-1", {
                         length: 75,
                         action: "setCoil",
                         field: "coils-1-power",
                         label: "Coil 1",
                         vertical: true,
                         scales: 2,
                         units: "%"
                     }),
                     new Slider("slider-coil-2", {
                         length: 75,
                         action: "setCoil",
                         field: "coils-2-power",
                         label: "Coil 2",
                         vertical: true,
                         scales: 2,
                         units: "%"
                     }),
                     new Container("container-control-buttons", {
                        width: 200,
                        widgets: [
                            new Switch("switch-motor-on", {
                                field: "motor-on", 
                                action: "setMotor",
                                label: "Motor",
                                width: 96,
                             }),
                             new Switch("switch-coils-on", {
                                 field: "coils-on",
                                 action: "setCoils",
                                 label: "Coils",
                                 width: 92,
                             }),
                            new Switch("switch-coupling", {
                                field: "motor-coil-couple",
                                action: "setCouple",
                                label: "Couple",
                                width: 107,
                            }),
                            new Image("couple-to-motor" , {
                                image: "/uts/shaketable/images/arrow-couple-left.png",
                            }),
                            new Image("couple-to-coils" , {
                                image: "/uts/shaketable/images/arrow-couple-right.png",
                            }),
                        ],
                        layout: new AbsoluteLayout({
                            border: 10,
                            coords: {
                                "switch-motor-on": { x: -5, y: 20 },
                                "switch-coils-on": { x: 100, y: 20 },
                                "switch-coupling": { x: 40, y: 80 },
                                "couple-to-motor": { x: 0, y: 55 },
                                "couple-to-coils": { x: 154, y: 55 },
                            }
                        })
                     }),
                ],
                layout: new GridLayout({
                    padding: 5,
                    columns: [
                        [ "container-control-buttons" ],
                        [ "slider-motor-speed" ],
                        [ "slider-coil-1" ],
                        [ "slider-coil-2" ]
                    ]
                })
            }),
            new DataLogging("data-logger", {
                left: -193,
                top: 142,
                width: 183,
                height: 388,
            })
        ]
    };
}

/*
 * 3 degree of freedom (3DOF) Shake Table interface.
 */
function Config3DOF()
{
    return {
        anchor: "#shake-table-anchor",
        controller: "ShakeTableController",
        dataAction: "dataAndGraph",
        dataDuration: 10,
        dataPeriod: 100,
        pollPeriod: 1000,
        windowToggle: true,
        theme: Globals.THEMES.flat,
        cookie: "shaketable",
        widgets: [
            new Graph("graph-displacement", {
                title: "Graphs",
                resizable: true,
                width: 418,
                height: 328,
                left: 351,
                top: 423,
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
            }),
            new MimicWidget(true),
            new CameraStream("camera-stream", {
                resizable: true,
                left: 2,
                top: 45,
                videoWidth: 320,
                videoHeight: 240,
                swfParam: 'camera-swf',
                mjpegParam: 'camera-mjpeg',
                title: "Camera"
            }),
            new Container("controls-container", {
                title: "Controls",
                resizable: false,
                left: 2,
                top: 375,
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
            })
        ]
    };
}

/* ============================================================================
 * == Mimic Widget.                                                          ==
 * ============================================================================ */

/**
 * Mimic Widget. This widget creates and controls the Shake Table Mimic.
 * 
 * @param {boolean} is3DOF whether to display 2DOF or 3DOF configuration
 */
function MimicWidget(is3DOF)
{
    Widget.call(this, "shaker-mimic", {
        title: "Model",
        windowed: true,
        resizable: true,
        preserveAspectRation: true,
        minWidth: 320,
        minHeight: 410,
        closeable: true,
        shadeable: true,
        expandable: true,
        draggable: true,
        left: 338,
        top: 5,
        width: 334
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
    this.is3DOF = is3DOF;
    
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
        this.coils[0] = data['coils-1-on'] ? data['coils-1-power'] : 0;
        this.coils[1] = data['coils-2-on'] ? data['coils-2-power'] : 0;
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

/**
 * Displays an FFT of one or more signals.
 * 
 * @constructor
 * @param {string} id graph identifier
 * @param {object} config configuration object
 * @config {object}  [fields]      map of graphed data fields with field => label
 * @config {object}  [colors]      map of graph trace colors with field => color (optional)
 * @config {boolean} [autoScale]   whether to autoscale the graph dependant (default off)
 * @config {integer} [minValue]    minimum value that is graphed, implies not autoscaling (default 0)
 * @config {integer} [maxValue]    maximum value that is graphed, implies not autoscaling (default 100)
 * @config {integer} [duration]    number of seconds this graph displays (default 60)
 * @config {integer} [period]      period betweeen samples in milliseconds (default 100)
 * @config {string}  [xLabel]      X axis label (default (Time (s))
 * @config {String}  [yLabel]      Y axis label (optional)
 * @config {boolean} [traceLabels] whether to show trace labels (default true)
 * @config {boolean} [fieldCtl]    whether data field displays can be toggled (default false)
 * @config {boolean} [autoCtl]     whether autoscaling enable control is shown (default false)
 * @config {boolean} [durationCtl] whether duration control slider is displayed
 * @config {integer} [vertScales]  number of vertical scales (default 5)
 * @config {integer} [horizScales] number of horizontal scales (default 8)
 */
function FFTGraph(id, config)
{
    Graph.call(this, id, config);
    
    
}

FFTGraph.prototype = new Graph;

FFTGraph.prototype.consume = function(data) {
    var i = 0;

    if (this.startTime == undefined) 
    {
        this.startTime = data.start;
        this._updateIndependentScale();
    }
    
    this.latestTime = data.time;

    for (i in this.dataFields)
    {
        if (data[i] === undefined) continue;

        this.dataFields[i].values = this.fftTransform(data[i]);
        this.dataFields[i].seconds = this.dataFields[i].values.length * this.config.period / 1000;
        this.displayedDuration = data.duration;
    }
    
    if (this.config.autoScale) 
    {
        /* Determine graph scaling for this frame and label it. */
        this._adjustScaling();
        this._updateDependantScale();
    }

    this._drawFrame();
    
};

FFTGraph.prototype._updateIndependentScale = function() {
    var i, $d = this.$widget.find(".graph-bottom-scale-0"), t;

    for (i = 0; i <= this.config.horizScales; i++)
    {
        t = 1000 * i / this.config.period / this.config.horizScales / 2; 
        $d.html(Util.zeroPad(t, t < 100 ? 1 : 0));
        $d = $d.next();
    }
};

/**
 * Pads the length of the array with 0 until its length is a multiple of 2.
 * 
 * @param {Array} arr array to pad
 * @return {Array} padded arary (same as input)
 */
FFTGraph.prototype.fftTransform = function(sample) {
    
    var i, n = sample.length, vals = new Array(n);
    
    /* The FFT is computed on complex numbers. */
    for (i = 0; i < n; i++)
    {
        vals[i] = new Complex(sample[i], 0);
    }
    
    /* The Cooley-Turkey algorithm operates on samples whose length is a 
     * multiple of 2. */ 
    while (((n = vals.length) & (n - 1)) != 0)
    {
        vals.push(new Complex(0, 0));
    } 
    
    /** Apply the FFT transform. */
    vals = fft(vals);
    
    /* For real inputs, a DFt has a symmetry with complex conjugation so we
     * are only plotting the lower half of the values. */
    vals.splice(n / 2 - 1, n / 2);

    /* The plot is of the absolute values of the sample, then scaled . */
    for (i = 0; i < vals.length; i++)
    {
        vals[i] = vals[i].abs() * 2 / n;
    }

    return vals;
};

