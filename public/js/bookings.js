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
 * Abstract bookings page.
 * 
 * @param tz system timezone
 * @param sysoff system offset
 */
function BookingPage(tz, sysoff)
{	
	this.systemOffset = sysoff;
	this.systemTimezone = tz;
	
	this.inuseTimezone = tz;
	this.inuseOffset = 0;
	
	this.timezones = new Object();
	this.regions = null;
}

BookingPage.prototype.TZ_COOKIE = "Bookings-Timezone";
BookingPage.prototype.DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
BookingPage.prototype.MINS_PER_SLOT = 15;
BookingPage.prototype.SLOTS_PER_HOUR = 4;

BookingPage.prototype.initTimezone = function() {
	var cname = this.TZ_COOKIE + "=",
	    cparts = document.cookie.split(";"),
	    tz = null,
	    i, c;
	
	for (i in cparts)
	{
		c = cparts[i];
		while (c.charAt(0) == ' ') c = c.substr(1);
		if (c.indexOf(cname) == 0) tz = unescape(c.substr(c.indexOf("=") + 1));
	}
	
	if (tz && this.timezones[tz])
	{
		/* Use the cookie stored value. */
		this.changeTimezone(tz);
	}
	else
	{
		/* Detect the value from the browser provided offset. */
		var tzOffset = -((new Date().getTimezoneOffset() * 60) + this.systemOffset);
		if (tzOffset == 0) return;
		
		for (i in this.timezones)
		{
			if (this.timezones[i] == tzOffset)
			{
				this.inuseTimezone = i;
				this.inuseOffset = this.timezones[i];
				this.changeTimezone(i, false);
				return;
			}
		}
	}
	
};

BookingPage.prototype.displayTzSelector = function() {
	
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
	
	var utcOff = (this.inuseOffset + this.systemOffset),
	    offHr = Math.floor(utcOff / 3600),
	    offMin = Math.floor(utcOff % 3600 / 60),
	    reg, tz;
	if (offMin < 0)
	{
		offHr--;
		offMin += 60;
	}
	offHr = Math.abs(offHr);
	
	var html = 
		"<div id='tzselector' title='Timezone Selector'>" +
			"<p>Current timezone: <span id='inusetz'>GMT " + (utcOff >= 0 ? "+" : "&ndash;") + offHr + ':' + zeroPad(offMin) + "<span></p>" +
			"<ul id='tzlist'>";
	
	for (reg in this.regions)
	{
		html += 
			"<li id='" + reg + "' class='tzregion' >" +
				 "<span class='ui-icon ui-icon-arrowthick-1-e tzicon'></span>" + reg +
				 "<div id='" + reg + "region' class='tzregioncontainer'>" +
					"<ul class='innertzlist'>";
		
		for (tz in this.regions[reg])
		{	
			html += 	"<li class='timezoneregion' tz='" + this.regions[reg][tz] + "'>" + 
							"<span class='ui-icon ui-icon-arrowthick-1-e tzicon'></span>" + 
							this.regions[reg][tz].substr(this.regions[reg][tz].indexOf('/') + 1).split('_').join(' ') + 
						"</li>";
		}
		
		html += 	"</ul>" +
				"</div>" +
			"</li>";
	}
	
	html += "</ul>" +
			"<div style='clear:both'></div>" +
		"</div>";
	
	$("body").append(html);
	
	$("#tzselector").dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 400,
		buttons: {
			'Close': function() { $(this).dialog('close'); }
		},
		close: function() { $(this).dialog('destroy').remove(); }
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
						vp.changeTimezone($(this).attr('tz'), true);
				});
			}
		},
		function() { }
	);
};

