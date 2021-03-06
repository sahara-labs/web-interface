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
 * @date 31st October 2012
 */

/**
 * Displays the add project dialog. 
 */
function displayAddProjectDialog()
{
	var i = 0, html = 
		"<div id='add-project-dialog' title='Add Activity'>" +
			"<form id='add-project-form' class='sahara-form'>" +
				"<div class='form-line'>" +
					"<label for='add-activity-id'>Activity ID:</label>" +
					"<input id='add-activity-id' type='text' name='add-activity-id' />" +
					"<div class='guidance-button'>" +
						"<span class='ui-icon ui-icon-help'></span>" +
						"<p>The activity ID of the activity. If you have a 'Research Master' ID, use that as your ID.</p>" +
					"</div>" + 
				"</div>" +
				"<div class='project-behaviour-title project-contents-title'>Behaviour</div>" +
				"<div class='form-line'>" +
					"<label for='add-permissions'>Permissions:</label>" +
					"<select id='add-permissions' name='add-permissions'>";
	
	/* Groups the user is a member of. */
	for (i in userClasses)
	{
		html += 		"<option value='" + userClasses[i].id + "'>" + userClasses[i].name.split("_").join(" ") + "</option>";
	}
	
	
    html += 		"</select>" +
    				"<div class='guidance-button'>" +
    					"<span class='ui-icon ui-icon-help'></span>" +
						"<p>Selects the permission that allows access to research instruments this activity is to use.</p>" +
					"</div>" + 
				"</div>" +
				"<div class='form-line'>" +
					"<label for='add-share-collection'>Share Collection:</label>" +
					"<input id='add-share-collection' type='checkbox' name='add-share-collection' />" +
					"<div class='guidance-button'>" +
						"<span class='ui-icon ui-icon-help'></span>" +
						"<p>Whether to share the activity and it's datasets with ANDS.</p>" +
					"</div>" + 
				"</div>" +
				"<div class='form-line'>" +
					"<label for='add-open-access'>Open Access:</label>" +
					"<input id='add-open-access' type='checkbox' name='add-open-access' />" +
					"<div class='guidance-button'>" +
						"<span class='ui-icon ui-icon-help'></span>" +
						"<p>Whether the datasets generated by this activity are openly accessible.</p>" + 
					"</div>" + 
				"</div>" +
				"<div class='form-line'>" +
					"<label for='add-auto-publish'>Auto Publish:</label>" +
					"<input id='add-auto-publish' type='checkbox' name='add-auto-publish' />" +
					"<div class='guidance-button'>" +
						"<span class='ui-icon ui-icon-help'></span>" +
						"<p>Whether datasets are automatically published as they are generated by using the " +
						"research equipment. If they are not automatically published, datasets " +
						"need to manually collated.</p>" + 
					"</div>" + 
				"</div>" +
			    "<div class='project-metadata-title project-contents-title'>Metadata</div>";
    
    /* Other metadata of the project. */
    for (i in definitions)
    {
    	html += "<div class='form-line'>" +
    				"<label for='" + definitions[i].id + "'>" + definitions[i].name + ":</label>" +
    				(definitions[i].optional ? "<input id='" + definitions[i].id + "-enable' type='checkbox' class='metadata-enable' />" : "") +
    				"<input id='" + definitions[i].id + "' type='text' name='" + definitions[i].id + "' " + (definitions[i].optional ? "disabled='disabled'" : "") + " />" +
    				"<div class='guidance-button'>" +
    					"<span class='ui-icon ui-icon-help'></span>" +
    					"<p>" + definitions[i].description + "</p>" +
    				"</div>" +
    			"</div>";
    }
    
	html +=	"</form>" +
		"</div>";
	
	/* Display the form dialog. */
	$("body").append(html);
	$("#add-project-dialog").dialog({
		modal: true,
		resizable: false,
		width: 400,
		buttons: {
			Add: addProject,
			Cancel: function() { $(this).dialog("close"); }
		},
		close: function() { $(this).dialog("destroy"); $(this).remove(); },
	}).parent().css('overflow', 'visible');
	
	/* Enable disable optional metadata fields. */
	$("#add-project-dialog .metadata-enable").click(function() {
		if ($(this).parent().has(":checked").length == 1)
		{
			/* Enable the input. */
			$(this).siblings("input").removeAttr("disabled");
		}
		else
		{
			/* Disable the input and clear contents. */
			$(this).siblings("input").attr("disabled", "disabled")
									  .val("");
		}
	});
	
	/* Form element focus. */
	$("#add-project-dialog input").focusin(formFocusIn).focusout(formFocusOut);
	
	/* Guidance button handling. */
	new GuidanceBubble("#add-project-dialog", "info", "left", 20, -20).initButtons();
	
	/* Check whether the activity ID is unique on focous out. */
	$("#add-activity-id")
		.focusin(function() { new GuidanceBubble().remove("#add-activity-id"); })
		.focusout(checkActivityID);
}

