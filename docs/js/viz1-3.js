var width = 800,
  height = 520;

var trgt_polluant = "";
var days_list = [];


var svg = d3
  .select("#carte1")
  .append("svg")
  .attr("width", width)
  .attr("height", height);


var svg2 = d3
  .select("#carteConsommation")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "map_conso");

var g = svg.append("g");

var g2 = svg2.append("g")

var tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "hidden tooltip-viz1");




var projection = d3.geoConicConformal()
  .center([2.454071, 46.279229])
  .scale(2800);

var path = d3.geoPath().projection(projection);

var colorize = d3
  .scaleQuantize()
  .range(["#F5E040", "#FF9B2E", "#E66F31", "#FF5A36", "#F52927"]);

var colorize2 = d3 
  .scaleQuantize()
  .range(["#F5E040", "#FF9B2E", "#E66F31", "#FF5A36", "#F52927"]);

var res = d3.json("../../data/france_regions.json").then(function (jsondata) {
  g.selectAll("path")
    .data(jsondata.features)
    .enter()
    .append("path")
    .attr("fill", "#ccc")
    .attr("id", "map_fr_path")
    .attr("stroke-width", "stroke")
    .attr("d", path);

  g2.selectAll("path")
    .data(jsondata.features)
    .enter()
    .append("path")
    .attr("fill", "#ccc")
    .attr("id", "map_fr_conso")
    .attr("stroke-width", "stroke")
    .attr("d", path);

});


d3.csv("../../data/resultat_final_bis.csv").then((data) => {

  colorize.domain([0, 50]);


  data = preprocess(data)
  init(data);


  //initialisation des spans et autres elements dynamiques


  //creation de la liste de jours pour les updates




  d3.json("../../data/france_regions.json").then((json) => {

    var jour = days_list[0];



    for (var i = 0; i < data.length; i++) {
      //Nom du departement
      if (data[i].date == jour) {
        var dep = data[i].region;


        var value = parseInt(data[i]["getPolluant"](trgt_polluant));

        //Recherche de l'etat dans le GeoJSON
        for (var j = 0; j < json.features.length; j++) {
          json.features[j].properties.date = jour;
          jsonDate = json.features[j].properties.date;
          var jsonDep = json.features[j].properties.nom.toLowerCase();
          json.features[j].properties.polluant = trgt_polluant;
          if (dep == jsonDep) {

            //On injecte la valeur de l'Etat dans le json
            json.features[j].properties.value = value;



            //Pas besoin de chercher plus loin
            break;
          }
        }
      }
    }


    draw(json.features)



    d3.select("#oneshot-slider").on("input", (event) => {
      new_val = event.target.value;
      d3.select("#oneshot-span").html(days_list[new_val]);

      updateMap(days_list[new_val], data, json.features, trgt_polluant);
    });
    d3.selectAll("#polluant").on("change", (evt) => {

      trgt_polluant = evt.target.value.toString();
      val = d3.select("#oneshot-slider").html().toString();

      json.features.forEach((elt) => {
        elt.properties.polluant = trgt_polluant;
        elt.properties.value = 0;
      })
      clean_map();
      updateMap(days_list[val], data, json.features, trgt_polluant);
    });
  });


});

/**PARTIE VISU 3 : CALCULATEUR DE CONSOMMATION */
var depart, arrivee;
var bool_dep, bool_arr = false;
var selected_model;
var begin = " - ";
var coords = {
  "dep": {},
  "arr": {},
  "dist": 0
};

var tooltip_conso = d3
  .select("body")
  .append("div")
  .attr("class", "hidden tooltip-viz1");

var pins = svg2.append("g");

initPoints();

var projectionConso = d3.geoMercator()
  .center([2.454071, 46.279229])
  .scale(2800);

var pathConso = d3.geoPath().projection(projectionConso)

var villes = d3.json("../data/villes_fr.json").then((json) => {
  var ret = []
  json.features.forEach((itm) => {


    ret.push(itm)
  })

  return ret;


});
var planes = d3.json("../data/engines.json").then((data) => {
  return data;
});


planes.then((dataplanes) => {
  console.log(dataplanes)
  d3.select(".avions")
    .selectAll("option")
    .data(dataplanes.features)
    .enter()
    .append("option")
    .attr("value", (d) => (d.properties.model))
    .text((d) => (d.properties.model));
  d3.select(".avions").on('change', (event) => {
      var selected_model = getAvion(event.target.value, dataplanes);
      console.log("readyyy")  
      if(readyToGo()){
        console.log("readyyy")
        calculEmissions(coords, selected_model);  
      }
      
    });
    selected_model = getAvion(d3.select("#avion").property("value").toString(), dataplanes)
   
    console.log("model ",selected_model)
});

