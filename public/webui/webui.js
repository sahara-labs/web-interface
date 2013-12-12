/**
 * Web User Interface Widget Library.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @author Jesse Charlton <jesse.charlton@uts.edu.au>
 * @date 18th November 2013
 */


/* ============================================================================
 * == Globals (must be set configured in implementations                     ==
 * ============================================================================ */

/** Global definitions. */
Globals = {
    /** @global Theme enumeration. */
    THEMES: {
       /** Flat theme, grey and black; clean and functional. */
       flat: 'flat',
       
       /** Skeuomorphic design, designed from real world. */
       skeuo: 'skeuo',
    },
        
    /** @static {string} Prefix for cookies. */
    COOKIE_PREFIX: undefined, 
    
    /** @static {string} Rig Client controller. */
    CONTROLLER: undefined,
    
    /** @static {string} Default theme is flat. */
    THEME: 'flat'
};

/* ============================================================================
 * == Base widget                                                            ==
 * ============================================================================ */

/**
 * Base class widgets that comprise a web user interface.
 * 
 * @constructor
 * @param {string} id the identifier of this widget
 * @param {object} config configuration of widget
 * @config {string}  [title]               the title of this widget
 * @config {string}  [icon]                class for icon sprite
 * @config {array}   [classes]             list of classes to add for the container of this box
 * @config {integer} [width]               width of widget in px
 * @config {integer} [height]              height of widget in px
 * @config {boolean} [resizable]           whether this widget should be resizable (default false)
 * @config {integer} [minWidth]            minimum width of widget if resizable
 * @config {integer} [minHeight]           minimum height of widget if resizable
 * @config {boolean} [preserveAspectRatio] whether aspect ratio should be kept if resizable (default false)
 * @config {boolean} [expandable]          whether this widget should be expandable (default false)
 * @config {boolean} [draggable]           whether this widget should be draggable (default false)
 * @config {boolean} [shadeable]           whether this widget should be shadeable (default false)
 * @config {boolean} [closeable]           whether this widget should be closeable (default false) 
 * @config {string}  [tooltip]             tooltip to show on hover (optional)
 */
function Widget(id, config)
{
    /** @protected {String} Identifier of widget */
    this.id = id;

    /** @protected {jQuery} The jQuery object of the outermost element of this widget. 
     *  This is to be set by the 'init' method and cleared by the 'destroy' method. */
    this.$widget = null;
    
    /** @protected {object} Display options. */
    this.config = config ? config : { };
    if (!this.config.classes) this.config.classes = [ ];
    
    /** @private {object} Window management properties. */
    this.window = {
        shown:    undefined, // Whether the widget is being shown
        width:    undefined, // The width of this window
        height:   undefined, // The height of this window
        left:     undefined, // Left position of this window
        top:      undefined, // Top position of this window
        zin:      undefined, // Z-Index of this window 
        shaded:   undefined, // Whether this window is shaded
        expanded: undefined  // Whether this window is expanded
    };
}

/* ----- WIDGET LIFE CYCLE ---------------------------------------------------- */

/** 
 * Adds the widget to the page and sets up any widgets event handlers.
 * 
 * @param {jQuery} container to add this widget to
 */
Widget.prototype.init = function($container) {
    throw "Widget init not defined.";
};

/** 
 * Method which is provided with data from the server. The data object is the 
 * return from /data operation and is a map of the response keys and objects. 
 * 
 * @param {object} data data object
 */
Widget.prototype.consume = function(data) { };

/** 
 * Removes the widget from the page and cleans up all registered
 * events handlers. 
 */
