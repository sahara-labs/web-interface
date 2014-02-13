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

/**
 * Web application. 
 *
 * @param {object} config configuration option
 * @config {string} [anchor] where the display is anchored to the screen
 * @config {array} [widgets] list of widgets that are on the page
 * @config {boolean} [windowToggle] whether to show the widget toggle list to allow windows \
 *                                  to be closed (default off)
 * @config {string} [controller] controller used to interact with the Rig Client
 * @config {string} [dataAction] action to request to pull data from the server (default data)
 * @config {integer} [dataDuration] duration of graph data to request in seconds (default 60)
 * @config {integer} [dataPeriod] period of graph data to request in milliseconds (default 100)
 * @config {integer} [pollPeriod] how often to poll server data in milliseconds (default 3000)
 * @config {integer} [errorPeriod] how long to wait after receiving errored data before \
 *                          requesting again in milliseconds (default 10000)
 * @config {string} [theme] display theme (default 'flat')
 * @config {string} [cookie] cookie prefix (default anchor id) 
 */
function WebUIApp(config)
{
    /** @private {object} Configuration object. */
    this.config = config;
    
    /** @private {jQuery} Interface anchor. */
    this.$anchor = undefined;
    
    /** @private {WindowManager} Page container. */
    this.display = new WindowManager(this.config.anchor + "-container", {
        widgets: this.config.widgets,
        windowToggle: this.config.windowToggle
    });;
    
    /** @private {boolean} Whether a data error has occurred. */
    this.dataError = false;
    
    /** @private {GlobalError} Global error display. */
    this.errorDisplay = new GlobalError();
    
    /* Set default options. */
    if (this.config.windowToggle === undefined) this.config.windowToggle = false;
    if (this.config.dataAction === undefined) this.config.dataAction = "data";
    if (this.config.dataDuration === undefined) this.config.dataDuration = 60;
    if (this.config.dataPeriod === undefined) this.config.dataPeriod = 100;
    if (this.config.pollPeriod === undefined) this.config.pollPeriod = 3000;
    if (this.config.errorPeriod === undefined) this.config.errorPeriod = 10000;
    if (this.config.theme === undefined) this.config.theme = Globals.THEMES.flat;
    if (this.config.cookie === undefined) this.config.cookie = this.config.anchor;
    
    return this;
}

/**
 * Perform setup of the application.
 */
WebUIApp.prototype.setup = function() {
    /* Validation of mandatory options. */
    if (!this.config.controller) throw "Rig Client controller not set.";
    if (!this.config.anchor) throw "Page anchor not configured.";
    if (!this.config.widgets) throw "No widgets added to the interface.";
    
    Globals.CONTROLLER = this.config.controller;
    Globals.COOKIE_PREFIX = this.config.cookie;
    Globals.THEME = this.config.theme;

    return this;
};

/** 
 * Run the web application. 
 */
WebUIApp.prototype.run = function() {
    /* Setup display. */
    this._setupDisplay();
       
    /* Start retrieving data. */
    this._acquireLoop();
    
    return this;
};

/**
 * Setup the display.
 */
WebUIApp.prototype._setupDisplay = function() {
    if ((this.$anchor = $(this.config.anchor)).length == 0)
    {
        throw "Anchor " + this.config.anchor + " not found on the page.";
    }
    
    this.display.init(this.$anchor);
};

/**
 * Acquisition main loop.
 */
WebUIApp.prototype._acquireLoop = function() {
    var thiz = this;

    $.ajax({
        url: "/primitive/mapjson/pc/" + this.config.controller + "/pa/" + this.config.dataAction,
        data: {
            period: this.config.dataPeriod,
            duration: this.config.dataDuration,
            from: 0,     // For now we are just asked for the latest data
        },
        success: function(data) {
            thiz._processData(data);
            setTimeout(function() { thiz._acquireLoop(); }, thiz.config.pollPeriod);
        },
        error: function(data) {
            thiz._errorData('Connection error.');
            setTimeout(function() { thiz._acquireLoop(); }, thiz.config.errorPeriod);
        }
    });
};

/**
 * Processes a successfully received data packet.  
 * 
 * @param {object} data data packet
 */
