(function () {
  document.documentElement.classList.add("js-ready");

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  var futureButton = document.querySelector(".future-button");
  var futureProduct = document.querySelector(".future-product");
  if (futureButton && futureProduct) {
    futureButton.addEventListener("click", function () {
      futureProduct.classList.toggle("is-notified");
    });
  }
})();
