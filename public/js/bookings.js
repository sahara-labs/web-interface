/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2010, University of Technology, Sydney
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * Neither the name of the University of Technology, Sydney nor the names
 *    of its contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author Michael Diponio (mdiponio)
 * @date 9th November 2010
 */


/**
 * Bookings page.
 * 
 * @param pid permission ID
 * @param start start date
 * @param end end date
 * @param dur session duration
 * @param extdur extension duration
 * @param name resource name
 * @param tz system timezone
 * @param sysoff system offset from UTC
 */
function Booking(pid, start, end, dur, ext, extdur, name, tz, sysoff)
{
	this.pid = pid;
	
	this.date = this.start = strToDate(start);
	this.end = new Date(strToDate(end).getTime() + this.DAY_MILLISECONDS - 1000);
	
	/* Permission information. */
	this.duration = Math.floor(dur / 60);
	this.maxSlots = Math.floor((dur + ext * extdur) / 60 / this.MINS_PER_SLOT);
	
	/* Booking creation display. */
	this.booking = -1;
	this.bookingEnd = -1;
	
	/* Hover states. */
	this.disableHovers = false;
	this.slotHovers = new Object();
	
	this.name = name;
	
	this.systemOffset = sysoff;
	this.systemTimezone = tz;
	
	this.inuseTimezone = tz;
	this.inuseOffset = 0;
	
	this.timezones = new Object();
	this.regions = null;
	
	this.bestFits = null;
}

/* ----------------------------------------------------------------------------
 * -- Constants.                                                             --
 * ---------------------------------------------------------------------------- */
Booking.prototype.DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
Booking.prototype.MINS_PER_SLOT = 15;
Booking.prototype.SLOTS_PER_HOUR = 4;

Booking.prototype.changeDate = function(newDate) {
	
	if ((typeof newDate) == "string") newDate = strToDate(newDate);
	
	/* Range check. */
	var dmillis = newDate.getTime();
	if (dmillis < this.start.getTime() || dmillis > this.end.getTime())
	{
		alert("ERROR: " + newDate.toDateString() + " out of range.");
		return;
	}

	/* Button states. */
	if (Math.abs(dmillis - this.start.getTime()) < this.DAY_MILLISECONDS)
	{
		this.enableDayButton(false);
		this.disableDayButton(true);
	}
	else if (Math.abs(this.end.getTime() - dmillis) < this.DAY_MILLISECONDS)
	{
		this.enableDayButton(true);
		this.disableDayButton(false);
	}
	else
	{
		this.enableDayButton(false);
		this.enableDayButton(true);
	}
	
	this.date = newDate;
    $('#daypicker').datepicker('setDate', this.date);
    $('#bookingstimetitle').empty().append(dateToStr(this.date));
    
    this.destroyBooking();
    $(".timeslot").unbind()
    	.removeClass('free')
    	.removeClass('nopermission')
    	.removeClass('booked')
    	.removeClass('ownbooking')
    	.addClass('slotloading');
    
    /* Get the free times. */
    $.post(
    	"/bookings/times",
    	{
    		pid: this.pid,
    		day: this.date.getFullYear() + "-" + zeroPad(this.date.getMonth() + 1) + "-" + zeroPad(this.date.getDate()),
    		tz: ((this.systemOffset >= 0) ? "+" : "-") + zeroPad(Math.floor(Math.abs(this.systemOffset) / 3600)) + ":" + 
    				zeroPad(Math.abs(this.systemOffset) % 3600 / 60)
    	},
    	function (resp) {
    		if (typeof resp == 'string') window.location.reload();
    		
    		for (var i in resp)
    		{
    			var s = resp[i].toLowerCase();
    			$("#slot" + i).removeClass('slotloading').addClass(s);
    			
    			if (s == 'free') vp.restoreFreeSlot(i);
    		}
    	}
    );
};

/* ----------------------------------------------------------------------------
 * -- Button behaviour.                                                      --
 * ---------------------------------------------------------------------------- */
Booking.prototype.nextEnabled = true;
Booking.prototype.previousEnabled = false;

