/* Menu slider from http://www.leigeber.com/2008/05/sliding-javascript-menu-highlight-1kb/ */

var menuSlider = function() {
	var m, e, g, s, q, i;
	e = [];
	q = 8;
	i = 8;
	return {
		init : function(j, k) {
			m = document.getElementById(j);
			e = m.getElementsByTagName('li');
			var i, l, w, p;
			i = 0;
			l = e.length;
			for (i; i < l; i++) {
				var c, v;
				c = e[i];
				v = c.value;
				if (v == 1) {
					s = c;
					w = c.offsetWidth;
					p = c.offsetLeft;
				}
				c.onmouseover = function() {
					menuSlider.mo(this);
				};
				c.onmouseout = function() {
					menuSlider.mo(s);
				};
			}
			g = document.getElementById(k);
			g.style.width = w + 'px';
			g.style.left = p + 'px';
		},
		mo : function(d) {
			clearInterval(m.tm);
			var el, ew;
			el = parseInt(d.offsetLeft);
			ew = parseInt(d.offsetWidth);
			m.tm = setInterval(function() {
				menuSlider.mv(el, ew);
			}, i);
		},
		mv : function(el, ew) {
			var l, w;
			l = parseInt(g.offsetLeft);
			w = parseInt(g.offsetWidth);
			if (l != el || w != ew) {
				if (l != el) {
					var ld, lr, li;
					ld = (l > el) ? -1 : 1;
					lr = Math.abs(el - l);
					li = (lr < q) ? ld * lr : ld * q;
					g.style.left = (l + li) + 'px';
				}
				if (w != ew) {
					var wd, wr, wi;
					wd = (w > ew) ? -1 : 1;
					wr = Math.abs(ew - w);
					wi = (wr < q) ? wd * wr : wd * q;
					g.style.width = (w + wi) + 'px';
				}
			} else {
				clearInterval(m.tm);
			}
		}
	};
}();

/**
 * Move applets, embeds and objects off screen.
 */
function moveObjectsOffScreen() 
{
	/* Move all the applet, object and embeds to a margin right off
	 * screen. */
	appletMargins = new Array();
	var applets = $("applet").toArray();
	for (var i in applets)
	{
		appletMargins[i] = applets[i].style.marginLeft;
		applets[i].style.marginLeft = "10000px";
	}

	objectMargins = new Array();
	var objects = $("object").toArray();
	for (var i in objects)
	{
		objectMargins[i] = objects[i].style.marginLeft;
		objects[i].style.marginLeft = "10000px";
	}

	embedMargins = new Array();
	var embeds = $("embed").toArray();
	for (var i in embeds)
	{
		embedMargins[i] = embeds[i].style.marginLeft;
		embeds[i].style.marginLeft = "10000px";
	}

	/* Remove the validation tooltips. */
	$(".formError").remove();
}

/**
 * Restores applets, embeds and objects back to original position.
 */
function restoreObjects() 
{
	/* Move the applet, object and embeds back to their original
	 * position. */
	var applets = $("applet").toArray();
	for (var i in applets)
	{
		applets[i].style.marginLeft = appletMargins[i];
	}

	var objects = $("object").toArray();
	for (var i in objects)
	{
		objects[i].style.marginLeft = objectMargins[i];
	}

	var embeds = $("embed").toArray();
	for (var i in embeds)
	{
		embeds[i].style.marginLeft = embedMargins[i];
	}
	/* Remove the validation tooltips. */
	$(".formError").remove();
}

/**
 * Resize format to page size.
 */
function resizeFooter()
{
	$("#wrapper").css("min-height", "0");

	if (/msie|MSIE 8/.test(navigator.userAgent))
	{
		/* For some reason IE 8 in "standards mode" finds an extra four pixels
		 * height that no other browser has. */
		$("#wrapper").css("min-height", $(document).height() - 4);
	}
	else
	{
		$("#wrapper").css("min-height", $(document).height() );
	}
}

/**
 * Form input focus in highlight.
 */
function formFocusIn() 
{
	$(this).css("border", "1px solid #333333");
}

/**
 * Form input focus out highlight.
 */
function formFocusOut()
{
	$(this).css("border", "1px solid #AAAAAA");
}

/**
 * Guidance bubble creation.
 * 
 * @param selector the base selector to initialise guidance bubbles from
 * @param type 'alert' for error message, 'info' for informational messages
 * @param position the arrow position, can be 'left', 'right'
 * @param leftoff left offset for bubble
 * @param topoff top offset for bubble
 */
function GuidanceBubble(selector, type, position, leftoff, topoff)
{
	this.selector = selector;
	this.type = type;
	this.position = position;
	
	this.leftOff = leftoff ? leftoff : 0;
	this.topOff = topoff ? topoff : 0;
}

/**
 * Initialise buttons that have the class '.guidance-button' to
 * open a guidance button when they are clicked. The messages for the 
 * guidance bubble are expected to be in a child paragraph of the
 * clicked button.
 */
GuidanceBubble.prototype.initButtons = function() {
	/* Initialise click handling. */
	var thiz = this;
	$(this.selector + " .guidance-button").click(function() {
		thiz.removeAll();
		thiz.show($(this).children("p").text(), this);
	});
};

/**
 * Adds a message to the page.
 * 
 * @param message the message to display
 * @param e node where the bubble will be positioned, if null the parent 
 * 			element is used
 */
GuidanceBubble.prototype.show = function(message, e) {
	var $box, i, aniIn, bs = 3, up = true, $e = e ? $(e) : $(this.selector),
		left = $e.position().left + this.leftOff, top = $e.position().top + this.topOff,
		html = 
		"<div class='guidance-bubble guidance-bubble-" + this.type + " guidance-bubble-in1' style='left:" + left + "px; top:" + top + "px'>" +
			"<div class='guidance-bubble-text'>" + message + "</div>" +
			"<div class='guidance-bubble-arrow guidance-bubble-arrow-" + this.position + "'>";
	
	for (i = 0; i < 8; i++)
	{
		html += "<div class='guidance-bubble-arrow-line guidance-bubble-arrow-line" + i + "'></div>";
	}
	
	html += "</div>" +
		"</div>";
	
	$box = $e.after(html).next();
		
	/* Throb box shadow around message box. */
	aniIn = setInterval(function() {
		if (bs == 2 || bs == 12) up = !up;
		$box.css("box-shadow", "0 0 " + (up ? bs++ : bs--) + "px #AAAAAA");
	}, 120);
	
	/* Remove box on click. */
	$box.click(function() {
		clearInterval(aniIn);
		$box.remove();
	});
};

/**
 * Removes all the guidance bubbles from nested from this objects 
 * selector.
 */
GuidanceBubble.prototype.removeAll = function() {
	$(this.selector + " .guidance-bubble").remove();
};

/**
 * Removes all the guidance bubbles from the page. 
 */
GuidanceBubble.prototype.globalRemove = function() {
	$(".guidance-bubble").remove();
};

