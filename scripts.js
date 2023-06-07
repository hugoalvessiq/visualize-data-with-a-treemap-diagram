// import React, {useState} from "https://cdn.skypack.dev/react@18.2.0";
// import ReactDOM from "https://cdn.skypack.dev/react-dom@18.2.0";

const { useState } = React;

const {
  select,
  json,
  interpolateRgb,
  scaleOrdinal,
  hierarchy,
  selectAll,
  schemePaired,
  treemapResquarify,
} = d3;

const DATASETS = {
  kickstarter: {
    TITLE: "Kickstarter Pledges",
    DESCRIPTION:
      "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json",
  },
};

function Treemap() {
  const [jsonUrl, setJsonUrl] = useState(DATASETS.kickstarter.FILE_PATH);

  console.log(jsonUrl);

  return (
    <div id="container">
      <h1 id="title">{DATASETS.kickstarter.TITLE}</h1>
      <h3 id="description">{DATASETS.kickstarter.DESCRIPTION}</h3>
      <Legend jsonUrl={jsonUrl} />
      <Svg jsonUrl={jsonUrl} />
    </div>
  );
}

const width = 600;
const height = 250;

const Svg = ({ jsonUrl }) => {
  const width = 970;
  const height = 600;

  const tooltip = select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "grey")
    .style("padding", "10px")
    .style("opacity", 1)
    .style("color", "white")
    .style("border-radius", "5px");

  json(jsonUrl).then((data) => {
    const svg = select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("display", "flex")
      .style("font-family", "Helvetica");

    const fader = (color) => {
      return interpolateRgb(color, "#fff")(0.2);
    };

    const format = d3.format(",d");
    const color = scaleOrdinal().range(schemePaired.map(fader));

    const treemap = d3
      .treemap()
      .tile(treemapResquarify)
      .size([width, height])
      .paddingInner(1);

    const root = hierarchy(data)
      .eachBefore(function (d) {
        d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
      })
      .sum(sumBySize)
      .sort(function (a, b) {
        return b.height - a.height || b.value - a.value;
      });

    treemap(root);

    /* **************** mouse move functions ******************** */

    const mouseOver = () => {
      return tooltip.style("visibility", "visible");
    };

    const mouseMove = (d, i) => {
      tooltip
        .attr("data-value", `${i.data.value}`)
        .style("left", d.pageX + 10 + "px")
        .style("top", d.pageY + 20 + "px");

      selectAll("#tooltip")
        .html(
          `Name: ${i.data.name}<br> Category: ${i.data.category}<br> Value: ${i.data.value}`
        )
        .style("font-size", "0.8rem")
        .style("font-family", "Helvetica");

      return tooltip.style("visibility", "visible");
    };

    const mouseOut = () => {
      return tooltip.style("visibility", "hidden");
    };

    /* **************** end mouse move functions ******************** */

    const cell = svg
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + d.x0 + "," + d.y0 + ")";
      });

    cell
      .append("rect")
      .attr("id", function (d) {
        return d.data.id;
      })
      .attr("class", "tile")
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("fill", function (d) {
        return color(d.data.category);
      })
      .attr("data-name", function (d) {
        return d.data.name;
      })
      .attr("data-category", function (d) {
        return d.data.category;
      })
      .attr("data-value", function (d) {
        return d.data.value;
      })
      .on("mouseover", (d, i) => mouseOver())
      .on("mousemove", (d, i) => mouseMove(d, i))
      .on("mouseout", (d, i) => mouseOut());

    cell
      .append("clipPath")
      .attr("id", function (d) {
        return "clip-" + d.data.id;
      })
      .append("use")
      .attr("xlink:href", function (d) {
        return "#" + d.data.id;
      });

    cell
      .append("text")
      .attr("clip-path", function (d) {
        return "url(#clip-" + d.data.id + ")";
      })
      .selectAll("tspan")
      .data(function (d) {
        return d.data.name.split(/(?=[A-Z][^A-Z])/g);
      })
      .enter()
      .append("tspan")
      .attr("x", 4)
      .attr("y", function (d, i) {
        return 13 + i * 10;
      })
      .text(function (d) {
        return d;
      });

    cell.append("title").text(function (d) {
      return d.data.id + "\n" + format(d.value);
    });

    function sumBySize(d) {
      return d.value;
    }
  });
  return <svg width={width} height={height} id="map"></svg>;
};

const Legend = ({ jsonUrl }) => {
  const fader = (color) => {
    return interpolateRgb(color, "#fff")(0.2);
  };

  const color = scaleOrdinal().range(schemePaired.map(fader));

  json(jsonUrl).then((data) => {
    const dataName = (d) =>
      d.children.map((d) => {
        return d.name;
      });

    const SVG = select("svg")
      .attr("width", width)
      .attr("id", "legend")
      .attr("height", height);

    const size = 20;
    SVG.selectAll("rect")
      .data(dataName(data))
      .enter()
      .append("rect")
      .attr("x", (d, i) => {
        if (i > 6 && i < 14) {
          return 300;
        } else if (i > 13) {
          return 450;
        }

        return 100;
      })
      .attr("class", "legend-item")
      .attr("y", function (d, i) {
        if (i > 6 && i < 14) {
          return i * (size + 5) - 120;
        } else if (i > 13) {
          return i * (size + 5) - 300;
        }
        return 50 + i * (size + 5);
      })
      .attr("width", size)
      .attr("height", size)
      .style("fill", function (d) {
        return color(d);
      });

    SVG.selectAll("text")
      .data(dataName(data))
      .enter()
      .append("text")
      .attr("x", (d, i) => {
        if (i > 6 && i < 14) {
          return 300 + size * 1.2;
        } else if (i > 13) {
          return 450 + size * 1.2;
        }
        return 100 + size * 1.2;
      })
      .attr("y", function (d, i) {
        if (i > 6 && i < 14) {
          return i * (size + 5) + size / 2 - 120;
        } else if (i > 13) {
          return i * (size + 5) + size / 2 - 300;
        }
        return 50 + i * (size + 5) + size / 2;
      })
      .style("fill", function (d) {
        return color(d);
      })
      .text(function (d) {
        return d;
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");
  });

  return (
    <svg>
      {" "}
      <use href="#legend" />
    </svg>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<Treemap />);
