const URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const YEARS = [];
for (let y = 2000; y <= 2021; y++) YEARS.push(String(y));

let labels = [];
let values = [];

function buildQuery(areaCode) {
  return {
    query: [
      { code: "timeperiod_y", selection: { filter: "item", values: YEARS } },
      { code: "alue_23_20260101", selection: { filter: "item", values: [areaCode] } },
      { code: "contentscode", selection: { filter: "item", values: ["synt-vaesto"] } },
    ],
    response: { format: "json-stat2" },
  };
}

async function fetchPopulation(areaCode) {
  const response = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildQuery(areaCode)),
  });
  return response.json();
}

function parseSeries(raw) {
  const ds = raw.dataset ?? raw;
  const id = ds.id ?? ds.dimension.id;
  const yearDim = ds.dimension[id[0]];
  const index = yearDim.category.index;
  const labelMap = yearDim.category.label;
  const years = Object.keys(index)
    .sort((a, b) => index[a] - index[b])
    .map((k) => labelMap[k]);
  return { years, values: ds.value };
}

function render() {
  document.getElementById("chart").innerHTML = "";
  new frappe.Chart("#chart", {
    title: "Population growth",
    data: { labels, datasets: [{ name: "Population", values }] },
    type: "line",
    height: 450,
    colors: ["#eb5146"],
  });
}

async function loadArea(areaCode) {
  const series = parseSeries(await fetchPopulation(areaCode));
  labels = series.years;
  values = series.values;
  localStorage.setItem("areaCode", areaCode);
  render();
}

async function getAreaCode(name) {
  const meta = await (await fetch(URL)).json();
  const areaVar =
    meta.variables.find((v) => v.code === "alue_23_20260101") || meta.variables[1];
  const i = areaVar.valueTexts.findIndex(
    (t) => t.toLowerCase() === name.toLowerCase()
  );
  return i === -1 ? null : areaVar.values[i];
}

function addPrediction() {
  if (values.length < 2) return;
  let sum = 0;
  for (let i = 1; i < values.length; i++) sum += values[i] - values[i - 1];
  const mean = sum / (values.length - 1);
  labels.push(String(Number(labels[labels.length - 1]) + 1));
  values.push(values[values.length - 1] + mean);
  render();
}

document.getElementById("area-form").addEventListener("submit", (e) => e.preventDefault());

document.getElementById("submit-data").addEventListener("click", async () => {
  const name = document.getElementById("input-area").value.trim();
  if (!name) return;
  const code = await getAreaCode(name);
  if (code) await loadArea(code);
});

document.getElementById("add-data").addEventListener("click", addPrediction);

loadArea("SSS");
