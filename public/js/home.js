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
 * @date 8th August 2010
 */

function deleteHomeFile(name, urlsuffix)
{	
	$.get(
		'/home/delete' + urlsuffix,
		null,
		function (response) {
			if (typeof response == "object")
			{
				$("#homedirmessage").html(
					'<div class="ui-state-highlight ui-corner-all alertdiv centercontent" style="width:360px;padding:10px">' +
					'	<p>' +
					'		<span class="ui-icon ui-icon-info" style="float:left;margin-right:5px"></span>' +
					"		Successfully deleted '" + name + "'." +
					'	</p>' +
					'</div>'
				);
					
				/* Replace the current list of files with a new list. */
				var html = '', len = 0;
				for (var k in response)
				{
					len++;
					html += '<li>' +
						   '	<a class="plaina hddownloadlink" href="/home/download' + response[k] + '" style="width:450px">' +
						   '		<span class="ui-icon ui-icon-circle-arrow-s" style="width:15px"></span>' + k +
						   '	</a>' +
						   '	<a class="plaina hddelfilelink" href="#" onclick=\'deleteHomeFile("' + k + '", "' + response[k] + '");return false\'>' +
					       '		<span class="ui-icon ui-icon-trash"></span>Delete' +
					       '	</a>' +
					       '</li>';
				}
				
				if (len == 0)
				{
					/* No files returned. */
					$("#homedirectory").html(
						'<div class="ui-state-error ui-corner-all alertdiv centercontent" style="width:360px">' +
						'	<p class="alertp">' +
						'		<span class="ui-icon ui-icon-alert alertspan"></span>' +
						'		You currently have no files in your home directory.' +
						'	</p>' +
						'</div>'
					);
				}
				else
				{
					$("#homedirlist").html(html);
				}
			}
			else
			{
				$("#homedirmessage").html(
					'<div class="ui-state-error ui-corner-all alertdiv centercontent" style="width:360px">' +
					'	<p class="alertp">' +
					'		<span class="ui-icon ui-icon-alert alertspan"></span>' + response +
					'	</p>' +
					'</div>'
				);
			}
		}
	);
}

function deleteHomeSessionFile(urlsuffix)
{
	$.get(
		'/home/deletesession' + urlsuffix,
		null,
		function (response) {
			if (typeof response == "object") replaceSessionFiles(response);
		}
	);
	return false;
}

function updateHomeFileList()
{
	$.get(
		'/home/listsession',
		null,
		function (response) {
			if (typeof response == "object") replaceSessionFiles(response);
		}
	);
}

function replaceSessionFiles(files)
{
	var html = '', len = 0;
	for (var k in files)
	{
		len++;
		html += '<li>' +
		'	<a class="plaina hddownloadlink" href="/home/download' + files[k] + '">' +
		'		<span class="ui-icon ui-icon-circle-arrow-s" style="width:15px"></span>' + k +
		'	</a>' +
		'	<a class="plaina hddelfilelink" onclick=\'deleteHomeSessionFile("' + files[k] + '");return false\' href="#">' +
		'		<span class="ui-icon ui-icon-trash"></span>Delete' +
		'	</a>' +
		'</li>';
	}
	$("#homedirlist").html(html);

	if (len > 10)
	{
		$("#homedircontents").css('overflow-y', 'scroll');
				$("#homedircontents").css('height', 240);
		$("#homedirlist").css('width', 530);
		$(".hddownloadlink").css('width', 430);
	}
	else
	{
		$("#homedircontents").css('overflow-y', 'hidden');
		$("#homedircontents").css('height', 25 * len);
		$("#homedirlist").css('width', 550);
		$(".hddownloadlink").css('width', 450);
	}
	resizeFooter();
}
