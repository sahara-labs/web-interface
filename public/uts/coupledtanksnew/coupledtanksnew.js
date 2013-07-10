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
	this.widgets.push(new WaterLevelsMimic(this.$container,'Water Levels'));

	/* Graph to display tank levels. */
	o = new GraphWidget(this.$container, "Tank Levels");
	o.setDataVariable('l1', 'Level 1',  '#1FA8DD', 0, 350);
	o.setDataVariable('l2', 'Level 2',  '#9F88FF', 0, 350);
	o.setDataVariable('sp', 'Setpoint', '#ECD563', 0, 350);
	o.setAxisLabels('Time (s)', 'Level (mm)');
	o.isPulling = false;
	this.widgets.push(o);

	/* Graph to display flow rates. */
	o = new GraphWidget(this.$container, "Flow Rates", o);
	o.setDataVariable('t1-in',    'Tank 1 In',    '#1FA8DD', 0, 10);
	o.setDataVariable('t1-to-t2', 'Tank 1 to 2',  '#9F88FF', 0, 10);
	o.setDataVariable('t2-out',   'Tank 2 Out',   '#ECD563', 0, 10);
	o.setAxisLabels('Time (s)',   'Flow (L/min)');
	this.widgets.push(o);	

	/* Add camera to page. */
	this.widgets.push(new CameraWidget(this.$container, 'Coupled Tanks', 'camera'));

	/* Controls. */
	o = new SliderWidget(this.$container, 'Manual', 'manual', 'valve', 'setValve');
	o.setOrientation(false);
	o.setLabels('Valve', '%');
	
	t = new TabbedWidget(this.$container, 'Controls', [ o, new PIDControl(this.$container) ], 
	        'control-mode', 'setManualMode');
	t.setDimensions(280, 110);
	t.setToolTips([
	    'Manually set the flow rate by varying the percent the valve is open.',
	    'Enable closed loop control using the proportional-integral-derivative (PID) controller.'
	]);
	this.widgets.push(t); 

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
function WaterLevelsMimic($container, title) {

	Widget.call(this, $container, 'Diagram', 'mimic');
    
    /** Identifier of the mimic. */
	this.id = title.toLowerCase().replace(' ', '-');
	
	/** Variables that are displayed on the mimic. */
	this.dataVars = { };

	/** Display precision for our data variables. */
	this.precision = {
		'l1': 1,
		'l2': 1,
		't1-in': 1,
		't2-out': 1,
		't1-to-t2': 1,
		'pump-rpm': 0,
		'valve-actual': 1
	};

	/** Units for out data variables. */
	this.units = {
		'l1': 'mm',
		'l2': 'mm',
		't1-in': 'L/min',
		't2-out': 'L/min',
		't1-to-t2': 'L/min',
		'pump-rpm': 'RPM',
		'valve-actual': '%',	
	};
};

WaterLevelsMimic.prototype = new Widget;

WaterLevelsMimic.prototype.init = function() {
	this.$widget = this.generateBox('water-levels-mimic');

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
   Widget.call(this, $container, 'PID', 'pid');
   
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
       sp: 'Desired water level in millimetres.',
       kp: 'Proportional gain, a tuning parameter.',
       ki: 'Integral gain, a tuning parameter.',
       kd: 'Derivative gain, a tuning parameter.'
   };
   
   /** CSS left position for guidance and validation messages. */
   this.toolTopLeft = {
       sp: 135,
       kp: 100,
       ki: 210,
       kd: 100
   };
   
   /** CSS top values for guidance and validation messages. */ 
   this.toolTipTop = {
       sp: 3,
       kp: 40,
       ki: 40,
       kd: 80
   };
}
PIDControl.prototype = new Widget;

PIDControl.prototype.init = function() {	
    var thiz = this, i = 0;
    
    /* Reset values. */
    for (i in this.pid) this.pid[i] = undefined;
    this.isChanged = false;
    
	this.$widget = this.generateBox('pid-control');
	
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
	        .mousedown(function() {
	            if (thiz.isChanged) $(this).addClass("click-button-active");
	        })
	        .mouseup(function() { $(this).removeClass("click-button-active") ; })
	        .click(function() { thiz.applyClick(); })
	        .keypress(function(e) {
	            if (e.keyCode == 13) thiz.applyClick();
	        });
	
	this.enableDraggable();
};

