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
 * @date 6th April 2010
 */

function updateSession()
{
	$.get(
		"/session/info",
		{},
		function (info) {
			if (!info.isInSession)
			{
				window.location.replace("/queue/index");
				return;
			}
			
			/* Ready overlay. */
			if (notReady)
			{
				if (info.isReady)
				{
					notReady = false;
					$("#readyoverlay").dialog("close");
					
					/* Restore the normal interval. */
					clearTimeout(tInterval);
					tInterval = setInterval("updateSession()", callBackInterval);
				}
			}
			
			/* Update the in session and remaining fields. */
			$("#sessiontime .hour").html(timePad(Math.floor(info.time / 3600)));
			$("#sessiontime .min").html(timePad(Math.floor((info.time % 3600) / 60)));
			$("#sessiontime .sec").html(timePad((info.time % 3600) % 60));
			
			var rHour = Math.floor(info.timeLeft / 3600);
			var rMin = Math.floor((info.timeLeft % 3600) / 60);
			$("#sessionremainingtime .hour").html(timePad(rHour));
			$("#sessionremainingtime .min").html(timePad(rMin));
			$("#sessionremainingtime .sec").html(timePad((info.timeLeft % 3600) % 60));
			
			if (rHour < 1 && rMin < 10)
			{
				$("#sessionremainingtime .timefields").addClass("timered");
				$("#sessionremainingtime .timefields").removeClass("timenormal");
			}

			/* Warning message. */
			if (info.warningMessage !== undefined)
			{
				$("#warnmessagetext").html(info.warningMessage);
				if ($("#warningmessage").css('display') == 'none')
				{
					$("#warningmessage").fadeIn("slow");
				}
			}
			else
			{
				if ($("#warningmessage").css('display') == 'block')
				{
					$("#warningmessage").fadeOut("slow");
				}
			}
			
			/* Time extensions. */
			if (info.extensions < extensions)
			{
				extensions = info.extensions;
				$("#sessiontimeextension").slideDown(1250);
				$(".leftpush").animate({"top": "+=35"}, 1250);
			}
			else
			{
				if ($("#sessiontimeextension").css("display") == "block")
				{
					$("#sessiontimeextension").slideUp(1250);
					$(".leftpush").animate({"top": "-=35"}, 1250);
				}
			}
		}
	);
}

function finishSession()
{
	var diagDiv = "div[aria-labelledby=ui-dialog-title-finishsessiondialog]";
	var conDiv = "#finishsessiondialog";
	
	/* Cancel all buttons. */
	$(diagDiv + " div.ui-dialog-buttonpane").css("display", "none");
	$(diagDiv + " div.ui-dialog-titlebar").css("display", "none");
	$(conDiv).dialog({'closeOnEscape': false});
	
	html = "<div style='text-align:center;font-size:1.3em;'>" +
		   "	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		   "	<p>Finishing session...</p>" +
		   "</div>";
	
	$(conDiv).html(html);
	
	$.get(
		"/session/finish",
		{},
		function (r) {
			$(conDiv).html(
					"<div class='dialogcentercontent'>" +
					"	<div class='dialogheader'>" +
					"		<h3 style='display:block;margin-top:20px'>Success, redirecting...</h3>" +
					"   </div>" +
					"<div>"
			);
			window.location.replace("/queue/index");
		}
	);
}

function remainingCountDown()
{
	var sec = $("#sessionremainingtime .sec").html();
	var min = $("#sessionremainingtime .min").html();
	var hour = $("#sessionremainingtime .hour").html();
	
	if (sec != 0)
	{
		 $("#sessionremainingtime .sec").html(timePad(sec - 1));
		 return;
	}
	
	/* Time has ended. */
	if (hour == 0 && min == 0) return;
	
	$("#sessionremainingtime .sec").html(timePad(59));
	if (min != 0)
	{
		$("#sessionremainingtime .min").html(timePad(min - 1));
		return;
	}
	
	$("#sessionremainingtime .min").html(timePad(59));
	
	$("#sessionremainingtime .hour").html(timePad(hour - 1));
}

function inSessionCountUp()
{
	var sec = $("#sessiontime .sec").html();
	var min = $("#sessiontime .min").html();
	var hour = $("#sessiontime .hour").html();
	
	if (sec != 59)
	{
		 $("#sessiontime .sec").html(timePad(parseInt(sec) + 1));
		 return;
	}
	
	$("#sessiontime .sec").html(timePad(0));
	if (min != 59)
	{
		$("#sessiontime .min").html(timePad(parseInt(min) + 1));
		return;
	}
	
	$("#sessiontime .min").html(timePad(0));
	$("#sessiontime .hour").html(timePad(parseInt(hour) + 1));
}

function timePad(tm)
{
	if (tm < 0) return "00";

	if (tm < 10)
	{
		return "0" + tm;
	}
	return tm;
}