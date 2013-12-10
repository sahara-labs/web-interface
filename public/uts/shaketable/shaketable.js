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
    this.duration = 30;

    /** The period in milliseconds. */
    this.period = 100;
};

/** 
 * Sets up this interface.
 */
ShakeTableControl.prototype.setup = function() {
	var o;
	
	/* Graph to display tank levels. */
	o = new GraphWidget(this.$container, "Displacements");
	o.setDataVariable('disp-graph-1', 'Level 1',  '#fcff00', -60, 60);
	o.setDataVariable('disp-graph-2', 'Level 2',  '#ff3b3b', -60, 60);
	o.setDataVariable('disp-graph-3', 'Level 3', '#8c42fb', -60, 60);
	o.setAxisLabels('Time (s)', 'Displacement (mm)');
	o.isPulling = false;
	this.widgets.push(o);

    /* Add mimic to page. */
    this.widgets.push(new MimicWidget(this.$container, 'Diagram', ''));

	/* Add camera to page. */
	this.widgets.push(new CameraWidget(this.$container, 'Camera', ''));

	/* Controls. */
	this.widgets.push(new Switch("switch-motor-on", {
	   field: "motor-on", 
	   action: "setMotor",
	   label: "Motor",
	}));
	
	this.widgets.push(new Switch("switch-coils-on", {
	    field: "coils-on",
	    action: "setCoils",
	    label: "Dampening"
	}));
	
	o = new SliderWidget(this.$container, "Motor", "motor", "motor-speed", "setMotor");
	o.setOrientation(true);
	o.setRange(0, 8);
	o.setPrecision(2);
	o.setLabels("Freq", "Hz");
	o.setDimension(167);
	o.setDraggable(true);
	this.widgets.push(o);
	
	this.widgets.push(new DataLogging(this.$container));

	/* Display manager to allow things to be shown / removed. */
	this.display = new DisplayManager(this.$container, 'Display', this.widgets);
	
	/* Error display triggered if error occurs. */
	this.errorDisplay = new GlobalError();
};

/** 
 * Runs the interface. 
 */