/**
 * Checks whether the entered activity ID is unique. If not a guidance bubble
 * is added to the page. 
 */
var isCheckingActivityID = false;
var activityIDUnique = false;
function checkActivityID()
{
	var id = $("#add-activity-id").val();
	if (id == "") return;

	isCheckingActivityID = true;
	$.get(
		"/research/checkactivity",
		{ activityID: id },
		function (resp) {
			/* User has probably logged out. */
			if (typeof resp != "object") window.location.reload();
			
			activityIDUnique = resp.unique;
			if (!resp.unique)
			{
				new GuidanceBubble("#add-project-dialog", "error", "left", 200, -10)
						.show("The activity ID is not unique. Please enter a different activity ID.", "#add-activity-id");
			}
			isCheckingActivityID = false;
		}
	);
}

/**
 * Adds a project using the contents of the add project dialog.
 */
var addProjectTimeout = false;
function addProject() 
{
	if (isCheckingActivityID)
	{
		if (addProjectTimeout) return;
		
		addProjectTimeout = true;
		setTimeout(function() {
			addProjectTimeout = false;
			addProject();
		}, 50);
	}
	
	var params = {}, valid = true,
		i = 0, val = "",
		gd = new GuidanceBubble("#add-project-dialog", "error", "left", 200, -10);
	
	/* Clear any existing guidance bubbles. */
	gd.removeAll();
	
	/* Validate entered values. */
	if ((params.activityID = $("#add-activity-id").val()) == "")
	{
		valid = false;
		gd.show("Activity ID must be specified.", "#add-activity-id");
	}
	else if (!activityIDUnique)
	{
		valid = false;
		gd.show("The activity ID is not unique. Please enter a different activity ID.", "#add-activity-id");
	}
	
	if ((params.userClass = $("#add-permissions option:selected").val()) == "")
	{
		valid = false;
		gd.show("A permission must selected for an activity. If you don't have any permissions " +
			    "use the 'Contact Support' form to request access.", "#add-activity-id");
	}
	
	params.shareCollection = $("#add-share-collection:checked").size() == 1 ? "true" : "false";
	params.openAccess = $("#add-open-access:checked").size() == 1 ? "true" : "false";
	params.autoPublish = $("#add-auto-publish:checked").size() == 1 ? "true" : "false";
	
	/* Validate other metadata fields. */
	for (i in definitions)
	{
		/* Optional parameters that have been selected to be added can be 
		 * ignored. */
		if (definitions[i].optional && $("#" + definitions[i].id + "-enable:checked").size() == 0) continue;

		val = $("#" + definitions[i].id).val();
		
		if (!definitions[i].optional && val == "")
		{
			/* Mandatory parameter not entered, valdiation failed. */
			valid = false;
			gd.show(definitions[i].name + " must be specified.", "#" + definitions[i].id);
		}
		else if (val == "") continue; // Optional parameter not specified.
		
		if (definitions[i].regex != "" && !(new RegExp(definitions[i].regex).test(val)))
		{
			valid = false;
			gd.show(definitions[i].hint, "#" + definitions[i].id);
			continue;
		}
		
		/* Metadata valid we can add it to the parameter set. */
		params[definitions[i].name] = val;
	}

	if (valid)
	{
		/* All fields correctly populated so we can add the project. */
		var $dialog = $("#add-project-dialog");
		$dialog.dialog("option", {
				closeOnEscape: false,
				width: 200,
			})
			.html(
				"<div id='add-project-submitting'>" +
					"<img src='/images/ajax-loading.gif' alt='' /><br />" +
					"Please wait..." +
				"</div>"
			)
			.parent()
				.css("left", parseInt($dialog.parent().css("left")) + 100)
				.children(".ui-dialog-titlebar, .ui-dialog-buttonpane").hide();
		
		/* Make the request to add the project. */
		$.post(
			"/research/addproject",
			params,
			function (resp)
			{
				/* User session timed out. */
				if (typeof resp != "object") 
				{
					window.location.reload();
					return;
				}
				
				/* Refresh the page to show the project in the list of existing projects. */
				if (resp.success)
				{
					window.location.reload();
					return;
				}
				
				/* Unexpected error, display error on restored dialog. */
				$dialog.dialog("option", {
						closeOnEscape: true,
						width: 400,
						buttons: {
							Cancel: function() { $(this).dialog("close"); }
						}
					})
					.html(
						"<div id='add-project-error' class='ui-state ui-state-error'>" +
							"<span class='ui-icon ui-icon-alert'></span>" +
							"Failed: " + resp.reason + 
						"</div>"
					)
					.parent()
						.css("left", parseInt($dialog.parent().css("left")) - 100)
						.children(".ui-dialog-titlebar, .ui-dialog-buttonpane").show();
			}
		);
	}
}

