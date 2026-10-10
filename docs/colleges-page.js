// Price calculator for the "Loopy Brains for colleges" page.
// Tiers: Rs 60 per student up to 999, Rs 45 up to 2999, Rs 30 from 3000; minimum Rs 25,000 a year.
(function () {
  var seats = document.getElementById("seats"), out = document.getElementById("result"), quote = document.getElementById("quote");
  function calc() {
    var n = Math.max(1, parseInt(seats.value, 10) || 0), rate = n >= 3000 ? 30 : n >= 1000 ? 45 : 60, total = Math.max(25000, n * rate);
    out.textContent = n + " students: Rs " + rate + " per student, about Rs " + total.toLocaleString("en-IN") + " per year (about Rs " + Math.round(total / n) + " per student).";
    quote.href = "mailto:v.bhaskar462@gmail.com?subject=" + encodeURIComponent("Loopy Brains quote for " + n + " students") + "&body=" + encodeURIComponent("College name:\nCity:\nNumber of students: " + n + "\nContact person and phone:\n");
  }
  seats.addEventListener("input", calc); calc();
})();
