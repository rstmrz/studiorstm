(function () {
	var hero = document.getElementById("HERO");
	if (!hero || !hero.classList.contains("rz-hero--media")) return;

	var video = hero.querySelector(".rz-hero-video");
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var ticking = false;

	function tryPlayVideo() {
		if (!video) return;
		var p = video.play();
		if (p && typeof p.catch === "function") {
			p.catch(function () {});
		}
	}

	function updateScroll() {
		ticking = false;
		var rect = hero.getBoundingClientRect();
		var h = Math.max(hero.offsetHeight, window.innerHeight, 1);
		var progress = Math.min(1, Math.max(0, -rect.top / (h * 0.72)));
		hero.style.setProperty("--hero-scroll", progress.toFixed(4));
		hero.style.setProperty("--hero-zoom", progress.toFixed(4));
		hero.classList.toggle("is-scrolled-past", progress > 0.12);
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(updateScroll);
		}
	}

	tryPlayVideo();
	document.addEventListener("visibilitychange", function () {
		if (!document.hidden) tryPlayVideo();
	});
	document.addEventListener(
		"pointerdown",
		function once() {
			tryPlayVideo();
			document.removeEventListener("pointerdown", once);
		},
		{ once: true, passive: true }
	);

	if (!reduce) {
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		updateScroll();
	} else {
		hero.style.setProperty("--hero-scroll", "0.65");
	}
})();