/**
 * Publishes a project.
 */
function publishProject()
{
	var $button = $(this), activity = $button.parents(".project-item").find(".project-activity-id").text();
	
	$("body").append(
		"<div id='publish-project-dialog' title='Publish Confirmation'>" +
			"<p>Are you sure you want to publish project to the UTS metadata store?</p>" +
			"<p class='ui-priority-secondary'>" +
				"<span class='ui-icon ui-icon-info'></span>Once your activity has been published " +
				"you can no longer modify it's details." +
			"</p>" +
			"<p class='ui-priority-secondary'>" +
				"<span class='ui-icon ui-icon-info'></span>Once your activity has been published, you " +
				"can start generating datasets." +
			"</p>" +
		"</div>"
	);
	
	$("#publish-project-dialog").dialog({
		closeOnEscape: true,
		width: 400,
		resizable: false,
		modal: true,
		buttons: {
			'Publish': function() {
				$.post(
					"/research/publishproject",
					{ activityID: activity },
					function(resp) {
						if (typeof resp != "object" || !resp.success)
						{
							window.location.reload();
							return;
						}
						
						/* Project contents drop down. */
						var $li = $button.parents(".project-item");
						$li.find(".project-content-save").remove();
						$li.children(".project-contents").append(
							"<div class='project-content-published'>" +
								"<p>Published activities cannot be modified.</p>" +
							"</div>"
						);
						
						/* Buttons. */
						$button.remove();
						
						if ($li.find('.auto-publish:checked').length == 1)
						{
							$li.children(".project-buttons").append(
								"<div class='project-button-view-collection'>" +
									"<span class='ui-icon ui-icon-search'></span> View Datasets" +
								"</div>"
							);
							
							$li.find(".project-button-view-collection").click(collectionsForProject);
						}
						else
						{
							$li.children(".project-buttons").append(
								"<div class='project-button-create-collection'>" +
									"<span class='ui-icon ui-icon-plus'></span> Collate Datasets" +
								"</div>"
							);
							
							$li.find(".project-button-create-collection").click(collectionsForProject);
						}
						
						$("#publish-project-dialog").dialog("close");
					}
				);
			},
			'Cancel': function() { $(this).dialog("close"); }
		},
		close: function() { $(this).dialog("destroy"); $(this).remove(); }
	});
}

/**
 * Redirects to the collections page.
 */