WebUIApp.prototype._processData = function(data) {
    /* A data packet may specify an error so we make need to make this into an 
     * error message. */

    /* AJAX / Primitive / validation error. */
    if (!(data['success'] == undefined || data['success'])) return this._errorData(data['errorReason']);

    /* Hardware communication error. */
    if (data['system-err'] != undefined && data['system-err']) return this._errorData('Hardware communication error.');

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
 * @param {string}  msg error message
 */
WebUIApp.prototype._errorData = function(msg) {    
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
 * Base class widgets that comprise a web user interface.
 * 
 * @constructor
 * @param {string} id the identifier of this widget
 * @param {object} config configuration of widget
 * @config {boolean} [windowed]            whether this widget is enclosed in a window frame (default false)
 * @config {string}  [title]               the title of this widget
 * @config {string}  [icon]                class for icon sprite
 * @config {array}   [classes]             list of classes to add for the container of this box
 * @config {integer} [width]               width of widget in px
 * @config {integer} [height]              height of widget in px
 * @config {integer} [left]                left absolute position of widget in px (default auto position)
 * @config {integer} [top]                 top absolute position of widget in px (default auto position)
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
    throw "Widget->init not implemented.";
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
 * @param {integer} xpos left absolute coordinate
 * @param {integer} ypos top absolute coordinate
 * @param {string} arrow the arrow position, this should be a value from MESSAGE_INDICATOR
 */
Widget.prototype.addMessage = function(message, type, xpos, ypos, arrow) {
    var $box, i, aniIn, bs = 1, up = true, html = 
        "<div class='message-box message-box-" + type + " message-box-in1' style='left:" + xpos + "px; top:" + ypos + "px'>" +
            "<div class='message-box-text'>" + message + "</div>" +
            "<div class='message-box-arrow message-box-arrow-" + arrow + "'>";

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
 * Moves the widget to the specified coordinates.
 * 
 * @param {integer} xpos x (left) position
 * @param {integer} ypos y (top) position
 */
Widget.prototype.moveTo = function(xpos, ypos) {
    this.$widget.css({
        left: xpos,
        top: ypos
    });

    /* Moving is equivalent to dragging, so the dragged event should be fired
     * in case any special handling needs to occur. */
    this.dragged(xpos, ypos);
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

    if (!this.window.shaded)
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
                left: this.$widget.parent().parent().width() / 2 - width / 2,
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

/* ----- UTILITY METHODS ------------------------------------------------------ */

/**
 * Generates the common styled widget box.
 * 
 * @param {string} contents of widget 
 * @return {jQuery} node of the generated box that has been appended to the page
 */
Widget.prototype._generate = function($container, html) {
    if (this.config.windowed)
    {
        this.$widget = $container.append(
          "<div class='window-wrapper window-" + Globals.THEME + " " + 
                      (this.config.classes ? this.config.classes.join(' ') : "") + "' id='" + this.id + "' " +
                      "style='" +
                          (this.config.height ? "height:" + this.config.height + "px;" : "") +
                          (this.config.width ? "width:" + this.config.width + "px;" : "") +
                          (this.config.left ? "left:" + this.config.left + "px;" : "") +
                          (this.config.top ? "top:" + this.config.top + "px;" : "") +
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
    }
    else
    {
        this.$widget = $container.append(
            "<div id='"+ this.id + "' class='no-window-content " + 
                    (this.config.classes ? this.config.classes.join(' ') : "") + "' style='" +
                        (this.config.width ? "width:" + this.config.width + "px;" : "") + 
                        (this.config.height ? "height:" + this.config.height + "px;" : "") +
                        (this.config.left ? "left:" + this.config.left + "px;" : "") +
                        (this.config.top ? "top:" + this.config.top + "px;" : "") +
                    "'>" + 
                html +
            "</div>"
        ).children().last();
    }
    
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
            if (responseCallback) responseCallback(data);
        },
        error: function(data) {
            if (errorCallback) errorCallback(data);
        }
    });
};

/* -- ACCESSOR METHODS -------------------------------------------------------- */

/**
 * Gets the widgets identifier.
 * 
 * @return {string} widget identifier
 */
Widget.prototype.getIdentifier = function() {
    return this.id;
};

/**
 * Gets the specified window property.
 * 
 * @param {string} name of window property
 * @return {mixed} window property value or undefined if none exists
 */
Widget.prototype.getWindowProperty = function(property) {

    /* If the widget has not be intialized, a stale property will be returned. */
    if (!this.$widget) return this.window[property];

    switch (property)
    {
    case 'width':
        return this.window.width === undefined ? this.$widget.outerWidth(true) : this.window.width;
        break;

    case 'height':
        return this.window.height === undefined ? this.$widget.outerHeight(true) : this.window.height;
        break;

    case 'left':
        return this.window.left === undefined ? parseInt(this.$widget.css("left")) : this.window.left;
        break;

    case 'top':
        return this.window.top === undefined ? parseInt(this.$widget.css("top")) : this.window.top;
        break;

    default:
        return this.window[property];
        break;
    }
};

/* ============================================================================
 * == Layouts                                                                ==
 * ============================================================================ */

/*
 * Layouts that are to be implemented:
 * 
 *  -> StackLayout: Widgets stacked with only visible at a time
 *  -> TabLayout: Widgets tabbed with only one visible at a time
 */

/**
 * A layout is used by a container to specify which widgets are currently visible
 * and where widgets are placed in relation to their parent container and siblings.
 */
function Layout(config)
{
    /** @private {object} Configuration object. */
    this.config = config;
    
    /** @protected {Container} Container this layout positions. */
    this.container = undefined;

    /** @protected {integer} Content width. */
    this.width = undefined;

    /** @protected {integer} Content height. */
    this.height = undefined;
}

/**
 * Sets up the display elements required by the layout (such as a tab bar) 
 * to the container contents box. 
 */
Layout.prototype.displayInit = function() { };

/**
 * Removes any display elements required by the layout 
 */
Layout.prototype.displayDestroy = function() { };

/**
 * Runs the layout moving, all contained widgets to their layout defined
 * position.
 */
Layout.prototype.layout = function() {
    throw "Layout->layout not implmented.";
};

/**
 * Scales the layout if the container has been resized.
 * 
 * @param {number} x x direction resize scale
 * @param {number} y y direction resize scale
 */
Layout.prototype.scale = function(x, y) { };

/**
 * Gets the width of the layouts displayed contents. 
 *
 * @return {integer} contents width
 */
Layout.prototype.getWidth = function() {
    return this.width;
};

/**
 * Gets the height of the layouts displayed contents.
 *
 * @return {integer} contents height
 */
Layout.prototype.getHeight = function() {
    return this.height;
};

/**
 * Sets the container whose contents this layout positions.
 *
 * @param {Container} container to set
 */
Layout.prototype.setContainer = function(container) {
    this.container = container;
};

/* ============================================================================
 * == Absolute Layout                                                        ==
 * ============================================================================ */

/**
 * The absolute layout has absolute coordinates of each component.
 * 
 * @param {object} config configuration object
 * @config {object} [coords] coordinates of each widget keyed by widget id
 * @config {integer} [border] border around contents box (default 0)
 */
function AbsoluteLayout(config)
{
    Layout.call(this, config);
    
    if (this.config.coords === undefined) this.config.coords = {};
    if (this.config.border === undefined) this.config.border = 0;
    
    /* Seperate vertical and horizontal borders are needed because resizing
     * may not preserve aspect ratio. */
    this.config.tbBorder = this.config.lrBorder = this.config.border;
}

AbsoluteLayout.prototype = new Layout;

AbsoluteLayout.prototype.layout = function() {
    var i = 0, w, width, height, x, y;

    this.width = this.height = 0;
    
    for (i in this.container.getWidgets())
    {
        w = this.container.getWidget(i);
        
        if (this.config.coords[i] !== undefined)
        {
            x = this.config.coords[i].x;
            y = this.config.coords[i].y;
        }
        else
        {
            x = 0;
            y = 0;
        }
        
        x += this.config.lrBorder;
        y += this.config.tbBorder;
        w.moveTo(x, y);
        
        if ((width = w.getWindowProperty("width")) + x > this.width) this.width = x + width;
        if ((height = w.getWindowProperty("height")) + y > this.height) this.height = y + height;
    }

    this.width += this.config.lrBorder;
    this.height += this.config.tbBorder;
};

AbsoluteLayout.prototype.scale = function(x, y) {
    this.lrBorder *= x;
    this.tbBorder *= y;
    
    var i = 0;
    for (i in this.config.coords)
    {
        this.config.coords[i].x *= x;
        this.config.coords[i].y *= y;
    }
};

/* ============================================================================
 * == Grid Layout                                                            ==
 * ============================================================================ */

/**
 * The grid layout sets out the widgets into the specified columns or rows. If 
 * both columns or rows are specified, the columns configuration takes precendence
 * and the layout will be in columns.
 * 
 * @param {object} config configuration object
 * @config {array} [columns] array of arrays, each specifying the list of \
 * 					indentifiers of the widgets in that column
 * @config {array} [rows] array of arrays, each specifying the list of \ 
 *                  indentifiers of the widgets in that row
 * @config {integer} [padding] number of pixels between widgets (default 10px)
 */
function GridLayout(config) 
{
    Layout.call(this, config);

    if (this.config.padding === undefined) this.config.padding = 10;    
}

GridLayout.prototype = new Layout;

GridLayout.prototype.layout = function() {
    if (this.config.columns) this.columnLayout();
    else if (this.config.rows) this.rowLayout();
    else throw "No columns or rows specified for grid layout.";
};

/**
 * Lays out the widgets in columns.
 */
GridLayout.prototype.columnLayout = function() {
    var i = 0, j = 0, left = this.config.padding, top, colWidth = 0, w, t;

    this.height = 0;
    for (i in this.config.columns)
    {
        colWidth = 0;
        top = this.config.padding;

        for (j in this.config.columns[i])
        {
            w = this.container.getWidget(this.config.columns[i][j]);
            w.moveTo(left, top);

            top += w.getWindowProperty("height") + this.config.padding;
            t = w.getWindowProperty("width");
            
            /* A column is as wide as the widest element. */
            if (t > colWidth) colWidth = t;
        }

        left += colWidth + this.config.padding;

        /* The container height is as tall as the tallest column. */
        if (top > this.height) this.height = top;
    }

    this.width = left;
};

/**
 * Lays out the widgets in rows.
 */
GridLayout.prototype.rowLayout = function() {
    var i = 0, j = 0, left, top = this.config.padding, rowHeight = 0, w, t;

    this.width = 0;
    for (i in this.config.rows)
    {
        rowHeight = 0;
        left = this.config.padding;

        for (j in this.config.rows[i])
        {
            w = this.container.getWidget(this.config.rows[i][j]);
            w.moveTo(left, top);

            left += w.getWindowProperty("width") + this.config.padding;
            t = w.getWindowProperty("height");
            
            /* A column is as wide as the widest element. */
            if (t > rowHeight) rowHeight = t;
        }

        top += rowHeight + this.config.padding;

        /* The container width is as wide as the widest row. */
        if (left > this.width) this.width = left;
    }
    
    this.height = top;
};

/* ============================================================================
 * == Box Layout                                                             ==
 * ============================================================================ */

/**
 * The box layout places widgets in either vertical and horizontal stacks. The 
 * widget order as the order the widgets are setup.
 * 
 * @param {object} config configuration object
 * @config {boolean} [vertical] the orientation (default vertical)
 * @config {integer} [padding] spacing between widgets (default 10)
 * @config {string} [align] align of elements either left, right, center, top, or \
 *                          bottom (default left for vertical, top for horizontal orientiation) 
 */
function BoxLayout(config) 
{
    Layout.call(this, config);
    
    if (this.config.vertical === undefined) this.config.vertical = true;
    if (this.config.padding === undefined) this.config.padding = 10;
    if (this.config.align === undefined) this.config.align = this.config.vertical ? "top" : "left";
}

BoxLayout.prototype = new Layout;

/** @const Alignments for the box layout. */
BoxLayout.ALIGN = {
    left: "left", 
    right: "right",
    center: "center",
    top: "top",
    bottom: "bottom"
};

BoxLayout.prototype.layout = function() {
    if (this.config.vertical) this.verticalLayout();
    else this.horizontalLayout();
};

/**
 * Runs box layout in vertical orientation.
 */
BoxLayout.prototype.verticalLayout = function() {
    var i = 0, top = this.config.padding, widths = [], w, leftOff;
    
    this.width = 0;
    for (i in this.container.getWidgets())
    {
        widths[i] = this.container.getWidget(i).getWindowProperty("width");
        if (widths[i] > this.width) this.width = widths[i];
    }
    
    for (i in this.container.getWidgets())
    {
        leftOff = this.config.padding;
        switch (this.config.align)
        {
        case 'center':
            leftOff += (this.width - widths[i]) / 2;
            break;
            
        case 'right':
            leftOff += this.width - widths[i];
            break;
            
        case 'left': // Default, falls through
        default:
            /* By default aligned to left. */
            break;
        }
        
        w = this.container.getWidget(i);
        w.moveTo(leftOff, top);
        
        top += w.getWindowProperty("height") + this.config.padding;
        
        wid = w.getWindowProperty("width");
        if (wid > this.width) this.width = wid;
    }
    
    this.width += this.config.padding * 2;
    this.height = top;
};

/**
 * Runs box layout in horizontal orientation. 
 */
BoxLayout.prototype.horizontalLayout = function() {
    var i = 0, left = this.config.padding, heights = [ ], w, topOff;
    
    this.height = 0;
    for (i in this.container.getWidgets()) 
    {
        heights[i] = this.container.getWidget(i).getWindowProperty("height");
        if (heights[i] > this.height) this.height = heights[i];
    }
    
    for (i in this.container.getWidgets())
    {
        topOff = this.config.padding;
        switch (this.config.align) 
        {
        case 'center':
            topOff += (this.height - heights[i]) / 2;
            break;
            
        case 'bottom':
            topOff += this.height - heights[i];
            break;
            
        case 'top': // Default case, falls through
        default:
            /* By default aligned to top. */
            break;
        }
        
        w = this.container.getWidget(i);
        w.moveTo(left, topOff);
        
        left += w.getWindowProperty("width") + this.config.padding;
    }
    
    this.width = left;
    this.height += this.config.padding * 2;
};

/* ============================================================================
 * == Flow Layout                                                            ==
 * ============================================================================ */

/**
 * The flow layout arranges widgets in a 'directional flow' where widgets are 
 * placed adjacent or below (depending on orientation), wrapping to the next
 * column or row when the next widget will overflow the specified size. 
 * The display order is the same as the containers insertion order.
 * If no size is set, the flow layout is effectively equivalent to the box 
 * layout. If any single widget is larger than the size, the size is adjusted 
 * to that size.
 * 
 * @param {object} config configuration object
 * @config {boolean} [vertical] the orientation (default vertical)
 * @config {integer} [size] maximum size in pixels that causes wrapping
 * @config {boolean} [center] whether to center contents if size leaves remaining whitespace (default false)
 * @config {integer} [padding] spacing between widgets in pixels (default 10px)
 */
function FlowLayout(config)
{
    Layout.call(this, config);
   
    if (this.config.vertical === undefined) this.config.vertical = true;
    if (this.config.size === undefined) this.config.size = Number.MAX_VALUE;
    if (this.config.center === undefined) this.config.center = false; 
    if (this.config.padding === undefined) this.config.padding = 10;   
}

FlowLayout.prototype = new Layout;

FlowLayout.prototype.layout = function() {
    if (this.config.vertical) this.verticalLayout();
    else this.horizontalLayout();
};

FlowLayout.prototype.verticalLayout = function() {
    var i = 0, left = this.config.padding, top = this.config.padding, heights = [], w, colWidth = 0, 
        col = 0, offsets = [];
    
    for (i in this.container.getWidgets()) 
    {
        if ((heights[i] = this.container.getWidget(i).getWindowProperty("height")) +
                2 * this.config.padding > this.config.size)
        {
            /* If any single widget is larger than the specified size, we need 
             * to expand the size to fit it. */
            this.config.size = heights[i] + 2 * this.config.padding;
        }
    }
    
    if (this.config.center)
    {
        for (i in heights)
        {
            if (top + heights[i] + this.config.padding > this.config.size)
            {
                offsets[col++] = (this.config.size - top) / 2;
                top = this.config.padding;
            }
            
            top += heights[i] + this.config.padding;
        }
        
        offsets[col++] = (this.config.size - top) / 2;
    }
    
    col = 0;
    top = this.config.padding + (this.config.center ? offsets[col++] : 0);
    for (i in this.container.getWidgets())
    {
        if (top + heights[i] + this.config.padding > this.config.size)
        {
            /* Overflow, Wrap to new column. */
            left += colWidth + this.config.padding;
            top = this.config.padding + (this.config.center ? offsets[col++] : 0);
            
            colWidth = 0;
        }
        
        this.container.getWidget(i).moveTo(left, top);
        
        top += heights[i] + this.config.padding;

        w = this.container.getWidget(i).getWindowProperty("width");
        if (w > colWidth) colWidth = w;
    }
    
    this.width = left + colWidth + this.config.padding;
    this.height = this.config.size;
};

FlowLayout.prototype.horizontalLayout = function() {
    var i = 0, left = this.config.padding, top = this.config.padding, widths = [], h, rowHeight = 0, 
        row = 0, offsets = [];
    
    for (i in this.container.getWidgets()) 
    {
        if ((widths[i] = this.container.getWidget(i).getWindowProperty("width")) +
                2 * this.config.padding > this.config.size)
        {
            /* If any single widget is larger than the specified size, we need 
             * to expand the size to fit it. */
            this.config.size = widths[i] + 2 * this.config.padding;
        }
    }
    
    if (this.config.center)
    {
        left = this.config.padding;
        for (i in widths)
        {
            if (left + widths[i] + this.config.padding > this.config.size)
            {
                offsets[row++] = (this.config.size - left) / 2;
                left = this.config.padding;
            }
            
            left += widths[i] + this.config.padding;
        }
        
        offsets[row++] = (this.config.size - left) / 2;
    }
    
    row = 0;
    left = this.config.padding + (this.config.center ? offsets[row++] : 0);
    for (i in this.container.getWidgets())
    {
        if (left + widths[i] + this.config.padding > this.config.size)
        {
            /* Overflow, Wrap to new row. */
            left = this.config.padding + (this.config.center ? offsets[row++] : 0);
            top += rowHeight + this.config.padding;
            rowHeight = 0;
        }
        
        this.container.getWidget(i).moveTo(left, top);
        
        left += widths[i] + this.config.padding;

        h = this.container.getWidget(i).getWindowProperty("height");
        if (h > rowHeight) rowHeight = h;
    }
    
    this.width = this.config.size;
    this.height = top + rowHeight + this.config.padding;
};

FlowLayout.prototype.scale = function(h, v) {
    this.config.size *= this.config.vertical ? v : h;
};

/* ============================================================================
 * == Tab Layout                                                             == 
 * ============================================================================ */

/**
 * The tab layout only shows one widget at time and provides a tab selector to
 * switch between the widgets. 
 * 
 * @param {object} config configuration object
 * @config {string} [position] position of tab bar, either 'top', 'bottom' (horizontal tab bar), 
 *                          'left', 'right' (vertical tab bar) (default top)
 * @config {integer} [border] border padding of widget in pixels (default 10px)
 * @config {boolean} [alignLeft] whether to align left or right for horizonal orientation (default left)
 */
function TabLayout(config)
{
    Layout.call(this, config);
    
    if (this.config.position === undefined) this.config.position = 'top';
    if (this.config.vertical === undefined) this.config.vertical = 
            this.config.position == 'top' || this.config.position == 'bottom';
    if (this.config.border === undefined) this.config.border = 10;
    if (this.config.alignLeft === undefined) this.config.alignLeft = true;
    
    /** @private {jQuery} Tab bar node. */
    this.$tabBar = undefined;
    
    /** @private {Widget} Currently displayed widget. */    
    this.currentWidget = undefined;
}

TabLayout.prototype = new Layout;

/** @const Possible tab bar positions. */
TabLayout.POSITION = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right'
};

TabLayout.prototype.displayInit = function($container) {
    this.$tabBar = this.container.getContentBox().prepend(this._tabBarHTML()).children(":first");
    
    var thiz = this;
    this.$tabBar.children(".tab").click(function() {
        $(this).siblings(".tab-active").removeClass("tab-active");
        $(this).addClass("tab-active");
        thiz._tabClick($(this).text()); 
    });
};

TabLayout.prototype._tabClick = function(title) {
   var i = 0, w = false, x, y, 
       wOff = this.config.vertical ? 0 : this.$tabBar.width() + this.config.border,
       hOff = this.config.vertical ? this.$tabBar.height() + this.config.border : 0;
     
   switch (this.config.position)
   {
   case TabLayout.POSITION.top:
       x = this.config.border;
       y = hOff + this.config.border;
       break;
       
   case TabLayout.POSITION.bottom:
       x = this.config.border;
       y = this.config.border;
       break;
       
   case TabLayout.POSITION.left:
       x = wOff + this.config.border;
       y = this.config.border;
       break;
       
   case TabLayout.POSITION.right:
       x = this.config.border;
       y = this.config.border;
       break;
       
   default:
       throw "Unknown tab bar position: " + this.config.position;
       break;
   }
   
   for (i in this.container.getWidgets())
   {
       if ((w = this.container.getWidget(i)).config.title == title) break;
   }
   
   if (!w)
   {
       alert("Widget with title '" + title + "' not found!");
       return;
   }
   
   /* No need to tab to the current widget. */
   if (w == this.currentWidget) return;
   
   /* Remove the current widget. */
   this.container.toggleEvent(this.currentWidget.id, false);
   
   /* Add the current widget. */
   this.currentWidget = w;
   this.container.toggleEvent(w.id, true);

   /* Resize and move the widget into the center. */
   if (w.getWindowProperty("width") + wOff + this.config.border * 2 != this.width || 
           w.getWindowProperty("height") + hOff + this.config.border * 2 != this.height)
   {
       w.resized(this.width - wOff - this.config.border * 2, this.height - hOff - this.config.border * 2);
       w.resizeStopped(this.width - wOff - this.config.border * 2, this.height - hOff - this.config.border * 2);
   }

   x += (this.width - wOff - w.getWindowProperty("width") - this.config.border * 2) / 2;
   y += (this.height - hOff - w.getWindowProperty("height") - this.config.border * 2) / 2;

   w.moveTo(x, y);

};

TabLayout.prototype._tabBarHTML = function() {
    var i, w, widgets = Object.getOwnPropertyNames(this.container.getWidgets()), html = 
        "<div class='tab-bar tab-bar-" + this.config.position + "'>";
    
    if (this.config.position == TabLayout.POSITION.bottom)
    {
        widgets.reverse();
        html += "<div class='tab-footer'></div>"; 
    }
    
    for (i = 0; i < widgets.length; i++)
    {
        w = this.container.getWidget(widgets[i]);
        
        html += "<div class='tab " + (Globals.THEME === 'flat' ? '' : 'button ') + (i == 0 && this.config.position != TabLayout.POSITION.bottom || 
                        i == widgets.length - 1 && this.config.position == TabLayout.POSITION.bottom ? "tab-active" : "")
                        + "' style='" + (this.config.vertical ? "float:" + (this.config.alignLeft ? "left" : "right") : "") + 
                        (Globals.THEME === 'flat' ? '' : '; width: '+ (this.config.position === 'left' ? '27%;' : '27%;') + ' font-size: 80%;') + "'>" + 
                w.config.title + "</div>";
    }
    
    if (this.config.position == TabLayout.POSITION.top)
    {
        html += "<div class='tab-footer'></div>"; 
    }
    else if (this.config.position == TabLayout.POSITION.bottom)
    {
        html += "<div style='clear:both'></div>";
    }
    else
    {
        html += "<div class='tab-post' style='" + 
                (this.config.position == TabLayout.POSITION.left ? "right:0" : "left:0") + "'></div>";
    }
    
    
    html += 
        "</div>";
        
    return html;
};

TabLayout.prototype.displayDestroy = function() {
    this.currentWidget = undefined;
    this.$tabBar.remove();
};

TabLayout.prototype.layout = function() {
    var i = 0, w, wid, hei, x, y,
        wOff = this.config.vertical ? 0 : this.$tabBar.width() + this.config.border, 
        hOff = this.config.vertical ? this.$tabBar.height() + this.config.border : 0;

    this.width = this.height = 0;

    for (i in this.container.getWidgets())
    {
        if (!this.container.states[i]) continue;
        w = this.container.getWidget(i);

        if ((wid = w.getWindowProperty("width")) > this.width) this.width = wid;
        if ((hei = w.getWindowProperty("height")) > this.height) this.height = hei;    
    }
    
    for (i in this.container.getWidgets())
    {
        w = this.container.getWidget(i);
        
        if (!this.currentWidget || this.currentWidget == w)
        {
            /* The first widget is the widget first displayed. */
            this.currentWidget = w;
            
            wid = w.getWindowProperty("width");
            hei = w.getWindowProperty("height");

            if (wid < this.width || hei < this.height)
            {
                w.resized(this.width, this.height);
                w.resizeStopped(this.width, this.height);
            }
            
            switch (this.config.position) 
            {
            case TabLayout.POSITION.top:
                x = this.config.border;
                y = hOff + this.config.border; 
                break;
                
            case TabLayout.POSITION.bottom:
                this.$tabBar.css({
                    left: 0,
                    top: hei + this.config.border * 2
                });
                x = this.config.border;
                y = this.config.border;
                break;
                
            case TabLayout.POSITION.left:
                x = wOff + this.config.border;
                y = this.config.border;
                break;
                
            case TabLayout.POSITION.right:
                x = this.config.border;
                y = this.config.border;
                break;
                
            default:
                throw "Unknown tab position: " + this.config.position;
                break;
            }

            x += (this.width - w.getWindowProperty("width")) / 2;
            y += (this.height - w.getWindowProperty("height")) / 2; 
            w.moveTo(x, y);
        }
        else
        {
            this.container.toggleEvent(w.id, false);
        }
    }

    this.width += wOff + this.config.border * 2;
    this.height += hOff + this.config.border * 2;
    
    if (this.config.position == TabLayout.POSITION.left || this.config.position == TabLayout.POSITION.right) 
    {
        this.$tabBar.children(".tab-post").css("height", this.height + "px");
    }
};

TabLayout.prototype.scale = function(h, v) {
    if (this.config.position == TabLayout.POSITION.bottom)
    {
        this.$tabBar.css("top", parseInt(this.$tabBar.css("top")) * v + "px");
    }
};

/* ============================================================================
 * == Container Widget                                                       ==
 * ============================================================================ */

/**
 * A container encloses one or more widgets. A container may be set with the 
 * following behaviour:
 * <ul>
 *   <li>Layout - </ul>
 *   <li>Toggling - whereby contained widgets may be selectively be displayed 
 *   or hidden.</li>
 * </ul> 
 * 
 * @param {string} id identifier 
 * @param {object} config configuration object
 * @config {array} [widgets] list of widgets managed by this container
 * @config {Layout} [layout] layout used to specify how widgets are placed (optional)
 */
function Container(id, config)
{
    Widget.call(this, id, config);
    
    /** @protected {object} Map of widget visibility states keyed by widget id. */
    this.states = { };
    
    /** @protected {object} Map of widgets keyed by identifer. */
    this.widgets = { };
    
    /** @protected {jQuery} Box where the contained widgets displayed gets attached to. */
    this.$contentBox = undefined;
    
    /** @protected {boolean} Whether contents are shown or hidden. */
    this.contentsShown = true;
}

Container.prototype = new Widget;

Container.prototype.init = function($container) {    
    var i = 0, w;
	
    this.$widget = this._generate($container, "");
    this.$contentBox = this.config.windowed ? this.$widget.children(".window-content") : this.$widget;
    
    /* Setup widget UI. */
    for (i in this.config.widgets)
    {
    	this.widgets[this.config.widgets[i].id] = w = this.config.widgets[i];
    	
        w._loadState();
        
        if (w.window.shown = this.states[w.id] = !(w.window.shown === false))
        {
            w.init(this.$contentBox);

            if (!this.config.layout)
            {
                /* No layout, restore windowing. */
                if (w.window.expanded)
                {
                    w.window.expanded = false;
                    w.toggleWindowExpand();
                }
                
                if (w.window.shaded)
                {
                    w.window.shaded = false;
                    w.toggleWindowShade();
                }
            }
        }
    }
    
    if (this.config.layout)
    {
        this.config.layout.setContainer(this);
        this.config.layout.displayInit();
        this.config.layout.layout();

        /* Account for CSS padding. */
        this.$contentBox.css({
            width: this.config.layout.getWidth() - parseInt(this.$contentBox.css("padding-left")) - 
                        parseInt(this.$contentBox.css("padding-right")),
            height: this.config.layout.getHeight() - parseInt(this.$contentBox.css("padding-top")) -
                        parseInt(this.$contentBox.css("padding-bottom"))
        });
    }
    
    /* Restore sizing.*/
    if (this.window.width && this.window.height) this.resizeStopped(this.window.width, this.window.height);
};

Container.prototype.consume = function(data) {
    var i = 0;
    for (i in this.widgets) if (this.states[i]) this.widgets[i].consume(data);
};

Container.prototype.destroy = function() {
    var i = 0;
    for (i in this.widgets) 
    {
        if (this.states[i]) 
        {
            this.widgets[i].destroy();
            this.states[i] = false;
        }
    }
    
    if (this.config.layout) this.config.layout.displayDestroy();
    
    Widget.prototype.destroy.call(this);
};

Container.prototype.resized = function(width, height) {
    /* Mask this function during initial _generate resize restore. */
    if (this.config.layout && this.config.layout.getWidth() === undefined) return;
    
    if (this.contentsShown)
    {
        this.$contentBox.hide();
        this.contentsShown = false;
    }
};

Container.prototype.resizeStopped = function(width, height) {
    /* Mask this function durinig initial _generate resize restore. */
    if (this.config.layout && this.config.layout.getWidth() === undefined) return;
    
    this.$contentBox.show();
    this.contentsShown = true;
    
    var i = 0, w, h, 
        horiz = (width - 12) / this.config.layout.getWidth(), 
        vert = (height - 35) / this.config.layout.getHeight() ;
    
    for (i in this.widgets)
    {   
        if (!this.states[i]) continue;
        
        this.widgets[i].$widget.css({
            width: w = this.widgets[i].getWindowProperty("width") * horiz, 
            height: h = this.widgets[i].getWindowProperty("height") * vert
        });
        this.widgets[i].resized(w, h);
        this.widgets[i].resizeStopped(w, h);
    }

    if (this.config.layout)
    {
        this.config.layout.scale(horiz, vert);
        this.config.layout.layout();
        this.$contentBox.css({
            width: this.config.layout.getWidth() - parseInt(this.$contentBox.css("padding-left")) - 
                        parseInt(this.$contentBox.css("padding-right")),
            height: this.config.layout.getHeight() - parseInt(this.$contentBox.css("padding-top")) -
                        parseInt(this.$contentBox.css("padding-bottom"))
        });
    }
    
    if (this.config.windowed)
    {
        this.$widget.css({
            width: "auto",
            height: "auto"
        });
    }
};

/**
 * Sets a widget either to be displaying or hidden.
 * 
 * @param {string} id widget intentifier
 * @param {boolean} visible whether the widget is displayed or hidden
 */
Container.prototype.toggleEvent = function(id, visible) {
    if (this.states[id] = visible)
    {
        this.widgets[id].init(this.$contentBox);
    }
    else
    {
        this.widgets[id].destroy();
    }
};

/**
 * Returns the contents box of this container.
 * 
 * @return ${jQuery} contents box
 */
Container.prototype.getContentBox = function() {
    return this.$contentBox;
};

/**
 * Returns the widgets this container holds.
 * 
 * @return {array} list of widgets this widget holds 
 */
Container.prototype.getWidgets = function() {
	return this.widgets;
};

/**
 * Gets the widget with the specified identifier.
 * 
 * @param {string} id widget identifier
 * @return {Widget|null} widget or null of non exists with id
 */
Container.prototype.getWidget = function(id) {
	return this.widgets[id];
};

/* ============================================================================
 * == Spacer widget                                                          ==
 * ============================================================================ */

/**
 * A spacer is a reserved block of space that may be set to have a border or a 
 * solid color. For a spacer to be useful, its width and height should be set.
 * 
 * @param {string} id spacer identifier
 * @param {object} config configuration option
 * @config {string} [border] color of the border (default no border)
 * @config {string} [color] color of the spacer (default no color)
 * @config {boolean} [round] whether to round the corners of the spacer (default false)
 * @config {string} [css] additional CSS directives to add to the spacer (optional)
 */
function Spacer(id, config) 
{
    Widget.call(this, id, config);
    
    if (this.config.css === undefined) this.config.css = '';
}

Spacer.prototype = new Widget;

Spacer.prototype.init = function($container) {
    this.$widget = this._generate($container, 
            "<div class='spacer-inner' style='" +
                (this.config.border ? "border: 1px solid " + this.config.border + ";" : "") +
                (this.config.color ? "background-color:" + this.config.color + ";" : "") +
                (this.config.round ? "border-radius:" + 
                        ((this.config.width < this.config.height ? this.config.width : this.config.height) / 2) + "px;" : "") + 
                this.config.css + 
            "'>" + this.config.width + "x" + this.config.height + "</div>"
    );
};

Spacer.prototype.resized = function(width, height) {
    if (this.config.round)
    {
        this.$widget.children("border-radius", (width < height ? width : height) / 2);
    }
    this.$widget.css({ width: width, height: height });
    this.$widget.children().text(Math.round(width) + "x" + Math.round(height));
};

/* ============================================================================
 * == Graph widget                                                           ==
 * ============================================================================ */

/** 
 * Graph widget. This widget contains a scrolling graph displays a series of 
 * data points that (usually) represent a time series.
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
function Graph(id, config)
{
	Widget.call(this, id, config);

	/* Default options. */
	if (this.config.colors === undefined )     this.config.colors = { };
	if (this.config.autoScale === undefined)   this.config.autoScale = false;
	if (this.config.minValue === undefined)    this.config.minValue = 0;
	if (this.config.maxValue === undefined)    this.config.maxValue = 100;
	if (this.config.duration === undefined)    this.config.duration = 60;
	if (this.config.period === undefined)      this.config.period = 100;
	if (this.config.xLabel === undefined)      this.config.xLabel = "Time (s)";
	if (this.config.yLabel === undefined)      this.config.yLabel = '';
	if (this.config.traceLabels === undefined) this.config.traceLabels = true;
	if (this.config.fieldCtl === undefined)    this.config.fieldCtl = false;
	if (this.config.autoCtl === undefined)     this.config.autoCtl = false;
	if (this.config.durationCtl === undefined) this.config.durationCtl = false;
	if (this.config.vertScales === undefined)  this.config.vertScales = 5;
	if (this.config.horizScales === undefined) this.config.horizScales = 8;
	if (this.config.width === undefined) this.config.width = 300;
	if (this.config.height === undefined) this.config.height = 300;
	
	/** @private {object} Data fields. */
	this.dataFields = undefined;
	
	/** @private {integer} The range of values. If autoscaling, this is determined
	 *  as the difference between the largest and smallest value, if not this is the 
	 *  difference between the max and min graphed values. */
	this.graphRange = this.config.maxValue - this.config.minValue;
	
	/** @private {number} The zero point offset of the graph in pixels. */
	this.graphOffset = this.config.minValue / this.graphRange;
	
	/** @private {integer} Width of the graph in pixels. */
	this.graphWidth = undefined;
	
	/** @private {integer} Height of the graph in pixels. */
	this.graphHeight = undefined;
	
	/** @private {CanvasRenderingCOntext2D} Canvas context. */
	this.ctx = null;

	/** @private {integer} The time of the first data update in seconds since epoch. */
	this.startTime = undefined;

	/** @private {integer} The time of the latest data update in seconds since epoch. */
	this.latestTime = undefined;

	/** @private {integer} The displayed duration in seconds. */
	this.displayedDuration = this.config.duration;
}
Graph.prototype = new Widget;