PIDControl.prototype.getHTML = function() {	
	return(
		'<div id="pid-settings" class="saharaform">' +
        	'<div id="pid-settings-sp">' + 
        		'<label for="pid-sp">Setpoint:</label>' +
        		'<input id="pid-sp" type="text" name="setpoint" disabled="disabled" tabindex="1" />' +
        		'&nbsp;&nbsp;mm' +
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
    if (!val.match(/^-?\d+\.?\d*$/))
    {
        this.addMessage("pid-validation-" + pVar, "Value must be a number", "error", this.toolTopLeft[pVar], 
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
                    "error", this.toolTopLeft[pVar], this.toolTipTop[pVar], "left");
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
    this.addMessage("pid-guidance-" + id, this.guidanceMsgs[id], "info", this.toolTopLeft[id], 
            this.toolTipTop[id], "left");
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
 * @param title the widgets title
 * @param icon the widgets box icon 
 */
function Widget($container, title, icon) 
{
	/** The jQuery object of the container the widget is attached to. */
	this.$container = $container;

	/** The page title. */
	this.title = title;

	/** The page icon. */
	this.icon = icon;

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
 * Event callback that is invoked when the widget is resized. This is called 
 * multiple times during resizing should be a speedy operation.
 * 
 * @param width the new widget width
 * @param height the new widget height
 */
Widget.prototype.resized = function(width, height) { };

/**
 * Event callback that is invoked when the widget has finished resizing. 
 * 
 * @param width the final widget width
 * @param height the final widget height
 */
Widget.prototype.resizeStopped = function(width, height) { };

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
Widget.prototype.addMessage = function(msgId, message, type, left, top, pos) {
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
 * @return jQuery node of the generated box that has been appended to the page
 */
Widget.prototype.generateBox = function(boxId) {
    return this.$container.append(
      "<div class='windowwrapper' id='" + boxId + "'>" +
          "<div class='windowheader'>" +
              "<span class='windowIcon icon_"+ this.icon + "'></span>" +
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
   
    /** Set the cookie names */
    var cookieNameP = this.id + '-pos';
    var cookieNameZ = this.id + '-z';

    /** if the position cookie exists */
    if (document.cookie.indexOf(cookieNameP) != -1){
             
        /** function that retrieves cookie values*/              
        function getCookie(c_name) {
		    var c_value = document.cookie;
		    var c_start = c_value.indexOf(" " + c_name + "=");
		    if (c_start == -1) {
		        c_start = c_value.indexOf(c_name + "=");
		    }
		    if (c_start == -1) {
		    c_value = null;
		    }
		    else {
		        c_start = c_value.indexOf("=", c_start) + 1;
		        var c_end = c_value.indexOf(";", c_start);
		        if (c_end == -1) {
		            c_end = c_value.length;
		        }
		        c_value = unescape(c_value.substring(c_start,c_end));
		    }
		    return JSON.parse(c_value);
		}   
        
        /** retrieves the values for position and zIndex */
        var cookiePos = getCookie(cookieNameP);
        var cookieZ = getCookie(cookieNameZ);
        
        /** update the widgets position */
        this.$widget.css({left: cookiePos.left, top: cookiePos.top});
           
        /** update the widgets zIndex */
        this.$widget.zIndex(cookieZ);        
    }
    
	/* Enables dragging on the widgets 'windowwrapper' class */
    var thiz = this;
	this.$widget.draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.windowwrapper',
        increaseZindexOnmousedown: true,
        distance: 10,
        handle: '.draggable-header',
        stop: function() {
            
            /** Gets the widgets position */
        	var p = $(this).position();
        	thiz.dragged(p.left, p.top);
        	
        	/** stores postion in a cookie as a JSON string */
        	document.cookie = cookieNameP + '=' + JSON.stringify(p);       	
        	
        	/** Gets the widgets zIndex */
            var z = $(this).zIndex();
        	thiz.dragged(z.z);
            
            /** stores zIndex in a cookie as a JSON string */
            document.cookie = cookieNameZ + '=' + JSON.stringify(z);
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
 * @param minWidth the minimum width the widget can be resized to (optional)
 * @param minHeight the minimum height the widget can be resized to (optional)
 * @param preserveAspectRatio whether to preserve the widgets aspect ratio, default to not preserve 
 */
Widget.prototype.enableResizable = function(minWidth, minHeight, preserveAspectRatio) {
    var thiz = this;
	this.$widget.resizable({
         minWidth: minWidth,
         minHeight: minHeight,
         aspectRatio: preserveAspectRatio,
         distance: 10,
         resize: function(e, ui) { thiz.resized(ui.size.width, ui.size.height); },
	     stop: function(e, ui) { thiz.resizeStopped(ui.size.width, ui.size.height); }
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
    Widget.call(this, $container, title, 'toggle');

    /** Identifier of the display manager box. */
    this.id = 'display-manager';

    /** Widgets that are toggle able by this widget. */
    this.widgets = widgets;
    
    /** The states of each of the widgets. */
    this.states = [ ];
    
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
	this.$widget = this.generateBox('display-manager');
    this.enableDraggable();
    
    this.$widget.find('.toggle').click(function() {    
    	$(this).find('.switch .slide').toggleClass("on off");
    	thiz.toggleWidget($(this).find("span").html());
    });
};

DisplayManager.prototype.getHTML = function() {	
	var i = 0, html =
		'<div class="buttonwrapper">' +
		'<div class="button reset-button" name="resetPos">Reset positions</div>';

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
 * == Tabbed Container Widget                                                ==
 * ============================================================================ */

/**
 * The 'tabbed' widget provides a container that holds other widgets within 
 * its tabs. Only one widget is visible at a time 
 */
function TabbedWidget($container, title, widgets, modeVar, modeAction) 
{
   DisplayManager.call(this, $container, title, widgets);
   
   /** Identifer of this widget. */
   this.id = title.toLowerCase().replace(' ', '-') + '-tabs';
   
   /** Tab idenfitiers. */
   this.tabIds = [ ];
   
   /** Tab contents container. */
   this.$tabContainer = undefined;
   
   /** Tools tips of the tab. */
   this.toolTips = undefined;
   
   /** Width of the tab box. If this is undefined, the box takes the width
    *  of its currently displayed contents. */
   this.width = undefined;
   
   /** Height of the box. If this is undefinde, the box takes the height of
    *  its currently displayed contents. */
   this.height = undefined;
   
   /** Server mode variable the controls which tab is currently active. */ 
   this.modeVar = modeVar;
   
   /** Action to post the mode change to. */
   this.modeAction = modeAction;
   
   /** Current mode. */
   this.currentMode = undefined;
   
   /** If a tab has been clicked to change current tab. */
   this.tabChanged = false;

   /* Initialise the tab indentifiers. */
   var i = 0;
   for (i in this.widgets) this.tabIds[i] = "tab-" + this.widgets[i].title.toLowerCase().replace(' ', '-');
}
TabbedWidget.prototype = new DisplayManager;

TabbedWidget.prototype.init = function() {
    /* Reset. */
    this.currentMode = undefined;
    
    /* Render the content box. */
	this.$widget = this.generateBox(this.id);
	this.$tabContainer = this.$widget.find(".tab-content");
	
	var i = 0;
	for (i in this.widgets)
	{
	    /* Replace default boxing with tab containment. */
	    this.widgets[i].$container = this.$tabContainer;
	    this.widgets[i].generateBox = function(boxId, icon) {
	       return this.$container.append(
	           "<div id='" + boxId + "' class='tab-containment'>" +
	               this.getHTML() +
	           "</div>"
	       ).children().last();
	    };
	    this.widgets[i].enableDraggable = function() { /* No-op. */ };
	    
	    this.states[i] = false;
	}
	
	var thiz = this;
	this.$widget.find(".tab-title").click(function() { thiz.tabClicked($(this).attr("id")); });
};

TabbedWidget.prototype.generateBox = function(boxId) {
    var i = 0, html = 
      "<div class='tab-wrapper' id='" + boxId + "'>" +
         "<div class='tab-header' style='width:" + (this.widgets.length * 122) + "px'>";

    for (i in this.widgets)
    {
        html += 
              "<div id='" + this.tabIds[i] + "' class='tab-title'>" +
                  "<span class='windowIcon icon_"+ this.widgets[i].icon + "'></span>" +
                  "<span class='windowtitle'>" + this.widgets[i].title + "</span>" +
              "</div>";
    }

    html += 
         "</div>" + 
         "<div class='tab-content' style='width:" + (this.width ? this.width + "px" : "inherit") + 
         		";height:" + (this.height ? this.height + "px" : "inherit") + "'></div>" +
      "</div>";

    return this.$container.append(html).children().last();
};

TabbedWidget.prototype.consume = function(data) {
    if (!this.tabChanged && data[this.modeVar] != undefined && data[this.modeVar] != this.currentMode)
    {
        /* Server state is different from the displayed state. */
        this.currentMode = data[this.modeVar];
        this.switchTab();
    }
    
    DisplayManager.prototype.consume.call(this, data);
};

/**
 * Handle a tab being clicked.
 * 
 * @param id identifer of clicked tab
 */
TabbedWidget.prototype.tabClicked = function(id) {
    this.tabChanged = true;
    this.destroyCurrentTab();
    
    var thiz = this, params = { }, i;
    
    /* Seach for the new tab index. */
    for (i = 0; i < this.tabIds.length; i++) if (this.tabIds[i] == id) break; 
    
    /* Post the change to the server. */
    params[this.modeVar] = i;
    this.postControl(this.modeAction, params, function(data) {
            thiz.tabChanged = false;
            thiz.consume(data);
    });
};

/**
 * Switches tab.
 */
TabbedWidget.prototype.switchTab = function() {
    this.destroyCurrentTab();
    this.states[this.currentMode] = true;
    this.widgets[this.currentMode].init();
    
    this.$widget.find(".tab-active").removeClass("tab-active");
    $("#" + this.tabIds[this.currentMode]).addClass("tab-active");
};

/**
 * Removes the current tab.
 */
TabbedWidget.prototype.destroyCurrentTab = function() {
    var i = 0;
    
    /* Remove the displayed widget. */
    for (i in this.states) 
    {
        if (this.states[i]) 
        {
            this.widgets[i].destroy();
            this.states[i] = false;
            break;
        }
    }    
};

/**
 * Sets the tool tips of the tabs of this container. These tooltips are 
 * displayed when hovering over a tab.
 * 
 * @param toolTips list of tool tips
 */
TabbedWidget.prototype.setToolTips = function(toolTips) {
    this.toolTips = toolTips;
};

/**
 * Sets the dimension of the box. If the width and height are undefined,
 * the box size is determined by its displayed contents.
 * 
 * @param width width of the box in pixels
 * @param height height of the box in pixels
 */
TabbedWidget.prototype.setDimensions = function(width, height) {
    this.width = width;
    this.height = height;
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
	Widget.call(this, $container, title, 'graph');

	/** ID of canvas. */
	this.id = "graph-" + title.toLowerCase().replace(' ', '-');
	
	/** The box width. The box is the outmost container of the widget. */
	this.boxWidth = undefined;
	
	/** The box height. */
	this.boxHeight = undefined;
	
	/** Width of the graph, including the padding whitespace but excluding the
	 *  border width. */
	this.width = 416;

	/** Height of the graph, including the padding whitespace but excluding the
	 *  border width and border title. */
	this.height = 175;

	/** The minimum expected graphed value. A value smaller than this will be
	 *  clipped. */
	this.minGraphedValue = undefined;

	/** The maximum expected graphed value. A value greater than this will be 
	 *  clipped. */
	this.maxGraphedValue = undefined;
	
	/** Whether the graph is autoscaling. */
	this.isAutoscaling = false;
	
	/** The range of values. If autoscaling, this is determined as the difference
	 *  between the largest and smallest valuem, if not this is the difference 
	 *  between the max and min graphed values. */
	this.graphRange = undefined;
	
	/** The zero point offset of the graph in pixels. */
	this.graphOffset = undefined;

	/** Canvas context. */
	this.ctx = null;

	/** Data fields. */
	this.dataFields = { };

	/** The number of seconds this graph displays. */
	this.duration = 300;

	/** The period in milliseconds. */
	this.period = 100;

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
	
	/** Whether the controls are displayed. */
	this.isControlsDisplayed = false;

}
GraphWidget.prototype = new Widget;

GraphWidget.prototype.init = function() {
	this.$widget = this.generateBox(this.id + '-box');

	/* Add the canvas panel. */
	var canvas = getCanvas(this.id, this.width, this.height);
	this.$widget.find("#" + this.id + "-canvas").append(canvas);
	this.ctx = canvas.getContext("2d");
	
	/* Track size. */
	this.boxWidth = parseInt(this.$widget.css("width"));
	this.boxHeight = parseInt(this.$widget.css("height"));

	/* Event handlers. */
	var thiz = this;
	this.$widget.find('.graph-label').click(function() {    
		thiz.showTrace($(this).children(".graph-label-text").text(), 
				$(this).find(".switch .slide").toggleClass("on off").hasClass("on"));
	});
	
	this.$widget.find(".graph-controls-show").click(function() {
	    thiz.showControls($(this).find(".switch .slide").toggleClass("on off").hasClass("on"));
	});
	
	this.$widget.find(".graph-autoscale").click(function() {
	   thiz.enableAutoscale($(this).find(".switch .slide").toggleClass("on off").hasClass("on")); 
	});

	/* Draw the first frame contents. */
	this.drawFrame();

	/* Pull data if we are setup to pull. */
	if (this.isPulling) this.acquireData();

	/* Enable dragging. */
	this.enableDraggable();
	
	/* Enable resizing. */
	this.enableResizable(500, 300);
};

/** The number of vertical scales. */
GraphWidget.NUM_VERT_SCALES = 5;

/** The number of horizontal scales. */
GraphWidget.NUM_HORIZ_SCALES = 8;

GraphWidget.prototype.getHTML = function() {
   
	var i = null, unitScale, styleScale, html = ''; 

	/* Graph labels. */
	html += "<div class='graph-labels'>";
	for (i in this.dataFields)
	{
		html += "	<div class='graph-label'>" + 
				"		<label for='graph-label-" + i + "' class='graph-label-text'>" + this.dataFields[i].label + "</label>" +  
		        "       <div id='graph-label-" + i + "' class='switch graph-label-enable'>" +
        		"		    <div class='animated slide on'></div>" +
        		"       </div>" +
				"		<div class='graph-label-color-box'>" +
				"			<div class='graph-label-color-line' style='background-color:" + this.dataFields[i].color + "'></div>" +
				"		</div>" +
				"	</div>";
	}
	html += "</div>";

	/* Left scale. */
	unitScale = Math.floor(this.graphRange / GraphWidget.NUM_VERT_SCALES);
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
	html += "<div id='" + this.id +  "-canvas' class='graph-canvas-box gradient' style='height:" + this.height + "px'></div>";

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
	
	/* Controls show / hide button. */
	html += "<div class='graph-controls-show'>" +
        	"   <label for='" + this.id + "-graph-controls-show' class='graph-label-text'>Controls</label>" +  
            "   <div id='" + this.id + "-graph-controls-show' class='switch graph-controls-show-enable'>" +
            "       <div class='animated slide off'></div>" +
            "   </div>" +
	        "</div>";
	
	/* Controls. */
	html += "<div class='graph-controls'>" +
        	"   <div class='graph-autoscale'>" +
            "       <label for='" + this.id + "-graph-autoscale' class='graph-label-text'>Autoscale</label>" +  
            "       <div id='" + this.id + "-graph-autoscale' class='switch'>" +
            "          <div class='animated slide off'></div>" +
            "       </div>" +
            "   </div>";
	        "</div>";

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
			from: 0,     // For now we are just asked for the latest data
		},
		success: function(data) {
			thiz.updateData(data);
			if (thiz.isPulling) setTimeout(function() { thiz.acquireData(); }, 500);
		},
		error: function(data) {
			if (thiz.isPulling) setTimeout(function() { thiz.acquireData(); }, 5000);
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
	
    if (this.isAutoscaling) 
    {
        /* Determine graph scaling for this frame and label it. */
        this.adjustScaling();
        this.updateDependantScale();
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
	
	/* Draw scales. */
	this.drawDependantScales();
	    
	/* Draw the trace for all graphed variables. */
	for (i in this.dataFields) this.drawTrace(this.dataFields[i]);
};

/**
 * Adjusts the scaling and offset based on the range of values in the graphed
 * datasets.
 */
GraphWidget.prototype.adjustScaling = function() {
    var min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY, j;

    for (i in this.dataFields)
    {
        for (j = 0; j < this.dataFields[i].values.length; j++)
        {
            if (this.dataFields[i].values[j] < min) min = this.dataFields[i].values[j];
            if (this.dataFields[i].values[j] > max) max = this.dataFields[i].values[j];
        }
    }

    this.graphRange = max - min;
    this.graphOffset = min / this.graphRange;    
};

/** The stipple width. */
GraphWidget.STIPPLE_WIDTH = 10;

/**
 * Draws the scales on the interface.
 */
GraphWidget.prototype.drawDependantScales = function() {
	var i, j,
		dt = this.height / GraphWidget.NUM_VERT_SCALES,
		off = Math.abs(this.graphOffset * this.height);

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.strokeStyle = "#FFFFFF";
	
	/* Zero line. */
	this.ctx.moveTo(0, off);
	this.ctx.lineTo(this.width, off);
	
	this.ctx.lineWidth = 0.3;

	/* Below zero. */
	for (i = off + dt; i < this.height; i += dt)
	{
		for (j = 0; j < this.width; j += GraphWidget.STIPPLE_WIDTH * 1.5)
		{
			this.ctx.moveTo(j, i + 0.25);
			this.ctx.lineTo(j + GraphWidget.STIPPLE_WIDTH, i + 0.25);
		}
	}
	
	/* Above zero line. */
	for (i = off - dt; i > 0; i -= dt)
	{
		for (j = 0; j < this.width; j += GraphWidget.STIPPLE_WIDTH * 1.5)
		{
			this.ctx.moveTo(j, i+ 0.25);
			this.ctx.lineTo(j + GraphWidget.STIPPLE_WIDTH, i + 0.25);
		}
	}

	this.ctx.closePath();
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

	var xStep  = this.width / (dObj.seconds * 1000 / this.period), 
	    yScale = this.height / this.graphRange, i, yCoord;

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
		yCoord = this.height - dObj.values[i] * yScale + this.graphOffset * this.height;
		/* If value too large, clipping at the top of the graph. */
		if (yCoord > this.height) yCoord = this.height;
		/* If value too small, clippling at the bottom of the graph. */
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
 * Updates the dependant variable scale.
 */
GraphWidget.prototype.updateDependantScale = function() {
    var i, n, $s = this.$widget.find(".graph-left-scales");
    
    if (this.graphOffset % GraphWidget.NUM_VERT_SCALES == 0)
    {
        $s.css("top", 33);
        $s = $s.children(".graph-left-scale-0").show();
        n = GraphWidget.NUM_VERT_SCALES;
    }
    else
    {
        $s.css("top", 33 + this.graphOffset * this.height / GraphWidget.NUM_VERT_SCALES);
        $s = $s.children(".graph-left-scale-0").hide();
        n = GraphWidget.NUM_VERT_SCALES + 1;
    }
    
    for (i = 0; i <= GraphWidget.NUM_VERT_SCALES; i++)
    {
        $s.html(Math.round(this.graphRange + this.graphOffset * this.graphRange
                - this.graphRange / n * i));
        $s = $s.next();
    }
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


GraphWidget.prototype.resized = function(width, height) {
    this.width = this.width + (width - this.boxWidth);
    this.height = this.height + (height - this.boxHeight);
    
    this.boxWidth = width;
    this.boxHeight = height;
    
    /* Adjust dimensions of canvas, box and other stuff. */
    this.$widget.find("canvas").attr({
        width: this.width,
        height: this.height
    });
    
    this.$widget.find(".graph-canvas-box").css({
        width: this.width,
        height: this.height 
    });
    
    var i, $s = this.$widget.find(".graph-left-scale-0");
    
    /* Left scales. */
    for (i = 0; i <= GraphWidget.NUM_VERT_SCALES; i++)
    {
        $s.css("top", this.height / GraphWidget.NUM_VERT_SCALES * i);
        $s = $s.next();
    }
    
    /* Left label. */
    this.$widget.find(".graph-left-axis-label").css("top", this.boxHeight / 2 - this.axis.y.length * 3);
    
    /* Bottom scales. */
    for (i = 0, $s = this.$widget.find(".graph-bottom-scale-0"); i <= GraphWidget.NUM_HORIZ_SCALES; i++)
    {
        $s.css("left", this.width / GraphWidget.NUM_HORIZ_SCALES * i);
        $s = $s.next();
    }
    
    this.$widget.css("height", "auto");
};

GraphWidget.prototype.resizeStopped = function(width, height) {
    this.resized(width, height);
    this.drawFrame();
};

/**
 * Shows or hides the graph controls.
 * 
 * @param show whether to show the controls
 */
GraphWidget.prototype.showControls = function(show) {
    var $n = this.$widget.find(".graph-controls");
    $n.css("display", $n.css("display") == "none" ? "block" : "none");
    this.$widget.css("height", "auto");
};

/**
 * Enables or disables graph autoscaling. 
 * 
 * @param autoscale true if graph autoscales
 */
GraphWidget.prototype.enableAutoscale = function(autoscale) {
    if (!(this.isAutoscaling = autoscale))
    {
        this.graphRange = this.maxGraphedValue - this.minGraphedValue;
        this.graphOffset = this.minGraphedValue / this.graphRange;
        this.updateDependantScale();
    }
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
	
	this.graphRange = this.maxGraphedValue - this.minGraphedValue;
	this.graphOffset = this.minGraphedValue / this.graphRange;
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
	
	this.graphRange = this.maxGraphedValue - this.minGraphedValue;
    this.graphOffset = this.minGraphedValue / this.graphRange;
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
 * == Slider Widget                                                          ==
 * ============================================================================ */

/**
 * Slider widget that displays a slider that allows that provides a slidable
 * scale over the specified range.
 * 
 * @param $container the container to add this widget to
 * @param title the title of this widget
 * @param icon the icon to display for the sliders box
 * @param dataVar the data variable that this slider is manipulating
 * @param postAction the action to post to
 */
function SliderWidget($container, title, icon, dataVar, postAction) 
{
    Widget.call(this, $container, title, icon);
    
    /** The identifer of this slider. */
    this.id = "slider-" + title.toLowerCase().replace(' ', '-');
    
    /** The minimum value of this slider. */
    this.min = 0;
    
    /** The maximum value of this slider. */
    this.max = 100;
    
    /** Whether this widget is vertically or horizontally oriented. */
    this.isVertical = true;
    
    /** Dimension of the slider, either height or width value depending 
     *  on orientation in pixels. */
    this.dimension = 250;
    
    /** Label for slider. */
    this.label = '';
    
    /** Units for the display. */
    this.units = '';
    
    /** The data variable this slider is manipulating. */
    this.dataVar = dataVar;
    
    /** The location to post data to. */
    this.postAction = postAction;
    
    /** The current value of the data variable. */
    this.val = undefined;
    
    /** Whether the value has changed due to user interaction. */
    this.valueChanged = false;
    
    /** Knob holder. */
    this.$knob = undefined;
    
    /** Value box. */
    this.$input = undefined;
    
    /** Whether we are sliding. */
    this.isSliding = false;
    
    /** Last coordinate in sliding orientation. */
    this.lastCoordinate = undefined;
}
SliderWidget.prototype = new Widget;

/** The number of displayed scales. */
SliderWidget.NUM_SCALES = 10;

SliderWidget.prototype.init = function() {
    /* Reset values. */
    this.val = undefined;
    this.valueChanged = false;
    
    this.$widget = this.generateBox(this.id);
    
    var thiz = this;
    
    /* Slider events. */
    this.$knob = this.$widget.find(".slider-knob")
        .mousedown(function(e) { thiz.slideStart(e.pageX, e.pageY); });
    
    /* Slider position click. */
    this.$widget.find(".slider-outer").bind("click." + this.id, function(e) { thiz.sliderClicked(e.pageX, e.pageY); });
    
    /* Value box events. */
    this.$input = this.$widget.find(".slider-text input")
        .focusin(formFocusIn)
        .focusout(formFocusOut)
        .change(function() { thiz.handleTextBoxChange($(this).val()); });    
};

/**
 * Handles a slider position click.
 * 
 * @param x coordinate of mouse
 * @param y coordiante of mouse
 */
SliderWidget.prototype.sliderClicked = function(x, y) {
    if (this.isSliding) return;
    
    var off = this.$widget.find(".slider-outer").offset(),
        p = this.isVertical ? y - off.top - 7 : x - off.left - 7;
    
    /* Value scaling. */
    this.valueChanged = true;
    this.val = p * (this.max - this.min) / this.dimension;
    
    /* Range check. */
    if (this.val < this.min) this.val = this.min;
    if (this.val > this.max) this.val = this.max;
    
    /* Vertical sliders have the scale inverse to positioning. */
    if (this.isVertical) this.val = this.max - this.val;
    
    /* Update display. */
    this.moveTo();
    this.$input.val(zeroPad(this.val, 1));
    
    /* Send results. */
    this.send();
};

/**
 * Handles slider start.
 * 
 * @param x x coordinate of mouse
 * @param y y coordinate of mouse
 */
SliderWidget.prototype.slideStart = function(x, y) {
    /* State management. */
    this.isSliding = true;
    this.valueChanged = true;
    
    /* Position tracking. */
    this.lastCoordinate = (this.isVertical ? y : x);
    
    /* Event handlings. */
    var thiz = this;
    $(document)
        .bind('mousemove.' + this.id, function(e) { thiz.slideMove (e.pageX, e.pageY); })
        .bind('mouseup.' + this.id,   function(e) { thiz.slideStop (e.pageX, e.pageY); });
    
    /* Stop double handling. */
    this.$widget.find(".slider-outer").unbind("click." + this.id);
};

/**
 * Handles slider move.
 *  
 * @param x x coordinate of mouse
 * @param y y coordinate of mouse
 */
SliderWidget.prototype.slideMove = function(x, y) {
    if (!this.isSliding) return;
    
    /* Scaling to value. */
    var dist = (this.isVertical ? y : x) - this.lastCoordinate;
    this.val += (this.max - this.min) * dist / this.dimension * (this.isVertical ? -1 : 1);
    
    
    /* Range check. */
    if (this.val < this.min) this.val = this.min;
    if (this.val > this.max) this.val = this.max;
    
    /* Display update. */
    this.$input.val(zeroPad(this.val, 1));
    this.moveTo();
    
    /* Position tracking. */
    this.lastCoordinate = (this.isVertical ? y : x);
};

/**
 * Handles slide stop.
 * 
 * @param x x coordinate of mouse
 * @param y y coordinate of mouse
 */
SliderWidget.prototype.slideStop = function(x, y) {
    if (!this.isSliding) return;
    
    $(document)
        .unbind('mousemove.' + this.id)
        .unbind('mouseup.' + this.id);
    
    this.isSliding = false;
    this.send();
    
    var thiz = this;
    this.$widget.find(".slider-outer").bind("click." + this.id, function(e) { thiz.sliderClicked(e.pageX, e.pageY); });
};
/**
 * Moves the slider to the specified value 
 */
SliderWidget.prototype.moveTo = function() {
    var p = this.val / (this.max - this.min) * this.dimension;
    this.$knob.css(this.isVertical ? "top" : "left", this.isVertical ? this.dimension - p : p);
};

/**
 * Handles a value text box change.
 * 
 * @param val new value
 */
SliderWidget.prototype.handleTextBoxChange = function(val) {
    var ttLeft = this.isVertical ? 60 : this.dimension + 17,
        ttTop  = this.isVertical ? this.dimension + 82 : 75, n;
    
    this.removeMessages();
    if (!val.match(/^-?\d+\.?\d*$/))
    {
        this.addMessage("slider-validation-" + this.id, "Value must be a number.", "error", ttLeft, ttTop, "left");
        return;
    }
    
    n = parseFloat(val);
    if (n < this.min || n > this.max)
    {
        this.addMessage("slider-validation-" + this.id, "Value out of range.", "error", ttLeft, ttTop, "left");
        return;
    }
    
    this.valueChanged = true;
    this.val = n;
    this.moveTo();
    this.send();  
};

SliderWidget.prototype.getHTML = function() {
    var i, s = (Math.floor((this.max - this.min) / SliderWidget.NUM_SCALES)),
        html = 
        "<div class='slider-outer' style='" + (this.isVertical ? "height" : "width") + ":" + this.dimension + "px'>";
            
    /* Slider scale. */
    html += "<div class='slider-scales slider-scales-" + (this.isVertical ? "vertical" : "horizontal") + "'>";
    for (i = 0; i <= SliderWidget.NUM_SCALES; i++)
    {
        html += "<div class='slider-scale' style='" + (this.isVertical ? "top" : "left") + ":" + 
                        (this.dimension / SliderWidget.NUM_SCALES * i) + "px'>" +
                    "<span class='ui-icon ui-icon-arrowthick-1-" + (this.isVertical ? "w" : "n") + "'></span>" +
                    "<span class='slider-scale-value'>" + (this.isVertical ? this.max - s * i : s * i) + "</span>" +
                "</div>";
    }
    html += "</div>";
    
    /* Slider post. */
    html += "<div class='slider-post slider-post-" + (this.isVertical ? "vertical" : "horizontal") + "'></div>";
    
    /* Slider knob. */
    html += "<div class='slider-knob slider-knob-" + (this.isVertical ? "vertical" : "horizontal" ) + "'>" +
                "<div class='slider-knob-slice slider-knob-back'></div>";
    
    for (i = 0; i < 9; i++)
    {
        html +=     "<div class='slider-knob-slice slider-knob-slice-" + i + "'></div>";
    }
    
    html += "</div>";
    
    html += 
        "</div>";
    
    /* Text box with numeric value. */
    html +=
        "<div class='slider-text slider-text-" + (this.isVertical ? "vertical" : "horizontal") +
                " saharaform' style='margin-" + (this.isVertical ? "top" : "left") + ":" +
                (this.dimension + (this.isVertical ? 20 : -90)) + "px'>" +                
                "<label for='" + this.id + "-text' class='slider-text-label'>" + this.label + ":</label>" +
            "<input id='" + this.id + "-text' type='text' /> " +
            "<span>" + this.units + "</span>" +
        "</div>";
    
    return html;
};

/** 
 * Sends the updated value to the server.
 */
SliderWidget.prototype.send = function() {
    var thiz = this, params = { };
    params[this.dataVar] = this.val;
    this.postControl(this.postAction, params,
        function(data) {
            thiz.valueChanged = false;
        }
    );
};

SliderWidget.prototype.consume = function(data) {
    if (!(data[this.dataVar] == undefined || data[this.dataVar] == this.val || this.valueChanged))
    {
        this.val = data[this.dataVar];
        this.moveTo();
        this.$input.val(zeroPad(this.val, 1));
    }
};

/**
 * Sets the range of values this sliders scale has. The default range is 
 * between 0 and 100.
 * 
 * @param min minimum value
 * @param max maximum value
 */
SliderWidget.prototype.setRange = function(min, max) {
    this.min = min;
    this.max = max;
};

/**
 * Sets the orientation of this slider, which is either vertical or 
 * horizontal. The default orientation is vertical.
 * 
 * @param vertical true if vertical, false if horizontal
 */
SliderWidget.prototype.setOrientation = function(vertical) {
    this.isVertical = vertical;
};

/**
 * Sets the dimension of the slider which is either the height or width of the
 * slider depending on the sliders orientation. The default dimension is 250px.  
 * 
 * @param dimension dimension of the slider in pixels
 */
SliderWidget.prototype.setDimension = function(dimension) {
    this.dimension = dimension;
};

/**
 * Sets the labels for graphed variables.
 * 
 * @param label label for value text box
 * @param units units units of the sliders value 
 */
SliderWidget.prototype.setLabels = function(label, units) {
    this.label = label;
    this.units = units;
};

/* ============================================================================
 * == Camera Widget                                                          ==
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
    Widget.call(this, $container, title, 'video');
    
    /** The width of the camera stream. */
    this.width = 320;
    
    /** The height of the camera stream. */
	this.height = 240;

	/** Identifier of the camera box. */
	this.id = title.toLowerCase().replace(' ', '-');

	/** The list of address for the each of the camera formats. */
	this.urls = {
		swf:   undefined, // Flash format
		mjpeg: undefined  // MJPEG format
	};  
	
	/** Whether the camera is deployed. */
	this.isDeployed = false;
	
	/** Current format. */
	this.currentFormat = undefined;
};
CameraWidget.prototype = new Widget;

CameraWidget.prototype.init = function() {
    /* Reset. */
    this.isDeployed = false;
    
	this.$widget = this.generateBox('camera-' + this.id);

	this.enableDraggable();
};

CameraWidget.prototype.consume = function(data) {
    /* Camera streams don't change. */
    if (this.isDeployed) return;
    
    if (data['camera-swf'] != undefined)
    {
        this.urls.swf = decodeURIComponent(data['camera-swf']);
    }
    
    if (data['camera-mjpeg'] != undefined)
    {
        this.urls.mjpeg = decodeURIComponent(data['camera-mjpeg']);
    }
    

    this.defaultDeploy();
};

/**
 * Deploys an appropriate camera stream for the platform.
 */
CameraWidget.prototype.defaultDeploy = function() {
    var html;
    
    if ((this.currentFormat = /Mobile|mobi|Android|android/i.test(navigator.userAgent) ? 'mjpeg' : 'swf') == 'swf')
    {
        html = this.getSwfHtml();
    }
    else
    {
        html = this.getMjpegHtml();
    }
    
    this.isDeployed = true;
    this.$widget.find(".video-player").html(html);
};


CameraWidget.prototype.getHTML = function() {	
	return (
		'<div class="video-player" style="height:' + this.height + 'px;width:' + this.width + 'px">' +
		'	<div class="video-placeholder">Please wait...' +
		'</div>'
	);
};

/**
 * Gets the HTML to deploy a SWF stream format. 
 */
CameraWidget.prototype.getSwfHtml = function() {
	return (!$.browser.msie ? // Firefox, Chrome, ...
			'<object type="application/x-shockwave-flash" data="' + this.urls.swf + '" ' +
	 				'width="' +  this.width  + '" height="' + this.height + '">' +
		        '<param name="movie" value="' + 'this.urls.swf' + '"/>' +
		        '<a href="http://www.adobe.com/go/getflash">' +
		        	'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" ' +
		        			'alt="Get Adobe Flash player"/>' +
		        '</a>' +
		    '</object>'
		:                  // Internet Explorer
			'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"  width="' + this.width + '" height="' + this.height + '"  id="camera-swf-movie">' +
				'<param name="movie" value="' + this.urls.swf + '" />' +
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
	
	return (!$.browser.msie ? // Firefox, Chrome, ...
			 '<img style="width:' + this.width + 'px;height:' + this.height + 'px" ' +
						'src="' + this.urls.jpeg + '?' + new Date().getTime() + ' alt="&nbsp;" />'
		 :                 // Internet Explorer
			 '<applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" ' + 
					'width="' + this.width + '" height="' + this.height + '">' +
				'<param name="url" value="' + this.urls.mjpeg + '"/>' +
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
