/**
 * Coupled Tanks web interface.
 */

/* ============================================================================
 * == WaterLevelControl.                                                     ==
 * ============================================================================ */

function WaterLevelControl() { };

/** Runs the Display Manager. */
WaterLevelControl.prototype.setup = function() {
	var dM = new DisplayManager($('#rigscriptcontainer'), 'Display Manager');
};

/** Retrieves latest data from the server. */
WaterLevelControl.prototype.run = function() { };

/* ============================================================================
 * == Widget.                                                                ==
 * ============================================================================ */

/* ----- WIDGET CONSTRUCTOR --------------------------------------------------- */

/**
 * Base class widgets that comprise the Coupled Tanks interface.
 * It provides declarations of a widgets required functionality
 * and implementations of common functionality.
 * 
 * @param $container a jQuery object that is the base where the widget is \ 
 * 				appended to
 * @param title the widget's title
 */
function Widget($container, title) 
{
	/** The jQuery object of the container the widget is attached to. */
	this.$container = $container;
	
	/** The page title. */
	this.title = title;
	
	/** The jQuery object of the outermost element of this widget. 
	 *  This is not initialised until the 'init' method has been called. */
	this.$widget = null;
};

/* ----- WIDGET LIFE CYCLE ---------------------------------------------------- */

/** 
 * Adds the widget to the page and sets up any widgets event handlers.
 */
Widget.prototype.init = function() {
    throw "Widget init not defined.";
};

/** 
 * Method which is provided with data from the server. The data object is the 
 * return from /data operation and is a map of the response keys and objects. 
 * 
 * @param data data object
 */
Widget.prototype.consume = function(data) { };

/** 
 * Removes the widget from the page and cleans up all registered
 * events handlers. 
 */
Widget.prototype.destroy = function() { 
    this.$widget.remove();
};

/* ----- WIDGET EVENT CALLBACKS ----------------------------------------------- */

/**
 * Event callback if an error has occurred and the widget should provide
 * a view that indicates something is amiss. An example of a possible error
 * is an error was received in server data polling.
 */
Widget.prototype.blur = function() { };

/**
 * Event callback to notify a previous blur can be cleared.
 */
Widget.prototype.unblur = function() { };

/** 
 * Event callback that is invoked when the widget is resized.  This is
 * provided in case the widget contents require rescaling. 
 * 
 * @param width the new widget width
 * @param height the new widget height
 */
Widget.prototype.resize = function(width, height) { };

/**
 * Event callback that is invoked when the widget has been dragged. 
 * 
 * @param xpos the new x coordinate from its enclosing container
 * @param ypos the new y coordinate from its enclosing container
 */
Widget.prototype.dragged = function(xpos, ypos) { };

/* ----- WIDGET COMMON BEHAVIOURS AND DISPLAY GENERATION ---------------------- */

/** 
 * Adds a message to the page. 
 * 
 * @param msgId ID of the message
 * @param message the message to display
 * @param type the message type, 'error', 'info', 'backing'
 * @param left left absolute coordinate
 * @param top top absolute coordinate
 * @param pos the arrow position, 'left', 'right', 'top', 'bottom'
 */
Widget.prototype.addMessage = function(msgId,message,type,left,top,pos) {
	var $box, i, aniIn, bs = 1, up = true, html = 
		"<div id='" + msgId + "' class='message-box message-box-" + type + " message-box-in1' style='left:" + left + "px; top:" + top + "px'>" +
			"<div class='message-box-text'>" + message + "</div>" +
			"<div class='message-box-arrow message-box-arrow-" + pos + "'>";
	
	for (i = 0; i < 8; i++)
	{
		html += "<div class='message-box-arrow-line message-box-arrow-line" + i + "'></div>";
	}
	
	html += "</div>" +
		"</div>";
	
	$box = this.$widget.after(html).next();
		
	/* Throb box shadow around message box. */
	aniIn = setInterval(function() {
		if (bs == 0 || bs == 12) up = !up;
		$box.css("box-shadow", "0 0 " + (up ? bs++ : bs--) + "px #EEEEEE");
	}, 120);
	
	/* Remove box on click. */
	$box.click(function() {
		clearInterval(aniIn);
		$box.remove();
	});
};