Booking.prototype.nextDay = function() {
	if (!this.nextEnabled) return;

	this.changeDate(new Date(this.date.getTime() + this.DAY_MILLISECONDS));
};

Booking.prototype.previousDay = function() {
	if (!this.previousEnabled) return;
	
	this.changeDate(new Date(this.date.getTime() - this.DAY_MILLISECONDS));
};

Booking.prototype.enableDayButton = function(prev) {
    if (prev && this.previousEnabled || !prev && this.nextEnabled) return;
    
	var base;
    if (prev)
    {
        this.previousEnabled = true;
        base = 'leftarrow';
    }
    else
    {
        this.nextEnabled = true;
        base = 'rightarrow';
    }
    
	$('#' + base).removeClass('disdaybutton')
		 .addClass('daybutton')
		 .children('img').attr('src', '/images/' + base + '.png');
};

Booking.prototype.disableDayButton = function(prev) {
    if (prev && !this.previousEnabled || !prev && !this.nextEnabled) return;
    
    var base;
    if (prev)
    {
        this.previousEnabled = false;
        base = 'leftarrow';
    }
    else
    {
        this.nextEnabled = false;
        base = 'rightarrow';
    }
    
	$('#' + base).removeClass('daybutton')
		 .addClass('disdaybutton')
		 .children('img').attr('src', '/images/dis_' + base + '.png');
};

Booking.prototype.displayTzSelector = function() {
	
	if (this.regions == null)
	{
		this.regions = new Object();
		for (var tz in this.timezones)
		{
			var r = tz.substr(0, tz.indexOf('/'));
			if (typeof this.regions[r] == 'undefined') this.regions[r] = new Array();
			this.regions[r].push(tz);
		}
	}
	
	var html = 
		"<div id='tzselector' title='Timezone Selector'>" +
			"<p>Current timezone: <span id='inusetz'>" + this.inuseTimezone.split("_").join(" ") + "<span></p>" +
			"<ul id='tzlist'>";
	
	for (var reg in this.regions)
	{
		html += 
			"<li id='" + reg + "' class='tzregion " + (this.inuseTimezone.indexOf(reg) == 0 ? "inuseregion'" : "'") + ">" +
				 "<span class='ui-icon ui-icon-arrowthick-1-e tzicon'></span>" + reg +
				 "<div id='" + reg + "region' class='tzregioncontainer'>" +
					"<ul class='innertzlist'>";
		
		for (var tz in this.regions[reg])
		{	
			html += 	"<li class='timezoneregion " + (this.inuseTimezone == this.regions[reg][tz] ? "inuseregion'" : "'") + 
									" tz='" + this.regions[reg][tz] + "'>" + 
							"<span class='ui-icon ui-icon-arrowthick-1-e tzicon'></span>" + 
							this.regions[reg][tz].substr(this.regions[reg][tz].indexOf('/') + 1).split('_').join(' ') + 
						"</li>";
		}
		
		html += 	"</ul>" +
				"</div>" +
			"</li>";
	}
	
	html += "</ul>" +
		"</div>";
	
	$("body").append(html);
	
	$("#tzselector").dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 400,
		height: 494,
		buttons: {
			'Close': function() { $(this).dialog('close'); }
		},
		close: function() { $(this).dialog('destroy').remove(); }
	});
	
	$("#" + this.inuseTimezone.substr(0, this.inuseTimezone.indexOf("/")) + "region").show()
		.children()
		.children(".timezoneregion").click(function() {
			vp.changeTimezone($(this).attr('tz'));
		});
	
	$(".tzregion").hover(
		function() {
			if ($(this).children(".tzregioncontainer").css("display") == "none")
			{
				$(".tzregioncontainer").hide();
				$(".timezoneregion").unbind();
				$(this).children(".tzregioncontainer").show()
					.children()
					.children(".timezoneregion").click(function () {
						vp.changeTimezone($(this).attr('tz'));
				});
			}
		},
		function() { }
	);
};