BookingPage.prototype.changeTimezone = function(tz, userSelected) {
	this.inuseTimezone = tz;
	this.inuseOffset = this.timezones[tz];
	
	var utcOff = (this.inuseOffset + this.systemOffset);
	var offHr = Math.floor(utcOff / 3600);
	var offMin = Math.floor(utcOff % 3600 / 60);
	if (offMin < 0)
	{
		offHr--;
		offMin += 60;
	}
	$("#inusetz").empty().append("GMT " + (utcOff >= 0 ? "+" : "&ndash;") + Math.abs(offHr) + ':' + zeroPad(offMin)); 
	
	var hrOff = Math.floor(this.timezones[tz] / 3600);
	var minOff = Math.floor(this.timezones[tz] % 3600 / 60);
	
	for (var i = 0; i < 24; i++)
	{
		$("#timelabel" + i).empty().append(this.displayHour(i + hrOff));
	}
	
	if (typeof this.changeMode == "function")
	{
		/* Update existing page. */
		this.changeMode(this.mode);
	}
	
	if (userSelected)
	{
		/* Store the timezone in a session cookie. */
		document.cookie = this.TZ_COOKIE + "=" + escape(tz) + ";path=/;";
	}
};

BookingPage.prototype.addTimezone = function(tz, off) {
	this.timezones[tz] = off;
};

/* ----------------------------------------------------------------------------
 * -- Utility functions.                                                     --
 * ---------------------------------------------------------------------------- */
BookingPage.prototype.slotToTime = function(slot) {
	
	/* Stript the slot ID prefix. */
	if ((typeof slot ) == 'string' && slot.indexOf('slot') == 0)
	{
		slot = parseInt(slot.substr(4), 10);
	}
	
	var hr = Math.floor(slot / this.SLOTS_PER_HOUR) + Math.floor(this.inuseOffset / 3600);
	var min = ((slot % this.SLOTS_PER_HOUR) * this.MINS_PER_SLOT) +  Math.floor(this.inuseOffset % 3600 / 60);
	if (min < 0)
	{
		hr--;
		min = 60 + min;
	}
	
	var tm  = this.displayHour(hr).split(' ');
	return tm[0] + ':' + zeroPad(min) + ' ' + tm[1];
};

BookingPage.prototype.slotToISOTime = function(slot) {
	/* Stript the slot ID prefix. */
	if ((typeof slot ) == 'string' && slot.indexOf('slot') == 0)
	{
		slot = parseInt(slot.substr(4), 10);
	}
	
	var hr = Math.floor(slot / this.SLOTS_PER_HOUR);
	var min = (slot % this.SLOTS_PER_HOUR) * this.MINS_PER_SLOT;
	
	return zeroPad(hr) + ':' + zeroPad(min) + ":" + "00";
};

BookingPage.prototype.isoTimeToSlot = function(iso) {
	var time = iso.substr(iso.indexOf("T") + 1);
	var pos = time.indexOf("+");
	if (pos != -1) time = time.substr(0, pos);
	if ((pos = time.indexOf("-")) != -1) time.substr(0, pos);
	
	time = time.split(":");	
	return Math.ceil((parseInt(time[0], 10) * 60 + parseInt(time[1], 10)) / this.MINS_PER_SLOT);
};

BookingPage.prototype.isoToTime = function(iso) {
	var time = iso.substr(iso.indexOf("T") + 1);
	var pos = time.indexOf("+");
	if (pos != -1) time = time.substr(0, pos);
	if ((pos = time.indexOf("-")) != -1) time.substr(0, pos);
	
	time = time.split(":");
	var hr = parseInt(time[0], 10) + Math.floor(this.inuseOffset / 3600);
	var min = parseInt(time[1], 10) + Math.floor(this.inuseOffset % 3600 / 60);
	if (min < 0)
	{
		hr--;
		min = 60 + min;
	}
	
	var tm  = this.displayHour(hr).split(' ');
	return tm[0] + ':' + zeroPad(min) + ' ' + tm[1];
};

