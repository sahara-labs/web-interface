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
 * @config {string}  [title] the title of this widget
 * @config {string}  [icon] class for icon sprite
 * @config {array}   [classes] list of classes to add for the container of this box
 * @config {integer} [width] width of widget in px
 * @config {integer} [height] height of widget in px
 * @config {boolean} [resizable] whether this widget should be resizable (default false)
 * @config {integer} [minWidth] minimum width of widget if resizable
 * @config {integer} [minHeight] minimum height of widget if resizable
 * @config {boolean} [preserveAspectRatio] whether aspect ratio should be kept if resizable (default false)
 * @config {boolean} [expandable] whether this widget should be expandable
 * @config {boolean} [draggable] whether this widget should be draggable (default false)
 * @config {string}  [tooltip] tooltip to show on hover (optional)
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
    var $w = $container.append(
      "<div class='window-wrapper window-" + Globals.THEME + " " + 
                  (this.config.classes ? this.config.classes.join(' ') : "") + "' id='" + this.id + "' " +
                  "style='" +
                      (this.config.height ? "height:" + this.config.height + "px;" : "") +
                      (this.config.width ? "width:" + this.config.width + "px;" : "") +
                  "'>" +
          "<div class='window-header'>" +
              (this.config.icon ? "<span class='window-icon icon_"+ this.config.icon + "'></span>" : "")+
              (this.config.title ? "<span class='window-title'>" + this.config.title + "</span>" : "") +
              "<span class='window-close ui-icon ui-icon-close'></span>" +
              "<span class='window-shade ui-icon ui-icon-minus'></span>" + 
              "<span class='window-expand ui-icon ui-icon-arrow-4-diag'></span>" +             
          "</div>" +
          "<div class='window-content'>" + 
              html +
          "</div>" +
      "</div>"
    ).children().last(), thiz = this;
    
    $w.find(".window-expand").click(function() { thiz.toggleWindowExpand(); });
    $w.find(".window-shade").click(function() { thiz.toggleWindowShade(); });
    $w.find(".window-header").dblclick(function() { thiz.toggleWindowShade(); });
    $w.find(".window-close").click(function() { thiz.destroy(); });
    
    $(document).bind("keypress.widget-" + this.id, function(e) {
       switch (e.keyCode) 
       {
           case 27:
               if (thiz.isExpanded) thiz.toggleWindowExpand();
               break;
       }
    });
    
    if (this.config.draggable) this._makeDraggable($w);
    if (this.config.resizable) this._makeResizable($w);
    if (this.config.tooltip) this._addTooltip($w);
    
    return $w;
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
        this.dragged(this.window.left, this.window.top);
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
        
        this.resized(this.window.width, this.window.height);
        this.resizeStopped(this.window.width, this.window.height);
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

function Graph()
{
    // TODO Graph widget
}

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
 * @config {string} [field] server data variable that is being switched
 * @config {string} [action] server action to call when the switched is changed1
 * @config {string} [label] switch label (optional)
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
        '<div class="switch-container">' +
            (this.config.label ? '<label class="switch-label">' + this.config.label + ':</label>' : '') +
            '<div class="switch">' +
                '<div class="switch-animated switch-slide"></div>' +
            '</div>' +
        '</div>'
    );
    
    var thiz = this;
    this.$widget.find(".switch-label, .switch").click(function() { thiz._clicked(); });
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
    if (on)
    {
        this.$widget.find(".switch .switch-slide").addClass("switch-on");
    }
    else
    {
        this.$widget.find(".switch .switch-slide").removeClass("switch-on");
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
 * @config {string} [field] server data variable that is being switched
 * @config {string} [action] server action to call when the switched is changed
 * @config {array}  [values] the list of potential 
 * @config {string} [label] switch label (optional)
 */
function RotarySwitch(id, config)
{
    if (!(config.field || config.action || config.values)) throw "Options not supplied."; 
    
    Widget.call(this, id, config);

    /** @private {boolean} The state of the switch. */
    this.val = undefined;
    
    /** @private {boolean} Whether the value has been changed by user action. */
    this.isChanged = false;  
}

RotartSwtich.prototype = new Widget;

RotarySwitch.prototype.init = function($container) {
    
};

RotarySwitch.prototype.consume = function(data) {
    
};

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

function Slider()
{
    // TODO Slider widget
}

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