ShakeTableControl.prototype.run = function() {
	/* Render the page. */
	this.display.init();

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
function SWidget($container, title, icon)
{
	/** The jQuery object of the container the widget is attached to. */
	this.$container = $container;
	
	/** State manager of this widget. This may be null if no parent widget is 
	 *  directly managing the state of this widget. */
	this.parentManager = undefined;

	/** The page title. */
	this.title = title;

	/** The page icon. */
	this.icon = icon;

	/** The jQuery object of the outermost element of this widget. 
	 *  This is not initialised until the 'init' method has been called. */
	this.$widget = null;
	
	/** Window management properties. */
	this.window = {
	    shown:    undefined, // Whether the widget is being shown
	    width:    undefined, // The width of this window
	    height:   undefined, // The height of this window
	    left:     undefined, // Left position of this window
	    top:      undefined, // Top position of this window
	    zin:      undefined, // Z-Index of this window 
	    shaded:   undefined, // Whether this window is shaded
	    expanded: undefined // Whether this window is expanded
	};
};

/* ----- WIDGET LIFE CYCLE ---------------------------------------------------- */

/** 
 * Adds the widget to the page and sets up any widgets event handlers.
 */
SWidget.prototype.init = function() {
    throw "Widget init not defined.";
};

/** 
 * Method which is provided with data from the server. The data object is the 
 * return from /data operation and is a map of the response keys and objects. 
 * 
 * @param data data object
 */
SWidget.prototype.consume = function(data) { };

/** 
 * Removes the widget from the page and cleans up all registered
 * events handlers. 
 */
SWidget.prototype.destroy = function() {     
    if (this.$widget) this.$widget.remove();
    $(document).unbind("keypress.widget-" + this.id);
};

/* ----- WIDGET EVENT CALLBACKS ----------------------------------------------- */

/**
 * Event callback if an error has occurred and the widget should provide
 * a view that indicates something is amiss. An example of a possible error
 * is an error was received in server data polling.
 */
SWidget.prototype.blur = function() { };

/**
 * Event callback to notify a previous blur can be cleared.
 */
SWidget.prototype.unblur = function() { };

/** 
 * Event callback that is invoked when the widget is resized. This is called 
 * multiple times during resizing should be a speedy operation.
 * 
 * @param width the new widget width
 * @param height the new widget height
 */
SWidget.prototype.resized = function(width, height) { };

/**
 * Event callback that is invoked when the widget has finished resizing. 
 * 
 * @param width the final widget width
 * @param height the final widget height
 */
SWidget.prototype.resizeStopped = function(width, height) { };

/**
 * Event callback that is invoked when the widget has been dragged. 
 * 
 * @param xpos the new x coordinate from its enclosing container
 * @param ypos the new y coordinate from its enclosing container
 */
SWidget.prototype.dragged = function(xpos, ypos) { };

/* ----- WIDGET COMMON BEHAVIOURS AND DISPLAY GENERATION ---------------------- */

/** 
 * Adds a message to the page. 
 * 
 * @param msgId ID of the message
 * @param message the message to display
 * @param type the message type, 'error', 'info', 'backing'
 * @param left left absolute coordinate
 * @param top top absolute coordinate
 * @param pos the arrow position, 'left', 'right', 'right-bottom', 'top-left', 'top-center'
 */
SWidget.prototype.addMessage = function(msgId, message, type, left, top, pos) {
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
SWidget.prototype.removeMessages = function() {
	this.$widget.find(".message-box").remove();
};

/**
 * Generates the common styled widget box.
 * 
 * @param boxId ID of the box
 * @param title the title of the widget
 * @param classes additional classes to add to the box
 * @return jQuery node of the generated box that has been appended to the page
 */
SWidget.prototype.generateBox = function(boxId, classes) {
    var $w = this.$container.append(
      "<div class='window-wrapper " + (classes ? classes : "") + "' id='" + boxId + "'>" +
          "<div class='window-header'>" +
              "<span class='window-icon icon_"+ this.icon + "'></span>" +
              "<span class='window-title'>" + this.title + "</span>" +
              "<span class='window-close ui-icon ui-icon-close'></span>" +
              "<span class='window-shade ui-icon ui-icon-minus'></span>" + 
              "<span class='window-expand ui-icon ui-icon-arrow-4-diag'></span>" +             
          "</div>" +
          "<div class='window-content'>" + 
          	  this.getHTML() +
          "</div>" +
      "</div>"
    ).children().last(), thiz = this;
    
    $w.find(".window-expand").click(function() { thiz.toggleWindowExpand(); });
    $w.find(".window-shade").click(function() { thiz.toggleWindowShade(); });
    $w.find(".window-header").dblclick(function() { thiz.toggleWindowShade(); });
    $w.find(".window-close").click(function() {  
        if   (thiz.parentManager) thiz.parentManager.toggleWidget(thiz.title);
        else thiz.destroy();
    });
    
    $(document).bind("keypress.widget-" + this.id, function(e) {
       switch (e.keyCode) 
       {
           case 27:
               if (thiz.isExpanded) thiz.toggleWindowExpand();
               break;
       }
    });
    
    return $w;
};
/**
 * Shades the widget which hides the widget contents only showing the title.
 *
 * @param shadeCallback runs a callback function after the shade animation has completed
 */
SWidget.prototype.toggleWindowShade = function(shadeCallback) {
	if (shadeCallback && typeof(shadeCallback) === "function") {
	    this.$widget.find(".window-content").slideToggle('fast');
	    this.$widget.find(".window-header").toggleClass("window-header-shade", "slide",function(){
            shadeCallback();
	    });
	    this.$widget.css("width", this.$widget.width());
    }
    else
    {
	    this.$widget.find(".window-content").slideToggle('fast');
	    this.$widget.find(".window-header").toggleClass("window-header-shade", "slide");
        this.$widget.css("width", this.$widget.width());
    }

    if (this.window.shaded != true)
    {
    	this.$widget.css("height", 'auto');
    	
    	/* Changing shaded icon */
        this.$widget.find(".window-shade").toggleClass('ui-icon-minus ui-icon-triangle-1-s');

        /* Disable resizing when shaded */
        this.$widget.find('.ui-resizable-handle').css('display', 'none');
    }
    else
    {
    	/* Changing shaded icon */
        this.$widget.find(".window-shade").toggleClass('ui-icon-minus ui-icon-triangle-1-s');

        /* Enable resizing */
        this.$widget.find('.ui-resizable-handle').css('display', 'block');
    }

    this.window.shaded = !this.window.shaded;
    this.storeState();
};

/** The expanded width of an expanded, resizable widget. */
SWidget.EXPANDED_WIDTH = 800;

/** The maximum expanded height of an expanded, resizable widget. */
SWidget.MAX_EXPANDED_HEIGHT = 500;

/**
 * Toggles the window expand state which makes the widget take a prominent 
 * position on the interface. 
 */
SWidget.prototype.toggleWindowExpand = function() {
    var thiz = this;
    /* Prevents expanding of a shaded widget */
    if (this.window.shaded === true) {
        this.toggleWindowShade(function() {
            thiz.toggleWindowExpand();
        });
    }
    else
    {
        if (this.window.expanded)
        {
            if (this.$widget.hasClass("ui-resizable"))
            {
                this.$widget.width(this.window.width);
                this.$widget.height(this.window.height);
                this.resized(this.window.width, this.window.height);
                this.resizeStopped(this.window.width, this.window.height);
            }

            /* Moving the widget back to its original position. */
            this.$widget.css({
                left: this.window.left,
                top:  this.window.top,
                zIndex: this.window.zin
            });	

            /* Changing expanded icon */
            this.$widget.find(".window-expand").toggleClass('ui-icon-arrow-4-diag ui-icon-newwin'); 
        }
        else
        {
            var width = this.window.width = this.$widget.width(),
                height = this.window.height = this.$widget.height(),
                p = this.$widget.position(),
                zin = this.window.zin = this.$widget.zIndex();

            this.window.left = p.left;
            this.window.top = p.top;

            if (this.$widget.hasClass("ui-resizable"))
            {
                /* We can resize the widget so we will make it larger. */
                height = SWidget.EXPANDED_WIDTH / width * height;
                width = SWidget.EXPANDED_WIDTH;

                /* If the height is larger than the width, we want to scale the 
                * widget so it first better. */
                if (height > SWidget.MAX_EXPANDED_HEIGHT)
                {
                    height = SWidget.MAX_EXPANDED_HEIGHT;
                    width = SWidget.MAX_EXPANDED_HEIGHT / this.window.height * this.window.width;
                }

                this.$widget.width(width);
                this.$widget.height(height);
                this.resized(width, height);
                this.resizeStopped(width, height);
            }

            /* We want the expanded widget to have the highest z-Index. */
            this.$container.find(".window-wrapper").each(function(i) {if ($(this).zIndex() > zin) zin = $(this).zIndex(); });

            /* Move the widget to a central position. */
            this.$widget.css({
                left: this.$container.width() / 2 - width / 2 - 60,
                top: 100,
                zIndex: zin + 100
            });

            /* Changing expanded icon */
            this.$widget.find(".window-expand").toggleClass('ui-icon-arrow-4-diag ui-icon-newwin');
        }

        this.$widget.toggleClass("window-expanded");
        this.window.expanded = !this.window.expanded;
        this.storeState();
    }
};

/**
 * Generates the HTML content for the widget box.
 */
SWidget.prototype.getHTML = function() {	};

/** Whether the z-index fix has been applied. */
SWidget.hasZIndexFix = false;

/**
 * Enables this widget to be draggable.
 */
SWidget.prototype.enableDraggable = function() {
		
    /* Adds the CSS for the draggable widgets */
    this.$widget.addClass('draggable');
    this.$widget.find('.window-header').addClass('draggable-header');
   
    if (this.window.left && this.window.top && this.window.zin) 
    {
        /* We have stored previously, dragged state so we will restore it. */
        this.$widget
                .css({
                    left: this.window.left, 
                    top: this.window.top,
                    zIndex: this.window.zin
                });
        this.dragged(this.window.left, this.window.top);
    }
    
	/* Enables dragging on the widgets 'window-wrapper' class */
    var thiz = this;
	this.$widget.draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.window-wrapper, .tab-wrapper',
        increaseZindexOnmousedown: true,
        distance: 10,
        handle: '.draggable-header',
        stop: function() {
            var p = $(this).position();
        	thiz.window.left = p.left;
        	thiz.window.top = p.top;
        	thiz.window.zin = $(this).zIndex();
        	thiz.storeState();
        	
        	/* Invoke event handler. */
        	thiz.dragged(p.left, p.top);
        }
    });

	if (!SWidget.hasZIndexFix)
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
	    
	    SWidget.hasZIndexFix = true;
	}
};