/**
 * Removes messages from the page.
 */
Widget.prototype.removeMessages = function() {
	this.$widget.find(".message-box").remove();
};

/**
 * Generates the common styled widget box.
 * 
 * @param boxId ID of the box
 * @param title the title of the widget
 * @param icon the type of icon the box will display, 'settings', 'toggle', 'video'
 * @return jQuery node of the generated box that has been appended to the page
 */
Widget.prototype.generateBox = function(boxId,icon) {
    return this.$container.append(
      "<div class='windowwrapper' id=" + boxId + ">" +
          "<div class='windowheader'><img class='windowIcon' src='/uts/coupledtanksnew/images/icon_" + icon + ".png'/>" +
              "<span class='windowtitle'>" + this.title +
              "</span>" +
          "</div>" +
          "<div class='windowcontent'>" + this.getHTML() +
          "</div>" +
      "</div>"
  );
};

/**
 * Generates the HTML content for the widget box.
 */
Widget.prototype.getHTML = function() {	};

/**
 * Enables this widget to be draggable.
 */
Widget.prototype.enableDraggable = function() {

    /* Adds the CSS for the draggable widgets */
    this.$widget.find('.windowwrapper').addClass('draggable');
    this.$widget.find('.windowheader').addClass('draggableHeader');
    
	/* Enables dragging on the widgets 'windowwrapper' class. */	
	this.$widget.find('.windowwrapper').draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.windowwrapper',
        increaseZindexOnmousedown: true,
        distance: 10,
    });

	//Enables increase Z-index on mouse down. 	
    $.ui.plugin.add('draggable', 'increaseZindexOnmousedown', {
        create: function() {
            this.mousedown(function(e) {
                var inst = $(this).data('draggable');
                inst._mouseStart(e);
                inst._trigger('start', e);
                inst._clear();
            });
        }
    });
    
};

/**
 * Enables this widget to be resizable. 
 * 
 * @param aspect the aspect resize the drag is restricted to
 * @param minHeight the minimum height the widget can be resized to
 * @param minWidth the minimum width the widget can be resized to
 */
Widget.prototype.enableResizable = function(aspect,minHeight,minWidth) {
	
	this.minHeight = minHeight;
	this.minWidth = minWidth;
		
	this.$widget.find(".windowcontent").resizable({
		 aspectRatio: aspect,
         minHeight: this.minHeight,
         minWidth: this.minWidth,
         distance: 10,
	});
};

/** 
 * Posts data to the server.
 * 
 * @param action the name of the action called from the Rig Client
 * @param params data object of POST variables
 * @param responseCallback function to be invoked with the response of POST
 */
Widget.prototype.postControl = function(action, params, responseCallback) {
	// IMPLEMENT THIS
};

/* ============================================================================
 * == Display Manager.                                                       ==
 * ============================================================================ */

function DisplayManager(container, title) {
	
    Widget.call(this, container, title);
    
    this.PCONTROLLER = "CoupledTanksTwoController";
	this.widgets = [];
	
	var camera = new Camera(container, "Camera");
	var pidControl = new PIDControl(container, "PID Control");
	var waterLevelsMimic = new WaterLevelsMimic(container, "Water Levels");
	
	var graphOne = new GraphWidget(this.$container, "Tank Levels");
	graphOne.setDataVariable('l1', 'Level 1',  '#0C61b6', 0, 300);
	graphOne.setDataVariable('l2', 'Level 2',  '#92FF79', 0, 300);
	graphOne.setDataVariable('sp', 'Setpoint', '#EDDA7E', 0, 300);
	graphOne.setAxisLabels('Time (s)', 'Level (mm)');
	
	/* camera.init();
    pidControl.init();
    waterLevelsMimic.init(); 
    this.init(); */
    
    graphOne.init();
};

DisplayManager.prototype = new Widget;