function collectionsForProject()
{
	window.location.href = "/research/collections/activityID/" + 
			$(this).parents(".project-item").find(".project-activity-id").text();
}

/**
 * Updates a project.
 */
function updateProject()
{
	var $item = $(this).parents(".project-item"), params = {}, i = 0, val, 
		valid = true, gd = new GuidanceBubble($item, "error", "left", 180, -20);
	
	/* Clear previous valdiation dialogs. */
	gd.removeAll();
	
	/* Project parameters. */
	params.activityID = $item.find(".project-activity-id").text();
	params.userClass = $item.find(".permissions-select option:selected").val();
	params.shareCollection = $item.find(".share-collection:checked").length == 1 ? 't' : 'f';
	params.openAccess = $item.find(".open-access:checked").length == 1 ? 't' : 'f';
	params.autoPublish = $item.find(".auto-publish:checked").length == 1 ? 't' : 'f';
	
	/* Project metadata. */
	for (i in definitions)
	{
		val = $item.find(".metadata-" + definitions[i].rid).val();
		
		/* Optional parameters that have been selected to be added can be 
		 * ignored. */
		if (definitions[i].optional && $item.find(".metadata-enable-" + definitions[i].rid).size() == 0) continue;

		if (!definitions[i].optional && val == "")
		{
			/* Mandatory parameter not entered, valdiation failed. */
			valid = false;
			gd.show(definitions[i].name + " must be specified.", $item.find(".metadata-" + definitions[i].rid));
		}
		else if (val == "") continue; // Optional parameter not specified.
		
		if (definitions[i].regex != "" && !(new RegExp(definitions[i].regex).test(val)))
		{
			valid = false;
			gd.show(definitions[i].hint, $item.find(".metadata-" + definitions[i].rid));
			continue;
		}
		
		/* Metadata valid we can add it to the parameter set. */
		params[definitions[i].name] = val;
	}
	
	if (valid)
	{
		/* Validation succeeded so we can update the record. */
		$.post(
			"/research/updateproject",
			params,
			function(resp) {
				if (typeof resp != "object") 
				{
					window.location.reload();
					return;
				}
				
				if (resp.success)
				{
					$item.find(".project-content-save")
							.removeClass("project-content-save-active");
				}
				else
				{
					alert(resp.error);
				}				
			}
		);
	}
}

/**
 * Removes a project.
 */
function removeProject()
{
	var activity = $(this).parents(".project-item").find('.project-activity-id').text(), e = this;
	
	$("body").append(
		"<div id='remove-project-dialog' title='Remove Confirmation'>" +
			"<p>Are you sure want to remove the activity with activity ID '" + activity + "'?</p>" + 
			"<p class='ui-priority-secondary'>" +
				"<span class='ui-icon ui-icon-info'></span>Removing the activity does not remove it from the UTS " +
				"metadata store or the ANDS Research Data Commons if it has been published." +
			"</p>" +
		"</div>"
	);
	
	$("#remove-project-dialog").dialog({
		closeOnEscape: true,
		width: 400,
		resizable: false,
		modal: true,
		buttons: {
			'Remove': function() {
				$.post(
					"/research/removeproject",
					{ activityID: activity },
					function(resp) {
						if (typeof resp != "object" || !resp.success) window.location.reload();
						
						$("#remove-project-dialog").dialog("close");
						$(e).parents(".project-item").remove();
						
						/* After deleting the last project we should display
						 * the no project text. */
						if ($("#project-list .project-item").length == 0) 
						{
							$("#project-list-container").remove();
							$("#no-projects").show();
						}
					}
					
				);
			},
			'Cancel': function() { $(this).dialog("close"); }
		},
		close: function() { $(this).dialog("destroy"); $(this).remove(); }
	});
}

/**
 * Adds a file.
 * 
 * @param id session id to add
 */
