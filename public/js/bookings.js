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
 * @param start start date
 * @param end end date
 */
function BookingPage(start, end)
{
	this.date = this.start = strToDate(start);
	this.end = new Date(strToDate(end).getTime() + this.DAY_MILLISECONDS - 1000);
}

/* ----------------------------------------------------------------------------
 * -- Constants.                                                             --
 * ---------------------------------------------------------------------------- */
BookingPage.prototype.DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

BookingPage.prototype.changeDate = function(newDate) {
	
	if ((typeof newDate) == "string") newDate = strToDate(newDate);
	
	/* Range check. */
	var dmillis = newDate.getTime();
	if (dmillis < this.start.getTime() || dmillis > this.end.getTime())
	{
		alert("Error: " + newDate.toDateString() + " out of range.");
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
    
    
};

/* ----------------------------------------------------------------------------
 * -- Button behaviour.                                                      --
 * ---------------------------------------------------------------------------- */
BookingPage.prototype.nextEnabled = true;
BookingPage.prototype.previousEnabled = false;

BookingPage.prototype.nextDay = function() {
	if (!this.nextEnabled) return;

	this.changeDate(new Date(this.date.getTime() + this.DAY_MILLISECONDS));
};

BookingPage.prototype.previousDay = function() {
	if (!this.previousEnabled) return;
	
	this.changeDate(new Date(this.date.getTime() - this.DAY_MILLISECONDS));
};

BookingPage.prototype.enableDayButton = function(prev) {
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

BookingPage.prototype.disableDayButton = function(prev) {
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
 * -- Accessors.                                                             --
 * ---------------------------------------------------------------------------- */
BookingPage.prototype.getStart = function() {
	return dateToStr(this.start);
};

BookingPage.prototype.getCurrent= function() {
	return dateToStr(this.date);
};

BookingPage.prototype.getEnd = function() {
	return dateToStr(this.end);
};

/* ----------------------------------------------------------------------------
 * -- Utility functions.                                                     --
 * ---------------------------------------------------------------------------- */

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
	return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}
