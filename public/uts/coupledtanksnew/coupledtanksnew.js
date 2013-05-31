/**
 * Coupled Tanks web interface.
 */


function CoupledTanks()
{
	
    /* Experiment variables. */
    this.valve = 0.0;
    this.setpoint = 0.0;
	
    /* Currently displayed mode. */
	this.mode = 0;
	
	/** The list of widgets that are displayed on the page. */
	this.widgets = [];
	
    
	this.PCONTROLLER = "CoupledTanks";

}

CoupledTanks.prototype.init = function() {
	this.requestData();
};

CoupledTanks.prototype.requestData = function() {
	var thiz = this;
	$.ajax({
		url: "/primitive/json/pc/CoupledTanks/pa/data",
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

/* ============================================================================
 * == Readings service.                                                      ==
 * ============================================================================ */

CoupledTanks.prototype.values = function(values) {
	for (i in values)
	{
		switch (values[i].name)
		{
		case "setValve":
			this.valve = round(parseFloat(values[i].value, 10), 2);
			break;
			
		case "setSetpoint":
			this.setpoint = round(parseFloat(values[i].value, 10), 2);
			break;
		}
	}
};
/* ============================================================================
 * == Rig control.                                                           ==
 * ============================================================================ */
CoupledTanks.prototype.setValve = function(val) {
	var thiz = this;
	this.valve = val;
	$.get("/primitive/json/pc/" + this.PCONTROLLER + "/pa/setValve/pressure/" + val,
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

CoupledTanks.prototype.setSetpoint = function(val) {
	var thiz = this;
	this.setpoint = val;
	$.get("/primitive/json/pc/" + this.PCONTROLLER + "/pa/setSetpoint/pressure/" + val,
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
/* ============================================================================
 * == Page widgets.                                                          ==
 * ============================================================================ */

CoupledTanks.prototype.Widget = function(wid,icon,title,content) {
	
	this.wid = wid;
	this.icon = icon;
	this.title = title;
	this.content = content;
	
	$("body").append(
			"<div class='windowwrapper' id=" + this.wid + ">" +
			    "<div class='windowheader'>" + this.icon +
			        "<span class='windowtitle'>" + this.title +
			        "</span>" +
			    "</div>" +
			    
			    "<div class='windowcontent'>" + this.content +
			    "</div>" +
			"</div>"
	);
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
    
/* ============================================================================
 * == Diagram                                                                ==
 * ============================================================================ */    
    
CoupledTanks.prototype.diagram = function(){
    
    var valvepercent;
    var pumprpm;
    var tankoneflowin;
    var flowsensorbetween;
    var tanktwoflowout;
    var levelBottom;
    
    $('.toggleWater').click(function(){ 
    	startSpin()
    	var percent =  "%";
        var tubeOneHeight;
        var i = 0; while (i<6){
        tubeOneHeight = randomNum();
        tubeTwoHeight = randomNum();
        tubeThreeHeight = randomNum();

    valvepercent = randomNum();
    pumprpm = randomNum();
    console.log('');
    tankoneflowin = randomNum();
    flowsensorbetween = randomNum();
    tanktwoflowout = randomNum();
    levelBottom = randomNum();
    
        $('.tubeOne').animate({"height": tubeOneHeight+percent }, 400);
        $('.tubeTwo').animate({"height": tubeTwoHeight+percent }, 400);
        $('.tubeThree').animate({"height": tubeTwoHeight+percent }, 400);
        
        $(".valvepercent").val(valvepercent + percent);
        $(".pumprpm").val(pumprpm + " RPM");
        $(".tankoneflowin").val(tankoneflowin + " L/m");
        $(".flowsensorbetween").val(flowsensorbetween + " L/m");
        $(".tanktwoflowout").val(tanktwoflowout + " L/m");
        $(".levelsensorone").val(tubeOneHeight);
        $(".levelsensortwo").val(tubeTwoHeight);

        i++;
        };
    });
};
    
    function startSpin(){
        var angle = 0;
        setInterval(function(){
            angle+=3;
            $(".spinner").rotate(angle);
        },10);
    };
    function randomNum(){	
        var x = Math.floor(Math.random()*100)+1;
        return x;
    };
      
/* ============================================================================
 * == Slider                                                                ==
 * ============================================================================ */
CoupledTanks.prototype.slider = function(){
    
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
/* ============================================================================
 * == Camera Display.                                                        ==
 * ============================================================================ */