function addFile(id)
{
    id = $(id).attr("id");
    id = id.substr(id.lastIndexOf("-") + 1); 
    
    $("body").append(
        '<iframe id="upload-target" name="upload-target" src=""></iframe>' +
        "<div id='add-file-dialog' class='confirm-dialog' title='Add File'>" +
            "<p>Add a file to the session which will then form part of a dataset when the session is " +
            "collated as a dataset.</p> " +
            "<div>" +
                "<form id='add-file-form' method='POST' enctype='multipart/form-data' " + 
		  		        "action='/datafile/upload' target='upload-target'>" +
		  		    "<input type='hidden' name='MAX_FILE_SIZE' value='2097152' />" +
		  		    "<input type='hidden' name='session-id' value='" + id + "'>" + 
		  		    "<input id='upload-file-1' name='file' id='file' size='27' type='file' />" +
		  	    "</form>" +
            "</div>" +
        "</div>"
    );

    $("#add-file-dialog").dialog({
        closeOnEscape: true,
        width: 400,
        resizable: false,
        modal: true,
        buttons: {
            'Upload' : function() {
                uploadFile(id);
            },
            'Close': function() { $(this).dialog("close"); }
        },
        close: function() { $(this).dialog("destroy"); $(this).remove(); }
    });
}

function uploadFile(id)
{
	if ($("#upload-file-1").val() == "") return;

    var width = $("body").width(), height = $("body").height();
    
    $("#add-file-form").submit();
    $("#add-file-dialog").dialog('close');
    
    $("body").append(
        '<div id="uploading-overlay" class="ui-widget-overlay" style="width:' + width + 'px;height:' + height + 'px">' +
        '</div>' +
        '<div id="uploading-file" class="ui-corner-all" style="left:' + Math.floor(width / 2 - 125) + 'px;top:' + 
                + Math.floor(height / 2 - 40) + 'px;z-index:1001">' +
            '<img src="/images/ajax-loading.gif" alt="Loading" />' +
            '<h3>Uploading file...</h3>' +
        '</div>'
    );
    
    setTimeout(function() { checkFileUploaded(id); }, 2000);
}

function checkFileUploaded(session)
{
	var response = $("#upload-target").contents().text();
    
    if (response == undefined || response == "") // Still waiting for the post response
    {
        setTimeout(function() { checkFileUploaded(id); }, 2000);
        return;
    }
    else 
    {
    	/* Upload complete. */
    	$("#upload-target, #uploading-file, #uploading-overlay").remove();
    	
    	if (response.indexOf("SUCCESS:") == 0)
    	{    		
    		var i = 0, files = response.substr("SUCCESS:".length).split(","), id, html = "", sel = "";
    		for (i in files)
    	    {
    			id = files[i].substr(files[i].indexOf("=") + 1);
    			sel += "#file-delete-" + id + ", ";
    			html += "<li class='is-downloadable'>" +
    						"<span class='ui-icon ui-icon-arrowthickstop-1-s'></span>" +
    						"<a href='/datafile/download/file/" + id + "' target='_blank'>" + files[i].substr(0, files[i].indexOf("=") - 1) + "</a>" +
    						"<a id='file-delete-" + id + "' class='file-delete'><span class='ui-icon ui-icon-trash'></span></a>" + 
    				   "</li>";
    	    }
    		
    		$("#session-" + session + " .files-list").append(html);
    		$(sel.substr(0, sel.length - 2)).click(function() { deleteFile(this); });
    	}
    	else
    	{
    		/* Something failed. */
    		alert(response);
    	}
    }
}

/**
 * Deletes a file. 
 * 
 * @param node delete button click
 */
function deleteFile(node) 
{
    $("body").append(
         "<div id='remove-file-dialog' class='confirm-dialog' title='Remove Confirmation'>" +
            "<p>Are you sure want to remove the file <strong>'" + strtrim($(node).parent().text()) + "'</strong>?</p>" + 
            "<p class='ui-priority-secondary'>" +
                "<span class='ui-icon ui-icon-info'></span>This deletes the file and cannot be undone." +
            "</p>" +
            "</div>"
    );
    
    var id = $(node).attr("id");
    $("#remove-file-dialog").dialog({
        closeOnEscape: true,
        width: 400,
        resizable: false,
        modal: true,
        buttons: {
            'Remove': function() {
                $.post(
                    "/datafile/delete",
                    { file: id.substr(id.lastIndexOf("-") + 1) },
                    function(resp) {
                        if (typeof resp == "object")
                        {
                            $("#remove-file-dialog").dialog("close");
                            
                            if (resp.success) $(node).parent().remove();
                            else alert("Error: " + resp.reason);
                        }
                        else
                        {
                            window.location.reload();
                        }
                    }
                );
            },
            'Cancel': function() { $(this).dialog("close"); }
        },
        close: function() { $(this).dialog("destroy"); $(this).remove(); }
    });
}