/** @const {array} List of default trace colors. */
Graph.COLORS = [
     "#FCFF00", "#FF3B3B", "#8C42FB"
];

Graph.prototype.init = function($container) {
    if (!(this.config.fields)) throw "Options not set";
    
    var i = 0, c = 0, thiz = this;
    
    /* Field dynamic properties. */
    if (!this.dataFields)
    {
        this.dataFields = { };
        for (i in this.config.fields)
        {
            this.dataFields[i] = {
                    label: this.config.fields[i],
                    visible: true,
                    values: [ ],
                    seconds: 0,
                    color: this.config.colors.hasOwnProperty(i) ? this.config.colors[i] : 
                        Graph.COLORS[c++ % Graph.COLORS.length]
            };
        }
    }
    
    /* Size reset. */
    this.graphWidth = this.config.width ? this.config.width - 84 : 400;
    this.graphHeight = this.config.height ? this.config.height - 134 : 160;
    if (!this.config.traceLabels) this.graphHeight += 30;
    if (!this.config.windowed) 
    {
        this.graphHeight += 50;
        this.graphWidth += 15;
    }
    
	this.$widget = this._generate($container, this._buildHTML());
	
	/* Positioning based on configured options. */
	c = this.$widget.find(".graph-left-axis-label");
	c.css({
	    top: (this.config.windowed ? 30 : 0) + this.graphHeight / 2,
	    left: -0.545 * c.width() + (this.config.windowed ? 26.1 : 21)
	});

	/* Add the canvas panel. */
	var canvas = Util.getCanvas(this.id, this.graphWidth, this.graphHeight);
	this.$widget.find("#" + this.id + "-canvas").append(canvas);
	this.ctx = canvas.getContext("2d");

	/* Event handlers. */
	if (this.config.fieldCtl && this.config.traceLabels)
	{
    	this.$widget.find('.graph-label').click(function() {    
    		thiz._showTrace($(this).children(".graph-label-text").text(), 
    				$(this).find(".switch .switch-slide").toggleClass("switch-on switch-off").hasClass("switch-on"));
    	});
	}
	
	if (this.config.autoCtl || this.config.durationCtl) this.$widget.find(".graph-controls-show").click(function() {
	    thiz._showControls($(this).find(".switch .switch-slide").toggleClass("switch-on switch-off").hasClass("switch-on"));
	});
	
	if (this.config.autoCtl) this.$widget.find(".graph-autoscale").click(function() {
	   thiz._enableAutoscale($(this).find(".switch .switch-slide").toggleClass("switch-on switch-off").hasClass("switch-on")); 
	});

	/* Draw the first frame contents. */
	this._drawFrame();
};

