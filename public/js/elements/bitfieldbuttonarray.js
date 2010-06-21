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
 * @date 18th June 2010
 */

function BitFieldButtonArray(id)
{
	var canvas = document.getElementById(id);
	if (canvas.getContext)
	{
		this.ctx = canvas.getContext("2d");
	}
}

BitFieldButtonArray.prototype.init = function() {
	if (!this.ctx) this.addNoSupportWarning();
	this.draw();
};

BitFieldButtonArray.prototype.draw = function() {
	/* Draw background. */
	this.ctx.fillStyle = "#CACACA";
	this.ctx.fillRect(0, 0, 400, 90);
	
	for (i = 0; i < 8; i++)
	{
		this.drawDipCell(50 * i, 0, 0);
	}
};

BitFieldButtonArray.prototype.drawDipCell = function(xoff, yoff, bpos) {
	var x = xoff + 10;
	var y = yoff + 5;
	
	/* Dip switch outline. */
	this.ctx.strokeStyle = "#000000";
	this.ctx.strokeRect(x, y, 30, 80);
	this.ctx.lineWidth = 3;
	this.ctx.beginPath();
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x, y + 80);
	this.ctx.lineTo(x + 30, y + 80);
	this.ctx.stroke();
	
	/* Colored inset. */
	this.ctx.lineWidth = 1;
	var lgrad = this.ctx.createLinearGradient(x, y, x + 30, y);
	lgrad.addColorStop(0.3, "#FF3D43");
	lgrad.addColorStop(0.8, "#B92C31");
	lgrad.addColorStop(1, "#731B1E");
	this.ctx.fillStyle = lgrad;
	this.ctx.fillRect(x + 1, y + 1, 28, 38);
	lgrad = this.ctx.createLinearGradient(x, y + 41, x + 30, y + 41);
	lgrad.addColorStop(0.3, "#57C84E");
	lgrad.addColorStop(0.8, "#459D3D");
	lgrad.addColorStop(1, "#33752D");
	this.ctx.fillStyle = lgrad;
	this.ctx.fillRect(x + 1, y + 41, 28, 38);
	this.ctx.strokeStyle = "#000";
	this.ctx.beginPath();
	this.ctx.moveTo(x, y + 40);
	this.ctx.lineTo(x + 30, y + 40);
	this.ctx.stroke();
	
	/* Button head. */
	var bx = x;
	var by = y + 40 - bpos;
	lgrad = this.ctx.createLinearGradient(x, y + 41, x + 30, y + 41);
	lgrad.addColorStop(0.3, "#8B8B8B");
	lgrad.addColorStop(0.8, "#606060");
	lgrad.addColorStop(1, "#414141");
	this.ctx.fillStyle = lgrad;
	this.ctx.fillRect(bx + 5, by - 5, 30, 40);
	this.ctx.strokeStyle = "#000000";
	this.ctx.strokeRect(bx + 5, by - 5, 30, 40);
	
	this.ctx.beginPath();
	this.ctx.moveTo(bx, by);
	this.ctx.lineTo(bx, by + 40);
	this.ctx.lineTo(bx + 5, by + 35);
	this.ctx.lineTo(bx + 5, by - 5);
	this.ctx.lineTo(bx, by);
	this.ctx.closePath();
	this.ctx.fill();
	
	this.ctx.lineWidth = 0.5;
	for (var i = 0; i <= 40; i += 2)
	{
		this.ctx.beginPath();
		this.ctx.moveTo(bx, by + i);
		this.ctx.lineTo(bx + 5, by + i - 5);
		this.ctx.stroke();
	}
	
	this.ctx.beginPath();
	this.ctx.moveTo(bx, by + 40);
	this.ctx.lineTo(bx + 30, by + 40);
	this.ctx.lineTo(bx + 35, by + 35);
	this.ctx.lineTo(bx + 5, by + 35);
	this.ctx.lineTo(bx, by + 40);
	this.ctx.closePath();
	this.ctx.fill();
	
	for (var i = 0; i < 30; i += 2)
	{
		this.ctx.beginPath();
		this.ctx.moveTo(bx + 3 + i, by + 40);
		this.ctx.lineTo(bx + 8 + i, by + 35);
		this.ctx.stroke();
	}
	
	this.ctx.lineWidth = 1;
	var rgrad = this.ctx.createRadialGradient(bx + 20, by + 15, 2, bx + 20, by + 15, 10);
	if (true)
	{
		rgrad.addColorStop(0, '#BCBCBC');  
		rgrad.addColorStop(0.8, '#606060');  
		rgrad.addColorStop(1, 'rgba(228,199,0,0)');
	}
	else
	{
		/* Mouse is hovering. */
		rgrad.addColorStop(0, '#F4F201');  
		rgrad.addColorStop(0.8, '#E4C700');  
		rgrad.addColorStop(1, 'rgba(228,199,0,0)');
	}
	
	this.ctx.fillStyle = rgrad;
	this.ctx.beginPath();
	this.ctx.arc(bx + 20, by + 15, 10, 0, Math.PI * 2, false);
	this.ctx.closePath();
	this.ctx.fill();
	this.ctx.stroke();
	
	/* Gradients. */
	lgrad = this.ctx.createLinearGradient(x + 30, y - 1, x + 45, y - 1);
	lgrad.addColorStop(0, "#404040");
	lgrad.addColorStop(0.1, "#808080");
	lgrad.addColorStop(0.4, "#ABABAB");
	lgrad.addColorStop(0.6, "#CACACA");
	this.ctx.fillStyle = lgrad;
	this.ctx.fillRect(x + 30, y - 1, 10, by - y - 5);
	
	lgrad = this.ctx.createLinearGradient(x + 35, by - 5, x + 45, by - 5);
	lgrad.addColorStop(0, "#515151");
	lgrad.addColorStop(0.1, "#949494");
	lgrad.addColorStop(0.4, "#ABABAB");
	lgrad.addColorStop(0.6, "#EFEFEF");
	this.ctx.fillStyle = lgrad;
	//this.ctx.fillRect(x + 35, by - 5, 40, 40);
	
};

BitFieldButtonArray.prototype.addNoSupportWarning = function() {
	alert("Browser not supported.");
};


