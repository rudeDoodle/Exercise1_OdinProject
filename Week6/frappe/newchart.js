const URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const YEARS = [];
for (let y = 2000; y <= 2021; y++) YEARS.push(String(y));

function buildQuery(areaCode, contentCode) {
  return {
    query: [
      { code: "timeperiod_y", selection: { filter: "item", values: YEARS } },
      { code: "alue_23_20260101", selection: { filter: "item", values: [areaCode] } },
      { code: "contentscode", selection: { filter: "item", values: [contentCode] } },
    ],
    response: { format: "json-stat2" },
  };
}

async function fetchData(areaCode, contentCode) {
  const response = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildQuery(areaCode, contentCode)),
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

async function init() {
  const areaCode = localStorage.getItem("areaCode") || "SSS";
  const births = parseSeries(await fetchData(areaCode, "synt-vm01"));
  const deaths = parseSeries(await fetchData(areaCode, "synt-vm11"));

  new frappe.Chart("#chart", {
    title: "Births and deaths",
    data: {
      labels: births.years,
      datasets: [
        { name: "Births", values: births.values },
        { name: "Deaths", values: deaths.values },
      ],
    },
    type: "bar",
    height: 450,
    colors: ["#63d0ff", "#363636"],
  });
}

init();