Graph.prototype._buildHTML = function() {
	var i = 0, unitScale, styleScale, html = '', left, top; 
	
	if (this.config.autoCtl || this.config.durationCtl)
    {
        /* Controls show / hide button. */
        html += "<div class='graph-controls-show'>" +
                "   <label for='" + this.id + "-graph-controls-show' class='graph-label-text'>Controls</label>" +  
                "</div>";
    }

	/* Graph labels. */
	if (this.config.traceLabels)
	{
    	html += "<div class='graph-labels'>";
    	for (i in this.dataFields)
    	{
    		html += "	<div class='graph-label'>" +
    		        (this.config.fieldCtl ?
    				"		<label for='graph-label-" + i + "' class='graph-label-text'>" + this.dataFields[i].label + "</label>" +  
    		        "       <div id='graph-label-" + i + "' class='switch graph-label-enable'>" +
            		"		    <div class='switch-animated switch-slide switch-on' " +
            		"                 style='background-color:" + this.dataFields[i].color + "'></div>" +
            		"       </div>"
            		:
            		"       <div class='graph-label-text' style='cursor:default'>" +
            		"           <div class='graph-label-color-box' " +
            		"                   style='background-color:" + this.dataFields[i].color + "'></div>" +
            		                this.dataFields[i].label + 
            		"       </div>" ) +
    				"	</div>";
    	}
    	html += "</div>";
	}

	/* Left scale. */
	unitScale = Math.floor(this.graphRange / this.config.vertScales);
	styleScale = this.graphHeight / this.config.vertScales;
	top = this.config.windowed ? (this.config.traceLabels ? 33 : 3) : (this.config.traceLabels ? 26 : 0);
	left = this.config.windowed ? 15 : 6;
	html += "<div class='graph-left-scales' style='top:" + top + "px;left:" + left + "px'>";
	for (i = 0; i <= this.config.vertScales; i++)
	{
		html += "<div class='graph-left-scale-" + i + "' style='top:"+ (styleScale * i) + "px'>" + 
					(this.config.maxValue - i * unitScale)+ 
				"</div>";
	}
	html += "</div>";

	/* Left axis label. */
	html += "<div class='graph-axis-label graph-left-axis-label'>" + this.config.yLabel + "</div>";

	/* Canvas element holding box. */
	html += "<div id='" + this.id +  "-canvas' class='graph-canvas-box gradient' style='height:" + this.graphHeight + 
	                "px;width:" + this.graphWidth + "px;margin-top:" + (this.config.traceLabels ? "30" : "0") + "px'></div>";

	/* Bottom scale. */
	html += "<div class='graph-bottom-scales'>";
	styleScale = this.graphWidth / this.config.horizScales;
	for (i = 0; i <= this.config.horizScales; i++)
	{
		html += "<div class='graph-bottom-scale-" + i + " " + (i == this.config.horizScales ? "graph-bottom-scale-last" : "") +
		        "' style='left:" + (styleScale * i - 5) + "px'>&nbsp</div>";
	}
	html += "</div>";

	/* Bottom axis label. */
	html += "<div class='graph-axis-label graph-bottom-axis-label'>" + this.config.xLabel + "</div>";
	
	if (this.config.autoCtl)
	{
    	/* Controls. */
    	html += "<div class='graph-controls'>" +
            	"   <div class='graph-autoscale'>" +
                "       <label for='" + this.id + "-graph-autoscale' class='graph-label-text'>Autoscale</label>" +  
                "       <div id='" + this.id + "-graph-autoscale' class='switch'>" +
                "          <div class='switch-animated switch-slide " + (this.config.autoScale ? "switch-on" : "") + "'></div>" +
                "       </div>" +
                "   </div>" +
    	        "</div>";
	}

	return html;
};

Graph.prototype.consume = function(data) { 
    var i = 0;

    if (this.startTime == undefined) this.startTime = data.start;
    this.latestTime = data.time;

    for (i in this.dataFields)
    {
        if (data[i] === undefined) continue;

        this.dataFields[i].values = data[i];
        this.dataFields[i].seconds = data.duration;
        this.displayedDuration = data.duration;
    }
    
    if (this.config.autoScale) 
    {
        /* Determine graph scaling for this frame and label it. */
        this._adjustScaling();
        this._updateDependantScale();
    }

    this._drawFrame();
    this._updateIndependentScale();
};

/**
 * Draws a graph frame.
 */
Graph.prototype._drawFrame = function() {
	var i = 0;
	
	/* Clear old frame. */
	this.ctx.clearRect(0, 0, this.graphWidth, this.graphHeight);
	
	/* Draw scales. */
	this._drawDependantScales();
	this._drawIndependantScales();
	    
	/* Draw the trace for all graphed variables. */
	for (i in this.dataFields) if (this.dataFields[i].visible) this._drawTrace(this.dataFields[i]);
};