villes.then((data) => {
  var villes_fr = data;
  d3.selectAll("select.villes")
    .selectAll("option")
    .data(data)
    .enter()
    .append("option")
    .attr("value", (d) => (d.properties.nom))
    .text((d) => (d.properties.nom));

  d3.select("#depart")
    .on('change', (event) => {
      var value = event.target.value;

      coords.dep.point = getCoords(event.target.value, villes_fr);
      coords.dep.name = value;
      var id = event.target.id + "-point"

      if (value != begin) {
        bool_dep = true;
        drawPoint(coords.dep, id);
        if (readyToGo()) {
          coords.dist = distance_trajet(coords);
          drawTrajet(coords, data);
          calculEmissions(coords, selected_model);
        }
      } else {
        bool_dep = false;
        hide(id);
        del_trajet();
      }


    })

  d3.select("#arrivee")
    .on('change', (event) => {
      var value = event.target.value;
      var id = event.target.id + "-point"
      if (value != begin) {
        bool_arr = true;
        coords.arr.point = getCoords(event.target.value, villes_fr);
        coords.arr.name = value;

        drawPoint(coords.arr, id);
        if (readyToGo()) {
          coords.dist = distance_trajet(coords);
          drawTrajet(coords, data);
          console.log("trip ",coords);
          calculEmissions(coords, selected_model);

        }
      } else {
        bool_arr = false;
        del_trajet();
        hide(id);
      }
    })





})


/**FONCTIONS VISU 1 */
function preprocess(data_csv) {
  for (var i = 0; i < data_csv.length; i++) {
    for (k in data_csv[i]) {
      data_csv[i][k] = data_csv[i][k].toString().trim();
      data_csv[i]["getPolluant"] = function (name) {

        return this[name] ? this[name] : undefined;

      }

    }
    var tab = data_csv[i].date.split('/')

    for (var j = 0; j < tab.length; j++) {
      if (parseInt(tab[j]) < 10) {
        tab[j] = "0".concat(tab[j]);

      }
    }
    data_csv[i].date = tab[2] + "/" + tab[1] + "/" + tab[0]

  }
  return data_csv;
}

function init(data) {
  var list = [];
  var polluants = ['PM2.5', 'PM10', 'NO2', 'O3'];
  for (var i = 0; i < data.length; i++) {
    if (list.indexOf(data[i].date) == -1) {
      list.push(data[i].date);
    }
  }

  list = sortedList(list);

  d3.select("#oneshot-slider")
    .attr("min", 0)
    .attr("value", 0)
    .attr("max", list.length - 1);
  d3.select("#oneshot-span").html(list[0]);

  d3.selectAll("#polluant").selectAll("option")
    .data(polluants)
    .enter()
    .append("option")
    .text((d) => d);


  trgt_polluant = d3.select("#polluant").node().value.toString();

  days_list = list;

}





function clean_map() {

  g.selectAll("path")
    .style("fill", "#ccc");
}



