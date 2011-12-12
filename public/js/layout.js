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

function formFocusIn() 
{
	$(this).css("border", "1px solid #333333");
}

function formFocusOut()
{
	$(this).css("border", "1px solid #AAAAAA");
}