Widget.prototype.destroy = function() {     
    if (this.$widget) this.$widget.remove();
    $(document).unbind("keypress.widget-" + this.id);
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

/** Message types. */
Widget.MESSAGE_TYPE = {
    error: 'error',
    info: 'info'
};

/** Arrow positions. */
Widget.MESSAGE_INDICATOR = {
    left: 'left',
    right: 'right',
    rightBottom: 'right-bottom',
    topLeft: 'top-left',
    topCenter: 'top-center'
};

/** 
 * Adds a message to the page. 
 * 
 * @param {string} message the message to display
 * @param {string} type the message type, this should be a value from MESSAGE_TYPE
 * @param {integer} left left absolute coordinate
 * @param {integer} top top absolute coordinate
 * @param {string} pos the arrow position, this should be a value from MESSAGE_INDICATOR
 */
Widget.prototype.addMessage = function(message, type, left, top, pos) {
    var $box, i, aniIn, bs = 1, up = true, html = 
        "<div class='message-box message-box-" + type + " message-box-in1' style='left:" + left + "px; top:" + top + "px'>" +
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
 * Removes messages from this page.
 */
Widget.prototype.removeMessages = function() {
    this.$widget.find(".message-box").remove();
};

/**
 * Shades the widget which hides the widget contents only showing the title.
 *
 * @param shadeCallback runs a callback function after the shade animation has completed
 */
Widget.prototype.toggleWindowShade = function(shadeCallback) {
    if (shadeCallback && typeof(shadeCallback) === "function") {
        this.$widget.find(".window-content").slideToggle('fast');
        this.$widget.find(".window-header").toggleClass("window-header-shade", "slide", function() {
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
    this._storeState();
};

/** The expanded width of an expanded, resizable widget. */
Widget.EXPANDED_WIDTH = 800;

/** The maximum expanded height of an expanded, resizable widget. */
Widget.MAX_EXPANDED_HEIGHT = 500;

/**
 * Toggles the window expand state which makes the widget take a prominent 
 * position on the interface. 
 */
Widget.prototype.toggleWindowExpand = function() {
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
                height = Widget.EXPANDED_WIDTH / width * height;
                width = Widget.EXPANDED_WIDTH;

                /* If the height is larger than the width, we want to scale the 
                * widget so it first better. */
                if (height > Widget.MAX_EXPANDED_HEIGHT)
                {
                    height = Widget.MAX_EXPANDED_HEIGHT;
                    width = Widget.MAX_EXPANDED_HEIGHT / this.window.height * this.window.width;
                }

                this.$widget.width(width);
                this.$widget.height(height);
                this.resized(width, height);
                this.resizeStopped(width, height);
            }

            /* We want the expanded widget to have the highest z-Index. */
            this.$widget.parent().find(".window-wrapper").each(function(i) {if ($(this).zIndex() > zin) zin = $(this).zIndex(); });

            /* Move the widget to a central position. */
            this.$widget.css({
                left: this.$widget.parent().width() / 2 - width / 2 - 60,
                top: 100,
                zIndex: zin + 100
            });

            /* Changing expanded icon */
            this.$widget.find(".window-expand").toggleClass('ui-icon-arrow-4-diag ui-icon-newwin');
        }

        this.$widget.toggleClass("window-expanded");
        this.window.expanded = !this.window.expanded;
        this._storeState();
    }
};

/* ----- UTILITY FUNCTIONS ---------------------------------------------------- */

/**
 * Generates the common styled widget box.
 * 
 * @param {string} contents of widget 
 * @return {jQuery} node of the generated box that has been appended to the page
 */
Widget.prototype._generate = function($container, html) {
    this.$widget = $container.append(
      "<div class='window-wrapper window-" + Globals.THEME + " " + 
                  (this.config.classes ? this.config.classes.join(' ') : "") + "' id='" + this.id + "' " +
                  "style='" +
                      (this.config.height ? "height:" + this.config.height + "px;" : "") +
                      (this.config.width ? "width:" + this.config.width + "px;" : "") +
                  "'>" +
          "<div class='window-header'>" +
              (this.config.icon ? "<span class='window-icon icon_"+ this.config.icon + "'></span>" : "")+
              (this.config.title ? "<span class='window-title'>" + this.config.title + "</span>" : "") +
              (this.config.closeable ? "<span class='window-close ui-icon ui-icon-close'></span>" : "") +
              (this.config.shadeable ? "<span class='window-shade ui-icon ui-icon-minus'></span>" : "") + 
              (this.config.expandable ? "<span class='window-expand ui-icon ui-icon-arrow-4-diag'></span>" : '') +             
          "</div>" +
          "<div class='window-content'>" + 
              html +
          "</div>" +
      "</div>"
    ).children().last();
    
    var thiz = this;
    
    if (this.config.expandable) this.$widget.find(".window-expand").click(function() { thiz.toggleWindowExpand(); });
    if (this.config.shadeable)
    {
        this.$widget.find(".window-shade").click(function() { thiz.toggleWindowShade(); });
        this.$widget.find(".window-header").dblclick(function() { thiz.toggleWindowShade(); });
    }
    if (this.config.closeable) this.$widget.find(".window-close").click(function() { thiz.destroy(); });
    
    $(document).bind("keypress.widget-" + this.id, function(e) {
       switch (e.keyCode) 
       {
           case 27:
               if (thiz.isExpanded) thiz.toggleWindowExpand();
               break;
       }
    });
    
    if (this.config.draggable) this._makeDraggable(this.$widget);
    if (this.config.resizable) this._makeResizable(this.$widget);
    if (this.config.tooltip) this._addTooltip(this.$widget);
    
    return this.$widget;
};

/** @global Tooltip timeout period. */
Widget.TOOLTIP_TIMEOUT = 2000;

/** @static {boolean} Whether to show tooltips. */
Widget.showTooltips = true;

/**
 * Adds a widget tooltip.
 * 
 * @param {jQuery} $w widget
 */
Widget.prototype._addTooltip = function($w) {
    var mousein = false, thiz = this;
    
    $w.mouseenter(function(e) {
        if (!Widget.showTooltips) return;

        mousein = true;
        if (thiz.$widget.children(".message-box").length == 0) setTimeout(function() {
            if (mousein)
            {
                display = true;
                thiz.addMessage(thiz.config.tooltip, Widget.MESSAGE_TYPE.info, 
                        $w.width() - 40, $w.height() - 10, Widget.MESSAGE_INDICATOR.topLeft);
            }
        }, Widget.TOOLTIP_TIMEOUT);
    }).mouseleave(function() {
        mousein = false;
    });
};

/** Whether the z-index fix has been applied. */
Widget._hasZIndexFix = false;

/**
 * Enables this widget to be draggable.
 * 
 * @param {jQuery} $w widget
 */
Widget.prototype._makeDraggable = function($w) {
        
    /* Adds the CSS for the draggable widgets */
    $w.addClass('draggable');
    $w.find('.window-header').addClass('draggable-header');
   
    if (this.window.left && this.window.top && this.window.zin) 
    {
        /* We have stored previously, dragged state so we will restore it. */
        $w.css({
                    left: this.window.left, 
                    top: this.window.top,
                    zIndex: this.window.zin
                });
        try
        {
            this.dragged(this.window.left, this.window.top);
        }
        catch (e) { }
    }
    
    /* Enables dragging on the widgets 'window-wrapper' class */
    var thiz = this;
    $w.draggable({
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
            thiz._storeState();
            
            /* Invoke event handler. */
            thiz.dragged(p.left, p.top);
        }
    });

    if (!Widget._hasZIndexFix)
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
        
        Widget._hasZIndexFix = true;
    }
};

/**
 * Enables this widget to be resizable. 
 * 
 * @param {jQuery} $w widget to make resizable 
 */
Widget.prototype._makeResizable = function($w) {
    var thiz = this;
    $w.resizable({
         minWidth: this.config.minWidth ? this.config.minWidth : undefined,
         minHeight: this.config.minHeight ? this.config.minHeight : undefined,
         aspectRatio: this.config.preserveAspectRatio ? this.config.preserveAspectRatio : false,
         distance: 10,
         resize: function(e, ui) { thiz.resized(ui.size.width, ui.size.height); },
         stop: function(e, ui) {
             /* Store sizing information. */
             thiz.window.width = ui.size.width;
             thiz.window.height = ui.size.height;
             thiz._storeState();
             
             /* Fire event. */
             thiz.resizeStopped(ui.size.width, ui.size.height); 
         }
    });
    
    if (this.window.width && this.window.height)
    {
        $w.css({
            width: this.window.width,
            height: this.window.height
        });

        try
        {
            this.resized(this.window.width, this.window.height);
            this.resizeStopped(this.window.width, this.window.height);
        }
        catch (e) { }
    }
};

/**
 * Stores the state of this widget in a cookie.
 */
Widget.prototype._storeState = function() {
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
    
    Util.setCookie(this.id + '-win', json);
};

