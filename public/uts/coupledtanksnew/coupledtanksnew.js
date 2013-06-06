/**
 * Coupled Tanks web interface.
 */

/* ============================================================================
 * == WaterLevelControl.                                                     ==
 * ============================================================================ */

function WaterLevelControl() { };

/** Runs the Display Manager. */
WaterLevelControl.prototype.setup = function() {
	
    this.PCONTROLLER = "CoupledTanksTwoController";

	DisplayManager();
};

/** Retrieves latest data from the server. */
WaterLevelControl.prototype.run = function() { };

/* ============================================================================
 * == Widget.                                                                ==
 * ============================================================================ */

function Widget() { };

/** adds the widget to the page. */
Widget.prototype.init = function() {
    throw "Widget init not defined.";
};

/** Retrieves data from the server. */
Widget.prototype.consume = function(data) { };

/** Removes the widget from the page. */
Widget.prototype.destroy = function() { };

/** Updates the widget. */
Widget.prototype.update = function(width,height) { };

/** Adds a message to the page. */
Widget.prototype.blur = function() { };

/** Posts data to the server. */
Widget.prototype.postControl = function(action,params) { };

/* ============================================================================
 * == Display Manager.                                                       ==
 * ============================================================================ */

function DisplayManager(control){
	
    Widget.call(this, control);
    
	this.widgets = [];
};

DisplayManager.prototype = new Widget;
DisplayManager.prototype.init = function() {
	
};

/* ============================================================================
 * == Page Widgets.                                                          ==
 * ============================================================================ */

function WaterLevelsMimic(control) {
	
	Widget.call(this, control);

};

WaterLevelsMimic.prototype = new Widget;

/* Controls the Water Levels Mimic */
WaterLevelsMimic.prototype.animateLoop = function() { };

function PIDControl(control) {
	
	Widget.call(this, control);

};

PIDControl.prototype = new Widget;

function TabbedWidget(control) {
	
	Widget.call(this, control);
};

TabbedWidget.prototype = new Widget;

function Slider(control) {
};

Slider.prototype = new Widget;

function Camera(control) {
	
	Widget.call(this, control);
	

};

Camera.prototype = new Widget;

/* Older Code *============================================================================ */


/* ============================================================================
 * == Control.                                                               ==
 * ============================================================================ */
function CoupledTanks()
{
	
    /* Experiment variables. */
    this.valve = 0.0;
    this.setpoint = 0.0;
	
    /* Currently displayed mode. */
	this.mode = 0;
	
	/** The list of widgets that are displayed on the page. */
	this.widgets = [];
	
    
	this.PCONTROLLER = "CoupledTanksTwo";

}

CoupledTanks.prototype.init = function() {
	this.requestData();
};

CoupledTanks.prototype.requestData = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/mapjson/pc/" + PCONTROLLER + "/pa/data",
		cache: false,
		success: function(packet) {
			if (typeof packet!= "object") 
			{
				/* User is probably logged out. */
				window.location.reload();
				return;
			}
			
			var data = {}, i = 0;
			
			/* Key the variables into a hash table. */
			for (i in packet) data[packet[i].name] = packet[i].value;
			
			/* If the mode is not the displayed mode, switch it. */
			if (data['lab'] != thiz.mode) thiz.setMode(data['lab']);

			/* Provide data to each of the versions. */
			thiz.data = data;
			for (i in thiz.widgets) thiz.widgets[i].update(data);
			
			setTimeout(function() { thiz.requestData(); }, 3000);
		},
		error: function() {
			setTimeout(function() { thiz.requestData(); }, 10000);
		}
	});
};

CoupledTanks.prototype.isWorking = function() {
	return this.working;
};

CoupledTanks.prototype.startSave = function() {};
CoupledTanks.prototype.stopSave = function() {};

/* ============================================================================
 * == Get Values.                                                            ==
 * ============================================================================ */

CoupledTanks.prototype.setPID = function(val) {
	var thiz = this;
	this.valve = val;
	$.get("/primitive/mapjson/pc/" + this.PCONTROLLER + "/pa/setPID" + val,
		   null,
		   function(response) {
				if (typeof response == 'object')
				{
					thiz.values(response);
					thiz.repaint();
				}
				else thiz.raiseError("Failed response");
			}
	);
};

CoupledTanks.prototype.setValve = function(val) {
	var thiz = this;
	this.setpoint = val;
	$.get("/primitive/mapjson/pc/" + this.PCONTROLLER + "/pa/setValve" + val,
		   null,
		   function(response) {
				if (typeof response == 'object')
				{
					thiz.values(response);
					thiz.repaint();
				}
				else thiz.raiseError("Failed response");
			}
	);
};


/* ============================================================================
 * == Set Values.                                                            ==
 * ============================================================================ */