DisplayManager.prototype.init = function() {

	this.$widget = this.generateBox('DisplayManagerWidgetId','toggle');
    this.enableDraggable();
    this.enableResizable(' ',0,0);
    
	    /* Toggle Buttons. */
    $('.toggle').click(function() {
        var x = '#' + $(this).attr('name');
        var y = $(this);
        $(x).is(':visible') ? $(x).remove : $(x).init;
        if ($(this).find('.switch').find('.slide').hasClass('off')) {
            $(this).find('.switch').find('.slide').addClass("on").removeClass("off");
        }else{
            $(this).find('.switch').find('.slide').addClass("off").removeClass("on");
        } 
    });
    
};

DisplayManager.prototype.getHTML = function() {	
	return(
		'<div class="buttonwrapper">' +
            '<div class="button toggle" name="video">Video' +
                '<div class="switch">' +
                    '<div class="animated slide on"></div>' +
                '</div>' +
            '</div>' +
            '<div class="button toggle" name="settings">Settings' +
                '<div class="switch">' +
                    '<div class="animated slide on"></div>' +
                '</div>' +
            '</div>' +
            '<div class="button toggle" name="chartone">Chart One' +
                '<div class="switch">' +
                    '<div class="animated slide on"></div>' +
                '</div>' +
            '</div>' +
            '<div class="button toggle" name="charttwo">Chart Two' +
                '<div class="switch">' +
                    '<div class="animated slide on"></div>' +
                '</div>' +
            '</div>' +
            '<div class="button toggle" name="diagram">Diagram' +
                '<div class="switch">' +
                    '<div class="animated slide on"></div>' +
                '</div>' +
            '</div>' +
        '</div>'
	);
};


/* ============================================================================
 * == Page Widgets.                                                          ==
 * ============================================================================ */

/* -- Graph ------------------------------------------------------------------- */

/** 
 * Graph widget. This widget contains a scrolling graph that is user navigable
 * through the sessions data. 
 */
function GraphWidget(container, title) 
{
	Widget.call(this, container, title);
	
	/** ID of canvas. */
	this.id = "graph-" + title.toLowerCase().replace(' ', '-');
	
	/** Width of the graph, including the padding whitespace but excluding the
	 *  border width. */
	this.width = 600;
	
	/** Height of the graph, including the padding whitespace but excluding the
	 *  border width and border title. */
	this.height = 300;
	
	/*(* The minimum expected graphed value. A value smaller than this will be
	 *  clipped. */
	this.minGraphedValue = undefined;
	
	/** The maximum expected graphed value. A value greater than this will be 
	 *  clipped. */
	this.maxGraphedValue = undefined;
	
	/** Canvas context. */
	this.ctx = null;
	
	/** Data fields. */
	this.dataFields = { };
	
	/** The number of seconds this graph displays. */
	this.duration = 600;
	
	/** The period in milliseconds. */
	this.period = 1000;
	
	/** The X and Y axis labels. */
	this.axis = {
		x: '',
		y: ''
	};
	
	/** The time of the first data update in seconds since epoch. */
	this.startTime = undefined;
	
	/** The time of the latest data update in seconds since epoch. */
	this.latestTime = undefined;
	
	/** The displayed duration in seconds. */
	this.displayedDuration = undefined;

	/** Whether this widget is in running mode, i.e. polling the server for new
	 *  graphing information. */
	this.isRunning = false;
}
GraphWidget.prototype = new Widget;

GraphWidget.prototype.init = function() {
	this.$widget = this.generateBox(this.id + '-box', 'graph');
	
	/* Add the canvas panel. */
	var canvas = getCanvas(this.id, this.width, this.height);
	this.$widget.find("#" + this.id + "-canvas").append(canvas);
	this.ctx = canvas.getContext("2d");
	
	/* Event handlers. */
	var thiz = this;
	this.$widget.find(".graph-label-enable").click(function() {
		thiz.showTrace($(this).next().text(), $(this).is(":checked"));
	});
	
	/* Draw the first frame contents. */
	this.drawFrame();
	
	/* Start acquiring data. */
	this.isRunning = true;
	this.acquireData();
};

/** The number of vertical scales. */
GraphWidget.NUM_VERT_SCALES = 5;

/** The number of horizontal scales. */
GraphWidget.NUM_HORIZ_SCALES = 10;