Booking.prototype.changeTimezone = function(tz) {
	$("#inusetz").empty().append(tz.split("_").join(" "));
	
	$(".inuseregion").removeClass("inuseregion");
	$("#" + tz.substr(0, tz.indexOf("/"))).addClass("inuseregion");
	$("li[tz=" + tz + "]").addClass("inuseregion");
	
	this.inuseTimezone = tz;
	this.inuseOffset = this.timezones[tz];
	
	var hrOff = Math.floor(this.timezones[tz] / 3600);
	var minOff = Math.floor(this.timezones[tz] % 3600 / 60);
	
	for (var i = 0; i < 24; i++)
	{
		$("#timelabel" + i).empty().append(this.displayHour(i + hrOff));
	}
};

/* ----------------------------------------------------------------------------
 * -- Page events.                                                         --
 * ---------------------------------------------------------------------------- */

Booking.prototype.confirmBooking = function() {
	var html = 
		"<div id='bookingconfirmation' title='Reservation Confirmation'>" +
			"<p>You have requested to reserve '<span>" + this.name + "</span>' on <span>" + dateToStr(this.date) + 
			"</span> from <span>" + this.slotToTime(this.booking) + "</span> to <span>" + 
			this.slotToTime(this.bookingEnd + 1) + "</span>.</p>" +
		"</div>";
	$("body").append(html);
	
	$('#bookingconfirmation').dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 400,
		buttons: {
			'Confirm Reservation': function () {
				vp.commitBooking();
			},
			'Cancel': function() {
				$(this).dialog('close');
				vp.destroyBooking();
			}
		},
		close: function(event, ui) {
				$(this).dialog('destroy').remove();
		}
	});
};