BookingPage.prototype.isoToDate = function(iso) {
	
	var time = iso.substr(iso.indexOf("T") + 1);
	var pos = time.indexOf("+");
	if (pos != -1) time = time.substr(0, pos);
	if ((pos = time.indexOf("-")) != -1) time.substr(0, pos);
	
	time = time.split(":");
	var hr = parseInt(time[0], 10) + Math.floor(this.inuseOffset / 3600);
	var min = parseInt(time[1], 10) + Math.floor(this.inuseOffset % 3600 / 60);
	if (min < 0)
	{
		hr--;
		min = 60 + min;
	}
	
	var date = iso.substr(0, iso.indexOf("T")).split("-");
	date = date[2] + "/" + date[1] + "/" + date[0];
	if (hr < 0)
	{
		var dt = new Date(strToDate(date).getTime() - this.DAY_MILLISECONDS);
		return zeroPad(dt.getDate()) + "/" + zeroPad(dt.getMonth() + 1) + "/" + zeroPad(dt.getFullYear());
	}
	else if (hr > 23)
	{
		var dt = new Date(strToDate(date).getTime() + this.DAY_MILLISECONDS);
		return zeroPad(dt.getDate()) + "/" + zeroPad(dt.getMonth() + 1) + "/" + zeroPad(dt.getFullYear());
	}
	else
	{
		return date;
	}
};

BookingPage.prototype.displayHour = function(hr) {
	var time;
	
	if (hr < 0) time = this.displayHour(24 + hr);
	else if (hr == 0 || hr == 24) time = '12 am';
	else if (hr < 12) time = hr + ' am';
	else if (hr == 12) time = '12 pm';
	else if (hr < 24) time = (hr - 12) + ' pm';
	else time = this.displayHour(hr - 24);

	return time;
};

/**
 * Bookings page.
 * 
 * @param pid permission ID
 * @param start start date
 * @param end end date
 * @param dur session duration
 * @param extdur extension duration
 * @param name resource name
 * @param num number of bookings
 * @oaram max maximum allowed bookings
 * @param tz system timezone
 * @param sysoff system offset from UTC
 */
