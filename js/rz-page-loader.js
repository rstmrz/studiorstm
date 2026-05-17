/**
 * Ferme l’overlay #rz-page-loader après window "load" et au moins ~1,5 s depuis le début de navigation.
 * Vanilla : ne dépend pas de jQuery.
 */
(function () {
	"use strict";

	var root = document.getElementById("rz-page-loader");
	if (!root) {
		return;
	}

	document.documentElement.classList.add("rz-page-loader-active");
	document.body.classList.add("rz-page-loader-active");

	var MIN_MS = 1500;
	var video = root.querySelector(".rz-page-loader__video");

	function navStartTime() {
		try {
			if (typeof performance !== "undefined" && performance.timeOrigin) {
				return performance.timeOrigin;
			}
			if (typeof performance !== "undefined" && performance.timing && performance.timing.navigationStart) {
				return performance.timing.navigationStart;
			}
		} catch (e) {}
		return Date.now();
	}

	function hide() {
		root.classList.add("is-done");
		root.setAttribute("aria-busy", "false");
		document.documentElement.classList.remove("rz-page-loader-active");
		document.body.classList.remove("rz-page-loader-active");
		if (video) {
			try {
				video.pause();
			} catch (e) {}
		}
		window.setTimeout(function () {
			if (root && root.parentNode) {
				root.parentNode.removeChild(root);
			}
		}, 550);
	}

	function scheduleHide() {
		var elapsed = Date.now() - navStartTime();
		var wait = Math.max(0, MIN_MS - elapsed);
		window.setTimeout(hide, wait);
	}

	if (document.readyState === "complete") {
		scheduleHide();
	} else {
		window.addEventListener("load", scheduleHide);
	}
})();