function sortedList(list) {
  return list.sort(function (a, b) {
    var aa = a.split("/").reverse().join();
    bb = b.split("/").reverse().join();
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
}

function draw(list_value) {

  g.selectAll("#map_fr_path").data(list_value).join(
    //premier dessin --> enter
    enter => enter.append("path")
      .attr("d", path)
      .style("fill", function (d) {
        //on prend la valeur recuperee plus haut
        var value = d.properties.value;

        if (value) {

          return colorize(value);

        } else {

          return "#ccc";
        }
      }),
    //second dessin --> update
    update => update.style("fill", (d) => {

      if (d.properties.value) {
        return colorize(d.properties.value);
      } else {
        return "#ccc"
      }
    }))
    .on("mouseover", function (event, d) {
      //on capture la position de la souris
      var pos = [event.pageX, event.pageY];
      tooltip
        .classed("hidden", false)
        .attr(
          "style",
          "left: " +
          (pos[0] - 15) +
          "px;" +
          "top: " +
          (pos[1] - 10) +
          "px;"
        )
        .html(d.properties.nom + " <br/> emissions " + d.properties.polluant + ": " + d.properties.value);
    })
    .on("mouseout", (event, d) => {
      tooltip.classed("hidden", true);

    });
}



function updateMap(new_day, datas_emissions, regions, polluant) {
  var reg = "";
  var emissions = 0;
  var regDpt = "";

  for (var i = 0; i < datas_emissions.length; i++) {
    if (new_day == datas_emissions[i].date) {
      reg = datas_emissions[i].region;
      emissions = parseInt(datas_emissions[i]["getPolluant"](polluant));



      for (var j = 0; j < regions.length; j++) {
        regCarte = regions[j].properties.nom.toLowerCase();

        if (regCarte == reg) {


          if (regions[j].properties.date == new_day) {
            regions[j].properties.value = Math.max(emissions, regions[j].properties.value);
          } else {
            regions[j].properties.value = emissions;
            regions[j].properties.date = new_day;
          }


          break;

        }
      }
    }
  }


  draw(regions)
}

/**FONCTIONS VISU 3 */
function initPoints() {

  var w = 15;
  var h = 3;

  pins.append("circle").attr("id", "depart-point").attr("class", "point ihdden").attr("cx", "0px").attr("cy", "0px");
  pins.append("circle").attr("id", "arrivee-point").attr("class", "point hidden").attr("cx", "0px").attr("cy", "0px");
  d3.select(".result_conso_div").append("svg").attr("class", "result_conso_svg").attr("width",w+"vw").attr("height", h+"vw");
  d3.select(".result_conso_div").append("p").attr("id","precisions");

}
function hide(id_point) {
  pins.select("#" + id_point).classed("hidden", true).attr("cx", "-10000px").attr("cy", "-10000px");
  d3.select(".result_conso_div").classed("hidden", true);
}
function drawPoint(point, id) {




  pins.selectAll("#" + id)
    .attr("r", "5px")
    .attr("cx", projection(point.point)[0])
    .attr("cy", projection(point.point)[1])
    .classed("hidden", false)
    .attr("fill", "green")
    .on('mouseover', (event) => {
      var pos = [event.pageX, event.pageY];
      var intitule = event.target.id.split("-")[0];
      tooltip_conso.classed("hidden", false)
        .attr(
          "style",
          "left: " +
          (pos[0] + 15) +
          "px;" +
          "top: " +
          (pos[1] + 10) +
          "px;"
        )
        .html(intitule + ": " + point.name);
    })
    .on("mouseout", (event, d) => {
      tooltip_conso.classed("hidden", "true");

    });
}

function distance_trajet(coords){

  formula = 6378 * Math.acos(Math.sin(toRadian(coords.dep.point[1]))*Math.sin(toRadian(coords.arr.point[1]))
                      + Math.cos(toRadian(coords.dep.point[1]))*Math.cos(toRadian(coords.arr.point[1]))
                      *Math.cos(toRadian(coords.arr.point[0]) - toRadian(coords.dep.point[0])));
 
  return formula;
}

function toRadian(val_deg){
  return (val_deg*Math.PI)/180;
}


function calculEmissions(trajet, avion){
  console.log("avion ", avion.speed)
  console.log("trajt ", trajet)
  var mach_kmh = parseFloat(avion.properties.speed_mach)*1234.8;
  console.log(mach_kmh)

  var time = (trajet.dist/ mach_kmh)*3600;
  var em_GES_co2eq=(time * avion.properties.consommation_fuel_kg_s * 3.16 * 1.22)/1000;
  console.log("emission GES ", em_GES_co2eq," kg en ", time/60," minutes");

  renderResults(em_GES_co2eq, trajet)
}


function getAvion(modele, list)

{

  var ret ={}
  for(var i = 0; i < list.features.length; i++){
    
    if(list.features[i].properties.model == modele){
      ret = list.features[i];
      
    }
  }
  console.log(ret)
  return ret;
}
function readyToGo() {
  return (bool_dep && bool_arr);
}

function drawTrajet(coords, villes) {
  del_trajet()
  pins.append("line")
    .style("stroke", "green")
    .style("stroke-width", 3)
    .attr("x1", projection(coords.dep.point)[0])
    .attr("y1", projection(coords.dep.point)[1])
    .attr("x2", projection(coords.arr.point)[0])
    .attr("y2", projection(coords.arr.point)[1]);
}

function del_trajet() {
  pins.selectAll("line").remove();
}
function getCoords(lieu, villes) {
  var res_arr = [];

  for (var i = 0; i < villes.length; i++) {

    if (villes[i].properties.nom == lieu) {
      res_arr.push(villes[i].geometry.coordinates[0]);
      res_arr.push(villes[i].geometry.coordinates[1]);

    }
  }
  return res_arr;
}

function renderResults(res, trajet){
  colorize2.domain([0, 10]);
  var dep = d3.select("#depart").node().value;
  var arr = d3.select("#arrivee").node().value;
  d3.select("#info-trajet").html("Trajet "+dep +" - "+arr+" : "+trajet.dist+"km")
  d3.select("#conso_amount").html("emmisions (GES): "+res)
  
  d3.select(".result_conso_svg").style("background-color",function(){return colorize2(res);} )
   d3.select("#precisions").html("Soit l'équivalent des emmissions annuelles moyennes de "+Math.floor(res)+" Français pour le chauffage du domicile.")
  d3.select("#resultat_conso").classed("hidden", false);  

}
