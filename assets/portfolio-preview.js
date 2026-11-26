"use strict";
(() => {
  const controls = document.getElementById("portfolio-controls");
  if (!controls) return;
  const filter = document.getElementById("portfolio-filter");
  const count = document.getElementById("portfolio-count");
  const heading = document.getElementById("portfolio-detail");
  const summary = document.getElementById("portfolio-summary");
  const graph = document.getElementById("portfolio-graph");
  const rows = Array.from(document.querySelectorAll("#workspace tr[data-decision]"));
  const records = {
    chile: ["Chile pilot", "The committee retains its USD 60,000 ceiling while procurement obtains comparable quotes.", ["Cost estimate withdrawn", "Limited pilot approved", "Pilot suspended; ceiling retained", "Obtain comparable quotes"]],
    ai: ["AI deployment", "Fictional approval is limited to a supervised pilot. Operations must monitor exceptions.", ["Pilot evaluation reviewed", "Supervised pilot proposed", "Authorized with human review", "Monitor exceptions"]],
    capital: ["Capital allocation", "Fictional investment proposal awaits a revised cash-flow assessment. No spending authority has been granted.", ["Cash-flow assessment incomplete", "Investment proposed", "Authorization pending", "Finance completes assessment"]]
  };
  const labels = ["Evidence", "Prior judgment", "Current judgment", "Next action"];
  function show(row, focus) {
    const record = records[row.dataset.decision];
    if (!record) return;
    heading.textContent = "Decision continuity · " + record[0];
    summary.textContent = record[1];
    graph.replaceChildren(...record[2].map((value, i) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      const span = document.createElement("span");
      strong.textContent = labels[i];
      span.textContent = value;
      li.append(strong, span);
      return li;
    }));
    rows.forEach(r => r.querySelector("button").setAttribute("aria-pressed", String(r === row)));
    if (focus) heading.focus();
  }
  rows.forEach(row => {
    const cell = row.cells[0];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-choice";
    button.textContent = cell.textContent;
    button.setAttribute("aria-controls", "portfolio-detail portfolio-summary portfolio-graph");
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => show(row, true));
    cell.replaceChildren(button);
  });
  function apply() {
    const visible = rows.filter(row => {
      row.hidden = filter.value !== "all" && row.cells[1].textContent.trim() !== filter.value;
      return !row.hidden;
    });
    count.textContent = visible.length + " of " + rows.length + " sample decisions";
    if (visible.length && !visible.some(row => row.querySelector("button").getAttribute("aria-pressed") === "true")) show(visible[0], false);
  }
  filter.addEventListener("change", apply);
  controls.hidden = false;
  show(rows[0], false);
  apply();
})();
