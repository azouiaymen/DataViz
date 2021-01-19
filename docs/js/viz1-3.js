var width = 700,
  height = 700;
var jaugeW = 300,
  jaugeH = 30;

var days_list = [];

var polluants = ['PM25', 'PM10', 'NO2', 'O3'];

var svg = d3.select("#carte1")
var svg_jauge1 = d3.select("div#legende")
                   .append("svg")
                   .attr("width", jaugeW)
                   .attr("height", jaugeH)
                   .attr("id","jauge")



var svg2 = d3
  .select("#carteConsommation")
  .append("svg")
  .attr("width", 800)
  .attr("height", 500)
  .attr("id", "map_conso");




//var g = svg.append("g");
var g2 = svg2.append("g")
tooltips={};
polluants.forEach((i)=>{
  var tool= d3
  .select("body")
  .append("div")
  .attr("class", "hidden tooltip-viz1")
  .attr("id","tooltip"+i);
  tooltips[i] = tool
})



//PROJECTION / COLORIZE
//
//

var projection = d3.geoConicConformal()
  .center([15.471, 43.27229])
  .scale(1800),
  projection_viz3 = d3.geoConicConformal()
  .center([3.454071, 46.279229])
  .scale(2800);

var path = d3.geoPath().projection(projection),
  path_viz3 = d3.geoPath().projection(projection_viz3);

var colorize = d3
  .scaleQuantize()
  .range(["#F5E040", "#FF9B2E", "#FF5A36", "#F52927"]);

var colorize2 = d3
  .scaleQuantize()
  .range(["#F5E040", "#FF9B2E", "#FF5A36", "#F52927"]);


var cpt = 0;



polluants.forEach((i) => {
  var div = svg.append("div").attr("id", "div" + i);
  div.append("label")
    .attr("id", "label-viz1")
    .attr("for", "div" + i)
    .html(i)
  div.append("svg")
    .attr("width", width / 2)
    .attr("height", height / 2)
    .attr("id", "map" + i)

})
polluants.forEach((i) => {

  d3.select("#map" + i.toString())
    .append("g")
    .attr("id", "g" + i.toString())
})

//DESSIN DES CARTES
//
// 
var res = d3.json("/docs/data/france_regions.json").then(function (jsondata) {


  polluants.forEach((i) => {
    d3.select("#g" + i)
      .selectAll("path")
      .data(jsondata.features)
      .enter()
      .append("path")
      .attr("fill", "#ccc")
      .attr("id", "map_fr_path" + i )
      .attr("stroke-width", "stroke")
      .attr("d", path);
  })

  g2.selectAll("path")
    .data(jsondata.features)
    .enter()
    .append("path")
    .attr("fill", "#ccc")
    .attr("id", "map_fr_conso")
    .attr("stroke-width", "stroke")
    .attr("d", path_viz3);

});

