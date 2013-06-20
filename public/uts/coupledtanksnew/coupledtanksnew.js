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

/* ----- WIDGET CONTSRUCTOR --------------------------------------------------- */

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
 * @param content the content of the widget
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
	
	camera.init();
    pidControl.init();
    waterLevelsMimic.init();
    this.init();
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
            	'<tr>' +
            		'<td>Auto Save</td>' +
            		'<td><input type="checkbox" name="autosavepid" placeholder="autosave"/></td>' +
            	'</tr>' +
            	'<tr>' +
            		'<td>Enable</td>' +
            		'<td><input type="checkbox" name="enablepid" placeholder="enable"/></td>' +
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
    var i, html =
	    '<div id="slidercont">' +
		'<div id="sliderinner">' +
		'<div id="slider"> </div>' +
		'<div id="sliderleg">';
		for (i = 0; i <= 10; i++)
		{
		    html += 
		        '<div class="slidertick">' +
				    '<span class="ui-icon ui-icon-arrowthick-1-w"> </span>' +
				    (i < 10 ? (100 - i * 10) + ' %'  : 'Off') +
                '</div>';
	    }

		html +=	'</div>' +
			'</div>' +
			'<div id="sliderval">Value: <span>' + this.val + '</span> %</div>' +
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
			$("#sliderval span").empty().append(ui.value);
		},
		stop: function(event, ui) {
			thiz.setter.call(thiz.hydro, ui.value);
		}
	});

	this.slider = $("#slider");
	this.slider.children(".ui-slider-handle").css('width', 30)
		.css("left", "-11px")
		.css("cursor", "row-resize");

	this.slider.children(".ui-slider-range").removeClass("ui-widget-header")
		.css("background-color", "#EFEFEF")
		.css("overflow", "hidden")
		.css("width", "10px");
	this.sliderVal = $("#sliderval span");
};

Slider.prototype.repaint = function() {
	(this.val != coupledTanksTwo.pump)
	{
		this.slider.slider("value",coupledTanksTwo.pump);
		this.sliderVal.empty().append(coupledTanksTwo.pump);
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