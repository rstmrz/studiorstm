(function () {
	var section = document.getElementById("RZ_CV_EDITORIAL");
	if (!section) return;

	var labels = section.querySelectorAll(".rz-cv-ed__label");
	if (!labels.length) return;

	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduce) return;

	var observer = new IntersectionObserver(
		function (entries) {
			entries.forEach(function (entry) {
				entry.target.classList.toggle("is-scroll-active", entry.isIntersecting);
			});
		},
		{
			root: null,
			rootMargin: "-20% 0px -35% 0px",
			threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
		}
	);

	labels.forEach(function (label) {
		observer.observe(label);
	});
})();
