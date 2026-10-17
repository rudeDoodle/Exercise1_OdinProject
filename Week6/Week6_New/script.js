const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const fetchStatFinData = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return await response.json();
};

const withArea = (body, code) => {
  const clone = JSON.parse(JSON.stringify(body));
  for (const item of clone.query) {
    if (item.code === "alue_23_20260101") {
      item.selection.values = [code];
    }
  }
  return clone;
};

let municipalityCodes = {};
let currentMunicipality = "SSS";

const loadMunicipalities = async () => {
  const data = await (await fetch(url)).json();
  const codes = data.variables[1].values;
  const names = data.variables[1].valueTexts;
  for (let i = 0; i < codes.length; i++) {
    municipalityCodes[names[i].toLowerCase()] = codes[i];
  }
  municipalityCodes["finland"] = "SSS";
};

const initializeCode = async () => {
  await loadMunicipalities();

  if (document.querySelector("#area-form")) {
    const populationBody = await (await fetch("/tiedot/population_query.json")).json();

    const populationData = await fetchStatFinData(url, populationBody);
    drawPopulation(populationData);

    document.querySelector("#area-form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.querySelector("#input-area").value.trim().toLowerCase();

      if (!(name in municipalityCodes)) {
        alert("Municipality not found");
        return;
      }

      currentMunicipality = municipalityCodes[name];

      const data = await fetchStatFinData(url, withArea(populationBody, currentMunicipality));
      drawPopulation(data);

      localStorage.setItem("municipality", currentMunicipality);
    });

    document.querySelector("#add-data").addEventListener("click", prediction);
  }

  if (window.location.pathname.includes("newchart")) {
    currentMunicipality = localStorage.getItem("municipality") || "SSS";

    const birthsBody = await (await fetch("/tiedot/births_query.json")).json();
    const deathsBody = await (await fetch("/tiedot/deaths_query.json")).json();

    const [births, deaths] = await Promise.all([
      fetchStatFinData(url, withArea(birthsBody, currentMunicipality)),
      fetchStatFinData(url, withArea(deathsBody, currentMunicipality))
    ]);

    drawBirthDeath(births, deaths);
  }
};

initializeCode();
