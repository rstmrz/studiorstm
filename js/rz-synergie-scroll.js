(function () {
	var stage = document.querySelector(".rz-synergie-stage");
	if (!stage) return;

	var hero = stage.querySelector(".rz-synergie-hero");
	var mark = stage.querySelector(".rz-synergie-mark");
	var trackCol = stage.querySelector(".rz-synergie-track-col");
	var trackFill = stage.querySelector(".rz-synergie-track-fill");
	var dotsRoot = document.getElementById("rz-synergie-dots");
	var content = stage.querySelector(".rz-synergie-content");
	var trackEndEl = document.getElementById("rz-synergie-track-end");
	var reveals = stage.querySelectorAll(".rz-synergie-reveal");
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var anchors = [];
	var trackHeight = 0;
	var ticking = false;

	function getProbeY() {
		return window.innerHeight * 0.4;
	}

	function getTrackLimit() {
		if (!content) return 0;
		if (trackEndEl) {
			return trackEndEl.offsetTop + trackEndEl.offsetHeight;
		}
		return content.offsetHeight;
	}

	function getExpHeaderNodes(el) {
		return {
			title: el.querySelector(".rz-synergie-exp-title"),
			company: el.querySelector(".rz-synergie-exp-company"),
		};
	}

	function getAnchorCenterY(el) {
		var header = getExpHeaderNodes(el);
		if (header.title && header.company) {
			var top = header.title.offsetTop;
			var bottom = header.company.offsetTop + header.company.offsetHeight;
			return top + (bottom - top) * 0.5;
		}
		return el.offsetTop + el.offsetHeight * 0.42;
	}

	function getAnchorViewportY(el) {
		var header = getExpHeaderNodes(el);
		if (header.title && header.company) {
			var t = header.title.getBoundingClientRect();
			var c = header.company.getBoundingClientRect();
			return (t.top + c.bottom) * 0.5;
		}
		var rect = el.getBoundingClientRect();
		return rect.top + rect.height * 0.42;
	}

	function collectAnchors() {
		var nodes = content.querySelectorAll(".rz-synergie-milestone, .rz-synergie-exp");
		return Array.prototype.slice.call(nodes);
	}

	function buildLogoBox(exp) {
		var box = document.createElement("span");
		box.className = "rz-synergie-exp-logo__box";

		if (exp.dataset.logoText) {
			box.classList.add("rz-synergie-exp-logo__box--text");
			box.textContent = exp.dataset.logoText;
		} else if (exp.dataset.logoSrc) {
			var img = document.createElement("img");
			img.src = exp.dataset.logoSrc;
			img.alt = "";
			img.loading = "lazy";
			img.decoding = "async";
			box.appendChild(img);
		}

		return box;
	}

	function layoutTimeline() {
		if (!trackCol || !content || !dotsRoot || !trackFill) return;

		trackHeight = getTrackLimit();
		trackCol.style.minHeight = trackHeight + "px";

		dotsRoot.innerHTML = "";
		anchors = [];

		collectAnchors().forEach(function (node) {
			var centerY = getAnchorCenterY(node);
			var isExp = node.classList.contains("rz-synergie-exp");
			var dot = document.createElement("span");

			dot.className = isExp ? "rz-synergie-dot rz-synergie-dot--logo" : "rz-synergie-dot";
			dot.style.top = centerY + "px";

			if (isExp) {
				dot.appendChild(buildLogoBox(node));
			}

			dotsRoot.appendChild(dot);
			anchors.push({
				el: node,
				dot: dot,
				y: centerY,
				isExp: isExp,
			});
		});

		if (reduce) {
			trackFill.style.height = trackHeight + "px";
			anchors.forEach(function (a) {
				a.dot.classList.add("is-lit", "is-active");
				a.el.classList.add("is-active");
			});
		}
	}

	function updateTimeline() {
		ticking = false;
		if (!trackFill || !anchors.length || reduce) return;

		var probe = getProbeY();
		var activeIndex = -1;
		var fillPx = 0;

		var stageRect = stage.getBoundingClientRect();
		var atSectionEnd = stageRect.bottom <= window.innerHeight * 1.05;

		for (var i = 0; i < anchors.length; i++) {
			if (getAnchorViewportY(anchors[i].el) <= probe) {
				activeIndex = i;
			}
		}

		if (atSectionEnd) {
			activeIndex = anchors.length - 1;
			fillPx = trackHeight;
		} else if (activeIndex < 0) {
			fillPx = 0;
		} else if (activeIndex < anchors.length - 1) {
			var curY = getAnchorViewportY(anchors[activeIndex].el);
			var nextY = getAnchorViewportY(anchors[activeIndex + 1].el);
			fillPx = anchors[activeIndex].y;
			if (probe > curY && nextY > curY) {
				var t = Math.min(1, Math.max(0, (probe - curY) / (nextY - curY)));
				fillPx =
					anchors[activeIndex].y +
					t * (anchors[activeIndex + 1].y - anchors[activeIndex].y);
			}
		} else {
			var lastY = getAnchorViewportY(anchors[activeIndex].el);
			fillPx = anchors[activeIndex].y;
			if (probe > lastY) {
				var tail = Math.min(1, (probe - lastY) / Math.max(100, window.innerHeight * 0.2));
				fillPx =
					anchors[activeIndex].y +
					tail * (trackHeight - anchors[activeIndex].y);
			}
		}

		trackFill.style.height = Math.max(0, Math.min(trackHeight, fillPx)) + "px";

		anchors.forEach(function (anchor, i) {
			var lit = i <= activeIndex;
			var active = i === activeIndex;

			anchor.dot.classList.toggle("is-lit", lit);
			anchor.dot.classList.toggle("is-active", active);
			anchor.el.classList.toggle("is-active", active);
		});
	}

	function updateMark() {
		if (!hero || !mark) return;
		var rect = hero.getBoundingClientRect();
		var inView = rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.2;
		stage.classList.toggle("is-mark-active", inView);
		mark.classList.toggle("is-active", inView);
	}

	function onScrollOrResize() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(function () {
				updateMark();
				updateTimeline();
			});
		}
	}

	if (reduce) {
		updateMark();
		layoutTimeline();
		reveals.forEach(function (el) {
			el.classList.add("is-visible");
		});
		return;
	}

	var revealObs = new IntersectionObserver(
		function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) entry.target.classList.add("is-visible");
			});
		},
		{ root: null, rootMargin: "-6% 0px -10% 0px", threshold: 0.08 }
	);
	reveals.forEach(function (el, i) {
		el.style.transitionDelay = Math.min(i * 0.04, 0.28) + "s";
		revealObs.observe(el);
	});

	function init() {
		layoutTimeline();
		updateMark();
		updateTimeline();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}

	window.addEventListener("scroll", onScrollOrResize, { passive: true });
	window.addEventListener(
		"resize",
		function () {
			layoutTimeline();
			onScrollOrResize();
		},
		{ passive: true }
	);

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(function () {
			layoutTimeline();
			updateMark();
			updateTimeline();
		});
	}

	setTimeout(function () {
		layoutTimeline();
		updateMark();
		updateTimeline();
	}, 500);
})();
