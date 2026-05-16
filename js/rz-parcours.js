(function () {
	"use strict";
	var root = document.getElementById("RZ_PARCOURS");
	if (!root) return;

	var tabs = root.querySelectorAll(".rz-timeline-item");
	var panels = root.querySelectorAll(".rz-timeline-panel");

	function activate(id) {
		if (!id) return;
		tabs.forEach(function (btn) {
			var on = btn.getAttribute("data-panel") === id;
			btn.classList.toggle("is-active", on);
			btn.setAttribute("aria-selected", on ? "true" : "false");
		});
		panels.forEach(function (panel) {
			var on = panel.id === id;
			panel.classList.toggle("is-active", on);
			panel.toggleAttribute("hidden", !on);
		});
	}

	tabs.forEach(function (btn) {
		btn.addEventListener("click", function () {
			activate(btn.getAttribute("data-panel"));
		});
	});
})();