/**
 * Enables this widget to be resizable. 
 * 
 * @param minWidth the minimum width the widget can be resized to (optional)
 * @param minHeight the minimum height the widget can be resized to (optional)
 * @param preserveAspectRatio whether to preserve the widgets aspect ratio, default to not preserve 
 */
SWidget.prototype.enableResizable = function(minWidth, minHeight, preserveAspectRatio) {
    var thiz = this;
	this.$widget.resizable({
         minWidth: minWidth,
         minHeight: minHeight,
         aspectRatio: preserveAspectRatio,
         distance: 10,
         resize: function(e, ui) { thiz.resized(ui.size.width, ui.size.height); },
	     stop: function(e, ui) {
	         /* Store sizing information. */
	         thiz.window.width = ui.size.width;
	         thiz.window.height = ui.size.height;
	         thiz.storeState();
	         
	         /* Fire event. */
	         thiz.resizeStopped(ui.size.width, ui.size.height); 
	     }
	});
	
	if (this.window.width && this.window.height)
	{
	    this.$widget.css({
	        width: this.window.width,
	        height: this.window.height
	    });
	    
	    this.resized(this.window.width, this.window.height);
	    this.resizeStopped(this.window.width, this.window.height);
	}
};

/** 
 * Posts data to the server.
 * 
 * @param action the name of the action called from the Rig Client
 * @param params data object of POST variables
 * @param responseCallback function to be invoked with the response of POST
 * @param errorCallback function to be invoked if an error occurs
 */
SWidget.prototype.postControl = function(action, params, responseCallback, errorCallback) {
    $.ajax({
        url: "/primitive/mapjson/pc/" + Globals.RC_CONTROLLER + "/pa/" + action,
        data: params,
        success: function(data) {
            if (responseCallback != null) responseCallback(data);
        },
        error: function(data) {
            if (errorCallabck != null) errorCallback(data);
        }
    });
};

/**
 * Stores the state of this widget in a cookie.
 */
SWidget.prototype.storeState = function() {
    var json;
    
    if (JSON.stringify)
    {
        /* Built JSON serialization. */
        json = JSON.stringify(this.window);
    }
    else
    {
        /* Legacy browser, no built in JSON. */
        var i = 0;
        json = "{";
        for (i in this.window) if (typeof this.window[i] != "undefined") json += '"' + i + '":' + this.window[i] + ",";
        json = json.substring(0, json.length - 1);
        json += "}";
    }
    
    setCookie(this.id + '-win', json);
};

/**
 * Loads the stored state from a store cookie.
 */
SWidget.prototype.loadState = function() {
    var state = getCookie(this.id + '-win');
    
    if (state && state.match(/^{.*}$/))
    {
        try
        {
            this.window = $.parseJSON(state);
        }
        catch (e) { /* Invalid JSON, not restoring layout. */ alert(e); }
    }
};

/* ============================================================================
 * == Display Manager.                                                       ==
 * ============================================================================ */

/**
 * Controls which widgets are active a which point.
 */
function DisplayManager($container, title, widgets) 
{	
    SWidget.call(this, $container, title, 'toggle');

    /** Identifier of the display manager box. */
    this.id = 'display-manager';

    /** Widgets that are toggle able by this widget. */
    this.widgets = widgets;
    
    /** The states of each of the widgets. */
    this.states = [ ];
    
    /** Whether the displayed in is blurred state. */
    this.isBlurred = false;
}
DisplayManager.prototype = new SWidget;

DisplayManager.prototype.init = function() {
    var thiz = this, i = 0;
    
    /* Enable all the other widgets. */
    for (i in this.widgets) 
    {    	
        this.widgets[i].parentManager = this; 
        if (this.widgets[i]._loadState) this.widgets[i]._loadState();
        else this.widgets[i].loadState();
    
        if (this.widgets[i].window.shown = this.states[i] = !(this.widgets[i].window.shown === false))
        {
            this.widgets[i].init(this.$container);
            
            /* Restore other states. */
            if (this.widgets[i].window.expanded)
            {
                this.widgets[i].window.expanded = false;
                this.widgets[i].toggleWindowExpand();
            }
            
            if (this.widgets[i].window.shaded)
            {
                this.widgets[i].window.shaded = false;
                this.widgets[i].toggleWindowShade();
            }
        }
    }

    /* Generate our UI. */
	this.$widget = this.generateBox('display-manager');
    this.$widget.find(".window-close").hide();

	/* Enable dragging. */
	this.enableDraggable();

    /* Shade the display manager if shaded cookie is undefined */
    if (this.window.shaded === undefined) this.toggleWindowShade();

    this.$widget.find('.toggle').click(function() {    
    	thiz.toggleWidget($(this).find("span").html(), this);
    });
    
    this.$widget.find('.reset-button').click(function() {    
	    var i = 0;
	    for (i in thiz.widgets)
	    {
            if (thiz.widgets[i].window.shown === false)
            {
	            thiz.widgets[i].parentManager.toggleWidget(thiz.widgets[i].title);
	        }
	        
            delete thiz.widgets[i].boxHeight;
            thiz.widgets[i].window = { };
            thiz.widgets[i].storeState();
            thiz.widgets[i].destroy();
            thiz.widgets[i].init();
	    }
	    
	    thiz.$widget.find(".button .animated")
            .removeClass("off")
            .addClass("on");
            
        thiz.$widget.css({
            'top': 155,
            'left': -194
        });

        thiz.toggleWindowShade();
    });
    
    if (this.window.shaded === undefined) this.toggleWindowShade();
};