Booking.prototype.commitBooking = function() {
	
	var confirm = $("#bookingconfirmation");
	confirm.dialog({closeOnEscape: false});
	
	/* Tear down dialog. */
	var diagsel = "div[aria-labelledby=ui-dialog-title-bookingconfirmation]";
	$(diagsel + " div.ui-dialog-titlebar").css("display", "none");
	$(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
	confirm.html(
		"<div class='bookingconfirmationloading'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		"	<p>Requesting...</p>" +
		"</div>"
	);
	
	/* Work out start and end times. */
	var dayStr = this.date.getFullYear() + "-" + zeroPad(this.date.getMonth() + 1) + "-" + zeroPad(this.date.getDate());
	
	var bkStart = dayStr + "T" + this.slotToISOTime(this.booking);
	var bkEnd = dayStr + "T";
	if (this.bookingEnd + 1 == this.SLOTS_PER_HOUR * 24) bkEnd += "23:59:59"; // End of day
	else bkEnd += this.slotToISOTime(this.bookingEnd + 1);	
	
	/* Add timezone info. */
	var tzOff = ((this.systemOffset >= 0) ? "+" : "-") + zeroPad(this.systemOffset / 3600) + ":" + 
			zeroPad(this.systemOffset % 3600 / 60);
	bkStart += tzOff;
	bkEnd += tzOff;
	
	$.post(
		"/bookings/commit",
		{
			pid: this.pid,
			start: bkStart,
			end: bkEnd,
			send: true,
			tz: this.inuseTimezone
		},
		function(resp) {
			vp.confirmBookingCallback(resp);
		}
	);
};

Booking.prototype.commitBestFit = function(id) {
	var confirm = $("#bookingfailed");
	confirm.dialog({closeOnEscape: false});
	
	/* Tear down dialog. */
	var diagsel = "div[aria-labelledby=ui-dialog-title-bookingconfirmation]";
	$(diagsel + " div.ui-dialog-titlebar").css("display", "none");
	$(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
	confirm.html(
		"<div class='bookingconfirmationloading'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		"	<p>Requesting...</p>" +
		"</div>"
	);
	
	var bf = parseInt(id.substr(7));
	if (this.bestFits == null || bf >= this.bestFits.length)
	{
		alert("ERROR: Best fit " + bf + " out of range.");
		$("bookingfailed").dialog("close");
		return;
	}
	
	this.booking = this.isoTimeToSlot(this.bestFits[bf].startTime);
	this.bookingEnd = this.isoTimeToSlot(this.bestFits[bf].endTime) - 1;

	$.post(
		"/bookings/commit",
		{
			pid:   this.pid,
			start: this.bestFits[bf].startTime,
			end:   this.bestFits[bf].endTime,
			send:  true,
			tz:    this.inuseTimezone
		},
		function(resp) {
			vp.confirmBookingCallback(resp);
		}
	);
};

Booking.prototype.confirmBookingCallback = function(resp) {
	/* Some error. */
	if (typeof resp == "string") window.location.reload();
	
	var bs = this.booking;
	var be = this.bookingEnd;
		
	$("#bookingconfirmation").dialog('close');
	$("#bookingfailed").dialog('close');
	
	this.destroyBooking();
		
	if (resp.success) 
	{	
		for (var i = bs; i <= be; i++)
		{
			$("#slot" + i).removeClass("free").addClass("ownbooking").unbind();
		}
		
		/* Success dialog. */
		var html = 
			"<div id='bookingsuccess' title='Reservation Created'>" +
				"<div><img src='/images/booking_success.png' alt='Success' /></div>" +
				"<p>A reservation was successfully created for '<span>" + this.name + "</span>' on <span>" + dateToStr(this.date) + 
				"</span> from <span>" + this.slotToTime(bs) + "</span> to <span>" + 
				this.slotToTime(be + 1) + "</span>.</p>" +
				"<div class='ui-state-highlight ui-corner-all'>" +
					"<span class='ui-icon ui-icon-info' style='float:left;margin-right:5px;'> </span>" +
					"Please log on at this time to use your reservation." +
				"</div>" +
			"</div>";
		$("body").append(html);
		
		$('#bookingsuccess').dialog({
			autoOpen: true,
			modal: true,
			resizable: false,
			width: 400,
			buttons: {
				'OK': function() {
					$(this).dialog('close');
					vp.destroyBooking();
				}
			},
			close: function(event, ui) {
					$(this).dialog('destroy').remove();
			}
		});
	}
	else
	{
		var html = 
			"<div id='bookingfailed' title='Reservation Not Created'>" +
				"<div><img src='/images/booking_failed.png' alt='Failed' /></div>" +
				"<p>The reservation for '<span>" + this.name + "</span>' on <span>" + dateToStr(this.date) + 
				"</span> from <span>" + this.slotToTime(bs) + "</span> to <span>" + 
				this.slotToTime(be + 1) + "</span> could not be created. The options to resolve this are:</p>" +
				"<ul class='bookingfailedlist'>";
		
		if (resp.bestFits != null)
		{
			this.bestFits = resp.bestFits.bookings;
			if (typeof this.bestFits == "object" && !this.bestFits.length)
			{
				this.bestFits = new Array();
				this.bestFits[0] = resp.bestFits.bookings;
			}

			for (var i in this.bestFits)
			{
				var startTime = this.bestFits[i].startTime;
				var bfDate = startTime.substr(0, startTime.indexOf("T")).split("-");
				
				html += 
					"<li>" +
						"<a id='bestfit" + i + "' class='bookingfailedoption bestfit ui-icon-all'>" +
							"<span class='ui-icon ui-icon-arrowthick-1-e bookingfailedicon'> </span>" +
							"Accept a reservation on <span>" + bfDate[2] + "/" + bfDate[1] + "/" + bfDate[0] + 
							"</span> from <span>" + isoToTime(this.bestFits[i].startTime) + "</span> to <span>" + 
							isoToTime(this.bestFits[i].endTime) + "</span>.";
						"</a>" +
					"</li>";
			}
		}
				
		html += 	"<li>" +
						"<a id='windowreload' class='bookingfailedoption ui-corner-all'>" +
							"<span class='ui-icon ui-icon-arrowthick-1-e bookingfailedicon'> </span>" +
							"Reload the page as reservations could have been made since the page was loaded." + 
						"</a>" +
					"</li>";
				"</ul>" +
			"</div>";
		$("body").append(html);
		
		$('#bookingfailed').dialog({
			autoOpen: true,
			modal: true,
			resizable: false,
			width: 400,
			buttons: {
				'Cancel': function() {
					$(this).dialog('close');
				}
			},
			close: function(event, ui) {
					$(this).dialog('destroy').remove();
					vp.destroyBooking();
			}
		});
		
		if (this.bestFits != null)
		{
			$(".bestfit").click(function () { vp.commitBestFit($(this).attr('id')); });
		}
		$("#windowreload").click(function() { window.location.reload(); });
	}
};

Booking.prototype.startBooking = function(slot) {
	
	this.disableHovers = true;
	this.clearHover(slot);

	
	/* Clear any other creation overlays. */
	if (this.booking >= 0) this.destroyBooking();
	
	this.booking = parseInt(slot.attr('id').substr(4));
	var mins = this.MINS_PER_SLOT;
	
	/* Pre select to half the session duration. */
	this.bookingEnd = this.booking + 1;
	while (mins < this.duration / 2 && this.isSlotBookable(this.bookingEnd)) 
	{
		mins += this.MINS_PER_SLOT;
		this.bookingEnd++;
	}
	
	/* Roll back to the last booking used slot. */
	this.bookingEnd--;
	
	var height = (this.bookingEnd - this.booking + 1) * 15;
	var html = 
			"<div class='timeselector ui-corner-all' style='height:" + height + "px'>" +
				"<div class='timeselectortitle'>" +
					this.slotToTime(this.booking) + " - " + this.slotToTime(this.bookingEnd + 1) +
				"</div>";
	
	
		/* Arrows. */
		if (this.isSlotBookable(this.bookingEnd + 1))
		{
			for (var i = 1; i <= 4; i++)
			{ 
				html += "<div class='timedragarrow timedragarrow" + i + "'>";
				for (var k = 10; k > 0; k--) html += "<div class='tline" + k + "'> </div>";
				html += "</div>";
			}
		}
		
		html += "<div class='timeselectorbutton timeselectorcommit ui-corner-all'>" +
					"<img src='/images/booking_commit.png' alt='commit' />" +
				"</div>" +
				"<div class='timeselectorbutton timeselectorcancel ui-corner-all'>" +
					"<img src='/images/booking_cancel.png' alt='Cancel' />" +
				"</div>" +
			"</div>";
		
	slot.append(html);
	
	for (var i = this.booking; i <= this.bookingEnd; i++)
	{
		slot.removeClass('free').addClass('createbooking').unbind();
	}
	
	$(".timeselector").resizable({
		handles: 's',
		grid: 21,
		stop: function(event, ui) {
			vp.changeBooking(Math.round((ui.size.height - ui.originalSize.height) / 21));
		}
	});
	
	/* Events. */
	$(".timeselectorcommit").click(function() {
		setTimeout("vp.confirmBooking()", 10);
	});
	
	$(".timeselectorcancel").click(function() {
		setTimeout("vp.destroyBooking()", 10);
	});
	
	$(".timeselector .ui-resizable-handle").css("height", '15px');
};

Booking.prototype.changeBooking = function(slots) {
	
	/* Any previous invocation cleanup. */
	$('.diswarn').remove();
	
	if (slots > 0)
	{
		/* The user has requested more time. */
	
		/* The user can only get the amount of slots that the permission allows. */
		var disallowed = 0;
		var message;
		if (this.bookingEnd + slots - this.booking + 1 > this.maxSlots)
		{
			slots -= disallowed = this.bookingEnd + slots - this.booking + 1 - this.maxSlots;
			message = "Maximum allowed reservation is " + (this.maxSlots * 15) + " min.";
		}
		
		/* Make sure the slots can be booked. */
		while (slots > 0 && this.isSlotBookable(++this.bookingEnd))
		{
			slots--;
		}
		disallowed += slots;
		
		if (slots > 0)
		{
			message = "Reservation already at " + this.slotToTime(this.bookingEnd) + ".";
			this.bookingEnd--;
		}
		
		if (disallowed > 0)
		{
			/* Display a warning message. */
			$('.timeselector').append(
				"<div class='diswarn bhover'>" +
					"<div class='bhovercontent ui-corner-all'>" + message + "</div>" +
				"</div>");
			
			$(".diswarn").click(function() {
				$(this).remove();
			});
		}
		
		if (disallowed > 0 || !this.isSlotBookable(this.bookingEnd + 1))
		{
			$('.timedragarrow').hide();
		}
		
		for (var i = this.booking; i <= this.bookingEnd; i++)
		{
			$("#slot" + i).removeClass('free').addClass('createbooking').unbind();
		}
	}
	else if (slots < 0)
	{
		/* The user has deselected some previously selected time. */
		while (slots < 0 && this.bookingEnd > this.booking)
		{
			this.restoreFreeSlot(this.bookingEnd);
			this.bookingEnd--;
			slots++;
		}
		
		$('.timedragarrow').show();
	}
	
	/* Fit the booking time selector. */
	var ts = $(".timeselector");
	ts.css('height', (this.bookingEnd - this.booking) > 0 ? (this.bookingEnd - this.booking)* 21 : 15);
	
	
	$(".timeselectortitle").empty()
		.append(this.slotToTime(this.booking) + " - " + this.slotToTime(this.bookingEnd + 1));
};

Booking.prototype.destroyBooking = function() {
	$("#slot" + this.booking).children('.timeselector').remove();
	
	for (var i = this.booking; i <= this.bookingEnd; i++)
	{
		this.restoreFreeSlot(i);
	}
	this.booking = -1;
	this.bookingEnd = -1;
	this.bestFits = null;
	
	this.disableHovers = false;
};

Booking.prototype.restoreFreeSlot = function(id) {
	$("#slot" + id).removeClass('createbooking').addClass('free')
	.click(function(){
		vp.startBooking($(this));
	})
	.hover(
		function() {
			var id = $(this).attr('id');
			if (vp.initHover(id)) setTimeout("vp.drawHover('" + id + "')", 1000);
		},
		function() {
			vp.clearHover($(this));
		}
	);
};

Booking.prototype.initHover = function(id) {
	if (this.disableHovers) return false;

	return this.slotHovers[id] = true;
};

Booking.prototype.drawHover = function(id) {
	if (this.slotHovers[id])
	{
		var html = 
				"<div class='slothover bhover'>" +
					"<div class='bhovercontent ui-corner-all'>" +
						"Click to start a reservation at " + this.slotToTime(id) + "." +
					"</div>" +
					"<div class='bhoverarrow'>";
		for (var i = 10; i > 0; i--) html += "<div class='bhover" + i + "'></div>";
		html += 	"</div>" +
				"</div>";
		$('#' + id).append(html)
				.children('.slothover').fadeIn();
	}
};

Booking.prototype.clearHover = function(slot) {
	this.slotHovers[slot.attr('id')] = false;
	slot.children('.slothover').fadeOut().remove();
};

/* ----------------------------------------------------------------------------
 * -- Accessors.                                                             --
 * ---------------------------------------------------------------------------- */
Booking.prototype.getStart = function() {
	return dateToStr(this.start);
};

Booking.prototype.getCurrent= function() {
	return dateToStr(this.date);
};

Booking.prototype.getEnd = function() {
	return dateToStr(this.end);
};

Booking.prototype.isSlotBookable = function(slot) {
	if ((typeof slot ) == 'string' && slot.indexOf('slot') == 0)
	{
		slot = parseInt(slot.substr(4));
	}
	
	/* Over the day boundary. */
	if (slot == 0 || slot == 24 * this.SLOTS_PER_HOUR) return false;
	
	return $('#slot' + slot).hasClass('free');
};

Booking.prototype.addTimezone = function(tz, off) {
	this.timezones[tz] = off;
};

/* ----------------------------------------------------------------------------
 * -- Utility functions.                                                     --
 * ---------------------------------------------------------------------------- */
Booking.prototype.slotToTime = function(slot) {
	/* Stript the slot ID prefix. */
	if ((typeof slot ) == 'string' && slot.indexOf('slot') == 0)
	{
		slot = parseInt(slot.substr(4));
	}
	
	var hr = Math.floor(slot / this.SLOTS_PER_HOUR);
	var min = (slot % this.SLOTS_PER_HOUR) * this.MINS_PER_SLOT;
	if (min == 0) min = "00";
	
	if (hr == 0 || hr == 24) return '12:' + min + ' am';
	else if (hr < 12) return hr + ':' + min + ' am';
	else if (hr == 12) return '12:' + min + ' pm';
	else return (hr -12) + ':' + min + ' pm';
};

Booking.prototype.slotToISOTime = function(slot) {
	/* Stript the slot ID prefix. */
	if ((typeof slot ) == 'string' && slot.indexOf('slot') == 0)
	{
		slot = parseInt(slot.substr(4));
	}
	
	var hr = Math.floor(slot / this.SLOTS_PER_HOUR);
	var min = (slot % this.SLOTS_PER_HOUR) * this.MINS_PER_SLOT;
	
	return zeroPad(hr) + ':' + zeroPad(min) + ":" + "00";
};

Booking.prototype.isoTimeToSlot = function(iso) {
	var time = iso.substr(iso.indexOf("T") + 1);
	var pos = time.indexOf("+");
	if (pos != -1) time = time.substr(0, pos);
	if ((pos = time.indexOf("-")) != -1) time.substr(0, pos);
	
	time = time.split(":");	
	return Math.ceil((parseInt(time[0]) * 60 + parseInt(time[1])) / this.MINS_PER_SLOT);
};

Booking.prototype.displayHour = function(hr) {
	var time = '';
		
	if (hr < 0)
	{
		if (24 + hr == 23)
		{
			time = dateToStr(new Date(this.date.getTime() - this.DAY_MILLISECONDS));
			time += "<br />";
		}
		time += this.displayHour(24 + hr);
	}
	else if (hr == 0 || hr == 24) time = '12 am';
	else if (hr < 12) time = hr + ' am';
	else if (hr == 12) time = '12 pm';
	else if (hr < 24) time = (hr - 12) + ' pm';
	else 
	{
		if (hr - 24 == 0)
		{
				time = dateToStr(new Date(this.date.getTime() + this.DAY_MILLISECONDS));
				time += "<br />";
		
		}
		time += this.displayHour(hr - 24);
	}
	return time;
};

/**
 * Converts a date string to a Date object.
 * 
 * @param str string date in the form dd/mm/yyyy.
 * @returns {Date} date object
 */
function strToDate(str)
{
	var dts = str.split('/', 3);
	
	var dobj = new Date();
	dobj.setFullYear(dts[2], dts[1] - 1, dts[0]);
	dobj.setHours(0, 0, 0, 0);
	return dobj;
}

/**
 * Converts a Date object to a date string in the format dd/mm/yyyy.
 * 
 * @param date date object
 * @return {String} date string
 */
function dateToStr(date)
{
	return zeroPad(date.getDate()) + "/" + zeroPad((date.getMonth() + 1)) + "/" + zeroPad(date.getFullYear());
}

/**
 * Converts a ISO8601 time to a display time.
 * 
 * @param iso ISO8601 time
 * @returns {String} display time
 */
function isoToTime(iso)
{
	var time = iso.substr(iso.indexOf("T") + 1);
	var pos = time.indexOf("+");
	if (pos != -1) time = time.substr(0, pos);
	if ((pos = time.indexOf("-")) != -1) time.substr(0, pos);
	
	time = time.split(":");
	var hr = parseInt(time[0]);
	var min = parseInt(time[1]);
	
	if (hr == 0 || hr == 24) return '12:' + zeroPad(min) + ' am';
	else if (hr < 12) return zeroPad(hr) + ':' + zeroPad(min) + ' am';
	else if (hr == 12) return '12:' + zeroPad(min) + ' pm';
	else return zeroPad(hr -12) + ':' + zeroPad(min) + ' pm';
}

/**
 * Zero pads with a leading 0 if parameter is one digit.
 * 
 * @param t param to pad
 * @return padded param
 */
function zeroPad(t)
{
	if (typeof t == "string")
	{
		if (t.length() == 1) return "0" + t;
	}
	else 
	{
		if (t < 10) return "0" + t;
	}
	
	return t;
}
