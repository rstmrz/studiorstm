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
	var expZoneHead = stage.querySelector(".rz-synergie-exp-zone-head");
	var steps = stage.querySelectorAll(".rz-synergie-content > .rz-synergie-step");
	var reveals = stage.querySelectorAll(".rz-synergie-reveal");
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var dots = [];
	var trackHeight = 0;
	var anchorOffsets = [];
	var expStartIndex = -1;
	var expEndIndex = -1;
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

	function getStepMarker(step) {
		return (
			step.querySelector(
				".rz-synergie-tagline, .rz-synergie-section-title, .rz-synergie-exp-title, .rz-synergie-cta-title"
			) || step
		);
	}

	function getStepCenterY(step) {
		var marker = getStepMarker(step);
		return step.offsetTop + marker.offsetTop + marker.offsetHeight * 0.5;
	}

	function createDot(step, index) {
		var marker = getStepMarker(step);
		var centerY = getStepCenterY(step);
		var dot = document.createElement("span");
		var logoSrc = step.getAttribute("data-logo");
		var logoInitials = step.getAttribute("data-logo-initials");
		var logoAlt = step.getAttribute("data-logo-alt") || "";

		dot.className = "rz-synergie-dot";
		if (logoSrc || logoInitials) {
			dot.classList.add("rz-synergie-dot--brand");
		}
		dot.setAttribute("data-index", String(index));
		dot.style.top = centerY + "px";

		if (logoSrc) {
			var img = document.createElement("img");
			img.src = logoSrc;
			img.alt = logoAlt;
			img.loading = "lazy";
			img.decoding = "async";
			dot.appendChild(img);
		} else if (logoInitials) {
			dot.textContent = logoInitials;
		}

		anchorOffsets.push(centerY);
		dotsRoot.appendChild(dot);
		dots.push(dot);
	}

	function layoutTimeline() {
		if (!trackCol || !content || !dotsRoot || !trackFill || !steps.length) return;

		trackHeight = getTrackLimit();
		trackCol.style.minHeight = trackHeight + "px";

		dotsRoot.innerHTML = "";
		dots = [];
		anchorOffsets = [];
		expStartIndex = -1;
		expEndIndex = -1;

		steps.forEach(function (step, i) {
			if (step.classList.contains("rz-synergie-step--exp")) {
				if (expStartIndex < 0) expStartIndex = i;
				expEndIndex = i;
			}
			createDot(step, i);
		});

		if (reduce) {
			trackFill.style.height = trackHeight + "px";
			dots.forEach(function (d) {
				d.classList.add("is-lit", "is-active");
			});
			steps.forEach(function (s) {
				s.classList.add("is-active");
			});
			if (expZoneHead) expZoneHead.classList.add("is-active");
		}
	}

	function updateTimeline() {
		ticking = false;
		if (!trackFill || !anchorOffsets.length || reduce) return;

		var probe = getProbeY();
		var activeIndex = -1;
		var fillPx = 0;

		var stageRect = stage.getBoundingClientRect();
		var atSectionEnd = stageRect.bottom <= window.innerHeight * 1.05;

		for (var i = 0; i < steps.length; i++) {
			var rect = steps[i].getBoundingClientRect();
			var center = rect.top + rect.height * 0.5;
			if (center <= probe) {
				activeIndex = i;
			}
		}

		if (atSectionEnd) {
			activeIndex = steps.length - 1;
			fillPx = trackHeight;
		} else if (activeIndex < 0) {
			fillPx = 0;
		} else if (activeIndex < steps.length - 1) {
			var curRect = steps[activeIndex].getBoundingClientRect();
			var nextRect = steps[activeIndex + 1].getBoundingClientRect();
			var curY = curRect.top + curRect.height * 0.5;
			var nextY = nextRect.top + nextRect.height * 0.5;
			fillPx = anchorOffsets[activeIndex];
			if (probe > curY && nextY > curY) {
				var t = Math.min(1, Math.max(0, (probe - curY) / (nextY - curY)));
				fillPx =
					anchorOffsets[activeIndex] +
					t * (anchorOffsets[activeIndex + 1] - anchorOffsets[activeIndex]);
			}
		} else {
			var lastRect = steps[activeIndex].getBoundingClientRect();
			var lastY = lastRect.top + lastRect.height * 0.5;
			fillPx = anchorOffsets[activeIndex];
			if (probe > lastY) {
				var tail = Math.min(1, (probe - lastY) / Math.max(100, window.innerHeight * 0.2));
				fillPx =
					anchorOffsets[activeIndex] +
					tail * (trackHeight - anchorOffsets[activeIndex]);
			}
		}

		trackFill.style.height = Math.max(0, Math.min(trackHeight, fillPx)) + "px";

		dots.forEach(function (dot, i) {
			dot.classList.toggle("is-lit", i <= activeIndex);
			dot.classList.toggle("is-active", i === activeIndex);
		});

		steps.forEach(function (step, i) {
			step.classList.toggle("is-active", i === activeIndex);
		});

		if (expZoneHead) {
			var inExpZone =
				activeIndex >= expStartIndex &&
				activeIndex <= expEndIndex &&
				expStartIndex >= 0;
			expZoneHead.classList.toggle("is-active", inExpZone);
		}
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