/**
 * Adjusts the scaling and offset based on the range of values in the graphed
 * datasets.
 */
Graph.prototype._adjustScaling = function() {
    var min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY, i = 0, j;

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
 * Draws the dependant scales on the interface.
 */
Graph.prototype._drawDependantScales = function() {
	var i, j,
		off = this.graphHeight - Math.abs(this.graphOffset * this.graphHeight);

	this.ctx.save();
	this.ctx.beginPath();
	
	this.ctx.strokeStyle = "#FFFFFF";
	
	/* Zero line. */
	this.ctx.lineWidth = 3;
	if (off > 0 && off < this.graphHeight)
	{
	    this.ctx.moveTo(0, off + 1.5);
	    this.ctx.lineTo(this.graphWidth, off + 1.5);
	}
	this.ctx.stroke();
	
	this.ctx.lineWidth = 0.3;

	for (i = 0; i < this.graphHeight; i += this.graphHeight / this.config.vertScales)
	{
		for (j = 0; j < this.graphWidth; j += Graph.STIPPLE_WIDTH * 1.5)
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
 * Draws the independant scales on the interface.
 */
Graph.prototype._drawIndependantScales = function() {
    /* For the time series graph, no scales are drawn. */
};

/**
 * Draws the trace of the data. 
 * 
 * @param {array} dObj data object
 */
Graph.prototype._drawTrace = function(dObj) {
    var xStep = this.graphWidth / (dObj.seconds * 1000 / this.config.period), 
	    yScale = this.graphHeight / this.graphRange, i, yCoord;

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
		yCoord = this.graphHeight - dObj.values[i] * yScale + this.graphOffset * this.graphHeight;
		/* If value too large, clipping at the top of the graph. */
		if (yCoord > this.graphHeight) yCoord = this.graphHeight;
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
 * Updates the independent scale.
 */
Graph.prototype._updateIndependentScale = function() {
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
Graph.prototype._showTrace = function(label, show) {
	var i = 0;
	for (i in this.dataFields)
	{
		if (this.dataFields[i].label == label)
		{
			this.dataFields[i].visible = show;
		}
	}

	this._drawFrame();
};


Graph.prototype.resized = function(width, height) {
    this.graphWidth = this.graphWidth + (width - this.config.width);
    this.graphHeight = this.graphHeight + (height - this.config.height);
    
    this.config.width = width;
    this.config.height = height;
    
    /* Adjust dimensions of canvas, box and other stuff. */
    this.$widget.find("canvas").attr({
        width: this.graphWidth,
        height: this.graphHeight
    });
    
    this.$widget.find(".graph-canvas-box").css({
        width: this.graphWidth,
        height: this.graphHeight 
    });
    
    var i, $s = this.$widget.find(".graph-left-scale-0");
    
    /* Left scales. */
    for (i = 0; i <= this.config.vertScales; i++)
    {
        $s.css("top", this.graphHeight / this.config.vertScales * i);
        $s = $s.next();
    }
    
    /* Left label. */
    this.$widget.find(".graph-left-axis-label").css("top", (this.config.windowed ? 30 : 0) + this.graphHeight / 2);
    
    /* Bottom scales. */
    for (i = 0, $s = this.$widget.find(".graph-bottom-scale-0"); i <= this.config.horizScales; i++)
    {
        $s.css("left", this.graphWidth / this.config.horizScales * i);
        $s = $s.next();
    }
    
    this.$widget.css({
        width: width,
        height: height
    });
};

Graph.prototype.resizeStopped = function(width, height) {
    this.resized(width, height);
    this._drawFrame();
};

/**
 * Enables or disables graph autoscaling. 
 * 
 * @param {boolean} autoscale true if graph autoscales
 */
Graph.prototype._enableAutoscale = function(autoscale) {
    if (!(this.config.autoScale = autoscale))
    {
        this.graphRange = this.config.maxValue - this.config.minValue;
        this.graphOffset = this.config.minValue / this.graphRange;
        this._updateDependantScale();
    }
};


/**
 * Shows or hides the graph controls.
 * 
 * @param {boolean} show whether to show the controls
 */
Graph.prototype._showControls = function(show) {
    var $n = this.$widget.find(".graph-controls");
    $n.css("display", $n.css("display") == "none" ? "block" : "none");
    this.$widget.css("height", "auto");
};

/* ============================================================================
 * == Scatter Plot Widget.                                                   ==
 * ============================================================================ */

/**
 * The scatter plot widget is a graph that plots points to show the 
 * relationship between two sets of data. 
 * 
 * @param {string} id graph identifier
 * @param {object} config configuration object
 * @config {object}  [fields]         map of graphed data fields with independant field => dependant field or 
 *                                      field => [dependant field, dependant field] 
 * @config {object}  [labels]         map of graphed data labels with independant field => label or
 *                                      field => [label, label] (optional)
 * @config {object}  [colors]         map of graph trace colors with independant field => color or
 *                                      field => [color, color] (optional)
 * @config {boolean} [continuous]      whether to plot a continous line or a series of points (default true)
 * @config {boolean} [autoScale]      whether to autoscale the graph dependant (default off)
 * @config {integer} [dependantMin]   minimum value that is graphed for dependant axis, implies not autoscaling (default 0)
 * @config {integer} [dependantMax]   maximum value that is graphed for dependant axis, implies not autoscaling (default 100)
 * @config {integer} [independantMin] minimum value that is graphed for dependant axis, implies not autoscaling (default 0)
 * @config {integer} [independantMax] maximum value that is graphed for dependant axis, implies not autoscaling (default 100)
 * @config {integer} [sampleSize]     number of samples to graph (default data size) 
 * @config {integer} [duration]       number of seconds this graph displays if time series (default data size)
 * @config {integer} [period]         period betweeen samples in milliseconds if time series (default 100)
 * @config {string}  [xLabel]         X axis label (default (Time (s))
 * @config {String}  [yLabel]         Y axis label (optional)
 * @config {boolean} [traceLabels]    whether to show trace labels (default true)
 * @config {boolean} [fieldCtl]       whether data field displays can be toggled (default false)
 * @config {boolean} [autoCtl]        whether autoscaling enable control is shown (default false)
 * @config {boolean} [durationCtl]    whether duration control slider is displayed
 * @config {integer} [vertScales]     number of vertical scales (default 5)
 * @config {integer} [horizScales]    number of horizontal scales (default 5)
 */
function ScatterPlot(id, config)
{
    /* Overriding base default options. */
    if (config.labels === undefined) config.labels = { };
    if (config.horizScales === undefined) config.horizScales = 5;
    
    /* Configuration synonyms. */
    if (config.dependantMin) config.minValue = config.dependantMin;
    if (config.dependantMax) config.maxValue = config.dependantMax;
    
    Graph.call(this, id, config);
    
    /* Discarding base default values. */
    this.config.duration = config.duration;
    
    /* Default options. */
    if (this.config.independantMin === undefined) this.config.independantMin = 0;
    if (this.config.independantMax === undefined) this.config.independantMax = 100;
    if (this.config.continuous === undefined) this.config.continuous = true;
    
    /** @private {integer} The range of values on the indepenedant scale. */
    this.independantRange = this.config.independantMax - this.config.independantMin;
    
    /** @private {integer} Offset to the zero value on the independant range. */
    this.independantOffset = this.config.independantMin / this.independantRange;
    
    /** @private {integer} Displayed sample size. If this is not set, the
     *  packet data length will be used as the sample size. */
    this.sampleSize = undefined;
    if (this.config.sampleSize) this.sampleSize = this.config.sampleSize;
    else if (this.config.duration && this.config.period) this.sampleSize = this.config.duration * this.config.period;
}

ScatterPlot.prototype = new Graph;

ScatterPlot.prototype.init = function($container) {
    var i = 0, j, c = 0;
    
    if (!this.dataFields)
    {
        this.dataFields = { };
        for (i in this.config.fields)
        {
            if ($.isArray(this.config.fields[i]))
            {
                for (j = 0; j < this.config.fields[i].length; j++)
                {
                    this.dataFields[i + "-" + j] = {
                            independant: i,
                            dependant: this.config.fields[i][j],
                            label: this.config.labels.hasOwnProperty(i) && this.config.labels[i].length > j ?
                                        this.config.labels[i][j] : "",
                            visible: true,
                            independantValues: [ ],
                            dependantValues: [ ],
                            color: this.config.colors.hasOwnProperty(i) && this.config.colors[i].length > j? 
                                        this.config.colors[i][j] : Graph.COLORS[c++ % Graph.COLORS.length]
                    };
                }
            }
            else
            {
                this.dataFields[i] = {
                        independant: i,
                        dependant: this.config.fields[i],
                        label: this.config.labels.hasOwnProperty(i) ? this.config.labels[i] : "",
                        visible: true,
                        independantValues: [ ],
                        dependantValues: [ ],
                        color: this.config.colors.hasOwnProperty(i) ? this.config.colors[i] : 
                            Graph.COLORS[c++ % Graph.COLORS.length]
                };
            }
        }
    }
    
    Graph.prototype.init.call(this, $container);
    
    this._updateDependantScale();
    this._updateIndependentScale();
};

ScatterPlot.prototype._drawIndependantScales = function() {
    var i, j,
        off = this.graphWidth - Math.abs(this.independantOffset * this.graphWidth);

    this.ctx.save();
    this.ctx.beginPath();

    this.ctx.strokeStyle = "#FFFFFF";

    /* Zero line. */
    this.ctx.lineWidth = 3;
    if (off > 0 && off < this.graphWidth)
    {
        this.ctx.moveTo(off - 1.5, 0);
        this.ctx.lineTo(off - 1.5, this.graphHeight);
    }
    this.ctx.stroke();
    
    this.ctx.lineWidth = 0.3;

    for (i = 0; i < this.graphWidth; i += this.graphWidth / this.config.horizScales)
    {
        for (j = 0; j < this.graphHeight ; j += Graph.STIPPLE_WIDTH * 1.5)
        {
            this.ctx.moveTo(i - 0.25, j);
            this.ctx.lineTo(i - 0.25, j + Graph.STIPPLE_WIDTH);
        }
    }

    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
};


ScatterPlot.prototype.consume = function(data) {
    var i = 0, size;
    
    for (i in this.dataFields)
    {
        if (data[this.dataFields[i].independant] === undefined ||
                data[this.dataFields[i].dependant] === undefined) continue;
        
        size = this.sampleSize ? this.sampleSize : data[this.dataFields[i].independant].length;

        this.dataFields[i].independantValues = this._pruneSample(data[this.dataFields[i].independant], size);
        this.dataFields[i].dependantValues = this._pruneSample(data[this.dataFields[i].dependant], size);
    }
    
    if (this.config.autoScale) 
    {
        /* Determine graph scaling for this frame and label it. */
        this._adjustScaling();
        this._updateDependantScale();
        this._updateIndependentScale();
    }

    this._drawFrame();
};

/**
 * Prune the sample dataset to the number of specified size. If the values 
 * length is less than the specified size, the data is padded with zeros, if
 * the values length is greater than the specified size, the oldest data 
 * (from the beginning of the values) is discarded.
 * 
 * @param {array} values list of samples
 * @param {integer} desired data size
 * @return {array} pruned values
 */
ScatterPlot.prototype._pruneSample = function(values, size) {
    if (values.length < size)
    {
        while (values.length < size) values.push(0);
    }
    else if (values.length > size)
    {
        while (values.length > size) values.shift();
    }
    
    return values;
};

ScatterPlot.prototype._drawTrace = function(dObj) {
    var i = 0, xCoord, yCoord;
    
    this.ctx.save();
    this.ctx.beginPath();
    
    this.ctx.strokeStyle = dObj.color;
    this.ctx.lineWidth = 3;
    this.ctx.lineJoin = "round";
    this.ctx.shadowColor = "#222222";
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    do 
    {
        xCoord = this.graphWidth / this.independantRange * dObj.independantValues[i] - 
                this.independantOffset * this.graphWidth;
        if (xCoord < 0) xCoord = 1;
        if (xCoord > this.graphWidth - 1) xCoord = this.graphWidth;
        
        yCoord = this.graphHeight - this.graphHeight / this.graphRange * dObj.dependantValues[i] + 
                this.graphOffset * this.graphHeight;
        if (yCoord < 0) yCoord = 1;
        if (yCoord > this.graphHeight) yCoord = this.graphHeight - 1;
        
        if (this.config.continuous)
        {
            if (i == 0) this.ctx.moveTo(xCoord, yCoord); 
            else this.ctx.lineTo(xCoord, yCoord);
        }
        else
        {
            this.ctx.moveTo(xCoord, yCoord);
            this.ctx.lineTo(xCoord + 1, yCoord + 1);
            this.ctx.stroke();
        }
    }
    while (++i < dObj.independant.length);
    
    this.ctx.stroke();
    this.ctx.restore();
};

ScatterPlot.prototype._updateIndependentScale = function() {
    var i, $s = this.$widget.find(".graph-bottom-scale-0");
    
    for (i = 0; i <= this.config.horizScales; i++)
    {
        $s.html(Util.zeroPad(
                this.independantRange / this.config.horizScales * i + this.independantRange * this.independantOffset,
                this.independantRange >= this.config.horizScales * 2 ? 0 : 1));
        $s = $s.next();
    }
};

ScatterPlot.prototype._adjustScaling = function() {
    var dmin = Number.POSITIVE_INFINITY, imin = Number.POSITIVE_INFINITY, dmax = Number.NEGATIVE_INFINITY, 
            imax = Number.NEGATIVE_INFINITY, i = 0, j;

    for (i in this.dataFields)
    {
        for (j = 0; j < this.dataFields[i].independantValues.length; j++)
        {
            if (this.dataFields[i].independantValues[j] < imin) imin = this.dataFields[i].independantValues[j];
            if (this.dataFields[i].independantValues[j] > imax) imax = this.dataFields[i].independantValues[j];
            if (this.dataFields[i].dependantValues[j] < dmin) dmin = this.dataFields[i].dependantValues[j];
            if (this.dataFields[i].dependantValues[j] > dmax) dmax = this.dataFields[i].dependantValues[j];
        }
    }

    this.graphRange = dmax - dmin;
    this.graphOffset = dmin / this.graphRange;
    
    this.independantRange = imax - imin;
    this.independantOffset = imin / this.independantRange;
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
 * @config {string} [led] set switch LED indicator (optional)
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
                (this.config.led ?'<div class="led switch-led led-novalue"></div>' : '') +
                '<div class="switch-vertical switch-stick-base"></div>' +
                '<div class="switch-vertical switch-stick switch-' + this.config.stickColor + '-down"></div>' +      
                '<div style="clear:both"></div>' +
            '</div>'
        : // Horizontal orientation
            '<div class="switch-container" >' +
                (this.config.label ? '<label class="switch-label">' + this.config.label + ':</label>' : '') +
                '<div class="switch">' +
                    '<div class="switch-animated switch-slide"></div>' +
                '</div>' +
            '</div>'
    );
    
    if (!this.config.vertical && this.config.width === undefined)
    {
        this.config.width = this.$widget.find("label").outerWidth(true) + 
                            this.$widget.find(".switch").outerWidth(true) + 13;
        this.$widget.css("width", this.config.width + "px");
    }
    
    var thiz = this;
    this.$widget.find(".switch-label, .switch, .switch-vertical").click(function() { thiz._clicked(); });
    
    /* Set existing state. */
    if (this.value !== undefined) this._setDisplay(this.value);
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
            this.$widget.find(".switch-stick").removeClass("switch-" + this.config.stickColor + "-down");
            this.$widget.find(".switch-stick").addClass("switch-" + this.config.stickColor + "-up");
            this.$widget.find(".switch-led").addClass("led-on");
            this.$widget.find(".switch-led").removeClass("led-novalue");
        }
        else
        {
            this.$widget.find(".switch-stick").addClass("switch-" + this.config.stickColor + "-down");
            this.$widget.find(".switch-stick").removeClass("switch-" + this.config.stickColor + "-up");
            this.$widget.find(".switch-led").addClass("led-novalue");
            this.$widget.find(".switch-led").removeClass("led-on");
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
 * @config {array}  [values] the list of potential values
 * @config {number} [radius] the radius of the switch
 * @config {string} [label]  switch label (optional)
 * @config {string} [color] set the switch color (default black)
 */
function RotarySwitch(id, config)
{
    if (!(config.field || config.action || config.values)) throw "Options not supplied."; 
    
    Widget.call(this, id, config);
    
    /* Default options. */
    if (this.config.label === undefined) this.config.label = '';

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
    	"<div class='rotary-container " + (this.config.label ? 'rotary-container-label' : '') + 
    	"' style='width:" + r * 3 + "px'>" +
    	(this.config.label ? "<label>" + this.config.label + "</label>" : '') +
        "<div id='rotary-container-" + this.id + "' class='rotary-switch-container' " + 
            "style='width:" + r * 2 +"px;height:" + r * 2 + "px;'>" +
                "<div id='rotary-switch-" + this.id + "' class='rotary-switch rotary-" + 
                (this.config.color ? this.config.color : 'black') + "'></div>" +
        "</div></div>"
    );

    /* Generates the positions of the switches' points. */
    for(var i = 0; i < v.length; i++) {

    	/* Calculate the X and Y axes of the current point.  */
        var x = (r - 5) - (r + 10) * Math.cos(2 * Math.PI * i / v.length),
            y = (r - 5) - (r + 10) * Math.sin(2 * Math.PI * i / v.length),
            p = v[(v.length - i)];

        $("#rotary-container-" + this.id).append(
            "<div class='rotary-switch-val " +
            ( y <= 55 ? y = (y - ( p ? 2 / 2 : '')) - (r >= 60 ? 9 : 4): 0) + "' id='" + this.id + "-" + i + "' " +
            "style='left:" + Math.round(y) + "px;top:" + Math.round(x) + "px' " + "value=" +
            ( p ? p.value : v[0].value) + ">" + ( p ? p.label : v[0].label) + "</div>"
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
    this.val = $(point).attr('value');
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
    var deg = Math.atan((pos.left - x0) / (y0 - pos.top)) * 180 / Math.PI;
    deg = x0 < pos.top ? Math.round(deg + 180) : Math.round(deg);

    /* Rotates the switch. */
    $(point).parent().find('.rotary-switch').css({
        '-webkit-transform' : 'rotate('+ deg +'deg)',
        '-moz-transform' : 'rotate('+ deg +'deg)',
        '-ms-transform' : 'rotate('+ deg +'deg)',
        '-o-transform' : 'rotate('+ deg +'deg)',
        'transform' : 'rotate('+ deg +'deg)'
    });
};

/* ============================================================================
 * == Button widget                                                          ==
 * ============================================================================ */

/**
 * Button that posts to the server when clicked.
 * 
 * @param {string} id identifier of widget
 * @param {object} config configuration of widget
 * @config {string}  [action] action to send to when pressed
 * @config {object}  [params] parameters to be sent when pressed (optional)
 * @config {string}  [label] the label to display on the button (optional)
 * @config {string}  [image] an image to display on the button (optional)
 * @config {boolean} [circular] whether the button is circular (default false)
 * @config {number}  [diameter] The size of a push button diameter in pixels (default 100px)
 * @config {string}  [color]  custom color setting for the button (default #EFEFEF)
 * @config {string}  [clickColor] color of button when clicked (default #CCCCCC)
 * @config {string}  [pushColor] color of the push button (optional)
 * @config {boolean} [overlay] whether the button has the clear style overlay (default false)
 * @config {function} [callback] callback to be invoked with response of posts (optional)
 */
function Button(id, config)
{
    Widget.call(this, id, config);
    this.config.classes.push("button-outer");

    /* Default options. */
    if (this.config.params === undefined) this.config.params = { };
    if (this.config.label === undefined) this.config.label = '';
    if (this.config.overlay === undefined) this.config.overlay = false;
    if (this.config.circular === undefined) this.config.circular = false;
    if (this.config.color === undefined) this.config.color = "#EFEFEF";
    if (this.config.clickColor === undefined) this.config.clickColor = "#CCC";
    if (this.config.diameter === undefined) this.config.diameter = 100;
}

Button.prototype = new Widget;

Button.prototype.init = function($container) {
    if (!this.config.action) throw "Options not set.";

    this.$widget = this._generate($container,
        "<div class='button " + (this.config.overlay && this.config.circular === false ? "button-overlay" : '') + "'style='" +
                (this.config.height ? "line-height:" + this.config.height + "px;" : "") +
                (this.config.color ? "background-color:" + this.config.color : "") +
                (this.config.circular ? "border-radius:" + this.config.width + "px;" : "") + "'>" +
            "<span class='button-label'>" + this.config.label + "</span>" +
            (this.config.image ? "<img src='" + this.config.image + "' alt='' />" : "") +
        "</div>"
    );

    var thiz = this;
    this.$widget.children(".button")
        .mousedown(function() { thiz._buttonEngaged(); })
        .bind("mouseup mouseout", function(){ thiz._buttonReleased(); })
        .click(function() { thiz._clicked(); });
    if ($('#'+this.id).hasClass('push-button')) {
        /* Remove the standard button classes for the push button. */
        $('#'+this.id).find('.window-content').empty();

        /* Add the push button classes. */
        this.$widget.find('.window-content').append('<div class="push-button-container" style="height:'+ this.config.diameter +'px; width:'+ this.config.diameter +'px;"></div>');
        this.$widget.find('.push-button-container').append('<div class="push-button-outer"></div>');
        this.$widget.find('.push-button-outer').append('<div class="push-button-middle"></div>');
        this.$widget.find('.push-button-outer').append('<div class="push-button-color push-button-'+ (this.config.pushColor ? this.config.pushColor : 'white') +'"></div>');
        this.$widget.find('.push-button-middle').append('<div class="push-button-label">'+ this.config.label +'</div>');

        /* Animates the push buttons when clicked. */
        this.$widget.find('.push-button-outer').click(function(){
        	if (!thiz.$widget.hasClass('push-button-down'))
        	{
                thiz.$widget.find('.push-button-outer').addClass('push-button-down');

                setTimeout(function()
                {
                    thiz.$widget.find('.push-button-outer').removeClass('push-button-down');
                },300);       
        	}     
        });
    };

};

/**
 * Event handler triggered from mouse down on button.
 */
Button.prototype._buttonEngaged = function() {
    this.$widget.find(".button").css("background-color", this.config.clickColor);
    !this.config.color ? this.$widget.find(".button").css("box-shadow", "0px 1px 5px 1px #" + this.config.color) : '';
    !this.config.color ? this.$widget.find(".button:after").css("background-size", "100% 100% !important") : '';
};

/**
 * Event handler triggered when no longer on mouse down on button.
 */
Button.prototype._buttonReleased = function() {
    !this.config.color ?
        this.$widget.find(".button").css("background-color", "") :
        this.$widget.find(".button").css("background-color", this.config.color);
};

/**
 * Event handler triggered when button clicked.
 */
Button.prototype._clicked = function() {
    this._postControl(this.config.action, this.config.params, this.config.callback);
};


/* ============================================================================
 * == Push Button widget                                                     ==
 * ============================================================================ */

/**
 * Push button that is active when the button is clicked. 
 * 
 * @param {string} id identifier of widget
 * @param {object} config configuration of widget
 * @config {string}  [action] action to send to when pressed
 * @config {string}  [releaseAction] action to send when released (optional)
 * @config {object}  [params] parameters to be sent when pressed (optional)
 * @config {integer} [period] number of milliseconds before next server post (default 250)
 * @config {string}  [label] the label to display on the button (optional)
 * @config {boolean} [circular] whether the button is circular (default false)
 * @config {function} [callback] callback to be invoked with response of posts (optional)
 */
function PushButton(id, config)
{
    if (!config.action) throw "Options not set";
    
    Button.call(this, id, config);
    this.config.classes.push("push-button");

    /* Default options. */
    if (this.config.period === undefined) this.config.period = 250;
    
    /* Whether the mouse is down. */
    this.engaged = false;
}

PushButton.prototype = new Button;

PushButton.prototype._buttonEngaged = function() {
    Button.prototype._buttonEngaged.call(this);
    
    this.engaged = true;
    this._sendUpdate();
};

PushButton.prototype._sendUpdate = function() {
    if (!this.engaged) return;
    
    var thiz = this;
    this._postControl(this.config.action, this.config.params, this.config.callback);
    setTimeout(function() { thiz._sendUpdate(); }, this.config.period);
};

PushButton.prototype._buttonReleased = function() {
    if (!this.engaged) return;
    
    Button.prototype._buttonReleased.call(this);
    this.engaged = false;
};

PushButton.prototype._clicked = function() { 
    /* Push buttons ignore the click event because data sending is triggered
     * in the mouse down event. */
};


/* ============================================================================
 * == Knob widget                                                            ==
 * ============================================================================ */

/**
 * A Knob switch allows the selection of a range of options using a circular slider.
 * 
 * @constructor
 * @param {string} id the identifier of widget
 * @param {object} config configuration of widget
 * @config {string} [field] data field that has displayed value
 * @config {string} [action] server action to call when the switched is changed
 * @config {string} [label] label to display
 * @config {string} [units] Units of the knobs value
 * @config {string} [precision] precision of values (default 0)
 * @config {string} [style] set the knob style (default smooth)
 * @config {integer} [min] minimum value of slider (default 0)
 * @config {integer} [max] maximum value of slider (default 100)
 * @config {number} [radius] the radius of the knob in pixels (default 25px)
 * @config {boolean} [indicator] whether the knob value has a visual indicator (default false)
 * @config {boolean} [vertical] whether the label and text entry is aside (default false)
 */
function Knob(id, config)
{
    Widget.call(this, id, config);
    
    /** Default settings. */
    if (this.config.min === undefined) this.config.min = 0;
    if (this.config.max === undefined) this.config.max = 100;
    if (this.config.vertical === undefined) this.config.vertical = false;
    if (this.config.indicator === undefined) this.config.indicator = false;
    if (this.config.radius === undefined) this.config.radius = 25;
    if (this.config.precision === undefined) this.config.precision = 0;
    
    /** @private {number} Current value of knob. */
    this.val = undefined;
    
    /** @private {boolean} Whether the value has changed by user action
     *  and is the being sent to the server. */
    this.valueChanged = false;
}

Knob.prototype = new Widget;

Knob.prototype.init = function($container) {
    if (!(this.config.action && this.config.field)) throw "Options not supplied.";
	
    this.$widget = this._generate($container, this._buildHTML());

    /* Generates the the knobs' indicator containers. */
    for(var i = 1; i <= 10; i++) {
        this.$widget.find(".knob-indicator-container").append("<div class='knob-indicator knob-indicator-" + i + "'>&nbsp;</div>");
    }

    /* Knob Position */        
    this.knob = this.$widget.find('.knob-' + this.config.style);
    this.kP = this.knob.offset();
    this.kPos = { x: this.kP.left, y: this.kP.top};

    /* Event Handlers. */
    var thiz = this;    
    this.$widget.find('.knob').mousedown(function(e){ e.preventDefault(); thiz._knobEngaged(); });
    this.$widget.mouseup(function(){ thiz._knobReleased(); });
    this.$widget.mousemove(function(e){ thiz._knobChanged(e); });
    this.$widget.find('.knob-val').click(function() { thiz._handleValueSelect($(this).data('value')); });
    this.$widget.find('.knob-range-val').click(function() { thiz._handleValueSelect($(this).data('value')); });
    this.$input = this.$widget.find('input').change(function() { thiz._handleTextBoxChange($(this).val()); });   
    $(document).bind("mouseup.knob-" + this.id, function(){ thiz._knobReleased(); });
};

Knob.prototype._buildHTML = function() {
    return (
    "<div id='knob-container-" + this.id + "'>" +
        (this.config.label ? "<label class='knob-label" + (this.config.vertical ? '' : ' knob-label-horizontal') +"'>" + this.config.label + ":</label>" : '') +
        "<div class='knob-range" + (!this.config.vertical && !this.config.windowed ? ' knob-range-horizontal' : '') +"'>" +
            "<div class='knob-range-val knob-max' data-value='1'>Max: " + this.config.max + "</div>" +
            "<div class='knob-min knob-range-val' data-value='0'>Min: " + this.config.min + "</div>" +
            "</div>" +
        "<div class='knob-container' style='height:" + this.config.radius * 2 + "px; width: " + this.config.radius * 2 + "px;'>" +
            "<div class='knob " + "knob-container-" + this.config.style + "'>" +
                "<div class='knob-texture knob-" + this.config.style + "'></div>" +
                "<div class='knob-highlight'" + (this.config.style == 'black' ? 'style="opacity:0.4;"' : '') + "></div>"+
            "</div>" +
        "</div>" +
        "<div class='knob-val knob-25' data-value='0.25' style='top:50%; right:" + (!this.config.windowed ? '-25%' : '-1px') + ";'>" + ((this.config.max - this.config.min) * 0.25 + this.config.min) + "</div>" +
        "<div><div class='knob-50-outter'><div class='knob-val knob-50' data-value='0.50'>" + ((this.config.max - this.config.min) * 0.50 + this.config.min) + "</div></div></div>" +
        "<div class='knob-val knob-75' data-value='0.75' style='top: 50%; left:" + (!this.config.windowed ? '-25%' : '-1px') + ";'>" + ((this.config.max - this.config.min) * 0.75 + this.config.min) + "</div>" +
        "<div class='knob-input-container" + (this.config.vertical ? '' : ' knob-input-horizontal') +"'>" +    
            "<input class='knob-input' value='0'></input>" +
            (this.config.indicator ? '<div class="knob-indicator-container"></div>' : '') +
            "<div class='knob-input-units'>" + (this.config.units ? this.config.units : '') + "</div>" +
        "</div>" +
    "</div>"
    );
};

/**
 * Event handler triggered when the knob is active.
 */
Knob.prototype._knobEngaged = function(){
    this.mouseDown = true;
};

/**
 * Event handler triggered when no longer on mouse down on button.
 */
Knob.prototype._knobReleased = function() {
    this.mouseDown = false;
    if (this.valueChanged) {
        this._send();
    }
    $('.knob-overlay').remove();
    this.$widget.css('z-index', 6);
};

/**
 * Event handler triggered when the knob is rotated.
 */
Knob.prototype._knobChanged = function(e){
    if (this.mouseDown) {

        e.preventDefault();

        /* Removes any old overlays and brings the widget to the front. */
        $('.knob-overlay').remove();
        this.$widget.css('z-index', 9999);

        /* Adds a hidden overlay to improve use of the knob widget. */
        this.$widget.find('.knob-container').append('<div class="knob-overlay"></div>');

        /* The current position of the mouse within the knob. */
        var mPos = {x: e.clientX - this.kPos.x, y: e.clientY - this.kPos.y};

        /* The current angle whose tangent is the mouse position. */
        var atan = Math.atan2(mPos.x - this.config.radius, mPos.y - this.config.radius);

        /* Degrees from mouse position. */
        this.deg = -atan / (Math.PI/180) + 180;

        /* Rotates the knob. */
        this._rotateKnob(this.deg);
        
        /* Get the value of the degree in comparison to the range of the knob widget. */
        var range = this.config.max - this.config.min;

        this.val = Math.round((this.deg * range) / 360) + this.config.min;
        this.valueChanged = 'true';
    }

    /* Updates the visual indicator with the knobs value. */
    if (this.config.indicator)
    {
        var perc = Math.round(((this.val - this.config.min) * 100) / (this.config.max - this.config.min));
        var indi = Math.floor(perc / 10);

        for(var i = indi; i <= 10; i++){
            this.$widget.find('.knob-indicator-' + i).css('background','none');
        }

        for(var i = indi; i >= 0; i--){
            this.$widget.find('.knob-indicator-' + i).css('background','#00C2FF');
        }    
    }    
};

/**
 * Rotates the knob widget.
 */
Knob.prototype._rotateKnob = function(){
    var t = (this.mouseDown === false) ? 0.5 : 0;

    this.knob.css({
    	'transition' : t + 's',
        '-webkit-transform' : 'rotate(' + this.deg + 'deg)',
        '-moz-transform' : 'rotate(' + this.deg + 'deg)',
        '-ms-transform' : 'rotate(' + this.deg + 'deg)',
        '-o-transform' : 'rotate(' + this.deg + 'deg)',
        'transform' : 'rotate(' + this.deg + 'deg)'
    });

    /* Update the knob input field. */
    this.$widget.find('.knob-input').val(this.val);
};

/**
 * Handles the click event for the knob values 
 */
Knob.prototype._handleValueSelect = function(val) {

    /* Get the values positon in relation to degrees. */
    val === 0 ? this.val = this.config.min : this.val = (this.config.max - this.config.min) * val;
    
    /* Get the degree position of the selected value. */
    switch (val)
    {
    case 0:
        this.deg = 0;
        this.val = this.config.min;
        break;

    case 0.25:
        this.deg = 90;
        this.val = ((this.config.max - this.config.min) * 0.25 + this.config.min);
        break;

    case 0.50:
        this.deg = 180;
        this.val = ((this.config.max - this.config.min) * 0.50 + this.config.min);
        break;

    case 0.75:
        this.deg = 270;
        this.val = ((this.config.max - this.config.min) * 0.75 + this.config.min);
        break;

    case 1:
        this.deg = 360;
        this.val = ((this.config.max - this.config.min) + this.config.min);
        break;

    default:
        //Do Nothing
    }

    /* Update the knob. */
    this.valueChanged = true;
    this._rotateKnob();
    this._send();
};

/**
 * Handles a value text box change.
 * 
 * @param {number} val new value
 */
Knob.prototype._handleTextBoxChange = function(val) {
    this.removeMessages();
    if (!val.match(/^-?\d+\.?\d*$/))
    {
        this.addMessage("Value must be a number.", Widget.MESSAGE_TYPE.error, (this.config.radius * 2.2), '95%', Widget.MESSAGE_INDICATOR.left);
        return;
    }

    n = parseFloat(val);
    if (n < this.config.min || n > this.config.max)
    {
        this.addMessage("Value out of range.", Widget.MESSAGE_TYPE.error, (this.config.radius * 2.2), '100%', Widget.MESSAGE_INDICATOR.left);
        return;
    }

    /* Get the values positon in relation to degrees. */
    this.deg = Math.round(val * 360 / (this.config.max - this.config.min) - 90);
    this.val = val;
    this.valueChanged = true;
    this._rotateKnob();
    this._send();
};

/** 
 * Sends the updated value to the server.
 */
Knob.prototype._send = function() {
    var thiz = this, params = { };
    params[this.config.field] = this.val;
    this._postControl(this.config.action, params,
        function(data) {
            thiz.valueChanged = false;
        }
    );
};

Knob.prototype.destroy = function() {
    $(document).unbind("mouseup.knob-" + this.id);
    Widget.prototype.destroy.call(this);
};

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
 * @constructor
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
        "<div class='slider-container-" + (this.config.vertical ? "vertical" : "horizontal") + "' style='" + 
                    (this.config.vertical ? "" : "width:" + (this.config.length + 15) + "px;") + "'>" +
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
    
    html += "</div>";
    
    /* Text box with numeric value. */
    html += this.config.textEntry ?
        "<div class='slider-text slider-text-" + (this.config.vertical ? "vertical" : "horizontal") +
                " saharaform' style='" + (this.config.vertical ? "margin-top:" + (this.config.length + 20) + "px;" : "") + "'>" +
            "<label for='" + this.id + "-text' class='slider-text-label'>" + this.config.label + ":&nbsp;</label>" +
            "<input id='" + this.id + "-text' type='text' /> " +
            "<span>" + this.config.units + "</span>" +
        "</div>" :
        "<div class='slider-text-" + (this.config.vertical ? "vertical" : "horizontal") +
                "' style='" + (this.config.vertical ? "margin-top:" + (this.config.length + 20) +"px;" : "") + "'>" +
            this.config.label + 
        "</div>";

    html += "</div>";

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
 * == Camera Widget                                                          ==
 * ============================================================================ */

/**
 * The camera widget displays a single camera stream which may have one or more
 * formats.  
 * 
 * @param {string} id camera identifier
 * @param {object} config configuration object
 * @config {string} [title] the camera box title
 * @config {string} [swfParam] data variable that specifies SWF stream URL
 * @config {string} [mjpegParam] data variable that specifies MJPEG stream URL
 * @config {integer} [videoWidth] width of the video stream
 * @config {integer} [videoHeight] height of the video stream
 */
function CameraStream(id, config)
{
    Widget.call(this, id, config);

    /** The list of address for the each of the camera formats. */
    this.urls = {
        swf:   undefined, // Flash format
        mjpeg: undefined  // MJPEG format
    };  
    
    /** @private {boolean} Whether the camera is deployed. */
    this.isDeployed = false;
    
    /** @private {string} Deployed video format. */
    this.deployedFormat = undefined;
    
    /** @private {integer} Deployed video width. */
    this.videoWidth = undefined;
    
    /** @private {integer} Deployed video height. */
    this.videoHeight = undefined;
    
    /** @private {} SWF timer. */
    this.swfTimer = undefined;
    
    this.config.classes.push("camera-stream");
};

CameraStream.prototype = new Widget;

/** @const {string} Cookie which stores the users chosen camera format. */
CameraStream.SELECTED_FORMAT_COOKIE = "camera-format";

CameraStream.prototype.init = function($container) {
    var thiz = this;
    
    /* Reset. */
    this.isDeployed = false;
    this.videoWidth = this.config.videoWidth;
    this.videoHeight = this.config.videoHeight;
    
    this.$widget = this._generate($container, this._buildHTML());

    this.$widget.find('.format-select').find('select').change(function() {
        thiz._undeploy();
        thiz._deploy($(this).val());
    });
    
    /* Loads Metro help window */
    this.$widget.find(".metro-fcheck").click(function() { $('.metro-container').fadeToggle(); });

    /* Restore current format after reinit. */
    if (this.deployedFormat) this._deploy(this.deployedFormat);
};

CameraStream.prototype.consume = function(data) {
    /* Camera streams don't change. */
    if ((this.urls.mjpeg || !this.config.mjpegParam) && (this.urls.swf || !this.config.swfParam)) return;
    
    if (this.config.swfParam && data[this.config.swfParam] != undefined)
    {
        this.urls.swf = decodeURIComponent(data[this.config.swfParam]);
    }
    
    if (this.config.mjpegParam || data[this.config.mjpegParam] != undefined)
    {
        this.urls.mjpeg = decodeURIComponent(data[this.config.mjpegParam]);
    }
    
    if ((this.urls.swf || this.urls.mjpeg) && !this.isDeployed) 
    {
        this._restoreDeploy();
    }
};

/**
 * Restores a stored user chosen format choice, otherwise uses platform deploy
 * to load the most appropriate choice. 
 */
CameraStream.prototype._restoreDeploy = function() {
    var storedChoice = Util.getCookie(CameraStream.SELECTED_FORMAT_COOKIE);
    
    if (storedChoice && this.urls[storedChoice])
    {
        this._deploy(storedChoice);
    }
    else
    {
        this._platformDeploy();
    }
};

/**
 * Deploys a format most appropriate to the platform.
 */
CameraStream.prototype._platformDeploy = function() {
    this._deploy(/Mobile|mobi|Android|android/i.test(navigator.userAgent) ? 'mjpeg' : 'swf');  
};

/**
 * Deploys the specified camera format. 
 * 
 * @param {string} format format to deploy
 */
CameraStream.prototype._deploy = function(format) {
    var html;
    
    switch (format)
    {
    case 'swf':
        html = this._getSwfHtml();
        break;
        
    case 'mjpeg':
        html = this._getMjpegHtml();
        break;
        
    default:
        this._platformDeploy();
        return;
    }
    
    this.isDeployed = true;
    this.$widget.find(".video-player").html(html);
    this.$widget.find("#video-player-select").children(":selected").removeAttr("selected");
    this.$widget.find("#video-player-select > option[value='" + format + "']").attr("selected", "selected");
    Util.setCookie(CameraStream.SELECTED_FORMAT_COOKIE, this.deployedFormat = format);
    
    if (this.deployedFormat == 'swf')
    {
        var thiz = this;
        this.swfTimer = setTimeout(function() {
            if (thiz.deployedFormat == 'swf') thiz._deploy(thiz.deployedFormat);
        }, 360000);
    }
};

/**
 * Removes the currently deployed video from displaying.
 */
CameraStream.prototype._undeploy = function() {
    if (this.deployedFormat == 'mjpeg')
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

CameraStream.prototype._buildHTML = function() {
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
                (this.config.swfParam ? '<option value="swf">SWF</option>' : '') +
                (this.config.mjpegParam ? '<option value="mjpeg">M-JPEG</option>' : '') +
            '</select>' +
        '</div>'
    );
};

/**
 * Gets the HTML to deploy a SWF stream format. 
 * 
 * @return {string} SWF video HTML
 */
CameraStream.prototype._getSwfHtml = function() {
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
 * 
 * @param {string} MJPEG video HTML
 */
CameraStream.prototype._getMjpegHtml = function() {
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

/** @const {integer} Difference between widget width and video width. */
CameraStream.VID_WIDTH_DIFF = 8;

/** @const {integer} Difference between widget height and video height. */
CameraStream.VID_HEIGHT_DIFF = 72;

CameraStream.prototype.resized = function(width, height) {
    if (this.isDeployed) this._undeploy();
    
    this.$widget.find(".video-player").css({
       width: width - CameraStream.VID_WIDTH_DIFF,
       height: height - CameraStream.VID_HEIGHT_DIFF
    });
    this.$widget.css("padding-bottom","0.8%");
};

CameraStream.prototype.resizeStopped = function(width, height) {
    this.videoWidth = width - CameraStream.VID_WIDTH_DIFF;
    this.videoHeight = height - CameraStream.VID_HEIGHT_DIFF;
    
    this._deploy(this.currentFormat);
};

CameraStream.prototype.destroy = function() {
    if (this.isDeployed) this._undeploy();
    Widget.prototype.destroy.call(this);
};

/**
 * Shades the Camera widget which hides the widget contents only showing the title.
 *
 * @param {Function} callback callback invoked after the shade animation has completed
 */
CameraStream.prototype.toggleWindowShade = function(callback) {
    Widget.prototype.toggleWindowShade.call(this, callback);
    
    if (this.window.shaded) this._undeploy();
    else this._deploy(this.deployedFormat);
};

/* ============================================================================
 * == Window Manager                                                         ==
 * ============================================================================ */

/**
 * The window manager is the outer container of the page holding all windowed
 * widgets. As well as the container, widget tracking it adds window management
 * persistance and restoration.
 * 
 * @param {string} id page identifier
 * @param {object} config configuration object
 * @config {boolean} [windowToggle] whether windows can be toggled on or off (default off)
 */
function WindowManager(id, config)
{
    Container.call(this, id, config);

    /** @private {WindowToggle} Window toggle list. */
    this.windowToggler = this.config.windowToggle ? new WindowToggler(this) : null;
    
    /** @private {object} Widget destroy functions. */
    this.destroyers = { };
}

WindowManager.prototype = new Container;

WindowManager.prototype.init = function($anchor) {
    var i = 0, w, thiz = this;
    
    /* Set the default windowing strategy if no explicit options have been set. */
    for (i in this.config.widgets)
    {
        w = this.config.widgets[i].config;
        if (w.closeable === undefined) w.closeable = this.config.windowToggle;
        if (w.windowed === undefined) w.windowed = true;
        if (w.draggable === undefined) w.draggable = true;
        if (w.shadeable === undefined) w.shadeable = true;
        if (w.expandable === undefined) w.expandable = true;
        if (w.resizable === undefined) w.resizable = true;
    }
    
    Container.prototype.init.call(this, $anchor);
    if (this.windowToggler) this.windowToggler.init($anchor);
    
    for (i in this.widgets)
    {
        /* We need to intercept window closes so we can track and store 
         * window closes. */
        w = this.widgets[i];
        this.destroyers[w.id] = w.destroy;
        w.destroy = function() {
            thiz.states[this.id] = false;
            thiz.widgets[this.id].window.shown = false;
            thiz.widgets[this.id]._storeState();
            if (thiz.windowToggler) thiz.windowToggler.setSwitch(this.id, false);
            
            thiz.destroyers[this.id].call(this);
        };
    }
};

WindowManager.prototype.toggleEvent = function(id, visible) {
    Container.prototype.toggleEvent.call(this, id, visible);
    
    this.widgets[id].window.shown = visible;
    this.widgets[id]._storeState();
};

/**
 * Resets the display, puting the contents back to their default positions.
 */
WindowManager.prototype.reset = function() {
    var i = 0;
    
    for (i in this.widgets) 
    {
        this.widgets[i].destroy();
        this.widgets[i].window = { };
        this.widgets[i]._storeState();
        
        this.states[i] = true;
        this.widgets[i].init(this.$contentBox);
    }
};

/* ============================================================================
 * == Window Toggler                                                         ==
 * ============================================================================ */

/**
 * List of windows that may be toggled to be on or off.
 * 
 * @param {Container} page outer page container
 */
function WindowToggler(page)
{   /** @private {Contnainer} Toggle list container. */
    this.page = page;
}

WindowToggler.prototype.init = function($container) {
    var i = 0, w, s, widgets = [ ], thiz = this;
    
    for (i in this.page.getWidgets())
    {
        w = this.page.getWidget(i);
        
        s = new Switch(w.id + "-toggle", {
           field: w.id,
           action: "none",
           label: w.config.title,
           vertical: false,
           width: 145
        });
        widgets.push(s);
        
        s._clicked = function() {
            /* When clicked the displayed state of the widget is toggled. */
            this.value = !this.value;
            thiz.page.toggleEvent(this.config.field, this.value);
            this._setDisplay(this.value);
        };
    }
    
    widgets.push(s = new Button("page-reset-button", {
        label: "Reset",
        action: "Reset",
    }));
    
    s._clicked = function() {
        thiz.page.reset();
        for (i in widgets) widgets[i]._setDisplay(widgets[i].value = true);
    };

    this.container = new Container("widget-toggle-list", {
        windowed: true,
        title: "Display",
        icon: "toggle",
        closeable: false,
        expandable: false,
        shadeable: true,
        expandable: false,
        draggable: true,
        resizable: false,
        left: -188,
        top: 144,
        widgets: widgets,
        
        layout: new BoxLayout({
           vertical: true,
           padding: 7
        })
    });
    
    this.container._loadState();
    this.container.init($container);
    
    /* Automatically set the to not displayed. */
    if (this.container.window.shaded === undefined) this.container.toggleWindowShade();
    
    /* Set the switch state. */
    widgets.pop();
    for (i in widgets)
    {
        widgets[i]._setDisplay(widgets[i].value = this.page.getWidget(widgets[i].config.field).window.shown);
    }
};

/**
 * Sets the state of a toggle switch.
 * 
 * @param {string} id identifier of window whose switch is being set
 * @param {boolean} state whether the switch is on or off
 */
WindowToggler.prototype.setSwitch = function(id, state) {
    var w = this.container.getWidget(id + "-toggle");
    w._setDisplay(w.value = state);
};

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
}

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
    var r = '' + Util.round(num, places);

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

/**
 * Determines the number of elements of an object.
 * 
 * @static
 * @param {object} o object to determine size
 * @return {integer} number of elements in an object
 */
Util.sizeOf = function(o) {
    var i = 0, c = 0;
    for (i in o) c++;
    return c;
};
