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
	var milestones = stage.querySelectorAll(".rz-synergie-content .rz-synergie-milestone");
	var reveals = stage.querySelectorAll(".rz-synergie-reveal");
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var dots = [];
	var trackHeight = 0;
	var anchorOffsets = [];
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

	function layoutTimeline() {
		if (!trackCol || !content || !dotsRoot || !trackFill) return;

		trackHeight = getTrackLimit();
		trackCol.style.minHeight = trackHeight + "px";

		dotsRoot.innerHTML = "";
		dots = [];
		anchorOffsets = [];

		milestones.forEach(function (milestone, i) {
			var centerY = milestone.offsetTop + milestone.offsetHeight * 0.5;
			anchorOffsets.push(centerY);

			var dot = document.createElement("span");
			dot.className = "rz-synergie-dot";
			dot.setAttribute("data-index", String(i));
			dot.style.top = centerY + "px";
			dotsRoot.appendChild(dot);
			dots.push(dot);
		});

		if (reduce) {
			trackFill.style.height = trackHeight + "px";
			dots.forEach(function (d) {
				d.classList.add("is-lit", "is-active");
			});
			milestones.forEach(function (m) {
				m.classList.add("is-active");
			});
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

		for (var i = 0; i < milestones.length; i++) {
			var rect = milestones[i].getBoundingClientRect();
			var center = rect.top + rect.height * 0.5;
			if (center <= probe) {
				activeIndex = i;
			}
		}

		if (atSectionEnd) {
			activeIndex = milestones.length - 1;
			fillPx = trackHeight;
		} else if (activeIndex < 0) {
			fillPx = 0;
		} else if (activeIndex < milestones.length - 1) {
			var curRect = milestones[activeIndex].getBoundingClientRect();
			var nextRect = milestones[activeIndex + 1].getBoundingClientRect();
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
			var lastRect = milestones[activeIndex].getBoundingClientRect();
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

		milestones.forEach(function (milestone, i) {
			milestone.classList.toggle("is-active", i === activeIndex);
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
	window.addEventListener("resize", function () {
		layoutTimeline();
		onScrollOrResize();
	}, { passive: true });

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
