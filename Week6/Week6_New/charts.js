const years = [];
for (let i = 2000; i <= 2021; i++) {
  years.push(i.toString());
}

let chart;

function drawPopulation(data) {
  document.querySelector("#chart").innerHTML = "";

  chart = new frappe.Chart("#chart", {
    title: "Population",
    type: "line",
    height: 450,
    data: {
      labels: years,
      datasets: [{ values: data.value }]
    },
    colors: ["#eb5146"]
  });
}

function prediction() {
  const values = [...chart.data.datasets[0].values];

  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    sum += values[i] - values[i - 1];
  }

  const mean = sum / (values.length - 1);
  values.push(values[values.length - 1] + mean);

  const labels = [...chart.data.labels];
  labels.push((parseInt(labels.at(-1)) + 1).toString());

  drawPopulation({ value: values });

  chart.update({
    labels: labels,
    datasets: [{ values: values }]
  });
}

function drawBirthDeath(births, deaths) {
  new frappe.Chart("#chart", {
    title: "Births and Deaths",
    type: "bar",
    height: 450,
    data: {
      labels: years,
      datasets: [
        { name: "Births", values: births.value },
        { name: "Deaths", values: deaths.value }
      ]
    },
    colors: ["#63d0ff", "#363636"]
  });
}