GraphWidget.prototype.getHTML = function() {
	var i = null, unitScale, styleScale, html = ''; 
	
	/* Graph labels. */
	html += "<div class='graph-labels'>";
	for (i in this.dataFields)
	{
		html += "	<div class='graph-label'>" + 
				"		<input id='graph-label-" + i + "' type='checkbox' checked='checked' class='graph-label-enable' />" +
				"		<label for='graph-label-" + i + "'>" + this.dataFields[i].label + "</label>" +  
				"		<div class='graph-label-color-box'>" +
				"			<div class='graph-label-color-line' style='background-color:" + this.dataFields[i].color + "'></div>" +
				"		</div>" +
				"	</div>";
	}
	html += "</div>";
	
	/* Left scale. */
	unitScale = Math.floor((this.maxGraphedValue - this.minGraphedValue) / GraphWidget.NUM_VERT_SCALES);
	styleScale = this.height / GraphWidget.NUM_VERT_SCALES;
	html += "<div class='graph-left-scales'>";
	for (i = 0; i <= GraphWidget.NUM_VERT_SCALES; i++)
	{
		html += "<div class='graph-left-scale-" + i + "' style='top:"+ (styleScale * i) + "px'>" + 
					(this.maxGraphedValue - i * unitScale)+ 
				"</div>";
	}
	html += "</div>";
	
	/* Left axis label. */
	html += "<div class='graph-axis-label graph-left-axis-label' style='top:" + 
			(this.width / 2 - this.axis.y.length * 9)  + "px'>" + this.axis.y + "</div>";
	
	/* Canvas element holding box. */
	html += "<div id='" + this.id +  "-canvas' class='graph-canvas-box' style='height:" + this.height + "px'></div>";
	
	/* Bottom scale. */
	html += "<div class='graph-bottom-scales'>";
	styleScale = this.width / GraphWidget.NUM_HORIZ_SCALES;
	for (i = 0; i <= GraphWidget.NUM_HORIZ_SCALES; i++)
	{
		html += "<div class='graph-bottom-scale-" + i + "' style='left:" + (styleScale * i - 5) + "px'>&nbsp</div>";
	}
	html += "</div>";
	
	/* Bottom axis label. */
	html += "<div class='graph-axis-label graph-bottom-axis-label'>" + this.axis.x + "</div>";

	return html;
};

GraphWidget.prototype.consume = function(data) { /* Does not consume. */ };

/**
 * Periodically requests the server to provide graph data.
 */
GraphWidget.prototype.acquireData = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/mapjson/pc/CoupledTanksController/pa/graphData",
		data: {
			period: this.period,
			duration: this.duration,
			from: 1,     // For now we are just asked for the latest data
		},
		success: function(data) {
			thiz.updateData(data);
			if (thiz.isRunning) setTimeout(function() { thiz.acquireData(); }, 1000);
		},
		error: function(data) {
			if (thiz.isRunning) setTimeout(function() { thiz.acquireData(); }, 30000);
		}
	});
};

/**
 * Updates graph with data received from the server. 
 * 
 * @param data data object
 */
GraphWidget.prototype.updateData = function(data) {
	var i = 0;
	
	if (this.startTime == undefined) this.startTime = data.start;
	this.latestTime = data.time;
	
	for (i in this.dataFields)
	{
		if (data[i] == undefined) continue;
		
		this.dataFields[i].values = data[i];
		this.dataFields[i].seconds = data.duration;
		this.displayedDuration = data.duration;
	}

	this.drawFrame();
	this.updateTimeScale();
};

/**
 * Draws a graph frame.
 */
GraphWidget.prototype.drawFrame = function() {
	var i = 0;
	
	/* Clear old frame. */
	this.ctx.clearRect(0, 0, this.width, this.height);
	
	this.drawScales();
	
	/* Draw the trace for all graphed variables. */
	for (i in this.dataFields) this.drawTrace(this.dataFields[i]);
};

/** The stipple width. */
GraphWidget.STIPPLE_WIDTH = 10;

/**
 * Draws the scales on the interface.
 */