DisplayManager.prototype.getHTML = function() {	
	var i = 0, html =
		'<div class="buttonwrapper">';
	
	for (i in this.widgets)
	{
		/* We should be adding this to be widgets that can be removed. */
		if (this.widgets[i] == this) continue;

		html += '<div class="button toggle">' +
					(this.icon != undefined ? '<div class="window-icon icon_' + this.widgets[i].icon + '"></div>' : '') +  
					'<span class="display-manager-title">' + this.widgets[i].title + '</span>' +
        			'<div class="switch">' +
        				'<div class="animated slide ' + (this.widgets[i].window.shown === false? "off" : "on") + '"></div>' +
        			'</div>' +
        		'</div>';
	}

    html += '<div class="button reset-button">Reset</div>' +
        '</div>';

	return html;
};

/**
 * Toggles a widget from either displaying or being invisible. 
 * 
 * @param title the title of the widget to toggle
 * @param node switch node to toggle classes (optional)
 */
SWidget.prototype.toggleWidget = function(title, node) {
	var i = 0;

	for (i in this.widgets)
	{
		if (this.widgets[i].title == title)
		{
			if (this.states[i])
			{
				this.widgets[i].destroy();
		    }
			else 
			{
				this.widgets[i].init();
				if (this.isBlurred) this.widgets[i].blur();
			}
			
			this.widgets[i].window.shown = this.states[i] = !this.states[i];
			this.widgets[i].storeState();
		}
	}
	
	$node = node ? $(node) : this.$widget.find(".button:has(span:contains(" + title + "))");
	$node.find('.switch .slide').toggleClass("on off");
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
 * == Data Logging                                                           ==
 * ============================================================================ */

/**
 * The data logging widget allows the enabling and disabling of data logging
 * and selection of data files to download.
 * 
 * @param $container the container to add this widget to
 */
function DataLogging($container)
{
    SWidget.call(this, $container, 'Data', 'datafiles');
    
    /** @type {string} Widget box ID. */
    this.id = 'data-logging';
    
    /** @type {boolean} Whether a log is currently running. */
    this.isLogging = undefined;
    
    /** @type {boolean} Whether a control action has been requested. */
    this.isControlled = false;
    
    /** @type {int} The duration of the current log file. */
    this.duration = undefined;
    
    /** @type {object} The list of files that have been logged. */
    this.files = undefined;

    /** @type {int} Number of files. */
    this.fileCount = 0;
    
    /** @type {object} The current file being logged to. */
    this.currentFile = undefined;
    
    /** @type {int} The timeout handle for session file polling. */
    this.filePollHandle = null;
}
DataLogging.prototype = new SWidget;

DataLogging.prototype.init = function() {
    /* Clear to force UI redraw. */
    this.files = this.isLogging = this.duration = undefined;
    this.isControlled = false;
    this.fileCount = 0;

    /* Draw UI. */
    this.$widget = this.generateBox(this.id);

	/* Enable dragging. */
	this.enableDraggable();

    /* Enable resizing */
    this.enableResizable(185, 100);

    var thiz = this;

    /* Event handlers. */
    this.$widget.find("#data-enable").click(function() { thiz.toggleLogging(); });
    
    /* Check we can download files. */
    setTimeout(function() { thiz.pollSessionFiles(); }, 2000);
};

DataLogging.prototype.getHTML = function() {
    return (
        "<div id='data-controls'>" +
        "   <div id='data-enable-line' class='data-control-line data-logger-blur'>" + 
        "       <label for='data-enable'>Logging: </label>" +  
        "       <div id='data-enable' class='switch'>" +
        "           <div class='animated slide'></div>" +
        "       </div>" +
        "       <div id='data-duration'></div>" +
        "       <div style='clear:both'></div>" +
        "   </div>" + 
        "   <div id='data-format-line' class='data-control-line data-logger-blur'>" +
        "       <label for='data-format'>Format: </label>" +  
        "       <div id='data-format-outer'>" +
        "          <select id='data-format'>" +
        "               <option value='CSV'>CSV</option>" +
        "               <option value='XLSX'>XLSX</option>" +
        "               <option value='XLS'>XLS</option>" +
        "          </select>" +
        "       </div>" +
        "      <div style='clear:both'></div>" +
        "   </div>" +
        "</div>" +
       
        "<div id='data-files'>" +
        "   <div id='data-list-placeholder'>" +
        "       Please wait..." +
        "   </div>" +
        "</div>"
    );
};

/**
 * Toggle between logging and not logging.
 */
DataLogging.prototype.toggleLogging = function() {
    /* We do not currently have a consistent state with the server so we will
     * stop any changes until the state is consistent. */
    if (this.isLogging === undefined) return;
    
    var thiz = this;
    this.isControlled = true;
    this.postControl(
        "logging", 
        {
            enable: !this.isLogging,
            format: this.$widget.find("#data-format :selected").val()
        }, 
        function(data) { thiz.isControlled = false; thiz.consume(data); }
    );
    
    if (this.currentFile) this.currentFile.isLogging = false;
    this.isLogging = !this.isLogging;
    this.$widget.find("#data-enable div").toggleClass("on");
};

DataLogging.prototype.consume = function(data) {
    if (typeof data['is-logging'] != "undefined" && data['is-logging'] !== this.isLogging && !this.controlled)
    {
        if (this.isLogging === undefined) 
        {
            /* Clear first load state. */
            this.$widget.find("#data-controls .data-logger-blur").removeClass("data-logger-blur");
        }
        
        if (this.isLogging = data['is-logging'])
        {
            this.$widget.find("#data-enable div").addClass("on");
            
        }
        else
        {
            this.$widget.find("#data-enable div").removeClass("on");
            
            if (this.currentFile)
            {
                this.currentFile.isLogging = false;
                this.currentFile = null;
            }
        }
    }
    
    if (typeof data['log-duration'] != "undefined" && data['log-duration'] != this.duration)
    {
        this.duration = data['log-duration'];
        this.$widget.find("#data-duration").html(this.duration > 0 ? this.duration + "s" : "");
    }
    
    if (typeof data['log-files'] != "undefined" && $.isArray(data['log-files']))
    {
        if (this.files === undefined)
        {
            /* First load. */
            if (data['log-files'].length == 0 ||
                    (data['log-files'].length == 1 && data['log-files'][0] == "")) // Crap, but error in JSON generation server side 
            {
                this.$widget.find("#data-list-placeholder").html("No files.");
            }

            this.files = { };
        }
                
        var i = 0, files = data['log-files'], f;
        
        /* Files may have some leading and trailing whitespace which may interfere with
         * sorting, so this is being removed. */
        for (i in files) files[i] = trim(files[i]);
        
        /* The files are named with a timestamp in the format YYYYMMDD_hhmmss.<format>
         * so a direct lexographical sort will correctly sort the files from earliest 
         * to latest. */
        files.sort();
        
        for (i in files)
        {
            if ((f = files[i]) != "" && typeof this.files[f] == "undefined")
            {
                if (this.files)
                
                this.files[f] = {
                    name: f,
                    time: f.substring(f.indexOf('_') + 1, f.indexOf('.')),
                    format: f.substring(f.indexOf('.') + 1).toUpperCase(),
                    path: undefined,
                    isLogging: this.isLogging && i == files.length - 1 
                };
                
                if (this.files[f].isLogging) 
                {
                    this.currentFile = this.files[f];
                    
                    if (this.files[f].format != this.$widget.find("#data-format :selected").val())
                    {
                        /* Update the UI to reflect to current logging format. */
                        this.$widget.find("#data-format :selected").removeAttr("selected");
                        this.$widget.find("#data-format option[value='" + this.files[f].format + "']")
                                .attr("selected", "selected");
                    }
                }

                this.files[f].hour = this.files[f].time.substring(0, 2);
                this.files[f].min = this.files[f].time.substring(2, 4);
                this.files[f].sec = this.files[f].time.substring(4);
                
                if (this.fileCount++ == 0) this.$widget.find("#data-files").html("<ul id='data-files-list'></ul>");
                this.$widget.find("#data-files-list").prepend(
                        "<li id='file-" + this.files[f].time + "'>" + 
                            "<a href='#'>" +
                                "<span class='data-icon data-icon-" + this.files[f].format + "'></span>" +
                                "From: " + this.files[f].hour + ":" + this.files[f].min + ":" + this.files[f].sec +
                            "</a>" +
                        "</li>");
                this.resized(this.$widget.width(), this.$widget.height());
            }
        }
    }
};

DataLogging.prototype.resized = function(width, height) {
    this.$widget.children(".window-content")
        .css("height", height - 53)
        .children($("#data-files-list").css("height", height - 120));
    
    this.$widget.css("height", "auto");
};

/**
 * Polls the files in the users home directory.
 */
DataLogging.prototype.pollSessionFiles = function() {
    var thiz = this;
    $.get(
        "/home/listsession",
        null,
        function(resp) {
            thiz.checkDownloadable(resp);
            setTimeout(function() { thiz.pollSessionFiles(); }, 30000);
        }
    );
};

/**
 * Checks whether we can download a file. To be able to download a file, the  
 * file must be no longer being logged to and it must be listed in the users
 * home directory contents.
 * 
 * @param {object} sessionFiles list of session files
 */
DataLogging.prototype.checkDownloadable = function(sessionFiles) {
    if (!this.files) return;
    
    var f = 0;
    for (f in sessionFiles) 
    {
        if (this.files[f] && !this.files[f].path && !this.files[f].isLogging)
        {
            /* File is avaliable for download, so the download can be made active. */
            this.files[f].path = sessionFiles[f];
            this.$widget.find("#file-" + this.files[f].time)
                .addClass("data-file-downloadable")
                .children("a")
                    .attr("href", "/home/download" + this.files[f].path);
        }
    }
};

DataLogging.prototype.destroy = function() {
    SWidget.prototype.destroy.call(this);
    
    if (this.filePollHandle)
    {
        clearTimeout(this.filePollHandle);
        this.filePollHandle = null;
    }
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
	SWidget.call(this, $container, title, 'graph');

	/** ID of canvas. */
	this.id = "graph-" + title.toLowerCase().replace(' ', '-');
	
	/** The box width. The box is the outmost container of the widget. */
	this.boxWidth = undefined;
	
	/** The box height. */
	this.boxHeight = undefined;
	
	/** Width of the graph, including the padding whitespace but excluding the
	 *  border width. */
	this.width = 580;

	/** Height of the graph, including the padding whitespace but excluding the
	 *  border width and border title. */
	this.height = 300;

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
	this.duration = 60;

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
GraphWidget.prototype = new SWidget;

GraphWidget.prototype.init = function() {
    /* Size reset. */
    this.width = 580;
    this.height = 300;
    
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
	this.enableResizable(484, 300);
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
	html += "<div class='graph-axis-label graph-left-axis-label' style='top:40%'>" + this.axis.y + "</div>";

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
            "          <div class='animated slide " + (this.isAutoscaling ? "on" : "off") + "'></div>" +
            "       </div>" +
            "   </div>" +
	        "</div>";

	return html;
};

GraphWidget.prototype.consume = function(data) { 
    this.updateData(data);
};

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
		off = this.height - Math.abs(this.graphOffset * this.height);

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.strokeStyle = "#FFFFFF";
	
	/* Zero line. */
	this.ctx.lineWidth = 3;
	if (off > 0 && off < this.height)
	{
	    this.ctx.moveTo(0, off + 1.5);
	    this.ctx.lineTo(this.width, off + 1.5);
	}
	
	this.ctx.lineWidth = 0.3;

	for (i = 0; i < this.height; i += this.height / GraphWidget.NUM_VERT_SCALES)
	{
		for (j = 0; j < this.width; j += GraphWidget.STIPPLE_WIDTH * 1.5)
		{
			this.ctx.moveTo(j, i + 0.25);
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
    var i, $s = this.$widget.find(".graph-left-scale-0");
    
    for (i = 0; i <= GraphWidget.NUM_VERT_SCALES; i++)
    {
        $s.html(zeroPad(
                this.graphRange + this.graphOffset * this.graphRange - this.graphRange / GraphWidget.NUM_VERT_SCALES * i, 
                this.graphRange >= GraphWidget.NUM_VERT_SCALES * 2 ? 0 : 1));
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
    SWidget.call(this, $container, title, icon);
    
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
    
    /** Whether the slider is draggable. */
    this.isDraggable = false;
    
    /** Whether the slider is resizable. */
    this.isResizable = false;
    
    /** Precision of label. */
    this.precision = 1;
    
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
SliderWidget.prototype = new SWidget;

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
    
    if (this.isDraggable) this.enableDraggable();
    if (this.isResizable) this.enableResizable();
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
    this.$input.val(zeroPad(this.val, this.precision));
    
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
    this.$input.val(zeroPad(this.val, this.precision));
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
    var numScales =  this.max - this.min > 10 ? SliderWidget.NUM_SCALES : this.max - this.min,
        i, s = (Math.floor((this.max - this.min) / numScales)),
        html = 
        "<div class='slider-outer' style='" + (this.isVertical ? "height" : "width") + ":" + this.dimension + "px'>";
            
    /* Slider scale. */
    html += "<div class='slider-scales slider-scales-" + (this.isVertical ? "vertical" : "horizontal") + "'>";
    for (i = 0; i <= numScales; i++)
    {
        html += "<div class='slider-scale' style='" + (this.isVertical ? "top" : "left") + ":" + 
                        (this.dimension / numScales * i) + "px'>" +
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
        this.$input.val(zeroPad(this.val, this.precision));
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

/** Sets the precision of the text input of the slider.
 * 
 * @param precision number digits after decimal point
 */
SliderWidget.prototype.setPrecision = function(precision) {
    this.precision = precision;
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

/**
 * Sets whether the slider is draggable.
 * 
 * @param draggable true if draggable
 */
SliderWidget.prototype.setDraggable = function(draggable) {
    this.isDraggable = draggable;
};

/**
 * Sets whether the slider is resizable. 
 * 
 * @param resizable true if resizable
 */
SliderWidget.prototype.setResizable = function(resizable) {
    this.isResizable = resizable;
};

/* ============================================================================
 * == Mimic Widget.                                                          ==
 * ============================================================================ */

/**
 * Mimic SWidget. This widget creates and controls the Shake Table Mimic.
 *
 * @param $container the container to append the mimic to
 * @param title the mimic title
 */
function MimicWidget($container, title)
{
    SWidget.call(this, $container, title, 'mimic');

    /** {String} The identifier of the Mimic. */
    this.id = 'mimic';
    
    /** Whether this mimic represents a 2DOF or a 3DOF widget. */
    this.is3DOF = true;
    
    /** Number of levels in the model. */
    this.numberLevels = this.is3DOF ? 4 : 3;

    /** The width of the diagram in pixels. */
    this.width = undefined;

    /** The height of the diagram in pixels. */
    this.height = undefined;
    
    /** The box width. */
    this.boxWidth = undefined;

	/** Millimeters per pixel. */
    this.mmPerPx = 1.475;

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
    
    /** Animation interval. */
    this.animateInterval = undefined;
}
MimicWidget.prototype = new SWidget;


MimicWidget.ANIMATE_PERIOD = 50;

MimicWidget.prototype.init = function() {
    var canvas, thiz = this;
    
    /* The width of the canvas diagram is the width of the building model plus 
     * the maximum possible displacement. */
    this.width = this.px(this.model.levelWidth + this.model.maxDisp * 2) + this.px(100);
    this.cx = this.width / 2;
    
    /* The height is the height of building model. */
    this.height = this.px(this.model.levelHeight * (this.is3DOF ? 4 : 3) + 
            this.model.wallHeight * (this.is3DOF ? 3: 2) + this.model.trackHeight + this.model.carHeight);
    
    /* Box. */
    this.$widget = this.generateBox(this.id + '-box');
    
    /* Canvas to draw display. */
    canvas = getCanvas(this.id, this.width, this.height);
    this.$widget.find("#" + this.id).append(canvas);
    this.ctx = canvas.getContext("2d");
    this.ctx.translate(0.5, 0.5);

    /* Draw inital frame of zero position. */
    this.drawFrame([0, 0, 0, 0]);
    
    this.boxWidth = this.$widget.width();
   
    /* Start animation. */
    this.animateInterval = setInterval(function() { thiz.animationFrame(); }, MimicWidget.ANIMATE_PERIOD);

    this.enableDraggable();
    this.enableResizable(this.width / 2, this.height / 2, true);
};

MimicWidget.prototype.getHTML = function() {
    /* Canvas Element. */
    var html = "<div class='mimic'>" +
    "               <div id='mimic'></div>" +
    "            </div>";

    return html;
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
    
    SWidget.prototype.destroy.call(this);
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
 * @param suf data attribute suffix to load this cameras information
 */
function CameraWidget($container, title, suf) 
{
    SWidget.call(this, $container, title, 'video');
    
	/** Identifier of the camera box. */
	this.id = title.toLowerCase().replace(' ', '-');

	/** The list of address for the each of the camera formats. */
	this.urls = {
		swf:   undefined, // Flash format
		mjpeg: undefined  // MJPEG format
	};  
	
	/** The camera format data suffix. */
	this.suf = suf;
	
	/** Whether the camera is deployed. */
	this.isDeployed = false;
	
	/** Current format. */
	this.currentFormat = undefined;
	
	/** Width of the video. */
	this.videoWidth = 320;
	
	/** Height of the video. */
	this.videoHeight = 240;
	
	/** SWF timer. */
	this.swfTimer = undefined;
};
CameraWidget.prototype = new SWidget;

/** Cookie which stores the users chosen camera format. */
CameraWidget.SELECTED_FORMAT_COOKIE = "camera-format";

CameraWidget.prototype.init = function() {
	var thiz = this;
	
    /* Reset. */
    this.isDeployed = false;
    this.videoWidth = 320;
    this.videoHeight = 240;
    
	this.$widget = this.generateBox('camera-coupled-tanks');

	/* Enable dragging. */
	this.enableDraggable();

	this.$widget.find('.format-select').find('select').change(function() {
	    thiz.undeploy();
        thiz.deploy($(this).val());
    });
	
	/* Loads Metro help window */
	this.$widget.find(".metro-check").click(function() {
	    $('.metro-container').fadeToggle();
	});
	
	this.enableResizable(185.5, 175, true);
	
	/* Restore current format after reinit. */
	if (this.currentFormat) this.deploy(this.currentFormat);
};

CameraWidget.prototype.consume = function(data) {
    /* Camera streams don't change. */
    if (this.urls.mjpeg && this.urls.swf) return;
    
    if (data['camera-swf' + this.suf] != undefined)
    {
        this.urls.swf = decodeURIComponent(data['camera-swf']);
    }
    
    if (data['camera-mjpeg' + this.suf] != undefined)
    {
        this.urls.mjpeg = decodeURIComponent(data['camera-mjpeg']);
    }
    
    if (this.urls.swf || this.urls.mjpeg) 
    {
        this.restoreDeploy();
    }
};

/**
 * Restores a stored user chosen format choice, otherwise uses platform deploy
 * to load the most appropriate choice. 
 */
CameraWidget.prototype.restoreDeploy = function() {
    var storedChoice = getCookie(CameraWidget.SELECTED_FORMAT_COOKIE);
    
    if (storedChoice && this.urls[storedChoice])
    {
        this.deploy(storedChoice);
    }
    else
    {
        this.platformDeploy();
    }
};

/**
 * Deploys a format most appropriate to the platform.
 */
CameraWidget.prototype.platformDeploy = function() {
    this.deploy(/Mobile|mobi|Android|android/i.test(navigator.userAgent) ? 'mjpeg' : 'swf');  
};

/**
 * Deploys the specified camera format. 
 * 
 * @param format format to deploy
 */
CameraWidget.prototype.deploy = function(format) {
    var html;
    
    switch (format)
    {
    case 'swf':
        html = this.getSwfHtml();
        break;
        
    case 'mjpeg':
        html = this.getMjpegHtml();
        break;
        
    default:
        this.platformDeploy();
        return;
    }
    
    this.isDeployed = true;
    this.$widget.find(".video-player").html(html);
    this.$widget.find("#video-player-select").children(":selected").removeAttr("selected");
    this.$widget.find("#video-player-select > option[value='" + format + "']").attr("selected", "selected");
    setCookie(CameraWidget.SELECTED_FORMAT_COOKIE, this.currentFormat = format);
    
    if (this.currentFormat == 'swf')
    {
        var thiz = this;
        this.swfTimer = setTimeout(function() {
            if (thiz.currentFormat == 'swf') thiz.deploy(thiz.currentFormat);
        }, 360000);
    }
};

CameraWidget.prototype.undeploy = function() {
    if (this.currentFormat == 'mjpeg')
    {
        /* Reports in the wild indicate Firefox may continue to the download 
         * the stream unless the source attribute is cleared. */
        this.$widget.find(".video-player > img").attr("src", "#");
    }

    this.$widget.find(".video-player").empty();
    
    if (this.swfTimer)
    {
        clearTimeout(this.swfTimer);
        this.swfTimer = undefined;
    }
    
    this.isDeployed = false;
};

CameraWidget.prototype.getHTML = function() {
	return (
		'<div class="video-player" style="height:' + this.videoHeight + 'px;width:' + this.videoWidth + 'px">' +
		    '<div class="video-placeholder">Please wait...</div>' +
		'</div>' +
		'<div class="metro-container">' +
		    'Please click the settings icon found at the bottom right corner of your browser window.' + 
		    '<p>(This menu can be accessed by right clicking in the browser window).</p>' +
		    '<div class="metro-image metro-image-settings"></div>' +
		    '<br /><br />Then select the "View on the desktop" option.' +
		    '<div class="metro-image metro-image-desktop"></div>' +
		'</div>' +
		($.browser.msie && $.browser.version >= 10 && !window.screenTop && !window.screenY ? 
		    '<div class="metro-check">' +
                '<img class="metro-icon" src="/uts/coupledtanksnew/images/ie10-icon.png" alt="Using Metro?" />' +
                'Using Metro?' +
            '</div>' : '' ) +
	    '<div class="format-select">' +   
            '<select id="video-player-select" class="gradient">' +
	            '<option selected="selected" value=" ">Select Format</option>' +
                '<option value="swf">SWF</option>' +
                '<option value="mjpeg">M-JPEG</option>' +
            '</select>' +
        '</div>'
	);
};

/**
 * Gets the HTML to deploy a SWF stream format. 
 */
CameraWidget.prototype.getSwfHtml = function() {
	return (!$.browser.msie ? // Firefox, Chrome, ...
			'<object type="application/x-shockwave-flash" data="' + this.urls.swf + '" ' +
	 				'width="' +  this.videoWidth  + '" height="' + this.videoHeight + '">' +
		        '<param name="movie" value="' + 'this.urls.swf' + '"/>' +
		        '<param name="wmode" value="opaque" />' +
		        '<div class="no-flash-container">' +
                    '<div class="no-flash-button">' +
		                '<a href="http://www.adobe.com/go/getflash">' +
		        	        '<img class="no-flash-image" src="/uts/coupledtanksnew/images/flash-icon.png"' +
		        			    'alt="Get Adobe Flash player"/>' +
		        			'<span class="no-flash-button-text">Video requires Adobe Flash Player</span>' +
		                '</a>' +
                    '</div>' +
                    '<p class="no-flash-substring">If you do not wish to install Adobe flash player ' +
                        'you can try another video format using the drop down box below.</p>' +
		        '</div>' +
		    '</object>'
		:                  // Internet Explorer
			'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"  width="' + this.videoWidth + 
			        '" height="' + this.videoHeight + '"  id="camera-swf-movie">' +
				'<param name="movie" value="' + this.urls.swf + '" />' +
				'<param name="wmode" value="opaque" />' +
		        '<div class="no-flash-container">' +
                    '<div class="no-flash-button">' +
		                '<a href="http://www.adobe.com/go/getflash">' +
		        	        '<img class="no-flash-image" src="/uts/coupledtanksnew/images/flash-icon.png"' +
		        			    'alt="Get Adobe Flash player"/>' +
		        			'<span class="no-flash-button-text">Video requires Adobe Flash Player</span>' +
		                '</a>' +
                    '</div>' +
                    '<p class="no-flash-substring">If you do not wish to install Adobe flash player ' +
                        'you can try another video format using the drop down box below.</p>' +
		        '</div>' +
			'</object>'
		);
};

/**
 * Gets the HTML to deploy a MJPEG stream.
 */
CameraWidget.prototype.getMjpegHtml = function() {
	return (!$.browser.msie ? // Firefox, Chrome, ...
			 '<img style="width:' + this.videoWidth + 'px;height:' + this.videoHeight + 'px" ' +
						'src="' + this.urls.mjpeg + '?' + new Date().getTime() + ' alt="&nbsp;" />'
		 :                 // Internet Explorer
			 '<applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" ' + 
					'width="' + this.videoWidth + '" height="' + this.videoHeight + '">' +
				'<param name="url" value="' + this.urls.mjpeg + '"/>' +
				'<param name="accessories" value="none"/>' +
			'</applet>'
        );
};

/** Difference between widget width and video width. */
CameraWidget.VID_WIDTH_DIFF = 8;

/** Difference between widget height and video height. */
CameraWidget.VID_HEIGHT_DIFF = 72;

CameraWidget.prototype.resized = function(width, height) {
    if (this.isDeployed) this.undeploy();
    
    this.$widget.find(".video-player").css({
       width: width - CameraWidget.VID_WIDTH_DIFF,
       height: height - CameraWidget.VID_HEIGHT_DIFF
    });
    this.$widget.css("padding-bottom","0.8%");
};

CameraWidget.prototype.resizeStopped = function(width, height) {
    this.videoWidth = width - CameraWidget.VID_WIDTH_DIFF;
    this.videoHeight = height - CameraWidget.VID_HEIGHT_DIFF;
    
    this.deploy(this.currentFormat);
};

CameraWidget.prototype.destroy = function() {
    this.undeploy();
    SWidget.prototype.destroy.call(this);
};

/**
 * Shades the Camera widget which hides the widget contents only showing the title.
 *
 * @param shadeCallback runs a callback function after the shade animation has completed
 */
CameraWidget.prototype.toggleWindowShade = function(shadeCallback) {
	if (shadeCallback && typeof(shadeCallback) === "function") {
	    this.$widget.find(".window-content").slideToggle('fast');
	    this.$widget.find(".window-header").toggleClass("window-header-shade", "slide",function(){
            shadeCallback();
	    });
	    this.$widget.css("width", this.$widget.width());
    }
    else
    {
	    this.$widget.find(".window-content").slideToggle('fast');
        this.$widget.css("width", this.$widget.width());

        /* Changing shaded icon */
	    this.$widget.find(".window-header").toggleClass("window-header-shade", "slide");
    }
    this.window.shaded = !this.window.shaded;
    this.storeState();
    
    if (this.window.shaded === true)
    {
    	this.$widget.css("height", 'auto');
        
        /* Changing shaded icon */
        this.$widget.find(".window-shade").toggleClass('ui-icon-minus ui-icon-triangle-1-s');
        
        /* Disable resizing when shaded */
        this.$widget.find('.ui-resizable-handle').css('display', 'none');
    }
    else
    {
        /* Changing shaded icon */
        this.$widget.find(".window-shade").toggleClass('ui-icon-minus ui-icon-triangle-1-s');

        /* Enable resizing */
        this.$widget.find('.ui-resizable-handle').css('display', 'block');
    }
};

/* ============================================================================
 * == Utility functions                                                      ==
 * ============================================================================ */

/**
 * Gets the value of the specified cookie. 
 * 
 * @param {String} cookie the cookie to find the value of
 * @return {mixed} cookies value or false if not found
 */
function getCookie(cookie)
{
    /* All cookies for the Coupled Tanks are prefixed. This is to differenate 
     * with rig interfaces that may have the same identifiers but different layouts. */
    cookie = Globals.COOKIE_PREFIX + cookie;
    
    var pos = document.cookie.indexOf(cookie), end = document.cookie.indexOf(';', pos + 1);
    if (end < 0) end = document.cookie.length;
    return pos >= 0 ? document.cookie.substring(pos + cookie.length + 1, end) : false;
}

/**
 * Sets a cookie for the Coupled Tanks interface.
 * 
 * @param {String} cookie name of cookie to set
 * @param {String} value value of cookie to set
 */
function setCookie(cookie, value)
{
    document.cookie = Globals.COOKIE_PREFIX + cookie + '=' + value + ';path=/;max-age=' + (60 * 60 * 24 * 365);
}

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
 * @param {number} num number to round
 * @param {int} places significant figures
 * @returns {number} number to return
 */
function mathRound(num, places) 
{
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

/**
 * Adds '0' characters to a number so it correctly displays the specified 
 * decimal point characters.
 * 
 * @param {number} num number to pad
 * @param {int} places significant figures
 * @returns {string}
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

/**
 * Trims leading and trailing whitespace from a string.
 * 
 * @param {string} s the string to trim
 * @return {string} the trimmed string
 */
function trim(s)
{
    return s.trim ? s.trim() : s.replace(/^\s+|\s+$/g);
}
