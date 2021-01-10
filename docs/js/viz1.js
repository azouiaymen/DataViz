


    var width = 800,
    height = 580;

    var trgt_polluant = "";
    var dictYearDaysData = {};
    var days_list =[];


    var svg = d3
    .selectAll("#carte1")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

    var g = svg.append("g");

    var tooltip = d3
      .selectAll("body")
      .append("div")
      .attr("class", "hidden tooltip-viz1");


    var projection = d3.geoConicConformal()
                        .center([2.454071, 46.279229])
                        .scale(2800);
        
    var path = d3.geoPath().projection(projection);
          
    var res= d3.json("../../data/france_regions.json").then(function (jsondata) {
    g.selectAll("path")
      .data(jsondata.features)
      .enter()
      .append("path")
      .attr("fill", "#ccc")
      .attr("id", "map_fr_path")
      .attr("stroke-width", "stroke")
      .attr("d", path);
    });  
      var colorize = d3
      .scaleQuantize()
      .range(["#F5E040","#FF9B2E", "#E66F31", "#FF5A36", "#F52927"]);

      d3.csv("../../data/resultat_final_bis.csv").then((data) => {
      
        colorize.domain([0, 50]);
        data = preprocess(data)   
        init(data);       
        split_years(data);
      
        //initialisation des spans et autres elements dynamiques
        init(data)

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
                json.features[j].properties.polluant= trgt_polluant;
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
          
            updateViz(days_list[new_val], data, json.features, trgt_polluant);
          });
          d3.selectAll("#polluant").on("change", (evt) => {
            console.log(evt.target.value.toString().toLowerCase());
            trgt_polluant=evt.target.value.toString();
            val = d3.select("#oneshot-slider").value;
            json.features.forEach((elt)=>{
              elt.properties.polluant = trgt_polluant;
              elt.properties.value = 0;
            })
            clean_map();
            updateViz(days_list[val], data, json.features);
          });
        });
      });
 
function init(data){
  var list = [];
  var polluants =['PM2.5','PM10', 'NO2', 'O3'];
  for (var i = 0; i < data.length; i++) {
    if (list.indexOf(data[i].date) == -1) {
      list.push(data[i].date);
    }
  }

  list=sortedList(list); 

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

  d3.json("../../data/france_regions.json").then((jsondata)=>{
    d3.select("#region").selectAll("option").data(jsondata.features).enter().append("option").text((d) =>{
      return d.properties.nom;
    });
    jsondata.features.forEach(itm => {
      itm.properties.date = "";
    
    })

  });
  trgt_polluant=d3.select("#polluant").node().value.toString();
  dictYearDaysData=split_years(data);
  days_list=list;
  return list;
}

function clean_map(){
  console.log("cleaning");
  g.selectAll("path")
   .style("fill", "#ccc");
} 

function split_years(data){
  var dict ={};
  var year="";
 
  for(var i=0; i<data.length; i++)
  {
    year = data[i].date.toString().split("/", 1)[0];
   
    if(dict[year])
    {
      dict[year].push(data[i]);
    } else{
      dict[year] = [];
      
      dict[year].push(data[i]);
     
    }
  
  }
  for(k in dict)
  {
    
    dict[k].sort((a ,b)=>{
      var da = a.date.split("/").join();
      var db = b.date.split("/").join();
      return da < db ? -1 : da > db ? 1 : 0
    });
   
  }

  return dict;

}



function sortedList(list) {
  return list.sort(function (a, b) {
    var aa = a.split("/").reverse().join();
      bb = b.split("/").reverse().join();
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
}

function draw(list_value){
 
  g.selectAll("path").data(list_value).join(
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
              })
              ,
  //second dessin --> update
  update => update.style("fill", (d) =>{
            
            if(d.properties.value)
            {
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
                      (pos[0] + 15) +
                      "px;" +
                      "top: " +
                      (pos[1] + 10) +
                      "px;"
                  )
                  .html(d.properties.nom+" <br/> emissions "+ d.properties.polluant+": "+d.properties.value);
              })
  .on("mouseout", (event, d) => {
    tooltip.classed("hidden", "true");
    
  });
}


function updateViz(new_day, datas_emissions, regions, polluant) {
  var reg = "";
  var emissions = 0;
  var regDpt = "";

  for (var i = 0; i < datas_emissions.length; i++) {
    if (new_day == datas_emissions[i].date) {
      reg = datas_emissions[i].region;
      emissions = parseInt(datas_emissions[i]["getPolluant"](polluant));

      

      for (var j = 0; j < regions.length; j++) {
        regCarte = regions[j].properties.nom.toLowerCase();
        
        if (regCarte == reg){
          console.log(regions[j].properties.date );  
    
          if(regions[j].properties.date == new_day) 
          {
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


function preprocess(data_csv)
{
  for (var i=0; i<data_csv.length; i++){
   for(k in data_csv[i])
   {
     data_csv[i][k] = data_csv[i][k].toString().trim();
     data_csv[i]["getPolluant"]= function(name){

       return this[name]? this[name]:undefined;
     
      }

   }
   var tab = data_csv[i].date.split('/')
   
  for(var j=0; j<tab.length; j++){
     if(parseInt(tab[j]) < 10)
     {
       tab[j]="0".concat(tab[j]);
      
     }
   }
   data_csv[i].date = tab[2]+"/"+tab[1]+"/"+tab[0]
  }
  return data_csv;
}