GraphWidget.prototype.drawScales = function() {
	var i, j,
		dt = Math.floor((this.maxGraphedValue - this.minGraphedValue) / GraphWidget.NUM_VERT_SCALES);

	this.ctx.save();
	
	this.ctx.strokeStyle = "#CCCCCC";
	this.ctx.lineWidth = 0.2;
	
	for (i = 0; i < GraphWidget.NUM_VERT_SCALES; i++)
	{
		for (j = 0; j < this.width; j += GraphWidget.STIPPLE_WIDTH * 1.5)
		{
			this.ctx.moveTo(j, i * dt);
			this.ctx.lineTo(j + GraphWidget.STIPPLE_WIDTH, i * dt);
		}
	}
	
	this.ctx.stroke();
	this.ctx.restore();
};

/**
 * Draws the trace of the data. 
 * 
 * @param dObj data object
 */
GraphWidget.prototype.drawTrace = function(dObj) {
	if (!dObj.visible) return;
	
	var yScale = (this.maxGraphedValue - this.minGraphedValue) / this.height,
		xStep  = this.width / (dObj.seconds * 1000 / this.period),
		i;
	
	this.ctx.save();
	this.ctx.strokeStyle = dObj.color;
	this.ctx.lineWidth = 3;
	this.ctx.lineJoin = "round";
	this.ctx.shadowColor = "#222222";
	this.ctx.shadowBlur = 2;
	this.ctx.shadowOffsetX = 1;
	this.ctx.shadowOffsetY = 1;
	
	this.ctx.beginPath();
	for (i = 0; i < dObj.values.length; i++)
	{
		if (i == 0)
		{
			this.ctx.moveTo(i * xStep, this.height - dObj.values[i] * yScale);
		}
		else
		{
			this.ctx.lineTo(i * xStep, this.height - dObj.values[i] * yScale);
		}
	}
	
	this.ctx.stroke();
	this.ctx.restore();
};

/**
 * Updates the time scale.
 */
GraphWidget.prototype.updateTimeScale = function() {
	var xstep = this.displayedDuration / GraphWidget.NUM_HORIZ_SCALES, i,
		$d = this.$widget.find(".graph-bottom-scale-0");
	
	for (i = 0; i <= GraphWidget.NUM_HORIZ_SCALES; i++)
	{
		$d.html(zeroPad(this.latestTime - xstep * (GraphWidget.NUM_HORIZ_SCALES - i) - this.startTime, 1));
		$d = $d.next();
	}
};

/**
 * Enables or disables displaying of the graphed variable.
 * 
 * @param label label of the variable
 * @param show whether the variable is displayed
 */
GraphWidget.prototype.showTrace = function(label, show) {
	var i = 0;
	for (i in this.dataFields)
	{
		if (this.dataFields[i].label == label)
		{
			this.dataFields[i].visible = show;
		}
	}

	this.drawFrame();
};

/**
 * Adds a data variable to be graphed. The minimum and maximum 
 * define ranges the graph will be expected to graph. If a
 * value of this data field is out of this range, it may be 
 * clipped.
 * <br />
 * If a new data variable is added, this widget must be
 * re-initialised so the display and labeling are correctly
 * redrawn.
 * 
 * @param dvar the data variable
 * @param label label to display
 * @param color graph line value
 * @param min minimum value of this variable to graph
 * @param max maximum value of this variable to graph
 */
GraphWidget.prototype.setDataVariable = function(dvar, label, color, min, max) {
	this.dataFields[dvar] = {
		label: label,
		color: color,
		min: min,
		max: max,
		values: [ ],
		seconds: 0,
		visible: true,
	};
	
	if (this.minGraphedValue == undefined || min < this.minGraphedValue) this.minGraphedValue = min;
	if (this.maxGraphedValue == undefined || max > this.maxGraphedValue) this.maxGraphedValue = max;
};

/**
 * Remove a data variable from being graphed. 
 * <br />
 * If a new data variable is added, this widget must be
 * re-initialised so the display and labeling are correctly
 * redrawn.
 * 
 * @param dvar data variable to remove
 */