CoupledTanks.prototype.values = function(values) {
	for (i in values)
	{
		switch (values[i].name)
		{
		case "setPID":
			this.valve = round(parseFloat(values[i].value, 10), 2);
			break;
			
		case "setVavle":
			this.setpoint = round(parseFloat(values[i].value, 10), 2);
			break;
		}
	}
};

/* ============================================================================
 * == Slider                                                                 ==
 * ============================================================================ */

function Slider(){
	
	    $(".slider").slider({
        range: "min",
        min: 0,
        max: 100,
        value: 0,
        slide: function(event, ui) {
            $(".sliderValue").val(ui.value);
            console.log('sliding');
        }
    });
    
    $(".sliderValue").change(function() {
        var value = this.value.substring(1);
        $(".slider").slider("value", parseInt(value));
        $(".sliderValue").val($(".slider").slider("value"));
    });
};
Slider.prototype.inti = function() {};
Slider.prototype.slide = function() {};
Slider.prototype.update = function() {};

/* ============================================================================
 * == Page Elements.                                                         ==
 * ============================================================================ */
    
    /* JQuery Tabs. */
    $("#tabs").tabs();
    $("#diagramTabs").tabs();
    $(".windowcontent").resizable();
    $(".resizableVideo").resizable({
        aspectRatio: 16 / 9,
        minHeight: 192,
        minWidth: 108
    });
    
    /* Toggle Buttons. */
    $('.toggle').click(function() {
        var x = '.' + $(this).attr('name');
        var y = $(this);
        $(x).is(':visible') ? $(x).hide('fade', 150) : $(x).show('fade', 150);
        if ($(this).find('.switch').find('.slide').hasClass('off')) {
            $(this).find('.switch').find('.slide').addClass("on").removeClass("off");
        }else{
            $(this).find('.switch').find('.slide').addClass("off").removeClass("on");
        } 
    }); 
    
    function randomNum(){	
        var x = Math.floor(Math.random()*100)+1;
        return x;
    };
        
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
    
    $(".windowwrapper").draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.windowwrapper',
        increaseZindexOnmousedown: true
    });

/* ============================================================================
 * == Page Widgets.                                                          ==
 * ============================================================================ */

function ControlPanel() {};
ControlPanel.prototype.init = function() {};
ControlPanel.prototype.setManualMode = function() {};
ControlPanel.prototype.toggle = function() {};

function diagram(CTinst)
{
	CoupledTanksWidget.call(this, CTinst);
	
	/* Default diagram properties. */
	this.width = 320;
	this.height = 240;
    this.duration = "";
    this.period = "";
    this.l1 = "";
    this.l2 = "";
    this.t1In = "";
    this.t2Out = "";
    this.t1Tot2 = "";
}

diagram.prototype.init = function() {};

diagram.prototype.animateSpin = function() {
    var angle = 0;
    setInterval(function(){
        angle+=3;
        $(".spinner").rotate(angle);
    },10); 
};

diagram.prototype.toggle = function() {};

function camera(CTinst)
{
	CoupledTanksWidget.call(this, CTinst);
	
	/* Default diagram properties. */
	this.width = 320;
	this.height = 240;
}
diagram.prototype.init = function() {};
diagram.prototype.resize = function() {};
diagram.prototype.pausefeed = function() {};
diagram.prototype.deployVideo = function() {};
diagram.prototype.deploySWF = function() {};
diagram.prototype.deployMPEG = function() {};
diagram.prototype.Format = function() {};
diagram.prototype.toggle = function() {};

function toggle(CTinst){
	CoupledTanksWidget.call(this, CTinst);
	
	/* Default diagram properties. */
	this.width = 320;
	this.height = 240;
}
toggle.prototype.init = function(){};
toggle.prototype.toggleWidget = function(){};

function chart(CTinst){
	CoupledTanksWidget.call(this, CTinst);
	
	/* Default diagram properties. */
    this.width = "";
    this.height = "";
}
chart.prototype.init = function() {};
chart.prototype.repaint = function() {};
chart.prototype.clearPlot = function() {};
chart.prototype.toggle = function() {};


/* ============================================================================
 * == Utility & debug.                                                       ==
 * ============================================================================ */

CoupledTanks.prototype.raiseError = function(error, level) {
	if (typeof console == "undefined") return;
	
	switch (level)
	{
	case 'DEBUG':
		console.debug("CoupledTanks debug: " + error);
		break;
	
	case 'INFO':
		console.info("CoupledTanks Info: " + error);
		break;
	
	case 'WARN':
		console.warn("CoupledTanks Warn: " + error);
		break;
		
	case 'ERR':
	default:
		console.error("CoupledTanks Err: " + error);		
	}
};