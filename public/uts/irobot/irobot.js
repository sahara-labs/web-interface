/**
 * iRobot rig interface.
 * 
 * @author Michael Diponio
 * @date 13th February 2011
 */

/* ----------------------------------------------------------------------------
 * -- Page Canvas                                                            --
 * ---------------------------------------------------------------------------- */

/**
 * The iRobot page. 
 */
function IRobot(id)
{
	/** Canvas widget. */
	this.$canvas = $("#" + id);
	
	/** The iRobot rig operating mode. */
	this.mode = 0;
	this.modeSelector = new ModeSelector(this);
	
	/** The list of widgets that are displayed on the page. */
	this.widgets = [];
	
	/* Log level. */
	this.logLevel = 0;
}

/* IRobot constants. */
IRobot.LOGOFF = 4;
IRobot.ERROR  = 3;
IRobot.WARN   = 2;
IRobot.INFO   = 1;
IRobot.DEBUG  = 0;

/**
 * Initialises the page. If no mode is stored in the page hash, the mode
 * selector is displayed.
 */
IRobot.prototype.init = function() {
	this.modeSelector.init();
	
	var hashMode = window.location.hash;
	if (hashMode && hashMode.length == 3)
	{
		var mode = parseInt(hashMode.substr(2));
		this.displayMode(0 < mode && mode <= 3 ? mode : 0);
	}
};

/**
 * Changes the page mode.
 * 
 * @param mode mode number
 */
IRobot.prototype.displayMode = function(mode) {
	var i = 0;
	
	this.log("Changing display mode to " + mode);
	
	/* Destroy the existing widgets. */
	for (i in this.widgets) this.widgets[i].destroy();
	
	switch (mode)
	{
	case 1: // Manual mode
		this.log("Manual mode not implemented", IRobot.ERROR);
		break;
		
	case 2: // Logging mode
		this.log("Logging mode not implemented", IRobot.ERROR);
		break;
		
	case 3: // Code upload mode
		this.log("Code mode not implemented", IRobot.ERROR);
		break;

	default:
		this.log(IRobot.ERROR, "Unknown mode: " + mode);
	}
	
	this.mode = mode;
	window.location.hash = "m" + this.mode;
	this.modeSelector.setSelected(mode);
	for (i in this.widgets) this.widgets[i].init();
};


IRobot.prototype.log = function(message, lvl) {
	if (typeof console == "undefined") return;
	
	if (!lvl) lvl = 0;
	if (lvl < this.logLevel) return;
	
	switch (lvl)
	{
	case 0:
		console.debug(message);
		break;
	case 1:
		console.info(message);
		break;
	case 2:
		console.warn(message);
		break;
	case 3: 
		console.error(message);
		break;
	}
};

/* ----------------------------------------------------------------------------
 * -- Widget base.                                                           --
 * ---------------------------------------------------------------------------- */

/**
 * Base of page widget.
 */
function IWidget(control)
{
	/** The page control object. */
	this.control = control;
		
	/** The widget name. */
	this.wid = "";
	
	/** The widget jQuery object. */
	this.$w = null;
}

/**
 * Initialises the widget which paints it onto the canvas. 
 */
IWidget.prototype.init = function() {	
	this.pageControl.log(this.wid + " has no init method", IRobot.ERROR);
};

/**
 * Destroys the widget by removing the widget from the canvas and clearing all 
 * event handlers. 
 */
IWidget.prototype.destroy = function () {
	this.$w.remove();
};

/**
 * Appends contents to the robot canvas.
 * 
 * @param contents page contents
 */
IWidget.prototype.pageAppend = function(contents) {
	this.control.$canvas.append(
			"<div id='" + this.wid + "'>" + contents + "</div>"
	);
	
	this.$w = this.control.$canvas.find("#" + this.wid);
};

/* ----------------------------------------------------------------------------
 * -- Widget to select a mode.                                               --
 * ---------------------------------------------------------------------------- */
function ModeSelector(pc)
{
	IWidget.call(this, pc);	
	this.wid = "mode-sel";
	
	this.modes = [
        'Manual',
        'Logging',
        'Upload'
	];
}
ModeSelector.prototype = new IWidget;

ModeSelector.prototype.init = function() {
	var html = "", i = 0;
	
	for (i in this.modes)
	{
		html += "<a id='mode" + (parseInt(i) + 1) + "'>" + this.modes[i] + "</a>";
	}
	this.pageAppend(html + "<div class='float-clear'></div>");
	
	var thiz = this;
	this.$w.children("a").click(function() {
		thiz.control.displayMode(parseInt($(this).attr("id").substr(4)));
	});
};

ModeSelector.prototype.setSelected = function(mode) {
	// FIXME Change selected mode
};