GraphWidget.prototype.removeDataVariable = function(dvar) {
	delete this.dataFields[dvar];
	
	/* Work out the correct scale. */
	
	this.minGraphedValue = this.maxGraphedValue = undefined;
	var i = null;
	for (i in this.dataFields)
	{
		if (this.minGraphedValue == undefined || this.dataFields[i].min < this.minGraphedValue)
		{
			this.minGraphedValue = this.dataFields[i].min;
		}
		
		if (this.maxGraphedValue == undefined || this.dataFields[i].min > this.maxGraphedValue)
		{
			this.maxGraphedValue = this.dataFields[i].max;
		}
	}
};

/**
 * Sets the axis Labels. This widget must be re-initialised so the display and 
 * labeling are correctly redrawn.
 * 
 * @param x independent axis label
 * @param y dependent axis label
 */
GraphWidget.prototype.setAxisLabels = function(x, y) {
	this.axis.x = x;
	this.axis.y = y;
};

/* -- Tabbed Widget Container ------------------------------------------------- */

/**
 * Creates and controls the TabbedWidget widget.
 */
function TabbedWidget(container,title) {
   
   Widget.call(this, container,title);
    
 };
 
TabbedWidget.prototype = new Widget;

TabbedWidget.prototype.init = function() { };
/**
 * Creates and controls the PIDControl widget.
 */
function PIDControl(container,title) {
   
   Widget.call(this, container,title);
    
 };
 
PIDControl.prototype = new Widget;

PIDControl.prototype.init = function() {	
		
	this.$widget = this.generateBox('PIDWidgetId','settings');
    this.enableDraggable();
    this.enableResizable(' ',189,180);

};

PIDControl.prototype.getHTML = function() {	
	return(
		'<div class="pidsettings">' +
            '<table cellspacing="0">' +
            	'<tr>' +
            		'<td>Setpoint (mm)</td>' +
            		'<td><input type="number" name="setpoint" placeholder="setpoint" style="height: 20px;"/></td>' +
            	'</tr>' +
            	'<tr>' +
            		'<td>Kp</td>' +
            		'<td><input type="number" name="kp" placeholder="kp" style="height: 20px;"/></td>' +
            	'</tr>' +
            	'<tr>' +
            		'<td>Ki</td>' +
            		'<td><input type="number" name="ki" placeholder="ki" style="height: 20px;"/></td>' +
            	'</tr>' +
            	'<tr>' +
            		'<td>Kd</td>' +
            		'<td><input type="number" name="kd" placeholder="kd" style="height: 20px;"/></td>' +
            	'</tr>' +	
            '</table>' +     
        '</div>'
	);
};

/**
 * Creates and controls the Camera widget.
 */
function Camera(container,title) {
	
    Widget.call(this, container,title);
    
 };
 
Camera.prototype = new Widget;

Camera.prototype.init = function() {
	
	this.$widget = this.generateBox('CameraWidgetId','video');
	this.enableDraggable();
	this.enableResizable('16 / 9',192,340);
	
};

Camera.prototype.getHTML = function() {	
	return(
		'<div class="videoplayer"></div>'
	);
};
/**
 * Creates and controls the Slider widget.
 */
function Slider(container,title) {
   
   Widget.call(this, container,title);
};
 
Slider.prototype = new Widget;

Slider.prototype.init = function() { 
   this.val = coupledTanksTwo.pump;
    var html =  
        '<div id="slidercont">' +
        '<div id="slider"></div>' +
        '<input id="sliderval" value="0">' +
        '</input>' +
        '</div>';

	this.container.append(html);

	this.$widget = $("#slidercont");

	var thiz = this;
	$("#slider").slider({
		orientation: "vertical",
		min: 0,
		max: 100,
		value: this.val,
		range: "min",
		slide: function(event, ui) {
			$("#sliderval").val(ui.value);
		},
		stop: function(event, ui) {
			thiz.setter.call(thiz.hydro, ui.value);
		}
	});

	this.slider = $("#slider");
	this.sliderVal = $("#sliderval").val();
};

