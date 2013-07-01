/**
 * Coupled Tanks web interface.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @author Jesse Charlton <jesse.charlton@uts.edu.au>
 * @date 1/6/2013
 */

/* ============================================================================
 * == WaterLevelControl.                                                     ==
 * ============================================================================ */

/**
 * This object that controls the interface.
 * 
 * @param id container to add this interface to
 */
function WaterLevelControl(id) 
{ 
	/** Display Manager. */
	this.display = undefined;

	/** Widgets. */
	this.widgets = [ ];

	/** Container. */
	this.$container = $('#' + id);

	/** Occurs if there is a data error. */
	this.dataError = false;
};

/** 
 * Sets up this interface.
 */
WaterLevelControl.prototype.setup = function() {
	var o, t;

	/* Mimic of the system. */
	this.widgets.push(new WaterLevelsMimic(this.$container));

	/* Graph to display tank levels. */
	o = new GraphWidget(this.$container, "Tank Levels");
	o.setDataVariable('l1', 'Level 1',  '#0C61b6', 0, 300);
	o.setDataVariable('l2', 'Level 2',  '#92FF79', 0, 300);
	o.setDataVariable('sp', 'Setpoint', '#EDDA7E', 0, 300);
	o.setAxisLabels('Time (s)', 'Level (mm)');
	o.isPulling = false;
	this.widgets.push(o);

	/* Graph to display flow rates. */
	o = new GraphWidget(this.$container, "Flow Rates", o);
	o.setDataVariable('t1-in',    'Tank 1 In',    '#0C61b6', 0, 10);
	o.setDataVariable('t1-to-t2', 'Tank 1 to 2',  '#92FF79', 0, 10);
	o.setDataVariable('t2-out',   'Tank 2 Out',   '#EDDA7E', 0, 10);
	o.setAxisLabels('Time (s)',   'Flow (L/min)');
	this.widgets.push(o);	

	/* Add camera to page. */
	this.widgets.push(new CameraWidget(this.$container, 'Coupled Tanks', 'camera'));

	/* Controls. */
	this.widgets.push(new PIDControl(this.$container));
//	t = new TabbedWidget(this.$container, 'Control Tabs', [ new PIDControl(this.$container) ]);	
//	this.widgets.push(t); 

	/* Display manager to allow things to be shown / removed. */
	this.display = new DisplayManager(this.$container, 'Display', this.widgets);
};

/** 
 * Runs the interface. 
 */
WaterLevelControl.prototype.run = function() {
	/* Render the page. */
	this.display.init();

	/* Start acquiring data. */
	this.acquireLoop();
};


