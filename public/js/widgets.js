/* ============================================================================
 * == Base widget                                                            ==
 * ============================================================================ */

/**
 * Base class widgets that comprise the root of the inheritance hierarchy of 
 * widgets. It provides declarations of a widgets required functionality
 * and implementations of common functionality.
 * 
 * @param {jQuery} $container a jQuery object that is the base where the widget is \ 
 * 				appended to
 * @param {string} title the widgets title
 * @param {string} icon the widgets box icon 
 */
function Widget($container, title, icon) 
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
	    expanded: undefined, // Whether this window is expanded
	};
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
    var $w = this.$container.append(
      "<div class='window-wrapper' id='" + boxId + "'>" +
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
Widget.prototype.toggleWindowShade = function(shadeCallback) {
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
    this.window.shaded = !this.window.shaded;
    this.storeState();
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
            this.$container.find(".window-wrapper").each(function(i) {if ($(this).zIndex() > zin) zin = $(this).zIndex(); });

            /* Move the widget to a central position. */
            this.$widget.css({
                left: this.$container.width() / 2 - width / 2 - 60,
                top: 100,
                zIndex: zin + 100
            });
        }

        this.$widget.toggleClass("window-expanded");
        this.window.expanded = !this.window.expanded;
        this.storeState();
    }
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
        stack: '.window-wrapper',
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