function Booking(pid, start, end, dur, ext, extdur, name, num, max, tz, sysoff)
{
	BookingPage.call(this, tz, sysoff);
	
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
	
	this.bestFits = null;
	
	this.numBookings = num;
	this.maxBookings = max;
}
Booking.prototype = BookingPage.prototype;

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
    		
    		if (vp.numBookings >= vp.maxBookings)
    		{
    			vp.setMaximumBookings();
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

/* ----------------------------------------------------------------------------
 * -- Page events.                                                         --
 * ---------------------------------------------------------------------------- */

Booking.prototype.confirmBooking = function() {
	var html = 
		"<div id='bookingconfirmation' title='Reservation Confirmation'>";
	
	
	var bkStart = this.slotToTime(this.booking);
	var bkEnd = this.slotToTime(this.bookingEnd + 1);

	if (bkStart.substr(bkStart.length - 2) == 'pm' && bkEnd.substr(bkEnd.length - 2) == 'am')
	{
		var bkStartDate = dateToStr(this.date);
		var bkEndDate = bkStartDate;
		if (this.inuseOffset < 0) bkStartDate = dateToStr(new Date(this.date.getTime() - this.DAY_MILLISECONDS));
		else bkEndDate = dateToStr(new Date(this.date.getTime() + this.DAY_MILLISECONDS));

		html += "<p>You have requested to reserve '<span>" + this.name.split('_').join(' ') + "</span>' from <span>" + 
				bkStart + "</span> on <span>" + bkStartDate + "</span> to <span>" + bkEnd + "</span> on <span>" + 
				bkEndDate + "</span>.</p>";
	}
	else
	{
		html += "<p>You have requested to reserve '<span>" + this.name.split('_').join(' ') + "</span>' on <span>" + 
				dateToStr(this.date) + "</span> from <span>" + bkStart + "</span> to <span>" + 
				bkEnd + "</span>.</p>";
	}
	html += '</div>';

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
	
	var bf = parseInt(id.substr(7), 10);
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
	
	var bkStart = this.slotToTime(this.booking);
	var bkEnd = this.slotToTime(this.bookingEnd + 1);
	var bkStartDate = dateToStr(this.date);
	var bkEndDate = bkStartDate;
	
	if (this.inuseOffset < 0)      bkStartDate = dateToStr(new Date(this.date.getTime() - this.DAY_MILLISECONDS));
	else if (this.inuseOffset > 0) bkEndDate = dateToStr(new Date(this.date.getTime() + this.DAY_MILLISECONDS));
	
	var bs = this.booking;
	var be = this.bookingEnd;
		
	$("#bookingconfirmation").dialog('close');
	$("#bookingfailed").dialog('close');
	
	this.destroyBooking();
		
	if (resp.success) 
	{
		/* Determine whether the user is in a booking countdown. */
		$.get(
			"/queue/inqueue",
			null,
			function(response){
				if (typeof response != "object" || response.inBooking)
				{
					window.location.reload();
				}
			}
		);
		
		for (var i = bs; i <= be; i++)
		{
			$("#slot" + i).removeClass("free").addClass("ownbooking").unbind();
		}
		
		/* Success dialog. */
		var html = 
			"<div id='bookingsuccess' title='Reservation Created'>" +
				"<div><img src='/images/booking_success.png' alt='Success' /></div>";
		
		if (bkStart.substr(bkStart.length - 2) == 'pm' && bkEnd.substr(bkEnd.length - 2) == 'am')
		{
			html += 
				"<p>A reservation was successfully created for '<span>" + this.name.split('_').join(' ') + 
				"</span>' from <span>" + bkStart + "</span> on <span>" + bkStartDate + "</span> to <span>" + 
				bkEnd + "</span> on <span>" + bkEndDate + ".</p>";				
		}
		else
		{
			html += 
				"<p>A reservation was successfully created for '<span>" + this.name.split('_').join(' ') + 
				"</span>' on <span>" + bkStartDate + "</span> from <span>" + bkStart + 
				"</span> to <span>" + bkEnd + "</span>.</p>";
		}
		
		
		html += "<div class='ui-state-highlight ui-corner-all'>" +
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
				}
			},
			close: function(event, ui) {
					$(this).dialog('destroy').remove();
					vp.destroyBooking();
			}
		});
		
		if (++this.numBookings >= this.maxBookings)
		{
			this.setMaximumBookings();
		}
	}
	else
	{
		var html = 
			"<div id='bookingfailed' title='Reservation Not Created'>" +
				"<div><img src='/images/booking_failed.png' alt='Failed' /></div>";
		
		if (bkStart.substr(bkStart.length - 2) == 'pm' && bkEnd.substr(bkEnd.length - 2) == 'am')
		{
			html += 
				"<p>The reservation for '<span>" + this.name.split('_').join(' ') + "</span>' from <span>" + 
				bkStart + "</span> on <span>" + bkStartDate + "</span> to <span>" + bkEnd + "</span> on <span>" +
				bkEndDate + "</span> could not be created. The options to resolve this are:</p>";
		}
		else
		{
			html += 
				"<p>The reservation for '<span>" + this.name.split('_').join(' ') + "</span>' on <span>" + 
				bkStartDate + "</span> from <span>" + bkStart + "</span> to <span>" + 
				bkEnd + "</span> could not be created. The options to resolve this are:</p>";
		}	
		html +=	"<ul class='bookingfailedlist'>";
		
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
				var bfStart = this.isoToTime(startTime);
				var bfEnd = this.isoToTime(this.bestFits[i].endTime);
				var bfDate = startTime.substr(0, startTime.indexOf("T")).split("-");
				
				html += 
					"<li>" +
						"<a id='bestfit" + i + "' class='bookingfailedoption bestfit ui-icon-all'>" +
							"<span class='ui-icon ui-icon-arrowthick-1-e bookingfailedicon'> </span>";
				
				if (bfStart.substr(bfStart.length - 2) == 'pm' && bfEnd.substr(bfEnd.length - 2) == 'am')
				{
					var bfStartDate = bfDate[2] + "/" + bfDate[1] + "/" + bfDate[0];
					var bfEndDate = bfStartDate;
					
					bfDate = strToDate(bfStartDate);
					if (this.inuseOffset < 0) bfStartDate = dateToStr(new Date(bfDate.getTime() - this.DAY_MILLISECONDS));
					else bfEndDate = dateToStr(new Date(bfDate.getTime() + this.DAY_MILLISECONDS));

					html += 
						"Accept a reservation from <span>" + bfStart + "</span> on <span>" + bfStartDate + 
						"</span> to <span>" + bfEnd + "</span> on <span>" + bfEndDate + "</span>.";
				}
				else
				{
					html += 
						"Accept a reservation on <span>" + bfDate[2] + "/" + bfDate[1] + "/" + bfDate[0] + 
						"</span> from <span>" + bfStart + "</span> to <span>" + bfEnd + "</span>.";
				}
				
				html += 	
						"</a>" +
					"</li>";
			}
		}
				
		html += 	"<li>" +
						"<a id='windowreload' class='bookingfailedoption ui-corner-all'>" +
							"<span class='ui-icon ui-icon-arrowthick-1-e bookingfailedicon'> </span>" +
							"Reload the page as reservations may have been made since the page was loaded." + 
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
	
	this.booking = parseInt(slot.attr('id').substr(4), 10);
	var mins = this.MINS_PER_SLOT;
	
	/* Pre select to half the session duration. */
	this.bookingEnd = this.booking + 1;
	while (mins < this.duration && this.isSlotBookable(this.bookingEnd)) 
	{
		mins += this.MINS_PER_SLOT;
		this.bookingEnd++;
	}
	
	/* Roll back to the last booking used slot. */
	this.bookingEnd--;
	
	var height = (this.bookingEnd - this.booking + 1) * 15,
	    html = 
			"<div class='timeselector ui-corner-all' style='height:" + height + "px'>" +
				"<div class='timeselectortitle'>" +
					this.slotToTime(this.booking) + " - " + this.slotToTime(this.bookingEnd + 1) +
				"</div>",
		i, k;
	
	
		/* Arrows. */
		if (this.isSlotBookable(this.bookingEnd + 1))
		{
			for (i = 1; i <= 2; i++)
			{ 
				html += "<div class='timedragarrow timedragarrow" + i + "'>";
				for (k = 10; k > 0; k--) html += "<div class='tline" + k + "'> </div>";
				html += "</div>";
			}
			
			/* Drag indicator helper. */
			html += "<div class='dragindicator bhover'>" +
						"<div class='bhovercontent ui-corner-all'>" +
							"Drag down to extend reservation." +
						"</div>" +
						"<div class='bhoverarrow'>";
			for (i = 1; i <= 10; i++) html += "<div class='bhover" + i + "'></div>";
			html += 	"</div>" +
					"</div>";
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
		$("#slot" + i).removeClass('free').addClass('createbooking').unbind();
	}
	
	$(".timeselector").resizable({
		handles: 's',
		grid: 21,
		start: function(event, ui) {
			$(".dragindicator").remove();
		},
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
	$('.dragindicator').remove();
	
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

Booking.prototype.setMaximumBookings = function() {
	$("#nobookwarning").show();
	
	this.disableBookings();
};

Booking.prototype.disableBookings = function() {
	$("#bookingstimecontainer").addClass("bookingsdisabled");
	
	this.disableHovers = true;
	$(".free").unbind()
		.removeClass("free")
		.addClass("freedisabled");
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
		slot = parseInt(slot.substr(4), 10);
	}
	
	/* Over the day boundary. */
	if (slot == 0 || slot == 24 * this.SLOTS_PER_HOUR) return false;
	
	return $('#slot' + slot).hasClass('free');
};

/**
 * Existing reservations page.
 * 
 * @param mode display mode
 * @param tz system timezone
 * @param sysoff system offset from UTC
 */
function Existing(mode, tz, sysoff)
{
	BookingPage.call(this, tz, sysoff);
	this.bookings = new Object();
	
	this.mode == mode;
}
Existing.prototype = BookingPage.prototype;

Existing.prototype.addBooking = function(bid, name, start, end, isFinished, isCancelled, reason){
	var bObj = new Object();
	bObj.bookingID = bid;
	bObj.startTime = start;
	bObj.endTime = end;
	bObj.displayName = name;
	bObj.isCancelled = isCancelled;
	bObj.isFinished = isFinished;
	bObj.cancelReason = reason;
	this.bookings[bid] = bObj;
};

Existing.prototype.initPage = function() {
	// FIXME This should init calendar or list view.
//	var stateMode = window.location.hash;
//	if (stateMode.substring(6) == "cal")
//	{
//
//		this.changeMode("list");
//	}
//	else
//	{
//		this.changeMode("list");	
//	}
	this.drawList();
};

Existing.prototype.changeMode = function(mode) {
	// FIXME This should change between calendar and list displays.
//	this.mode = mode;
//	if (mode == "cal")
//	{
//		window.location.hash = 'dmodecal';
//		$("#listtab").removeClass("selectedtab").addClass("notselectedtab");
//		$("#caltab").removeClass("notselectedtab").addClass("selectedtab");
//		this.drawCalendar();
//	}
//	else
//	{
//		if (window.location.hash.length > 0) window.location.hash = 'dmodelist';
//		$("#listtab").removeClass("notselectedtab").addClass("selectedtab");
//		$("#caltab").removeClass("selectedtab").addClass("notselectedtab");
//		this.drawList();
//	}
	this.drawList();
};

Existing.prototype.drawList = function() {

	var html = 
		"<div class='stateselector ui-corner-top'>" +
			"<div class='stateselectoritem'>" +
				"<input class='showactivecb' type='checkbox' name='showactive' checked='checked' /> Active</span>" +
			"</div>" +
			"<div class='stateselectoritem'>" +
				"<input class='showcancelledcb' type='checkbox' name='showcancelled' checked='checked' /> Cancelled</span>" +
			"</div>" +
			"<div class='stateselectoritem'>" +
				"<input class='showfinishedcb' type='checkbox' name='showactive' checked='checked' /> Finished</span>" +
				"</div>" +
		"</div>" +
		"<table class='bookingstable'>";
	for (var i in this.bookings)
	{
		var b = this.bookings[i];	
		html += "<tr id='booking" + i + "'class='" + (b.isCancelled ? "bcancelled" : (b.isFinished ? "bfinished" : "bactive")) + "'>" +
					"<td class='namecell'>" + b.displayName.split('_').join(' ') + "</td>" +
					"<td class='datecell'>" + this.isoToDate(b.startTime) + "</td>" +
					"<td class='timecell'>" + this.isoToTime(b.startTime) + "</td>" +
					"<td class='timecell'>" + this.isoToTime(b.endTime) + "</td>" +
					"<td class='statecell'>";
		
		if (b.isCancelled) html += b.cancelReason;
		else if (b.isFinished) html += 'Reservation complete.';
		else 
		{
			html += "&nbsp";
		}
		
		html += 	"</td>" +
				"</tr>";
	}
	html += "</table>";
	
	$("#modecontents").empty().append(html);
	
	$(".bookingstable tr.bactive").hover(
		function() {
			$(this).addClass("rowhover")
				   .children(".statecell").append("Click To Cancel");
		},
		function() {
			$(this).removeClass("rowhover");
			$(this).children(".statecell").empty();
		}
	);
	
	$(".showactivecb").click(function() {
		if ($(".showactivecb:checked").length == 0) $(".bactive").hide();
		else $(".bactive").show();
	});
	
	$(".showfinishedcb").click(function() {
		if ($(".showfinishedcb:checked").length == 0) $(".bfinished").hide();
		else $(".bfinished").show();
	});
	
	$(".showcancelledcb").click(function() {
		if ($(".showcancelledcb:checked").length == 0) $(".bcancelled").hide();
		else $(".bcancelled").show();
	});
	
	$(".bactive").click(function() {
		vp.confirmCancel($(this).attr('id'));
	});
};

Existing.prototype.drawCalendar = function() {
	var html = 'cal view';
	
	$("#modecontents").empty().append(html);
};

Existing.prototype.confirmCancel = function(id) {
	var b = this.bookings[id.substr(7)];
	var html = 
		"<div id='confirmcancel' title='Cancel Reservation'>" +
			"<p>Are you sure you want to cancel the reservation for '<span>" + b.displayName.split('_').join(' ') +
			"</span>' on <span>" + this.isoToDate(b.startTime) + "</span> from <span>" + this.isoToTime(b.startTime) + 
			"</span> to <span>" + this.isoToTime(b.endTime) + "</span>.<p>" +
		"</div>";
	
	$("body").append(html);
	$("#confirmcancel").dialog({
		autoOpen: true,
		modal: true,
		width: 400,
		resizable: false,
		buttons: {
			'Cancel Reservation': function() {
				vp.cancelBooking(b.bookingID);
			},
			'Close': function() {
				$(this).dialog('close');
			}
		},
		close: function() {
			$(this).dialog('destroy').remove();
		}
	});
};

Existing.prototype.cancelBooking = function(id) {
	/* Tear down dialog. */
	var diagsel = "div[aria-labelledby=ui-dialog-title-confirmcancel]";
	$(diagsel + " div.ui-dialog-titlebar").css("display", "none");
	$(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
	$("#confirmcancel").html(
		"<div class='bookingconfirmationloading'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		"	<p>Requesting...</p>" +
		"</div>");
	
	$.post(
		'/bookings/cancel',
		{
			bid: id,
			reason: "User cancellation."
		},
		function(response) { vp.cancelBookingCallback(response, id); }
	);
};

Existing.prototype.cancelBookingCallback = function(response, id) {
	if (typeof response != "object") window.location.reload();
	
	$("#confirmcancel").dialog('close');
	
	if (response.success)
	{
		$("#booking" + id).switchClass("bactive", "bcancelled", 0)
			 .unbind()
			 .children(".statecell").append("User cancellation.");
	}
	else
	{
		alert("FAILED: " + response.failureReason);
	}
};

function Waiting(bid, sec)
{
	this.bookingId = bid;
	this.seconds = sec;
	
	this.statusTimer = null;
	
	this.startWarning = -120 < sec && sec <= 0;
	this.offlineWarning = sec <= -120;
}

Waiting.prototype.countDown = function() {
	this.seconds--;
	
	if (this.seconds < 60 && this.statusTimer == null)
	{
		this.statusTimer = setTimeout(function(){
			$.get(
				"/queue/inqueue",
				null,
				function(response) {
					vp.statusTimer = null;
					if (typeof response != "object")
					{
						/* Some unexpected response. */
						window.location.reload();
					}
					else if (response.inSession)
					{
						/* Booking redeemed. */
						window.location.replace("/session/index");
					}
					else if (!response.inBooking)
					{
						window.location.replace("/queue/index/emessage/Booking%20has%20been%20cancelled.");
					}
			});
		}, this.seconds > 30 ? 30000 : 15000);
	}
	
	if (this.seconds > 0)
	{
		var min = Math.floor(this.seconds / 60),
			sec = this.seconds % 60;
		
		var nmin = $("#bookingmin").text(min);
		var nsec = $("#bookingsec").text(zeroPad(sec));
		
		if (min < 10 && nmin.hasClass("booktimeblack")) nmin.switchClass("booktimeblack", "booktimered");
		if (min < 10 && nsec.hasClass("booktimeblack")) nsec.switchClass("booktimeblack", "booktimered");
	}
	else if (this.seconds > -120 && !this.startWarning)
	{
		this.startWarning = true;
		
		var res = $("#bookres").text();
		$("#bookdesc").remove();
		$("#booktime").remove();
		$("#bookinginfo").children(":first").before(
			"<div id='bookdescstart'>" +
				"Please wait, your reservation for '<span id='bookres'>" + res + "</span>' is about to start." +
			"</div>"
		);

	}
	else if (this.seconds <= -120 && !this.offlineWarning)
	{
		this.offlineWarning = true;
		
		var res = $("#bookres").text();
		$("#bookdescstart").remove();
		$("#bookinginfo").children(":first").before(
			"<div id='bookdescwarn' class='ui-corner-all ui-state ui-state-error'>" +
				"<span class='ui-icon ui-icon-alert bookdescwarnicon'></span>" +
				"It appears your reserved resource '<span id='bookres'>" + res + "</span>' is " +
				"currently <em>offline</em>. Please wait, if any other rigs are free, these will be provided to you." +
			"</div>"
		);
	}
};

Waiting.prototype.cancel = function() {
	$.post(
		"/bookings/cancel",
		{
			bid: this.bookingId,
			reason: "User Cancellation"
		},
		function(response) {
			window.location.replace("/queue/index");
		}
	);
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