Slider.prototype.repaint = function() {
	(this.val != coupledTanksTwo.pump)
	{
		this.slider.slider("value",coupledTanksTwo.pump);
		this.sliderVal.val(coupledTanksTwo.pump);
	}
	return this;
};

/* Valve slider which sets pump pressure */
function ValveSlider(container)
{
	Slider.call(this, container);

	this.setter = this.widget.setValve;
}
ValveSlider.prototype = new Slider;


/**
 * Creates and controls the Water Levels Mimic widget.
 */
function WaterLevelsMimic(container,title) {
		
	Widget.call(this, container,title);
};

WaterLevelsMimic.prototype = new Widget;

WaterLevelsMimic.prototype.init = function() {
	this.$widget = this.generateBox('WaterLevelsWidgetId','video');
    this.enableDraggable();
    this.enableResizable(' ',290,310);
    this.animateLoop();
};

WaterLevelsMimic.prototype.getHTML = function() {	
	return(
        '<div class="mimicBG">' +
            '<div class="waterTube waterBackground">' +
                '<div class="level tubeOne"></div>' +
                '</div>' +
            '<div class="waterTube waterTubeRight waterBackground">' +
                '<div class="level tubeTwo"></div>' +
            '</div>' +
            '<div class="containerBottom waterBackground">' +
                '<div class="level tubeThree"></div>' +
            '</div>' +
            '<div class="diagramInfo levelsensorone" name="levelsensorone">0.0</div>' +
            '<div class="diagramInfo levelsensortwo" name="levelsensortwo">0.0</div>' + 
            '<div class="diagramInfo tankoneflowin" name="tankoneflowin">0.0 L/M</div>' + 
            '<div class="diagramInfo tanktwoflowout" name="tanktwoflowout">0.0 L/M</div>' + 
            '<div class="diagramInfo flowsensorbetween" name="flowsensorbetween">0.0 L/M</div>' + 
            '<div class="diagramInfo pumprpm" name="pumprpm">0 RPM</div>' + 
            '<div class="diagramInfo valvepercent" name="valvepercent">0.0 %</div>' +
            '<img src="/uts/coupledtanksnew/images/spinner.png" border="0" alt="spinner" class="spinner spin"/>'+
        '</div>'
	);
};
/**
 * Creates and controls the Water Levels Mimic widget's amimation.
 */
WaterLevelsMimic.prototype.animateLoop = function() { 
		
	/** Get the values required for the animation */
	function getNum(){
		
        /** Currently a random number, will be replaced with data request */
        var x = Math.floor(Math.random()*100)+1;
        return x;
    };

    /** Defines the variables used in the animation */
    var p = '%';
    var t1 = getNum();
    var t2 = getNum();
    var t3 = getNum();

    /** Displays values in input fields */
    $('.levelsensorone').html(t1 + p);
    $('.levelsensortwo').html(t2 + p);
    
    /** Animates the tube levels */
    $('.tubeOne').animate({"height": (100 - t1) + p }, 400);
    $('.tubeTwo').animate({"height": (100 - t2) + p }, 400);
    $('.tubeThree').animate({"height": (100 - t3) + p }, 400);

    // setInterval(this.animateLoop(), 1000);
};

/* ============================================================================
 * == Utility functions                                                      ==
 * ============================================================================ */

/**
 * Gets a canvas element with an appropriate fallback for IE6 to IE8 which do
 * not natively support canvas.
 * 
 * @param id the ID of the element
 * @param width the width of the canvas element
 * @param height the height of the canvas element
 * @return canvas element or appropriate fallback
 */
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

/**
 * Rounds of a number to a specified number of significant figures.
 * 
 * @param num number to round
 * @param places significant figures
 * @returns {Number} number to return
 */
function mathRound(num, places) 
{
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

/**
 * Adds '0' characters to a number so it correctly displays the specified 
 * decimal point characters.
 * 
 * @param num number to pad
 * @param places significant figures
 * @returns {String}
 */
function zeroPad(num, places)
{
	var r = '' + mathRound(num, places);
	
	if (r.indexOf('.') == -1) r += '.';
	while (r.length - r.indexOf('.') < places + 1) r += '0';
	
	return r;
}