/** @type {string} Address to post control requests to. */
Widget.CONTROL_URL = "";

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
        url: Widget.CONTROL_URL + action,
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
Widget.prototype.storeState = function() {
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
Widget.prototype.loadState = function() {
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
    
    /** Whether the displayed in is blurred state. */
    this.isBlurred = false;
}
DisplayManager.prototype = new Widget;

DisplayManager.prototype.init = function() {
    var thiz = this, i = 0;
    
    /* Enable all the other widgets. */
    for (i in this.widgets) 
    {    	
        this.widgets[i].parentManager = this; 
        this.widgets[i].loadState();
    
        if (this.widgets[i].window.shown = this.states[i] = !(this.widgets[i].window.shown === false))
        {
            this.widgets[i].init();
            
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

            thiz.widgets[i].window = { };
            thiz.widgets[i].storeState();
            thiz.widgets[i].destroy();
            thiz.widgets[i].init();
	    }
	    
	    thiz.$widget.find(".button .animated")
            .removeClass("off")
            .addClass("on");
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
Widget.prototype.toggleWidget = function(title, node) {
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
   
   /** Tool tips hover states. */
   this.toolTipsHovers = { };

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
	this.$widget.find(".tab-title")
	    .click(function() { thiz.tabClicked($(this).attr("id")); })
	    .mouseenter(function() {
	        var id = $(this).attr("id");
	        thiz.toolTipsHovers[id] = true;
	        setTimeout(function() {
	            if (thiz.toolTipsHovers[id]) thiz.showToolTip(id);
	        }, 2000);
	    })
	    .mouseleave(function() {
	        thiz.toolTipsHovers[$(this).attr("id")] = false;
	    });
	
	this.$widget.find(".window-close").click(function() {
	    if   (thiz.parentManager) thiz.parentManager.toggleWidget(thiz.title);
        else  thiz.destroy();
	});
	
	this.enableDraggable();
};

TabbedWidget.prototype.generateBox = function(boxId) {
    var i = 0, html = 
      "<div class='tab-wrapper' id='" + boxId + "'>" +
          "<div class='tab-wrapper-controls draggable-header'>" +
              "<span class='window-close ui-icon ui-icon-close'></span>" +    
              "<div class='tab-wrapper-height'></div>" +
          "</div>" +
         "<div class='tab-header' style='width:" + (this.widgets.length * 122) + "px'>";

    for (i in this.widgets)
    {
        html += 
              "<div id='" + this.tabIds[i] + "' class='tab-title'>" +
                  "<span class='window-icon icon_"+ this.widgets[i].icon + "'></span>" +
                  "<span class='window-title'>" + this.widgets[i].title + "</span>" +
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
 * @param {string} id identifer of clicked tab
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
 * Shows a tooltip of a tab.
 * 
 * @param {string} id ID of a tab to show
 */
TabbedWidget.prototype.showToolTip = function(id) {
    if ($("#" + id + "-tooltip").size() == 0)
    {
        this.removeMessages();
        
        var message = "", i = 0;
        for (i in this.tabIds) if (this.tabIds[i] == id) message = this.toolTips[i];
        this.addMessage(id + "-tooltip", message, "info", $("#" + id).position().left - 10, -3, "top-left");
    }
};

/**
 * Sets the tool tips of the tabs of this container. These tooltips are 
 * displayed when hovering over a tab.
 * 
 * @param {array} toolTips list of tool tips
 */
TabbedWidget.prototype.setToolTips = function(toolTips) {
    this.toolTips = toolTips;
};

/**
 * Sets the dimension of the box. If the width and height are undefined,
 * the box size is determined by its displayed contents.
 * 
 * @param {integer} width width of the box in pixels
 * @param {integer} height height of the box in pixels
 */
TabbedWidget.prototype.setDimensions = function(width, height) {
    this.width = width;
    this.height = height;
};

/* ============================================================================
 * == Data Logging                                                           ==
 * ============================================================================ */

/**
 * The data logging widget allows the enabling and disabling of data logging
 * and selection of data files to download.
 * 
 * @param {jQuery} $container the container to add this widget to
 */
function DataLogging($container)
{
    Widget.call(this, $container, 'Data', 'datafiles');
    
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
DataLogging.prototype = new Widget;

DataLogging.prototype.init = function() {
    /* Clear to force UI redraw. */
    this.files = this.isLogging = this.duration = undefined;
    this.isControlled = false;
    this.fileCount = 0;

    /* Draw UI. */
    this.$widget = this.generateBox(this.id);
    this.enableDraggable();
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
    Widget.prototype.destroy.call(this);
    
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
 * @param {jQuery} $container the container to append the graph to
 * @param {String} title the graph title
 * @param {boolean} chained a graphs that are chained to this graph to receives its \
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
	this.width = 400;

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
    /* Size reset. */
    this.width = 400;
    this.height = 175;
    
	this.$widget = this.generateBox(this.id + '-box');

	/* Add the canvas panel. */
	var canvas = Util.getCanvas(this.id, this.width, this.height);
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
            "   </div>";
	        "</div>";

	return html;
};

GraphWidget.prototype.consume = function(data) { 
    this.updateData(data);
};

/** @type {string} Address to retreive graph data. */
GraphWidget.GRAPH_DATA_URL = "";

/**
 * Periodically requests the server to provide graph data.
 */
GraphWidget.prototype.acquireData = function() {
	var thiz = this;
	$.ajax({
		url: GraphWidget.GRAPH_DATA_URL,
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
		off = Math.abs(this.graphOffset * this.height);

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
        $s.html(Util.zeroPad(
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
    this.val = p * (this.max - this.min) / this.dimension + this.min;
    
    /* Vertical sliders have the scale inverse to positioning. */
    if (this.isVertical) this.val = this.max + this.min - this.val;
    
    /* Range check. */
    if (this.val < this.min) this.val = this.min;
    if (this.val > this.max) this.val = this.max;
    
    /* Update display. */
    this.moveTo();
    this.$input.val(Util.zeroPad(this.val, 1));
    
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
    this.$input.val(Util.zeroPad(this.val, 1));
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
    var p = (this.val - this.min) / (this.max - this.min) * this.dimension;
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
                    "<span class='slider-scale-value'>" + (this.isVertical ? this.max - s * i : this.min + s * i) + "</span>" +
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
    if (!(data[this.dataVar] === undefined || data[this.dataVar] == this.val || this.valueChanged))
    {
        this.val = data[this.dataVar];
        this.moveTo();
        this.$input.val(Util.zeroPad(this.val, 1));
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
 * @param suf data attribute suffix to load this cameras information
 */
function CameraWidget($container, title, suf) 
{
    Widget.call(this, $container, title, 'video');
    
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
CameraWidget.prototype = new Widget;

/** Cookie which stores the users chosen camera format. */
CameraWidget.SELECTED_FORMAT_COOKIE = "camera-format";

CameraWidget.prototype.init = function() {
	var thiz = this;
	
    /* Reset. */
    this.isDeployed = false;
    this.videoWidth = 320;
    this.videoHeight = 240;
    
	this.$widget = this.generateBox('camera-coupled-tanks');

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
    var storedChoice = Util.getCookie(CameraWidget.SELECTED_FORMAT_COOKIE);
    
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
    Util.setCookie(CameraWidget.SELECTED_FORMAT_COOKIE, this.currentFormat = format);
    
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
            '<select id="video-player-select">' +
	            '<option selected="selected" value=" "> </option>' +
                '<option value="swf">SWF</option>' +
                '<option value="mjpeg">M-JPEG</option>' +
            '</select>' +
        '</div>' +
        '<div class="format-select-label">Format:</div>'
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
		        '<a href="http://www.adobe.com/go/getflash">' +
		        	'<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" ' +
		        			'alt="Get Adobe Flash player"/>' +
		        '</a>' +
		    '</object>'
		:                  // Internet Explorer
			'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"  width="' + this.videoWidth + 
			        '" height="' + this.videoHeight + '"  id="camera-swf-movie">' +
				'<param name="movie" value="' + this.urls.swf + '" />' +
				'<param name="wmode" value="opaque" />' +
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
};

CameraWidget.prototype.resizeStopped = function(width, height) {
    this.videoWidth = width - CameraWidget.VID_WIDTH_DIFF;
    this.videoHeight = height - CameraWidget.VID_HEIGHT_DIFF;
    
    this.deploy(this.currentFormat);
};

CameraWidget.prototype.destroy = function() {
    this.undeploy();
    Widget.prototype.destroy.call(this);
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
	    this.$widget.find(".window-header").toggleClass("window-header-shade", "slide");
        this.$widget.css("width", this.$widget.width());
    }
    this.window.shaded = !this.window.shaded;
    this.storeState();
    
    if (this.window.shaded === true)
    {
    	this.$widget.css("height", 'auto');
    }
};

/* ============================================================================
 * == Information Widget                                                     ==
 * ============================================================================ */

/**
 * Information displaying widget. The information can be of type 'info' which
 * shows an informational guiadance message, 'error' which shows an error message,
 * '
 * 
 * @param 
 */
function PlaceHolderWidget($container, title, icon, message, type)
{
    Widget.call(this, $container, title, icon);
    
    /** Identifer of this widget. */
    this.id = "place-holder-" + title.toLowerCase().replace(' ', '-');
    
    /** Message that is displayed by this widget. */
    this.message = message;
    
    /** The information type of this widget; either 'info', 'error', or 
     * 'loading'. */
    this.type = type;
}

PlaceHolderWidget.prototype = new Widget;

PlaceHolderWidget.prototype.init = function() {
    this.$widget = this.generateBox(this.id);
};

PlaceHolderWidget.prototype.getHTML = function() {
    var html = '<div class="place-holder place-holder-' + this.type + '">';
    
    switch (this.type)
    {
    case 'info':
        html += '<p>Guidance: <span class="place-holder-message">' + this.message + '</span></p>';
        break;
        
    case 'error':
        html += '<p>Error: <span class="place-holder-message">' + this.message + '</span></p>';
        break;
        
    case 'loading':
        html += '<img src="/uts/coupledtanksnew/images/loading.gif" alt=" " />' +
                '<p>Please wait: <span class="place-holder-message">' + this.message + '</span></p>';
        break;
    }
    
    html +=    '</div>';
    return html;
};

/* ============================================================================
 * == Global Error Widget                                                    ==
 * ============================================================================ */

/**
 * Display an error overlay on the page.
 * 
 * @param $container page container
 */
function GlobalError($container) 
{
	Widget.call(this, $container, 'Global Error', 'settings');
	
	/** Displayed error message. */
	this.error = '';
};

GlobalError.prototype = new Widget;

GlobalError.prototype.init = function() {	
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

GlobalError.prototype.destroy = function() {
    $(document).unbind("keydown.global-error");
    this.$container.find(".window-wrapper, .tab-wrapper").removeClass("global-error-blur");
    Widget.prototype.destroy.call(this);
};


/* ============================================================================
 * == Utility functions                                                      ==
 * ============================================================================ */

/**
 * Object that forms the namespace of utility functions which will be
 * (syntactically) assigned as static functions.
 */
function Util() { }

/** @type {string} The prefix for cookies. This should be redefined in */
Util.COOKIE_PREFIX = "";


/**
 * Gets the value of the specified cookie. 
 * 
 * @param {string} cookie the cookie to find the value of
 * @return {mixed} cookies value or false if not found
 */
Util.getCookie = function(cookie) {
    /* All cookies for an interface are prefixed. This is to differenate 
     * with rig interfaces that may have the same identifiers but different layouts. */
    cookie = Util.COOKIE_PREFIX + cookie;
    
    var pos = document.cookie.indexOf(cookie), end = document.cookie.indexOf(';', pos + 1);
    if (end < 0) end = document.cookie.length;
    return pos >= 0 ? document.cookie.substring(pos + cookie.length + 1, end) : false;
};

/**
 * Sets a cookie. The cookie has the expiry for a year in the future.
 * 
 * @param {string} cookie name of cookie to set
 * @param {string} value value of cookie to set
 */
Util.setCookie = function(cookie, value) {
    document.cookie = Util.COOKIE_PREFIX + cookie + '=' + value + ';path=/;max-age=' + (60 * 60 * 24 * 365);
};

/**
 * Gets a canvas element with an appropriate fallback for IE6 to IE8 which do
 * not natively support canvas.<br/>
 * <br />
 * <strong>NOTE: For this function to actually work, the <tt>excanvas.js</tt>
 * library must be included on the page within a less than IE9 conditional 
 * comment.  
 * 
 * @param {string} id the ID of the element
 * @param {integer} width the width of the canvas element
 * @param  {integer} height the height of the canvas element
 * @return {element} canvas element 
 */
Util.getCanvas = function(id, width, height)
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
};

/**
 * Rounds of a number to a specified number of significant figures.
 * 
 * @param {number} num number to round
 * @param {int} places significant figures
 * @returns {number} number to return
 */
Util.mathRound = function(num, places) {
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
};

/**
 * Adds '0' characters to a number so it correctly displays the specified 
 * decimal point characters.
 * 
 * @param {number} num number to pad
 * @param {int} places significant figures
 * @returns {string}
 */
Util.zeroPad = function(num, places) {
	var r = '' + Util.mathRound(num, places);

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
 * @param {string} s the string to trim
 * @return {string} the trimmed string
 */
Util.trim = function(s) {
    return s.trim ? s.trim() : s.replace(/^\s+|\s+$/g);
};