//RECUPERATION DES DONNEES
// ET INITIALISATION
//
d3.csv("/docs/data/resultat_final_bis.csv").then((data) => {

  colorize.domain([0, 60]);

  

  data = preprocess(data)
  init(data);


  //initialisation des spans et autres elements dynamiques


  //creation de la liste de jours pour les updates




  d3.json("/docs/data/france_regions.json").then((json) => {
    var jour = days_list[0];



    

      
      for (var i = 0; i < data.length; i++) {
        //Nom du departement
        if (data[i].date == jour) {

          polluants.forEach((itm) => {
          var dep = data[i].region;


          var value = parseInt(data[i]["getPolluant"](itm));
          
          var repeat = false;
          //Recherche de l'etat dans le GeoJSON
          for (var j = 0; j < json.features.length; j++) {
            json.features[j].properties.date = jour;
            jsonDate = json.features[j].properties.date;
            var jsonDep = json.features[j].properties.nom.toLowerCase();

            if (dep == jsonDep) {
              
              //On injecte la valeur de l'Etat dans le json
              
              if (isNaN(value)) {
                json.features[j].properties.value = 0;
              }
              if (repeat) {
                json.features[j].properties.value = Math.max(value, json.features[j].properties.value);
                
              } else {
                json.features[j].properties.value = value;
                repeat = true;
              }
    

              

              //Pas besoin de chercher plus loin
              break;
            }
          }
          
          draw(json.features, itm)
        })
        }
      }
      
    
     

    



    d3.select("#oneshot-slider").on("input", (event) => {
      new_val = event.target.value;
      d3.select("#oneshot-span").html(days_list[new_val]);
      polluants.forEach((i) => {
        updateMap(days_list[new_val], data, json.features, i);
      })

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

var villes = d3.json("/docs/data/villes_fr.json").then((json) => {
  var ret = []
  json.features.forEach((itm) => {


    ret.push(itm)
  })

  return ret;


});
var planes = d3.json("/docs/data/engines.json").then((data) => {
  return data;
});


planes.then((dataplanes) => {

  d3.select(".avions")
    .selectAll("option")
    .data(dataplanes.features)
    .enter()
    .append("option")
    .attr("value", (d) => (d.properties.model))
    .text((d) => (d.properties.model));
  d3.select(".avions").on('change', (event) => {
    var selected_model = getAvion(event.target.value, dataplanes);

    resetIcons();
    if (readyToGo()) {

      calculEmissions(coords, selected_model);
    }

  });
  selected_model = getAvion(d3.select("#avion").property("value").toString(), dataplanes)


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
      resetIcons();
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
      resetIcons();
      if (value != begin) {
        bool_arr = true;
        coords.arr.point = getCoords(event.target.value, villes_fr);
        coords.arr.name = value;

        drawPoint(coords.arr, id);
        if (readyToGo()) {

          coords.dist = distance_trajet(coords);
          drawTrajet(coords, data);

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

        return (this[name] && !isNaN(this[name]) ? this[name] : 0);

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
  var cpt = 0;
 /* svg_jauge1.selectAll("rect")
  .data(colorize.range())
  .enter()
  .append("rect")
  .attr("id", "rect" + cpt)
  .attr("x", (d) => {
    var ret = cpt * (300 / d.length) + "px";
    cpt = cpt + 1;
    return ret;
  })
  .attr("y", 0)
  .attr("width",(d)=>{return jaugeW / d.length} )
  .attr("height", jaugeH)
  .style("fill", (d) => (d));
*/
  bars = svg_jauge1.selectAll("g")
            .data(colorize.range())
            .enter()
            .append("g")
  bars.append("rect")
      .attr("x",() => {
        var ret = cpt * (jaugeW / colorize.range().length) + "px";
        cpt = cpt + 1;
        return ret;
      }) 
      .attr("y", 0)
      .attr("width",jaugeW / colorize.range().length)
      .attr("height", jaugeH)
      .style("fill", (d) => (d));
  
  var cpt_txt=0;

  bars.append("text")
      .attr("x", (d,i)=>{
        var ret = i * (jaugeW / colorize.range().length) +10+ "px";

        return ret;
      })
      .attr("y",(d)=>(jaugeH-(jaugeH/d.length)))
      .text((d,i)=>{
        
        var str = (Math.ceil(i*(60/colorize.range().length))).toString() +"-"+(i+1)*Math.ceil((60/colorize.range().length)).toString()
  
        return str;
      })

  //bars.append
  
    /*.selectAll("rect")
    .data(colorize.range())
    .enter()
    .append("rect")
    .attr("x", )
    .style("fill", (d) => (d))
    .style("color", "white")
    .text((d) => {
      var s = "";
      if (cpt == 0) {
        s = colorize.domain()[0].toString() + "-"
      } else if (cpt == colorize.range().length - 1) {
        s = colorize.domain()[1].toString() + "+"
      }
      cpt++;
      return s;
    })*/
  for(var i =0; i< colorize.range().length; i++)
  {
    svg_jauge1.select("#rect"+i).selectAll("text").data(colorize.range())
  }
 

  days_list = list;

}



function sortedList(list) {
  return list.sort(function (a, b) {
    var aa = a.split("/").reverse().join();
    bb = b.split("/").reverse().join();
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
}

function draw(list_value, i) {

  


  d3.select("#g" + i)
    .selectAll("#map_fr_path" + i).data(list_value).join(
      //premier dessin --> enter
      enter => enter.append("path")
      .attr("id", "map_fr_path" + i)
      .attr("d", path)
      .style("fill", function (d) {
        //on prend la valeur recuperee plus haut
        var value = d.properties.value;

        if (value && !isNaN(value)) {

          return colorize(value);

        } else {

          return "#ccc";
        }
      }),
      //second dessin --> update
      update => update.style("fill", (d) => {

        if (d.properties.value && !isNaN(d.properties.value)) {
          return colorize(d.properties.value);
        } else {
          return "#ccc"
        }
      }))
    .on("mouseover", function (event, d) {
      //on capture la position de la souris
      
      var pos = [event.pageX, event.pageY];
      d3.select("#tooltip"+i)
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
        .html(d.properties.nom + " <br/> emissions " + i + ": " + d.properties.value);

    })
    .on("mouseout", (event, d) => {
      d3.select("#tooltip"+i).classed("hidden", true);

    });

}



function updateMap(new_day, datas_emissions, regions, pollu) {
  var reg = "";
  var emissions = 0;
 
  for (var i = 0; i < datas_emissions.length; i++) {
    if (new_day == datas_emissions[i].date) {
      reg = datas_emissions[i].region;
      emissions = parseInt(datas_emissions[i]["getPolluant"](pollu));



      for (var j = 0; j < regions.length; j++) {
        regCarte = regions[j].properties.nom.toLowerCase();

        if (regCarte == reg) {

          if (isNaN(regions[j].properties.value)) {
            regions[j].properties.value = 0;
          }
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


  draw(regions, pollu)
}

/**FONCTIONS VISU 3 */
function initPoints() {

  var w = 15;
  var h = 3;

  pins.append("circle").attr("id", "depart-point").attr("class", "point hidden").attr("cx", "0px").attr("cy", "0px");
  pins.append("circle").attr("id", "arrivee-point").attr("class", "point hidden").attr("cx", "0px").attr("cy", "0px");

}

function hide(id_point) {
  pins.select("#" + id_point).classed("hidden", true).attr("cx", "-10000px").attr("cy", "-10000px");
  d3.select(".result_conso_div ").classed("hidden", true);
}

function resetIcons() {
  d3.select("#equiv-icons").selectAll("i").remove();
}

function drawPoint(point, id) {




  pins.selectAll("#" + id)
    .attr("r", "5px")
    .attr("cx", projection_viz3(point.point)[0])
    .attr("cy", projection_viz3(point.point)[1])
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

function distance_trajet(coords) {

  formula = (6378 * Math.acos(Math.sin(toRadian(coords.dep.point[1])) * Math.sin(toRadian(coords.arr.point[1])) +
    Math.cos(toRadian(coords.dep.point[1])) * Math.cos(toRadian(coords.arr.point[1])) *
    Math.cos(toRadian(coords.arr.point[0]) - toRadian(coords.dep.point[0])))).toFixed(2);

  return formula;
}

function toRadian(val_deg) {
  return (val_deg * Math.PI) / 180;
}


function calculEmissions(trajet, avion) {


  var em_GES_co2eq = 0;
  if (trajet.dist > 0) {
    var mach_kmh = parseFloat(avion.properties.speed_mach) * 1234.8;


    var time = (trajet.dist / mach_kmh) * 3600;
    em_GES_co2eq = ((((time * avion.properties.consommation_fuel_flying) + avion.properties.LTO_conso) * 3.16 * 1.22) / 1000).toFixed(2);
  }



  renderResults(em_GES_co2eq, trajet);
}


function getAvion(modele, list)

{

  var ret = {}
  for (var i = 0; i < list.features.length; i++) {

    if (list.features[i].properties.model == modele) {
      ret = list.features[i];

    }
  }

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
    .attr("x1", projection_viz3(coords.dep.point)[0])
    .attr("y1", projection_viz3(coords.dep.point)[1])
    .attr("x2", projection_viz3(coords.arr.point)[0])
    .attr("y2", projection_viz3(coords.arr.point)[1]);
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

function renderResults(res, trajet) {
  colorize2.domain([0, 2]);
  var dep = d3.select("#depart").node().value;
  var arr = d3.select("#arrivee").node().value;
  d3.select("#info-trajet").html("Trajet " + dep + " - " + arr + " : " + trajet.dist + "km")
  d3.select("#conso_amount").html("emmisions (GES): " + res + " T (CO2eq)")
  var borne_sup = Math.ceil(res)

  for (var i = 0; i < borne_sup; i++) {
    var id_icon = "icon" + i;
    var sup_1 = res > 1
    d3.select("#equiv-icons").append("i")
      .attr("id", id_icon)
      .attr("class", "fa fa-home")
      .style("font-size", "4vw")
      .style("color", "white");

  }
  var jauge_dims = Array(d3.select("#equiv-icons").style("width"), d3.select("#equiv-icons").style("width"))

  d3.select("#equiv-icons")
    .style("background", "linear-gradient(to right," + colorize2(res) + " " + 100 * ((res) / borne_sup) + "%, white " + 100 * ((res) / borne_sup) + "%)")
  d3.select("#equiv-icons").append("line")
    .attr("x1", jauge_dims[1] * (res / borne_sup))
    .attr("y1", jauge_dims[0])
    .attr("x2", jauge_dims[1] * (res / borne_sup))
    .attr("y1", jauge_dims[0] - 15)
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  d3.select(".result_conso_div ").classed("hidden", false);

}