WaterLevelControl.prototype.acquireLoop = function() {
	var thiz = this;

	$.ajax({
		url: "/primitive/mapjson/pc/CoupledTanksController/pa/data",
		data: { },
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
WaterLevelControl.prototype.processData = function(data) {
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
	}

	this.display.consume(data);
};

/**
 * Processes an errored communication. 
 * 
 * @param msg error message
 */
WaterLevelControl.prototype.errorData = function(msg) {
	if (!this.dataError)
	{
		this.dataError = true;

		/* TODO: There should be a global error display. */

		/* Tell the display manager to correctly tells the active displays to 
		 * provide error information. */
		this.display.blur();
	}
};

/* ============================================================================
 * == Water Level Mimic                                                      ==
 * ============================================================================ */

/**
 * Creates and controls the Water Levels Mimic widget.
 */
function WaterLevelsMimic($container) {

	Widget.call(this, $container, 'Diagram');

	/** Variables that are displayed on the mimic. */
	this.dataVars = { };

	/** Display precision for our data variables. */
	this.precision = {
		'l1': 0,
		'l2': 0,
		't1-in': 1,
		't2-out': 1,
		't1-to-t2': 1,
		'pump-rpm': 0,
		'valve': 1
	};

	/** Units for out data variables. */
	this.units = {
		'l1': 'mm',
		'l2': 'mm',
		't1-in': 'L/min',
		't2-out': 'L/min',
		't1-to-t2': 'L/min',
		'pump-rpm': 'RPM',
		'valve': '%',	
	};
};

WaterLevelsMimic.prototype = new Widget;

WaterLevelsMimic.prototype.init = function() {
	this.$widget = this.generateBox('water-levels-mimic','mimic');

	var i = 0;
	for (i in this.precision)
	{
		this.dataVars[i] = this.$widget.find("#mimic-" + i + " span");
	}

	this.enableDraggable();
};

WaterLevelsMimic.prototype.getHTML = function() {	
	var i = 0, html =
        '<div id="mimic-bg">' +
        '	<div id="water-tube-t1" class="waterTube waterBackground">' +
        '		<div class="level .gradient"></div>' +
        '	</div>' +
        '	<div id="water-tube-t2" class="waterTube waterBackground">' +
        '		<div class="level .gradient"></div>' +
        '	</div>' +
        '	<div id="water-reservoir" class="waterBackground">' +
        '		<div class="level .gradient"></div>' +
        '	</div>';

	for (i in this.precision)
	{
		html += '<div id="mimic-' + i + '" class="diagramInfo"><span>' + zeroPad(0, this.precision[i]) + '</span>&nbsp;' + 
				this.units[i] + '</div>';
	}
        
	html +=
        '	<img src="/uts/coupledtanksnew/images/spinner.png" border="0" alt="spinner" class="spinner spin" />'+
        '</div>';

    return html;
};

WaterLevelsMimic.prototype.consume = function(data) {
	var i = 0, t1, t2;

	/* Update labels. */
	for (i in this.dataVars)  
	{
		if (data[i] != undefined) this.dataVars[i].html(zeroPad(data[i], this.precision[i]));
	}

	/* Animations of water levels. */
	if (!(data['l1'] == undefined || data['l2'] == undefined))
	{
		t1 = data['l1'] / 300 * 100;
		t2 = data['l2'] / 300 * 100;

		/* A negative tank level might occur if the sensors are out of 
		 * calibration. */
		if (t1 < 0) t1 = 0;
		if (t2 < 0) t2 = 0; 

		this.$widget.find("#water-tube-t1 .level").animate({"height": (100 - t1) + "%"}, 1000);
		this.$widget.find("#water-tube-t2 .level").animate({"height": (100 - t2) + "%"}, 1000);
		this.$widget.find("#water-reservoir .level").animate({"height": ((t1 + t2) / 2) + "%"}, 1000);
	}
};

WaterLevelsMimic.prototype.destroy = function() {
	this.dataVars = { };

	Widget.prototype.destroy.call(this);
};

/* ============================================================================
 * == PID Controls                                                           ==
 * ============================================================================ */

/**
 * Creates and controls the PID variables. 
 * 
 * @param $container the container to add this widget to
 */
function PIDControl($container)
{
   Widget.call(this, $container, 'PID Controls');
   
   /** Whether we have the settings loaded from the server. */
   this.hasSettings = false;
   
   /** Whether the values have been changed and not sent to the server. */
   this.isChanged = false;
   
   /** PID variables. */
   this.pid = {
       sp: undefined,  // Set point
       kp: undefined,  // Kp 
       ki: undefined,  // Ki
       kd: undefined   // Kd
   };
   
   /** Input hover state for input hover track. */
   this.inputHovers = { };
   
   /** Guidance messages. */
   this.guidanceMsgs = {
       sp: 'Desired water level.',
       kp: 'Proportional gain, a tuning parameter.',
       ki: 'Integral gain, a tuning parameter.',
       kd: 'Derivative gain, a tuning parameter.'
   };
   
   /** CSS left position for guidance and validation messages. */
   this.toolTopLeft = 155;
   
   /** CSS top values for guidance and validation messages. */ 
   this.toolTipTop = {
       sp: 45,
       kp: 78,
       ki: 111,
       kd: 144
   };
}
PIDControl.prototype = new Widget;

PIDControl.prototype.init = function() {	
	this.$widget = this.generateBox('pid-control', 'pid');

	var thiz = this;
	
	/* Input field handlers. */
	this.$widget.find("input")
	        .focusin(formFocusIn)   // Input entered focus
	        .focusout(formFocusOut) // Input exited focus
	        .change(function() {    // Input value modified
	            if (thiz.validate($(this).attr("id").substr(4), $(this).val()) && !thiz.isChanged)
	            {
	                /* Enable the send button. */
	                thiz.isChanged = true;
	                $("#pid-send").removeClass("click-button-disabled");
	            }  
	        })
	        .keypress(function(e){
	            /* Enter pressed. */
	            if (e.keyCode == 13)  thiz.applyClick();
	        })      
	        .hover(function() {     // Mouse hover over field in
	            var id = $(this).attr("id");
	            thiz.inputHovers[id] = true;
	            setTimeout(function() {
	                if (thiz.inputHovers[id]) thiz.guidance(id.substr(4));
	            }, 3000);
	        }, function() {         // Mouse hover over field out
	            thiz.inputHovers[$(this).attr("id")] = false;
	        });
	                
	
	$("#pid-send")
	        .click(function() { thiz.applyClick(); });
	
	this.enableDraggable();
};

PIDControl.prototype.getHTML = function() {	
	return(
		'<div id="pid-settings" class="saharaform">' +
        	'<div>' + 
        		'<label for="pid-sp">Setpoint:</label>' +
        		'<input id="pid-sp" type="text" name="setpoint" disabled="disabled" tabindex="1" />' +
        	'</div>' +
        	'<div>' + 
        		'<label for="pid-kp">K<span>p</span>:</label>' +
        		'<input id="pid-kp" type="text" name="kp" disabled="disabled" tabindex="2" />' +
        	'</div>' +
        	'<div>' + 
        		'<label for="pid-ki">K<span>i</span>:</label>' +
        		'<input id="pid-ki" type="text" name="ki" disabled="disabled" tabindex="3" />' +
        	'</div>' +
        	'<div>' + 
        		'<label>K<span>d</span>:</label>' +
        		'<input id="pid-kd" type="text" name="kd" disabled="disabled" tabindex="4" />' +
        	'</div>' +
        '</div>' +
        '<a id="pid-send" class="click-button click-button-disabled" tabindex="5" >Apply</a>' +
        '<div class="data-blur"></div>' 
	);
};

PIDControl.prototype.consume = function(data) {
	var i = 0;
	for (i in this.pid)
	{
	    /* All packets should have all PID variables. */
	    if (data[i] == undefined) return;
	    
	    if (this.pid[i] != data[i])
	    {
	        this.pid[i] = data[i];
	        $("#pid-" + i).val(data[i]);
	    }
	}
	
	if (!this.hasSettings)
	{
	    this.$widget.find("input").attr("disabled", "");
	    this.$widget.find(".data-blur").hide();
	}
};

/**
 * Validates an entered value. 
 * 
 * @param pVar variable to validate
 * @param val value
 */
PIDControl.prototype.validate = function(pVar, val) {
    this.removeMessages();
    
    /* Add variables must be numbers. */
    if (!val.match(/^\d+\.?\d*$/))
    {
        this.addMessage("pid-validation-" + pVar, "Value must be a number", "error", this.toolTopLeft, 
                this.toolTipTop[pVar], "left");
        return false;
    }

    var n = parseFloat(val);
    switch (pVar)
    {
    case 'sp':
        if (n < 0 || n > 300)
        {
            this.addMessage("pid-validation-" + pVar, "Setpoint out of range, must be between 0 and 300 mm.", 
                    "error", this.toolTopLeft, this.toolTipTop[pVar], "left");
            return false;
        }
        break;
        
    case 'kp':
        /* No validation rules. */
        break;
        
    case 'ki':
        /* No validation rules. */
        break;
        
    case 'kd':
        /* No validation rules. */
        break;
    }

    return true;
};

/**
 * Sends PID values if they correctly validate. 
 */
PIDControl.prototype.applyClick = function() {
    /* Nothing changed, nothing to send. */
    if (!this.isChanged) return;
    
    /* Validate values. */
    var data = { }, i = 0, val;
    for (i in this.pid)
    {
        val = $("#pid-" + i).val();
        if (!this.validate(i, val)) return;
        
        data[i] = parseFloat(val);
    }
    
    var thiz = this;
    this.postControl("setPID", data, function() {
        thiz.isChanged = false;
        $("#pid-send").addClass("click-button-disabled");
    }, function() {
        
    });
};

/**
 * Provides a guidance tooltip.
 * 
 * @param id identifer
 */
PIDControl.prototype.guidance = function(id) {
    this.removeMessages();
    this.addMessage("pid-guidance-" + id, this.guidanceMsgs[id], "info", this.toolTopLeft, this.toolTipTop[id], "left");
};

/* ============================================================================
 * == Base widget                                                            ==
 * ============================================================================ */

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

	/** The page icon. */
	this.icon = undefined;

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

	$box = this.$widget.append(html).children(':last');

	/* Throb box shadow around message box. */
	aniIn = setInterval(function() {
		if (bs == 0 || bs == 12) up = !up;
		$box.css("box-shadow", "0 0 " + (up ? bs++ : bs--) + "px #AAAAAA");
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
Widget.prototype.generateBox = function(boxId, icon) {
	this.icon = icon;
    return this.$container.append(
      "<div class='windowwrapper' id=" + boxId + ">" +
          "<div class='windowheader'><span class='windowIcon icon_"+ this.icon + "'></span>" +
              "<span class='windowtitle'>" + this.title + "</span>" +
          "</div>" +
          "<div class='windowcontent'>" + 
          	  this.getHTML() +
          "</div>" +
      "</div>"
  ).children().last();
};

/**
 * Generates the HTML content for the widget box.
 */
Widget.prototype.getHTML = function() {	};

/** Whether the z-index fix has been applied. */
Widget.hasZIndexFix = false;

/**
 * Enables this widget to be draggable.
 */
Widget.prototype.enableDraggable = function() {
    /* Adds the CSS for the draggable widgets */
    this.$widget.addClass('draggable');
    this.$widget.find('.windowheader').addClass('draggable-header');
    
	/* Enables dragging on the widgets 'windowwrapper' class. */
    var thiz = this;
	this.$widget.draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.windowwrapper',
        increaseZindexOnmousedown: true,
        distance: 10,
        handle: 'draggable-header',
        stop: function() {
        	var p = $(this).position();
        	thiz.dragged(p.left, p.top);
        }
    });

	if (!Widget.hasZIndexFix)
	{
		/* Enables increase Z-index on mouse down. */ 	
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

	    Widget.hasZIndexFix = true;
	}
};

/**
 * Enables this widget to be resizable. 
 * 
 * @param aspect the aspect resize the drag is restricted to
 * @param minHeight the minimum height the widget can be resized to
 * @param minWidth the minimum width the widget can be resized to
 */
Widget.prototype.enableResizable = function(aspect, minHeight, minWidth) {
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
 * @param errorCallback function to be invoked if an error occurs
 */
Widget.prototype.postControl = function(action, params, responseCallback, errorCallback) {
    $.ajax({
        url: "/primitive/mapjson/pc/CoupledTanksController/pa/" + action,
        data: params,
        success: function(data) {
            if (responseCallback != null) responseCallback(data);
        },
        error: function(data) {
            if (errorCallabck != null) errorCallback(data);
        }
    });
};

/* ============================================================================
 * == Display Manager.                                                       ==
 * ============================================================================ */

/**
 * Controls which widgets are active a which point.
 */
function DisplayManager($container, title, widgets) 
{	
    Widget.call(this, $container, title);
    
    /** Widgets that are toggle able by this widget. */
    this.widgets = widgets;
    
    /** The states of each of the widgets. */
    this.states = { };
    
    /* Whether the displayed in is blurred state. */
    this.isBlurred = false;
}
DisplayManager.prototype = new Widget;

DisplayManager.prototype.init = function() {
    var thiz = this, i = 0;
    
    /* Enable all the other widgets. */
    for (i in this.widgets) 
    {    	
    	this.widgets[i].init();
    	this.states[i] = true;
    }

    /* Generate our UI. */
	this.$widget = this.generateBox('display-manager', 'toggle');
    this.enableDraggable();
    
    this.$widget.find('.toggle').click(function() {    
    	$(this).find('.switch .slide').toggleClass("on off");
    	thiz.toggleWidget($(this).find("span").html());
    });    
};

DisplayManager.prototype.getHTML = function() {	
	var i = 0, html =
		'<div class="buttonwrapper">';

	for (i in this.widgets)
	{
		/* We should be adding this to be widgets that can be removed. */
		if (this.widgets[i] == this) continue;

		html += '<div class="button toggle" name="video">' +
					(this.icon != undefined ? '<div class="windowIcon icon_' + this.widgets[i].icon + '"></div>' : '') +  
					'<span class="display-manager-title">' + this.widgets[i].title + '</span>' +
        			'<div class="switch">' +
        				'<div class="animated slide on"></div>' +
        			'</div>' +
        		'</div>';
	}

    html += '</div>';

	return html;
};

/**
 * Toggles a widget from either displaying or being invisible. 
 * 
 * @param title the title of the widget to toggle
 */
DisplayManager.prototype.toggleWidget = function(title) {
	var i = 0;

	for (i in this.widgets)
	{
		if (this.widgets[i].title == title)
		{
			if (this.states[i])  this.widgets[i].destroy();
			else 
			{
				this.widgets[i].init();
				if (this.isBlurred) this.widgets[i].blur();
			}
			this.states[i] = !this.states[i];
		}
	}
};

DisplayManager.prototype.consume = function(data) {
	var i = 0;
	for (i in this.widgets) if (this.states[i]) this.widgets[i].consume(data);
};


DisplayManager.prototype.blur = function() {
	var i = 0;
	this.isBlurred = true;
	for (i in this.widgets) if (this.states[i]) this.widgets[i].blur();
};

DisplayManager.prototype.unblur = function() {
	var i = 0;
	this.isBlurred = false;
	for (i in this.widgets) if (this.states[i]) this.widgets[i].unblur();
};


/* ============================================================================
 * == Graph Widget                                                           ==
 * ============================================================================ */

/** 
 * Graph widget. This widget contains a scrolling graph that is user navigable
 * through the sessions data. 
 * 
 * @param $container the container to append the graph to
 * @param title the graph title
 * @param chained a graphs that are chained to this graph to receives its \
 * 			 pulled or pushed data
 */
function GraphWidget($container, title, chained) 
{
	Widget.call(this, $container, title);

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

	/** Whether this widget is pulling data, i.e. polling the server for new
	 *  graphing information. */
	this.isPulling = true;

	/** Graphs that are chained to this graph. */
	this.chained = chained;
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
	this.$widget.find('.graph-label').click(function() {    
		thiz.showTrace($(this).children(".graph-label-text").text(), 
				$(this).find(".switch .slide").toggleClass("on off").hasClass("on"));
	});

	/* Draw the first frame contents. */
	this.drawFrame();

	/* Pull data if we are setup to pull. */
	if (this.isPulling) this.acquireData();

	/* Enable dragging. */
	this.enableDraggable();
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
				"		<label for='graph-label-" + i + "' class='graph-label-text'>" + this.dataFields[i].label + "</label>" +  
		        "       <div id='graph-label-" + i + "'class='switch graph-label-enable'>" +
        		"		    <div class='animated slide on'></div>" +
        		"       </div>" +
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
			(this.width / 2 - this.axis.y.length * 10)  + "px'>" + this.axis.y + "</div>";

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
			if (thiz.isPulling) setTimeout(function() { thiz.acquireData(); }, 1000);
		},
		error: function(data) {
			if (thiz.isPulling) setTimeout(function() { thiz.acquireData(); }, 30000);
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

	/* Forward data onto chained graph. */
	if (this.chained != undefined) this.chained.updateData(data);
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
		dt = this.height / GraphWidget.NUM_VERT_SCALES;

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

	var yScale = this.height / (this.maxGraphedValue - this.minGraphedValue),
		xStep  = this.width / (dObj.seconds * 1000 / this.period),
		i, yCoord;

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
		yCoord = this.height - dObj.values[i] * yScale;
		/* If value too large, clipping at the top of the graph. */
		if (yCoord > this.height) yCoord = this.height;
		/* If value too smale, clippling at the bottom of the graph. */
		if (yCoord < 0) yCoord = 0;

		if (i == 0)
		{
			this.ctx.moveTo(i * xStep, yCoord);
		}
		else
		{
			this.ctx.lineTo(i * xStep, yCoord);
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
		$d = this.$widget.find(".graph-bottom-scale-0"), t;

	for (i = 0; i <= GraphWidget.NUM_HORIZ_SCALES; i++)
	{
		t = this.latestTime - xstep * (GraphWidget.NUM_HORIZ_SCALES - i) - this.startTime;
		$d.html(zeroPad(t, t < 100 ? 1 : 0));
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

/* ============================================================================
 * == Tabbed Container Widget                                                ==
 * ============================================================================ */

/**
 * The 'tabbed' widget provides a container that holds other widgets within 
 * its tabs. 
 */
function TabbedWidget($container, title, widgets) 
{
   
   DisplayManager.call(this, $container, title, widgets);
   
   /** Identifer of this widget. */
   this.id = title.toLowerCase().replace(' ', '-');
}
TabbedWidget.prototype = new DisplayManager;

TabbedWidget.prototype.init = function() { 
	this.$widget = this.generateBox(this.id, 'settings');

	this.enableDraggable();
};

/* ============================================================================
 * == Camera Widget                                                           ==
 * ============================================================================ */

/**
 * The camera widget displays a single camera stream which may have one or more
 * formats.  
 * 
 * @param $container the container to add this camera to
 * @param title the camera box title
 * @param attr data attribute to request from the server
 */
function CameraWidget($container, title, attr) 
{
    Widget.call(this, $container, title);
    
    /** The width of the camera stream. */
    this.width = 320;
    
    /** The height of the camera stream. */
	this.height = 240;

	/** Identifier of the camera box. */
	this.id = title.toLowerCase().replace(' ', '-');

	/** The list of address for the each of the camera formats. */
	this.urls = {
		swf: '',   // Flash format
		mjpeg: ''  // MJPEG format
	};  
};
CameraWidget.prototype = new Widget;

CameraWidget.prototype.init = function() {
	this.$widget = this.generateBox('camera-' + this.id, 'video');

	this.enableDraggable();
	this.enableResizable('16 / 9', 192, 340);
};


CameraWidget.prototype.getHTML = function() {	
	return(
		'<div class="video-player" style="height:' + this.height + 'px;width:' + this.width + 'px">' +
		'	<div class="video-placeholder">Please wait...' +
		'</div>'
	);
};

/**
 * Gets the HTML to deploy a SWF stream format. 
 */
CameraWidget.prototype.getSwfHtml = function() {
	return 
		(!$.browser.msie ? // Firefox, Chrome, ...

			'<object type="application/x-shockwave-flash" data="' + this.swf + '" ' +
	 				'width="' +  this.width  + '" height="' + this.height + '">' +
		        '<param name="movie" value="' + 'this.urls.swf' + '"/>' +
		        '<a href="http://www.adobe.com/go/getflash">' +
		        	'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" ' +
		        			'alt="Get Adobe Flash player"/>' +
		        '</a>' +
		    '</object>'
		:                  // Internet Explorer
			'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"  width="' + this.width + '" height="' + this.height + '"  id="camera-swf-movie">' +
				'<param name="movie" value="' + this.swf + '" />' +
				'<a href="http://www.adobe.com/go/getflash">' +
					'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player"/>' +
				'</a>' +
			'</object>'
		);
};

/**
 * Gets the HTML to deploy a MJPEG stream.
 */
CameraWidget.prototype.getMjpegHtml = function() {
	return 
		(!$.browser.msie ? // Firefox, Chrome, ...
			 '<img style="width:' + this.width + 'px;height:' + this.height + 'px" ' +
						'src="' + this.mjpeg + '?' + new Date().getTime() + ' alt="&nbsp;" />'
		 :                 // Internet Explorer
			 '<applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" ' + 
					'width="' + this.width + '" height="' + this.height + '">' +
				'<param name="url" value="' + this.mjpeg + '"/>' +
				'<param name="accessories" value="none"/>' +
			'</applet>'
	    );
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

	if (places > 0)
	{
		if (r.indexOf('.') == -1) r += '.';
		while (r.length - r.indexOf('.') < places + 1) r += '0';
	}

	return r;
}