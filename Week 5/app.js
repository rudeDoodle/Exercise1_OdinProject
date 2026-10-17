const map = L.map("map", { minZoom: -3 });

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const GEO_URL =
  "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";

const MIGRATION_URL =
  "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/muutl/11a2.px";

const migrationByCode = {};

function getHue(positive, negative) {
  const hue = Math.pow(positive / negative, 3) * 60;
  return Math.min(hue, 120);
}

function getStyle(feature) {
  const code = "KU" + String(feature.properties.kunta).padStart(3, "0");
  const data = migrationByCode[code];
  if (!data) return { weight: 2 };
  return { weight: 2, color: `hsl(${getHue(data.positive, data.negative)}, 75%, 50%)` };
}

async function getMigrationData() {
  const query = await (await fetch("migration_data_query.json")).json();
  const response = await fetch(MIGRATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  return response.json();
}

async function init() {
  const migrationData = await getMigrationData();
  const geoData = await (await fetch(GEO_URL)).json();

  const areaDim = migrationData.dimension[migrationData.id[0]];
  const index = areaDim.category.index;
  const values = migrationData.value;

  Object.keys(index).forEach((key) => {
    const i = index[key];
    migrationByCode[key] = { positive: values[i * 2], negative: values[i * 2 + 1] };
  });

  const geoLayer = L.geoJSON(geoData, {
    style: getStyle,
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || feature.properties.nimi;
      const code = "KU" + String(feature.properties.kunta).padStart(3, "0");
      const data = migrationByCode[code];

      layer.bindTooltip(name);

      if (data) {
        layer.bindPopup(
          `<strong>${name}</strong><br>Positive migration: ${data.positive}<br>Negative migration: ${data.negative}`
        );
      }
    },
  }).addTo(map);

  map.fitBounds(geoLayer.getBounds());
}

init();
