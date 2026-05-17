/**
 * Affiche le loader vidéo avant chaque navigation interne (liens .html du site).
 */
(function () {
	"use strict";

	function isInternalNavLink(anchor) {
		if (!anchor || anchor.tagName !== "A") return false;
		if (anchor.hasAttribute("download") || anchor.getAttribute("data-rz-no-loader") !== null) {
			return false;
		}
		if (anchor.target === "_blank" || anchor.target === "_new") return false;

		var href = anchor.getAttribute("href");
		if (!href || href.charAt(0) === "#") return false;
		if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

		try {
			var url = new URL(anchor.href, window.location.href);
			if (url.origin !== window.location.origin) return false;
			if (
				url.pathname === window.location.pathname &&
				(!url.hash || url.href === window.location.href)
			) {
				return false;
			}
			var path = url.pathname.toLowerCase();
			return path.endsWith(".html") || path.endsWith(".htm") || !/\.[a-z0-9]+$/i.test(path.split("/").pop() || "");
		} catch (e) {
			return false;
		}
	}

	function loaderVideoSrc() {
		try {
			return new URL("img/video/loader.mp4", window.location.href).href;
		} catch (e) {
			return "img/video/loader.mp4";
		}
	}

	function showLoader() {
		var root = document.getElementById("rz-page-loader");
		if (!root) {
			root = document.createElement("div");
			root.id = "rz-page-loader";
			root.className = "rz-page-loader";
			root.setAttribute("role", "status");
			root.setAttribute("aria-busy", "true");
			root.setAttribute("aria-live", "polite");
			var inner = document.createElement("div");
			inner.className = "rz-page-loader__inner";
			var video = document.createElement("video");
			video.className = "rz-page-loader__video";
			video.src = loaderVideoSrc();
			video.muted = true;
			video.playsInline = true;
			video.autoplay = true;
			video.loop = true;
			video.setAttribute("preload", "metadata");
			inner.appendChild(video);
			root.appendChild(inner);
			document.body.insertBefore(root, document.body.firstChild);
		}

		root.classList.remove("is-done");
		root.setAttribute("aria-busy", "true");
		document.documentElement.classList.add("rz-page-loader-active");
		document.body.classList.add("rz-page-loader-active");

		var video = root.querySelector(".rz-page-loader__video");
		if (video) {
			if (!video.getAttribute("src")) {
				video.src = loaderVideoSrc();
			}
			try {
				video.currentTime = 0;
				var p = video.play();
				if (p && typeof p.catch === "function") p.catch(function () {});
			} catch (e) {}
		}
	}

	document.addEventListener(
		"click",
		function (e) {
			if (e.defaultPrevented) return;
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

			var anchor = e.target.closest("a");
			if (!isInternalNavLink(anchor)) return;

			e.preventDefault();
			showLoader();
			window.setTimeout(function () {
				window.location.assign(anchor.href);
			}, 120);
		},
		true
	);
})();