function deleteSession(node)
{
	$("body").append(
			"<div id='remove-session-dialog' class='confirm-dialog' title='Remove Confirmation'>" +
				"<p>Are you sure want to remove this session?</p>" + 
			"</div>"
	);
	
	$(node).parent().addClass("session-to-delete");

	var id = $(node).attr("id");
	$("#remove-session-dialog").dialog({
		closeOnEscape: true,
		width: 400,
		resizable: false,
		modal: true,
		buttons: {
			'Remove': function() {
				$.post(
						"/research/removesession",
						{ session: id.substr(id.lastIndexOf("-") + 1) },
						function(resp) {
							if (typeof resp == "object")
							{
								$("#remove-session-dialog").dialog("close");

								if (resp.success)
								{
									$(node).parent().parent().remove();
									if ($("#session-list ul").children().length == 0)
									{
										window.location.reload();								
									}
								}
								else alert("Error: " + resp.reason);
							}
							else
							{
								window.location.reload();
							}
						}
				);
			},
			'Cancel': function() { $(this).dialog("close"); }
		},
		close: function() { 
			$(this).dialog("destroy"); 
			$(this).remove();
			$(node).parent().removeClass("session-to-delete");
		}
	});
}

function selectSession(node)
{
	var $parent = $(node).parent();
	if ($parent.hasClass("session-is-selected"))
	{
		$parent.removeClass("session-is-selected");
		$parent.find("input").removeAttr("checked");
	}
	else
	{
		$parent.addClass("session-is-selected");
		$parent.find("input").attr("checked", "checked");		
	}
	
	if ($("#session-list .session-select input:checked").length > 0)
	{
		$(".collate-dataset-button").addClass("collate-dataset-enabled");
	}
	else
	{
		$(".collate-dataset-button").removeClass("collate-dataset-enabled");
	}
}

function collateDataset(node)
{
	if ($("#session-list .session-select input:checked").length == 0) return;
	
	$("body").append(
		"<div id='collate-dialog' title='Collate Dataset'>" +
			"<p>Are you sure you want to collate the selected sessions as a dataset?</p>" + 
			"<p class='ui-priority-secondary' style='padding:10px 5px 0;'>" +
				"<span class='ui-icon ui-icon-info' style='float:left; margin-right: 5px;'></span>This publishes metadata to ANDS." +
			"</p>" +
		"</div>"
	);
	
	$("#collate-dialog").dialog({
		closeOnEscape: true,
		width: 400,
		resizable: false,
		modal: true,
		buttons: {
			'Collate': function() {
				var $checks = $("#session-list .session-select input:checked"), 
					pid = $(node).attr("id"), ses = '', sid;
			
				if ($checks.length == 0) return;
				
				$checks.each(function() {
					sid = $(this).parent().attr("id");
					ses += sid.substr(sid.lastIndexOf("-") + 1) + ',';
				});
				ses = ses.substr(0, ses.length - 1);
					
				$.post(
						"/research/addcollection",
						{ project: pid.substr(pid.lastIndexOf("-") + 1), sessions: ses },
						function(resp) { window.location.reload(); }
				);
			},
			'Cancel': function() { $(this).dialog("close"); }
		},
		close: function() { $(this).dialog("destroy"); $(this).remove(); }
	});
}

/**
 * Trims a strings whitespace
 * 
 * @param str string to trim
 * @return trimmed string
 */
function strtrim(str)
{
    return str.replace(/^\s+|\s+$/, '');
}