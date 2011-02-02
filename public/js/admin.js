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
 * @date 30th January 2010
 */

function loadTypeStatus(rigType, id)
{
	$.get(
		"/admin/type",
		{
			name: rigType
		},
		function(response) {
			if (typeof response != "object") window.location.reload();
		
			var html = "<div class='typedialogcontent'>";
			if (response.isAlarmed)
			{
				html += "<img src='/images/balls/red_anime.gif' alt='Alarm' />" +
						"<br />" +
						"<span class='statusstring'>Alarm!</span>";
			}
			else if (response.isOnline)
			{
				html += "<img src='/images/balls/green.gif' alt='Alarm' />" +
						"<br />" +
						"<span class='statusstring'>Online</span>";
			}
			else
			{
				html += "<img src='/images/balls/blue.gif' alt='Alarm' />" +
						"<br />" +
						"<span class='statusstring'>Offline</span>";
			}
			
			html += "<ul class='riglist'>";
			if (response.rigs instanceof Array)
			{
				var i;
				for (i in response.rigs)
				{
					html += addRigButton(response.rigs[i]);	
				}
			}
			else if (typeof response.rigs == "object")
			{
				html += addRigButton(response.rigs);
			}
			
			html +=	"</ul>" + 
				"</div>";
			
			$("#" + id + "dialog").empty().append(html);
		}
	);
}

function addRigButton(rig, html)
{
	html = "<li><a class='rigbutton ui-corner-all' href='/admin/rigpage/rig/" + rig.name + "'>";
	
	if (rig.isAlarmed)
	{
		html += "<img src='/images/balls/red_anime_small.gif' alt='Online' />";
	}
	else if (!rig.isRegistered)
	{
		html += "<img src='/images/balls/blue_small.gif' alt='Online' />";
	}
	else if (!rig.isOnline)
	{
		html += "<img src='/images/balls/red_trans_small.gif' alt='Online' />";
	}
	else if (rig.isInSession)
	{
		html += "<img src='/images/balls/yellow_trans_small.gif' alt='Online' />";
	}
	else
	{
		html += "<img src='/images/balls/green_trans_small.gif' alt='Online' />";
	}
	
	html += "<br />" +
			rig.name.split('_').join(' ') +
			"</a></li>";
	
	return html;
}

function createOffline()
{
	$("body").append(
		"<div id='createoffline' title='Add Offline Period'>" +
			"<div>" +
				"<div class='timeline'>Start: </div>" + 
				"<div class='timeline'>End: </div>" + 
			"</div>" + 
			"<div class='reasonline'>" +
				"<div class='reasonlabel'>Reason:</div>" +
				"<div class='jqTransformInputWrapper' style='width:300px'>" +
					"<div class='jqTransformInputInner'><div>" +
						"<input id='offreason' class='jqtransformdone jqTranformInput' type='text' />" +
					"</div></div>" +
			"</div>" +
			"<div style='clear:both'> </div>" +
		"</div>"
	);
	
	$("#createoffline").dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 350,
		buttons: {
			'Add Period': function() {
				cancelOffline();
			},
			'Cancel': function() {
				$(this).dialog('close');
			}
		},
		close: function() {
			$(this).dialog('destroy');
			$(this).remove();
		}
	});
}

var cancelId = null;
function confirmOffline(id)
{
	cancelId = id;
	$("body").append(
		"<div id='confirmcanceloffline' title='Cancel Offline Period'>" +
			"<div>" + 
				"Are you sure you want to cancel the rig offline period?" +
			"</div>" +
		"</div>");
	

	$("#confirmcanceloffline").dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 350,
		buttons: {
			'Cancel Offline': function() {
				cancelOffline();
			},
			'Close': function() {
				$(this).dialog('close');
			}
		},
		close: function() {
			$(this).dialog('destroy');
			$(this).remove();
		}
	});
}

function cancelOffline()
{
	var reason = $("#kickreason").val();
	/* Tear down dialog. */
	var confirm = $("#confirmcanceloffline");
	confirm.dialog({closeOnEscape: false});
	
	/* Tear down dialog. */
	var diagsel = "div[aria-labelledby=ui-dialog-title-confirmcanceloffline]";
	$(diagsel).css('width', 150)
		.css('text-align', 'center')
		.css('left', parseInt($(diagsel).css('left')) + 100);
	$(diagsel + " div.ui-dialog-titlebar").css("display", "none");
	$(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
	confirm.html(
		"<div class='bookingconfirmationloading'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		"	<p>Requesting...</p>" +
		"</div>"
	);
	
	$.post(
		"/admin/canceloffline",
		{
			pid: cancelId
		},
		function(response){
			// TODO Should be page update not reload
			window.location.reload();
		}
	);
}

function confirmKickSession() 
{
	$("body").append(
		"<div id='confirmsessionkick' title='Confirm Session Termination'>" +
			"<div>" +
				"Are you sure you want to terminate the in-progress session and free the rig?" +
			"</div>" + 
			"<div class='reasonline'>" +
				"<div class='reasonlabel'>Reason:</div>" +
				"<div class='jqTransformInputWrapper' style='width:300px'>" +
					"<div class='jqTransformInputInner'><div>" +
						"<input id='kickreason' class='jqtransformdone jqTranformInput' type='text' />" +
					"</div></div>" +
			"</div>" +
			"<div style='clear:both'> </div>" +
		"</div>"
	);
	
	$("#confirmsessionkick").dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		width: 350,
		buttons: {
			'Terminate Session': function(){
				cancelSession();
			},
			'Cancel': function(){
				$(this).dialog('close');
			}
		},
		close: function() {
			$(this).dialog('destroy');
			$(this).remove();
		}
	});
}

function cancelSession()
{
	var reason = $("#kickreason").val();
	/* Tear down dialog. */
	var confirm = $("#confirmsessionkick");
	confirm.dialog({closeOnEscape: false});
	
	/* Tear down dialog. */
	var diagsel = "div[aria-labelledby=ui-dialog-title-confirmsessionkick]";
	$(diagsel).css('width', 150)
		.css('text-align', 'center')
		.css('left', parseInt($(diagsel).css('left')) + 100);
	$(diagsel + " div.ui-dialog-titlebar").css("display", "none");
	$(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
	confirm.html(
		"<div class='bookingconfirmationloading'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		"	<p>Requesting...</p>" +
		"</div>"
	);
	
	$.post(
		"/admin/kick",
		{
			rig: rig,
			reason: reason
		},
		function(response){
			// TODO Should be page update not reload
			window.location.reload();
		}
	);
}