/**
 * Loads the stored state from a store cookie.
 */
Widget.prototype._loadState = function() {
    var state = Util.getCookie(this.id + '-win');
    
    if (state && state.match(/^{.*}$/))
    {
        try
        {
            this.window = $.parseJSON(state);
        }
        catch (e) { /* Invalid JSON, not restoring layout. */ alert(e); }
    }
};

/** 
 * Posts data to the server.
 * 
 * @param {string} action the name of the action called from the Rig Client
 * @param {object} params data object of POST variables
 * @param {callback} responseCallback function to be invoked with the response of POST
 * @param {callback} errorCallback function to be invoked if an error occurs
 */
Widget.prototype._postControl = function(action, params, responseCallback, errorCallback) {
    if (!Globals.CONTROLLER) throw "Rig Client controller not set";
    
    $.ajax({
        url: "/primitive/mapjson/pc/" + Globals.CONTROLLER + "/pa/" + action,
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
 * == Graph widget                                                           ==
 * ============================================================================ */


/** 
 * Graph widget. This widget contains a scrolling graph that is user navigable
 * through the sessions data. 
 * 
 * @param {string} id graph identifier
 * @param {object} config configuration object
 * @config {object}  [fields]      map of graphed data fiels in with field => label
 * @config {integer} [width]       width of graph (default 400)
 * @config {integer} [height]      height of graph (default 250)
 * @config {boolean} [autoScale]   whether to autoscale the graph dependant (default off)
 * @config {integer} [minValue]    minimum value that is graphed, implies not autoscaling (default 0)
 * @config {integer} [maxValue]    maximum value that is graphed, implies not autoscaling (default 100)
 * @config {integer} [duration]    number of seconds this graph displays (default 60)
 * @config {integer} [period]      period betweeen samples in milliseconds (default 100)
 * @config {string}  [xLabel]      X axis label (default (Time (s))
 * @config {String}  [yLabel]      Y axis label (optional)
 * @config {boolean} [fieldCtl]    whether data field displays can be toggled (default false)
 * @config {boolean} [autoCtl]     whether autoscaling enable control is shown (default false)
 * @config {boolean} [durationCtl] whether duration control slider is displayed
 * @config {integer} [vertScales]  number of vertical scales (default 5)
 * @config {integer} [horizScales] number of horizontal scales (default 8)
 */
function Graph(id, config)
{
    if (!(config.fields)) throw "Options not set";
    
	Widget.call(this, id, config);

	/* Default options. */
	if (this.config.width === undefined)       this.config.width = 400;
	if (this.config.height === undefined)      this.config.height = 250;
	if (this.config.autoScale === undefined)   this.config.autoScale = false;
	if (this.config.minValue === undefined)    this.config.minValue = 0;
	if (this.config.maxValue === undefined)    this.config.maxValue = 100;
	if (this.config.duration === undefined)    this.config.duration = 60;
	if (this.config.period === undefined)      this.config.period = 100;
	if (this.config.xLabel === undefined)      this.config.xLabel = "Time (s)";
	if (this.config.yLabel === undefined)      this.config.yLabel = '';
	if (this.config.fieldCtl === undefined)    this.config.fieldCtl = false;
	if (this.config.autoCtl === undefined)     this.config.autoCtl = false;
	if (this.config.durationCtl === undefined) this.config.durationCtl = false;
	if (this.config.vertScales === undefined)  this.config.vertScales = 5;
	if (this.config.horizScales === undefined) this.config.horizScales = 8;
	
	/** @private {object} Data fields. */
	this.dataFields = { };
	var i = 0;
	for (i in this.config.fields)
	{
	    this.dataFields[i] = {
	        label: this.config.fields[i],
	        visible: true,
	        values: [ ],
	        seconds: 0,
	        color: "#FFFFFF"
	    };
	}
		
	/** The minimum expected graphed value. A value smaller than this will be
	 *  clipped. */
	this.minGraphedValue = undefined;

	/** The maximum expected graphed value. A value greater than this will be 
	 *  clipped. */
	this.maxGraphedValue = undefined;
	
	/** @private {integer} The range of values. If autoscaling, this is determined
	 *  as the difference between the largest and smallest value, if not this is the 
	 *  difference between the max and min graphed values. */
	this.graphRange = this.config.maxValue - this.config.minValue;
	
	/** @private {Number} The zero point offset of the graph in pixels. */
	this.graphOffset = this.config.minValue / this.graphRange;

	/** Canvas context. */
	this.ctx = null;

	/** The time of the first data update in seconds since epoch. */
	this.startTime = undefined;

	/** The time of the latest data update in seconds since epoch. */
	this.latestTime = undefined;

	/** The displayed duration in seconds. */
	this.displayedDuration = undefined;
}
Graph.prototype = new Widget;

Graph.prototype.init = function($container) {
    this.graphRange = this.config.maxValue - this.config.minValue;
    
	this.$widget = this._generate($container, this._buildHTML());

	/* Add the canvas panel. */
	var canvas = getCanvas(this.id, this.config.width, this.config.height);
	this.$widget.find("#" + this.id + "-canvas").append(canvas);
	this.ctx = canvas.getContext("2d");

	/* Event handlers. */
//	var thiz = this;
//	this.$widget.find('.graph-label').click(function() {    
//		thiz.showTrace($(this).children(".graph-label-text").text(), 
//				$(this).find(".switch .slide").toggleClass("on off").hasClass("on"));
//	});
//	
//	this.$widget.find(".graph-controls-show").click(function() {
//	    thiz.showControls($(this).find(".switch .slide").toggleClass("on off").hasClass("on"));
//	});
//	
//	this.$widget.find(".graph-autoscale").click(function() {
//	   thiz.enableAutoscale($(this).find(".switch .slide").toggleClass("on off").hasClass("on")); 
//	});

	/* Draw the first frame contents. */
	this._drawFrame();
};

Graph.prototype._buildHTML = function() {
	var i = 0, unitScale, styleScale, html = ''; 

	/* Graph labels. */
	html += "<div class='graph-labels'>";
	for (i in this.config.fields)
	{
		html += "	<div class='graph-label'>" + 
				"		<label for='graph-label-" + i + "' class='graph-label-text'>" + this.config.fields[i].label + "</label>" +  
		        "       <div id='graph-label-" + i + "' class='switch graph-label-enable'>" +
        		"		    <div class='animated slide on'></div>" +
        		"       </div>" +
				"	</div>";
	}
	html += "</div>";

	/* Left scale. */
	unitScale = Math.floor(this.graphRange / this.config.vertScales);
	styleScale = this.config.height / this.config.vertScales;
	html += "<div class='graph-left-scales'>";
	for (i = 0; i <= this.config.vertScales; i++)
	{
		html += "<div class='graph-left-scale-" + i + "' style='top:"+ (styleScale * i) + "px'>" + 
					(this.config.maxValue - i * unitScale)+ 
				"</div>";
	}
	html += "</div>";

	/* Left axis label. */
	html += "<div class='graph-axis-label graph-left-axis-label' style='top:40%'>" + this.config.yLabel + "</div>";

	/* Canvas element holding box. */
	html += "<div id='" + this.id +  "-canvas' class='graph-canvas-box gradient' style='height:" + this.config.height + "px'></div>";

	/* Bottom scale. */
	html += "<div class='graph-bottom-scales'>";
	styleScale = this.config.width / this.config.horizScales;
	for (i = 0; i <= this.config.horizScales; i++)
	{
		html += "<div class='graph-bottom-scale-" + i + "' style='left:" + (styleScale * i - 5) + "px'>&nbsp</div>";
	}
	html += "</div>";

	/* Bottom axis label. */
	html += "<div class='graph-axis-label graph-bottom-axis-label'>" + this.config.xLabel + "</div>";
	
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
            "          <div class='animated slide " + (this.config.autoScale ? "on" : "off") + "'></div>" +
            "       </div>" +
            "   </div>" +
	        "</div>";

	return html;
};

Graph.prototype.consume = function(data) { 
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
        this._adjustScaling();
        this._updateDependantScale();
    }

    this._drawFrame();
    this._updateTimeScale();
};

/**
 * Draws a graph frame.
 */
Graph.prototype._drawFrame = function() {
	var i = 0;
	
	/* Clear old frame. */
	this.ctx.clearRect(0, 0, this.config.width, this.config.height);
	
	/* Draw scales. */
	this._drawDependantScales();
	    
	/* Draw the trace for all graphed variables. */
	for (i in this.dataFields) this._drawTrace(this.dataFields[i]);
};

/**
 * Adjusts the scaling and offset based on the range of values in the graphed
 * datasets.
 */
Graph.prototype.adjustScaling = function() {
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

/** @static {integer} The stipple width. */
Graph.STIPPLE_WIDTH = 10;

/**
 * Draws the scales on the interface.
 */
Graph.prototype._drawDependantScales = function() {
	var i, j,
		off = this.config.height - Math.abs(this.graphOffset * this.config.height);

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.strokeStyle = "#FFFFFF";
	
	/* Zero line. */
	this.ctx.lineWidth = 3;
	if (off > 0 && off < this.config.height)
	{
	    this.ctx.moveTo(0, off + 1.5);
	    this.ctx.lineTo(this.config.width, off + 1.5);
	}
	
	this.ctx.lineWidth = 0.3;

	for (i = 0; i < this.config.height; i += this.config.height / this.config.vertScales)
	{
		for (j = 0; j < this.config.width; j += Graph.STIPPLE_WIDTH * 1.5)
		{
			this.ctx.moveTo(j, i + 0.25);
			this.ctx.lineTo(j + Graph.STIPPLE_WIDTH, i + 0.25);
		}
	}

	this.ctx.closePath();
	this.ctx.stroke();
	this.ctx.restore();
};

/**
 * Draws the trace of the data. 
 * 
 * @param {array} dObj data object
 */
Graph.prototype._drawTrace = function(dObj) {
	if (!dObj.visible) return;

	var xStep  = this.config.width / (dObj.seconds * 1000 / this.config.period), 
	    yScale = this.config.height / this.graphRange, i, yCoord;

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
		yCoord = this.config.height - dObj.values[i] * yScale + this.graphOffset * this.config.height;
		/* If value too large, clipping at the top of the graph. */
		if (yCoord > this.config.height) yCoord = this.config.height;
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
Graph.prototype._updateDependantScale = function() {
    var i, $s = this.$widget.find(".graph-left-scale-0");
    
    for (i = 0; i <= this.config.vertScales; i++)
    {
        $s.html(Util.zeroPad(
                this.graphRange + this.graphOffset * this.graphRange - this.graphRange / this.config.vertScales * i, 
                this.graphRange >= this.config.vertScales * 2 ? 0 : 1));
        $s = $s.next();
    }
};

/**
 * Updates the time scale.
 */
Graph.prototype._updateTimeScale = function() {
	var xstep = this.displayedDuration / this.config.horizScales, i,
		$d = this.$widget.find(".graph-bottom-scale-0"), t;

	for (i = 0; i <= this.config.horizScales; i++)
	{
		t = this.latestTime - xstep * (this.config.horizScales - i) - this.startTime;
		$d.html(Util.zeroPad(t, t < 100 ? 1 : 0));
		$d = $d.next();
	}
};

/**
 * Enables or disables displaying of the graphed variable.
 * 
 * @param label label of the variable
 * @param show whether the variable is displayed
 */
Graph.prototype.showTrace = function(label, show) {
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


Graph.prototype.resized = function(width, height) {
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

Graph.prototype.resizeStopped = function(width, height) {
    this.resized(width, height);
    this.drawFrame();
};

/**
 * Enables or disables graph autoscaling. 
 * 
 * @param autoscale true if graph autoscales
 */
Graph.prototype.enableAutoscale = function(autoscale) {
    if (!(this.isAutoscaling = autoscale))
    {
        this.graphRange = this.maxGraphedValue - this.minGraphedValue;
        this.graphOffset = this.minGraphedValue / this.graphRange;
        this.updateDependantScale();
    }
};

/* ============================================================================
 * == Switch Widget.                                                         ==
 * ============================================================================ */

/**
 * The switch widget which provides a toggable switch to change a boolean 
 * variable.
 *
 * @constructor
 * @param {string} id the identifier of widget
 * @param {object} config configuration of widget
 * @config {string}  [field]      server data variable that is being switched
 * @config {string}  [action]     server action to call when the switched is changed
 * @config {string}  [label]      switch label (optional)
 * @config {string}  [stickColor] sets the color of the switches stick (silver, black, red)
 * @config {boolean} [vertical]   set button vertical or horizontal (default horizontal)
 */
function Switch(id, config)
{
    if (!(config.field || config.action)) throw "Options not supplied."; 
    
    Widget.call(this, id, config);

    /** @private {boolean} The state of the switch. */
    this.val = undefined;
    
    /** @private {boolean} Whether the value has been changed by user action. */
    this.isChanged = false;  
    
    this.config.classes.push("switch-box");
    this.config.classes.push("switch-" + Globals.THEME);
}
Switch.prototype = new Widget;

Switch.prototype.init = function($container) {
    this.$widget = this._generate($container, 
        this.config.vertical ? // Vertical orientation
            '<div class="switch-vertical-container">' +
                (this.config.label ? '<label class="switch-vertical-label">' + this.config.label + ':</label>' : '') +
                '<div class="switch-vertical switch-' + this.config.stickColor + '-down"></div>' +
            '</div>'
        : // Horizontal orientation
            '<div class="switch-container">' +
                (this.config.label ? '<label class="switch-label">' + this.config.label + ':</label>' : '') +
                '<div class="switch">' +
                    '<div class="switch-animated switch-slide"></div>' +
                '</div>' +
            '</div>'
    );
    
    var thiz = this;
    this.$widget.find(".switch-label, .switch, .switch-vertical").click(function() { thiz._clicked(); });
};

Switch.prototype.consume = function(data) {
    if (!(data[this.config.field] === undefined || data[this.config.field] === this.val || this.isChanged))
    {
        this.val = data[this.config.field];
        this._setDisplay(this.val);
    }
};

/**
 * Event handler to be called when the switch is clicked.
 */
Switch.prototype._clicked = function() {
    this.isChanged = true;
    this.val = !this.val;
    this._setDisplay(this.val);
    
    var thiz = this, params = { };
    params[this.config.field] = this.val ? 'true' : 'false';
    this._postControl(
        this.config.action,
        params,
        function() {
            thiz.isChanged = false;
        }
     );
};

/**
 * Sets the display value. 
 * 
 * @param on whether the display should be on or off
 */
Switch.prototype._setDisplay = function(on) {
    if (this.config.vertical)
    {
        if (on)
        {
            this.$widget.find(".switch-vertical").removeClass("switch-" + this.config.stickColor + "-down");
            this.$widget.find(".switch-vertical").addClass("switch-" + this.config.stickColor + "-up");
        }
        else
        {
            this.$widget.find(".switch-vertical").addClass("switch-" + this.config.stickColor + "-down");
            this.$widget.find(".switch-vertical").removeClass("switch-" + this.config.stickColor + "-up");
        }     
    }
    else
    {
        if (on)
        {
            this.$widget.find(".switch .switch-slide").addClass("switch-on");
        }
        else
        {
            this.$widget.find(".switch .switch-slide").removeClass("switch-on");
        }
    }
};

/* ============================================================================
 * == Rotary Switch widget                                                   ==
 * ============================================================================ */

/**
 * A rotary switch allows the selection of a limited number of options.
 *
 * @constructor
 * @param {string} id the identifier of widget
 * @param {object} config configuration of widget
 * @config {string} [field]  server data variable that is being switched
 * @config {string} [action] server action to call when the switched is changed
 * @config {array}  [values] the list of potential
 * @config {number} [radius] the radius of the switch
 * @config {string} [label]  switch label (optional)
 * @config {string} [colour] set the switch colour (default black)
 */
function RotarySwitch(id, config)
{
    if (!(config.field || config.action || config.values)) throw "Options not supplied."; 
    
    Widget.call(this, id, config);

    /** @private {boolean} The selected value. */
    this.val = undefined;
    
    /** @private {boolean} Whether the value has been changed by user action. */
    this.isChanged = false;  
}

RotarySwitch.prototype = new Widget;

RotarySwitch.prototype.init = function($container) {
	var r = this.config.radius,
        v = this.config.values;
	
    this.$widget = this._generate($container,
    	(this.config.label ? "<label>" + this.config.label + "</label>" : '') +
        "<div id='rotary-container-" + this.id + "' class='rotary-switch-container' " + 
            "style='width:" + r * 2 +"px;height:" + r * 2 + "px;'>" +
                "<div id='rotary-switch-" + this.id + "' class='rotary-switch rotary-" + 
                (this.config.colour ? this.config.colour : 'black') + "'></div>" +
        "</div>"
    );

    /* Generates the positions of the switches' points. */
    for(var i = 0; i < v.length; i++) {

    	/* Calculate the X and Y axes of the current point.  */
        var x = (r - 5) - (r + 10) * Math.cos(2 * Math.PI * i / v.length),
            y = (r - 5) - (r + 10) * Math.sin(2 * Math.PI * i / v.length),
            p = v[(v.length - i)];

        //TODO Fix Label positioning

        $("#rotary-container-" + this.id).append(
            "<div class='rotary-switch-val " +
            ( y <= 55 ? y = (y - ( p ? p.length : '')) - 8 : 0) + "' id='" + this.id + "-" + i + "' " + 
            "style='left:" + Math.round(y) + "px;top:" + Math.round(x) + "px' " + "value=" + 
            ( p ? p : v[0]) + ">" + ( p ? p : v[0]) + "</div>"
        );
    }

    var thiz = this;
    this.$widget.find(".rotary-switch-val").click(function() { thiz._clicked(this); });	
};

RotarySwitch.prototype.consume = function(data) {

};

/**
 * Event handler to be called when a value is clicked.
 */
RotarySwitch.prototype._clicked = function(point) {
	//TODO Add code to update rig with the selected value.
	
    this.val = undefined;
    this.isChanged = true;
    this._animateSwitch(point);

    var thiz = this, params = { };
    params[this.config.field] = this.val;
    this._postControl(
        this.config.action,
        params,
        function() {
            thiz.isChanged = false;
        }
     );
};

/**
 * Animates the switch to point to the selected label. 
 * 
 * @param point the selected label
 */
RotarySwitch.prototype._animateSwitch = function(point) {
    /* Get the position of the point and sets the X and Y axes used for calculating the value positions. */
    var pos = $(point).position(),
        x0 = (this.config.radius - 5),
        y0 = (this.config.radius - 5);

    //TODO Fix issue with some labels making the switch fully rotate to get to the closest one.

    /* Calculate the switches degree in relation to the point. */
    var deg = Math.atan((pos.left-x0)/(y0-pos.top))*180/Math.PI,
        deg = x0 < pos.top ? Math.round(deg + 180) : Math.round(deg);

    /* Rotates the switch. */
    $(point).parent().find('.rotary-switch').css({
        '-webkit-transform' : 'rotate('+ deg +'deg)',
        '-moz-transform' : 'rotate('+ deg +'deg)',
        '-ms-transform' : 'rotate('+ deg +'deg)',
        '-o-transform' : 'rotate('+ deg +'deg)',
        'transform' : 'rotate('+ deg +'deg)'
    });
}

/* ============================================================================
 * == Button widget                                                          ==
 * ============================================================================ */

function Button()
{
    // TODO Button widget
}

/* ============================================================================
 * == Push Button widget                                                     ==
 * ============================================================================ */

function PushButton()
{
    // TODO Push button widget
}

/* ============================================================================
 * == Knob widget                                                            ==
 * ============================================================================ */

function Knob()
{
    // TODO Knob widget
}

/* ============================================================================
 * == Spinner widget                                                         ==
 * ============================================================================ */

function Spinner()
{
    // TODO Spinner widget
}

/* ============================================================================
 * == Slider widget                                                          ==
 * ============================================================================ */

/**
 * Slider widget that displays a slider that allows that provides a slidable
 * scale over the specified range.
 * 
 * @param {string} id widget identifier
 * @param {object} config configuration of widget
 * @config {string}  [field] server data variable that is being set
 * @config {string}  [action] server action to call when the slider is changed
 * @config {boolean} [textEntry] whether text entry is displayed (default true) 
 * @config {string}  [label] slider label (optional)
 * @config {string}  [units] units label to display (optional)
 * @config {integer} [precision] precision of displayed value (default 1)
 * @config {integer} [min] minimum value of slider (default 0)
 * @config {integer} [max] maximum value of slider (default 100)
 * @config {boolean} [vertical] whether slider is vertically or horizontally orientated (default vertical)
 * @config {integer} [length] length of slider in pixels (default 250)
 * @config {integer} [scales] number of scales to display (default fitted to min, max value)
 */
function Slider(id, config)
{
    if (!(config.field || config.action)) throw "Options not supplied.";
    
    Widget.call(this, id, config);
    
    /* Default options. */
    if (this.config.min === undefined) this.config.min = 0;
    if (this.config.max === undefined) this.config.max = 100;
    if (this.config.vertical === undefined) this.config.vertical = true;
    if (this.config.textEntry === undefined) this.config.textEntry = true;
    if (this.config.length === undefined) this.config.length = 250;
    if (this.config.label === undefined) this.config.label = '';
    if (this.config.units === undefined) this.config.units = '';
    if (this.config.precision === undefined) this.config.precision = 1;
    if (this.config.scales === undefined) this.config.scales = 
            this.config.max - this.config.min > 10 ? 10 : this.config.max - this.config.min;

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
Slider.prototype = new Widget;

Slider.prototype.init = function($container) {
    /* Reset values. */
    this.val = undefined;
    this.valueChanged = false;
    
    this.$widget = this._generate($container, this._buildHTML());
    
    var thiz = this;
    
    /* Slider events. */
    this.$knob = this.$widget.find(".slider-knob")
        .mousedown(function(e) { thiz._slideStart(e.pageX, e.pageY); });
    
    /* Slider position click. */
    this.$widget.find(".slider-outer").bind("click." + this.id, function(e) { thiz._sliderClicked(e.pageX, e.pageY); });
    
    /* Value box events. */
    if (this.config.textEntry) this.$input = this.$widget.find(".slider-text input")
        .focusin(formFocusIn)
        .focusout(formFocusOut)
        .change(function() { thiz._handleTextBoxChange($(this).val()); });    
};

Slider.prototype._buildHTML = function() {
    var i, s = (Math.floor((this.config.max - this.config.min) / this.config.scales)),
        html = 
        "<div class='slider-outer' style='" + (this.config.vertical ? "height" : "width") + ":" + this.config.length + "px'>";
            
    /* Slider scale. */
    html += "<div class='slider-scales slider-scales-" + (this.config.vertical ? "vertical" : "horizontal") + "'>";
    for (i = 0; i <= this.config.scales; i++)
    {
        html += "<div class='slider-scale' style='" + (this.config.vertical ? "top" : "left") + ":" + 
                        (this.config.length / this.config.scales * i) + "px'>" +
                    "<span class='ui-icon ui-icon-arrowthick-1-" + (this.config.vertical ? "w" : "n") + "'></span>" +
                    "<span class='slider-scale-value'>" + 
                            (this.config.vertical ? this.config.max - s * i : this.config.min + s * i) + "</span>" +
                "</div>";
    }
    html += "</div>";
    
    /* Slider post. */
    html += "<div class='slider-post slider-post-" + (this.config.vertical ? "vertical" : "horizontal") + "'></div>";
    
    /* Slider knob. */
    html += "<div class='slider-knob slider-knob-" + (this.config.vertical ? "vertical" : "horizontal" ) + "'>" +
                "<div class='slider-knob-slice slider-knob-back'></div>";
    
    for (i = 0; i < 9; i++)
    {
        html +=     "<div class='slider-knob-slice slider-knob-slice-" + i + "'></div>";
    }
    
    html += "</div>";
    
    html += 
        "</div>";
    
    /* Text box with numeric value. */
    html += this.config.textEntry ?
        "<div class='slider-text slider-text-" + (this.config.vertical ? "vertical" : "horizontal") +
                " saharaform' style='margin-" + (this.config.vertical ? "top" : "left") + ":" +
                (this.config.length + (this.config.vertical ? 20 : -200)) + "px'>" +                
                "<label for='" + this.id + "-text' class='slider-text-label'>" + this.config.label + ":&nbsp;</label>" +
            "<input id='" + this.id + "-text' type='text' /> " +
            "<span>" + this.config.units + "</span>" +
        "</div>" : 
        "<div class='slider-text-" + (this.config.vertical ? "vertical" : "horizontal") +
                "' style='margin-" + (this.config.vertical ? "top" : "left") + ":" +
                (this.config.length + (this.config.vertical ? 20 : -90)) + "px'>" + this.config.label + "</div>";
    
    return html;
};

/**
 * Handles a slider position click.
 * 
 * @param {number} x coordinate of mouse
 * @param {number} y coordiante of mouse
 */
Slider.prototype._sliderClicked = function(x, y) {
    if (this.isSliding) return;
    
    var off = this.$widget.find(".slider-outer").offset(),
        p = this.config.vertical ? y - off.top - 7 : x - off.left - 7;
    
    /* Value scaling. */
    this.valueChanged = true;
    this.val = p * (this.config.max - this.config.min) / this.config.length + this.config.min;
    
    /* Range check. */
    if (this.val < this.config.min) this.val = this.config.min;
    if (this.val > this.config.max) this.val = this.config.max;
    
    /* Vertical sliders have the scale inverse to positioning. */
    if (this.config.vertical) this.val = this.config.max + this.config.min - this.val;
    
    /* Update display. */
    this._moveTo();
    if (this.config.textEntry) this.$input.val(Util.zeroPad(this.val, this.config.precision));
    
    /* Send results. */
    this._send();
};

/**
 * Handles slider start.
 * 
 * @param {number} x x coordinate of mouse
 * @param {number} y y coordinate of mouse
 */
Slider.prototype._slideStart = function(x, y) {
    /* State management. */
    this.isSliding = true;
    this.valueChanged = true;
    
    /* Position tracking. */
    this.lastCoordinate = (this.config.vertical ? y : x);
    
    /* Event handlings. */
    var thiz = this;
    $(document)
        .bind('mousemove.' + this.id, function(e) { thiz._slideMove (e.pageX, e.pageY); })
        .bind('mouseup.' + this.id,   function(e) { thiz._slideStop (e.pageX, e.pageY); });
    
    /* Stop double handling. */
    this.$widget.find(".slider-outer").unbind("click." + this.id);
};

/**
 * Handles slider move.
 *  
 * @param {number} x x coordinate of mouse
 * @param {number} y y coordinate of mouse
 */
Slider.prototype._slideMove = function(x, y) {
    if (!this.isSliding) return;
    
    /* Scaling to value. */
    var dist = (this.config.vertical ? y : x) - this.lastCoordinate;
    this.val += (this.config.max - this.config.min) * dist / this.config.length * (this.config.vertical ? -1 : 1);
    
    
    /* Range check. */
    if (this.val < this.config.min) this.val = this.config.min;
    if (this.val > this.config.max) this.val = this.config.max;
    
    /* Display update. */
    if (this.config.textEntry) this.$input.val(Util.zeroPad(this.val, this.config.precision));
    this._moveTo();
    
    /* Position tracking. */
    this.lastCoordinate = (this.config.vertical ? y : x);
};

/**
 * Handles slide stop.
 * 
 * @param {number} x x coordinate of mouse
 * @param {number} y y coordinate of mouse
 */
Slider.prototype._slideStop = function(x, y) {
    if (!this.isSliding) return;
    
    $(document)
        .unbind('mousemove.' + this.id)
        .unbind('mouseup.' + this.id);
    
    this.isSliding = false;
    this._send();
    
    var thiz = this;
    this.$widget.find(".slider-outer").bind("click." + this.id, function(e) { thiz._sliderClicked(e.pageX, e.pageY); });
};
/**
 * Moves the slider to the specified value 
 */
Slider.prototype._moveTo = function() {
    var p = this.val / (this.config.max - this.config.min) * this.config.length - 
            this.config.min / (this.config.max - this.config.min) * this.config.length;
    this.$knob.css(this.config.vertical ? "top" : "left", this.config.vertical ? this.config.length - p : p);
};

/**
 * Handles a value text box change.
 * 
 * @param {number} val new value
 */
Slider.prototype._handleTextBoxChange = function(val) {
    var ttLeft = this.config.vertical ? 60 : this.config.length + 17,
        ttTop  = this.config.vertical ? this.config.length + 82 : 75, n;
    
    this.removeMessages();
    if (!val.match(/^-?\d+\.?\d*$/))
    {
        this.addMessage("Value must be a number.", Widget.MESSAGE_TYPE.error, ttLeft, ttTop, Widget.MESSAGE_INDICATOR.left);
        return;
    }
    
    n = parseFloat(val);
    if (n < this.config.min || n > this.config.max)
    {
        this.addMessage("Value out of range.", Widget.MESSAGE_TYPE.error, ttLeft, ttTop, Widget.MESSAGE_INDICATOR.left);
        return;
    }
    
    this.valueChanged = true;
    this.val = n;
    this._moveTo();
    this._send();  
};

/** 
 * Sends the updated value to the server.
 */
Slider.prototype._send = function() {
    var thiz = this, params = { };
    params[this.config.field] = this.val;
    this._postControl(this.config.action, params,
        function(data) {
            thiz.valueChanged = false;
        }
    );
};

Slider.prototype.consume = function(data) {
    if (!(data[this.config.field] === undefined || data[this.config.field] == this.val || this.valueChanged))
    {
        this.val = data[this.config.field];
        this._moveTo();
        if (this.config.textEntry) this.$input.val(Util.zeroPad(this.val, this.config.precision));
    }
};

/* ============================================================================
 * == LED widget                                                             ==
 * ============================================================================ */

/** 
 * The LED widget displays a binary field with three displayed states, 
 * undefined, on, and off.
 * 
 * @constructor
 * @param {string} id the identifer of widget
 * @param {object} config configuration of widget
 * @config {string} [field] server data variable that is being displayed
 * @config {string} [label] label to display
 * @config {boolean} [ledBelow] whether the LED is below the label (default: false, adjacent to label)
 */
function LED(id, config)
{
    if (!config.field) throw "Option not supplied.";
    
    Widget.call(this, id, config);
    
    /** @private {boolean} The displayed value of the field. */
    this.val = undefined;
}
LED.prototype = new Widget;

LED.prototype.init = function($container) {
    this.$widget = this._generate($container,
        '<div class="led-container led-' + (this.config.ledBelow ? 'below' : 'adjacent') + '">' +
            (this.config.label ? '<label class="led-label">' + this.config.label + 
                    (this.config.ledBelow ? '' : ':') + '</label>' : '') +
            '<div class="led led-novalue"></div>' +
        '</div>'
    );
};

LED.prototype.consume = function(data) {
    if (!(data[this.config.field] === undefined || data[this.config.field] == this.val))
    {
        this.val = data[this.config.field];
        this.$widget.find(".led").removeClass("led-novalue led-on led-off").addClass(this.val ? 'led-on' : 'led-off');
    }
};

/* ============================================================================
 * == LCD widget                                                             ==
 * ============================================================================ */

function LCD() 
{
    // TODO Implement LCD widget
}

/* ============================================================================
 * == Gauge Widget                                                           ==
 * ============================================================================ */

function Gauge()
{
    // TODO Implment Gauge widget
}

/* ============================================================================
 * == Linear Gauge widget                                                    ==
 * ============================================================================ */

function LinearGauge()
{
    // TODO Implement Linear Gauge widget
}


/* ============================================================================
 * == Global Error Widget                                                    ==
 * ============================================================================ */

/**
 * Display an error overlay on the page.
 */
function GlobalError() 
{
	Widget.call(this, 'global-error-overlay', { });
	
	/** @private {jQuery} Parent container. */
	this.$container = undefined;
	
	/** @private {String} Displayed error message. */
	this.error = '';
};

GlobalError.prototype = new Widget;

GlobalError.prototype.init = function($container) {
    this.$container = $container ? $container : $("#rigscriptcontainer");
    
    this.$widget = this.$container.append(
    	"<div id='global-error' class='global-error-overlay'>" +
            "<div class='global-error-container'>" +
		        "<span class='ui-icon ui-icon-alert global-error-icon'></span>" +
		        "<span class='global-error-heading'>Alert!</span>" +
		        "<span class='window-close ui-icon ui-icon-close global-error-close'></span>" +
                "<p class='global-error-message'>This web page has encountered an error. This may be " +
                "because you are no longer connected to the internet. To resolve this error, first " +
                "check your internet connection, then refresh this page.<br/><br/>" +
                "If further assistance is required, please use the 'Contact Support' button to the " +
                "right of the page.</p>" +
                "<p class='global-error-log'>" + this.error + "</p>" +
            "</div>" +
        "</div>"
    ).children().last();

    /* Add a error class to widget boxes. */
    this.$container.find(".window-wrapper, .tab-wrapper").addClass("global-error-blur");
    
    var thiz = this;
    this.$widget.find(".window-close").click(function() { thiz.destroy(); });
    
    $(document).bind("keydown.global-error", function(e) {
        if (e.keyCode == 27) thiz.destroy();
    });
};

/**
 * Returns the error message string currently displayed.
 * 
 * @returns {String} error message
 */
GlobalError.prototype.getError = function() {
    return this.error;
};

/**
 * Displays the specified error message. 
 * 
 * @param {String} error message to display. 
 */
GlobalError.prototype.displayError = function(error) {
    if (this.error != error)
    {
        /* Clear previous display. */
        if (this.$container) this.destroy();
        
        this.error = error;
        this.init();
    }
};

/**
 * Clears displaying an error message.
 */
GlobalError.prototype.clearError = function() {
    this.error = null;
    this.destroy();
};

GlobalError.prototype.destroy = function() {
    $(document).unbind("keydown.global-error");
    this.$container.find(".window-wrapper, .tab-wrapper").removeClass("global-error-blur");
    this.$container = null;
    Widget.prototype.destroy.call(this);
};

/* ============================================================================ 
 * == Utility functions namespace                                            ==
 * ============================================================================ */

/** 
 * Utility namespace
 */
function Util() { };

/**
 * Gets the value of the specified cookie. 
 * 
 * @static
 * @param {string} cookie the cookie to find the value of
 * @return {mixed} cookies value or false if not found
 */
Util.getCookie = function(cookie) {
    if (!Globals.COOKIE_PREFIX) throw "Cookie prefix not set";
    cookie = Globals.COOKIE_PREFIX + '-' + cookie;
    
    var pos = document.cookie.indexOf(cookie), end = document.cookie.indexOf(';', pos + 1);
    if (end < 0) end = document.cookie.length;
    return pos >= 0 ? document.cookie.substring(pos + cookie.length + 1, end) : false;
};

/**
 * Sets a cookie for this interface.
 * 
 * @static
 * @param {string} cookie name of cookie to set
 * @param {string} value value of cookie to set
 */
Util.setCookie = function(cookie, value) {
    if (!Globals.COOKIE_PREFIX) throw "Cookie prefix not set";
    document.cookie = Globals.COOKIE_PREFIX + '-' + cookie + '=' + value + ';path=/;max-age=' + (60 * 60 * 24 * 365);
};

/**
 * Rounds of a number to a specified number of significant figures.
 * 
 * @static
 * @param {number} num number to round
 * @param {int} places significant figures
 * @returns {number} number to return
 */
Util.round = function(num, places) {
    return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
};

/**
 * Adds '0' characters to a number so it correctly displays the specified 
 * decimal point characters.
 * 
 * @static
 * @param {number} num number to pad
 * @param {int} places significant figures
 * @returns {string} padded string
 */
Util.zeroPad = function(num, places) {
    var r = '' + mathRound(num, places);

    if (places > 0)
    {
        if (r.indexOf('.') == -1) r += '.';
        while (r.length - r.indexOf('.') < places + 1) r += '0';
    }

    return r;
};

/**
 * Trims leading and trailing whitespace from a string.
 * 
 * @static
 * @param {string} s the string to trim
 * @return {string} the trimmed string
 */
Util.trim = function(s) {
    return s.trim ? s.trim() : s.replace(/^\s+|\s+$/g);
};

/**
 * Gets a canvas element with an appropriate fallback for IE6 to IE8 which do
 * not natively support canvas.
 * 
 * @static
 * @param {string} id the ID of the element
 * @param {integer} width the width of the canvas element
 * @param {integer} height the height of the canvas element
 * @return {object} canvas element or appropriate fallback
 */
Util.getCanvas = function(id, width, height) {
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
};