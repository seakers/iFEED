/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function add_newArchs_to_scatterPlot() {
    for (var i = 0; i < newArchs.length; i++) {
        architectures.push(newArchs[i]);
    }
    reset_scatterPlot();
    draw_scatterPlot(architectures);
}



function selectArchsWithinRange() {
	
    var clickedArchs = d3.selectAll(".dot.archPlot.selected");
    var unClickedArchs = d3.selectAll(".dot.archPlot:not(.selected)");

    var minCost = d3.select("[id=selectArchsWithinRange_minCost]")[0][0].value;
    var maxCost = d3.select("[id=selectArchsWithinRange_maxCost]")[0][0].value;
    var minScience = d3.select("[id=selectArchsWithinRange_minScience]")[0][0].value;
    var maxScience = d3.select("[id=selectArchsWithinRange_maxScience]")[0][0].value;

    if (maxCost == "inf") {
        maxCost = 1000000000000;
    }

    unClickedArchs.filter(function (d) {

        var sci = d.science;
        var cost = d.cost;

        if (sci < minScience) {
            return false;
        } else if (sci > maxScience) {
            return false;
        } else if (cost < minCost) {
            return false;
        } else if (cost > maxCost) {
            return false;
        } else {
            return true;
        }
    })
    .classed('selected',true)
    .style("fill", selectedColor);

    clickedArchs.filter(function (d) {

        var sci = d.science;
        var cost = d.cost;

        if (sci < minScience) {
            return true;
        } else if (sci > maxScience) {
            return true;
        } else if (cost < minCost) {
            return true;
        } else if (cost > maxCost) {
            return true;
        } else {
            return false;
        }
    })
    .classed('selected',false)
    .style("fill",defaultColor);

    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
    initialize_tabs_classification_tree();
}









function hideSelection(){

    var clickedArchs = d3.selectAll(".dot.archPlot.selected");

    clickedArchs.classed('hidden',true)
            .classed('selected',false)
            .classed('highlighted',false)
            .style('fill',defaultColor)
            .style("opacity", 0.085);
    
    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    d3.select("[id=numOfArchs_inputBox]").text(""+numOfArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
}


function show_all_archs(){

    var hiddenArchs = d3.selectAll(".dot.archPlot.hidden");
    
    hiddenArchs.classed('hidden',false)
            .style("opacity",1);
   
    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    d3.select("[id=numOfArchs_inputBox]").text(""+numOfArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
}






function arch_mouseover(d) {
        
    // The support panel is active, disable hovering 
	if(supportPanel_active){
		return;
	}
	
	numOfArchViewed = numOfArchViewed+1;
	
    
    check_satisfied_features(d.bitString);
    
    // Change the color of the dot temporarily
    var id = d.id;
    
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
        if(d.__data__.id==id){
            d3.select(d).style("fill", defaultColor_mouseover);
        }
    });
    
    // Remove the previous info
    d3.select("#supportPanel").select("[id=view1]").select("g").remove();
    var supportPanel = d3.select("#supportPanel").select("[id=view1]")
            .append("g");
    
    
//	supportPanel.append("div")
//            .attr('id','arch_specific_buttons')
//			.style("width","400px")
//			//.style("margin","auto")
//			.append("button")
//			.attr("id","evaluate_architecture_button")
//			.style("margin-top","5px")
//			.style("font-size","15px")
//			.text("Evaluate Architecture")
//            .on('click',function(d){
//                evaluate_architecture(current_bitString);
//            });
    
//    supportPanel.select('#arch_specific_buttons')
//			.append("button")
//			.attr("id","criticize_architecture_button")
//			.style("margin-top","5px")
//            .style('margin-left','4px')
//			.style("font-size","15px")
//			.text("Criticize Architecture")
//            .on('click',function(d){
//                criticize_architecture(current_bitString);
//            });    

    // Display the current architecture info
    supportPanel.append('div')
            .attr('id','arch_info_display')
            .style('width','90%')
            .style('float','left');
    
    d3.select('#arch_info_display').append("p")
            .text("Benefit: " + d.science.toFixed(4));
    d3.select('#arch_info_display').append("p")
            .text("Cost: " + d.cost.toFixed(1));    
    
//    supportPanel.append('div')
//            .attr('id','instr_options_display')
//            .style('float','right')
//            .style('width','220px')
//            .style('margin-right','5%')
//            //.style('margin-top','2%')
//            .style('background-color','#E6E6E6')
//            .style('padding','20px');
    
    current_bitString = booleanArray2String(d.bitString);
    
    display_arch_info(current_bitString);
    
    display_instrument_options();
}


function display_instrument_options(){
    
    var instrOptions = d3.select('#instr_options_display');
    
    if(instrOptions.select('table')[0][0]){
        return;
    }
    
    var table = instrOptions
            .append("table")
            .attr("id", "instrOptionsTable")
            .style('border-spacing','10px')
            .style('width','200px');
    
    var candidate_instruments = [];
    for(var i=0;i<Math.round(ninstr/2);i++){
        var temp = [];
        for(var j=0;j<2;j++){
            var index = j*Math.round(ninstr/2) + i;
            if(index < ninstr){
                temp.push(instrList[index]);
            }
        }
        candidate_instruments.push(temp);
    }

    // create table body
    table.append('tbody')
            .selectAll('tr')
            .data(candidate_instruments)
            .enter()
            .append('tr')
            .selectAll('td')
            .data(function(row,i){
                return candidate_instruments[i];
            })
            .enter()
            .append('td')
            .attr("name", function (d) {
                return d;
            })
            .attr("width", function (d, i) {
                return "70px";
            })
            .attr('class',function(d){
                return 'instr_cell arch_cell candidates';
            })
            .text(function (d) {
                return ActualName2DisplayName(d,"instrument");
            });    
    
//    $('.instr_cell.candidates').draggable({
//        connectWith: '.orbit_cell',
//        helper: 'clone',
//        cursor: 'pointer'
//    });    
    
//    instrOptions.append('div')
//            .attr('id','instr_options_trash')
//            .style('width','180px')
//            .style('margin-left','10px')
//            .style('height','50px')
//            .style('background-color','#FF8B8B');
//    
//    $('#instr_options_trash').droppable({
//        accept: '.instr_cell',
//        drop: function (event, ui) {
//            var node = d3.select(ui.draggable.context);
//            if(node.classed('candidates')) return;
//            ui.draggable.remove();
//        }
//    });    
    
}





function check_satisfied_features(bitString){
    
    // If the input bitString is not given, use default colors
    if(bitString==null){
        d3.selectAll('.applied_feature')[0].forEach(function(d){
            
            var this_feature = d3.select(d);
            var activated = this_feature.select('.feature_application_activate')[0][0].checked;
            this_feature.select('.feature_application_expression').style("color",function(d){
                if(activated){
                    return "#000000"; //black
                }else{
                    return "#989898"; // gray
                }
            });
        });
        return;
    }
        
    // Selectively highlight features that do not apply to the given bitString
    d3.selectAll('.applied_feature')[0].forEach(function(d){
        var this_feature = d3.select(d);
        var expression = this_feature.select('.feature_application_expression').attr('expression');
        
        if(expression.indexOf('{FeatureToBeAdded}')!=-1){
            return;
        }
        
        if(!applyPresetFilter(expression,bitString)){
            // highlight the feature  
            this_feature.select('.feature_application_expression').style('color','red');            
        }
    });
}


function arch_mouseout(d) {
    var id = d.id;
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
        if(d.__data__.id==id){
            var dot = d3.select(d);
            if(dot.classed('selected') && dot.classed('highlighted')){
                dot.style('fill',overlapColor);
            }else if(dot.classed('selected')){
                dot.style('fill',selectedColor);  
            }else if(dot.classed('highlighted')){
                dot.style('fill',highlightedColor);
            }else{
                d3.select(d).style("fill", defaultColor);
            }
        }
    });
    check_satisfied_features();
}





function drawParetoFront(){
    
    var margin=ScatterPlot_margin;
    var width=ScatterPlot_width;
    var height=ScatterPlot_height;
    
    var xScale = ScatterPlot_xScale;
    var xMap = ScatterPlot_xMap;
    var xAxis = ScatterPlot_xAxis;
    var yScale = ScatterPlot_yScale;
    var yMap = ScatterPlot_yMap;
    var yAxis = ScatterPlot_yAxis;


    var archsInParetoFront = d3.selectAll(".dot.archPlot")[0].filter(function(d){
        if(d3.select(d).attr("paretoRank")=="0"){
            return true;
        }
    });

    var sortedScoreList = []; sortedScoreList.length=0;
    var sortedArchList = []; sortedArchList.length=0;

    var size = archsInParetoFront.length;

    for(var i=0;i<size;i++){
        var thisScore = archsInParetoFront[i].__data__.science;
        var tmp = {
                cost: archsInParetoFront[i].__data__.cost,
                sci: archsInParetoFront[i].__data__.science
        };

        if(sortedScoreList.length==0){
            sortedScoreList.push(thisScore);
            sortedArchList.push(tmp);
        }else{
            var sortedLength = sortedScoreList.length;
            for(var j=0;j<sortedLength;j++){
                if(thisScore > sortedScoreList[j]){
                    break;
                }
            }
            sortedScoreList.splice(j, 0, thisScore);
            sortedArchList.splice(j, 0, tmp);
        }
    }

    var lines = []; lines.length=0;
    for (var i=1;i<size;i++){
        var line = {
            x1: xScale(sortedArchList[i-1].sci),
            x2: xScale(sortedArchList[i].sci),
            y1: yScale(sortedArchList[i-1].cost),
            y2: yScale(sortedArchList[i].cost) 
        };
        lines.push(line);
    }

    d3.select("[id=scatterPlotFigure]").select("svg")
            .select("[class=objects]")
            .selectAll("[class=paretoFrontier]")
            .data(lines)
            .enter()
            .append("line")
            .attr("class","paretoFrontier")
            .attr("stroke-width", 1.5)
            .attr("stroke", "#D00F0F")
            .attr("x1",function(d){
                return d.x1;
            })
            .attr("x2",function(d){
                return d.x2;
            })
            .attr("y1",function(d){
                return d.y1;
            })
            .attr("y2",function(d){
                return d.y2;
            });
}




function calculateParetoRanking(){      
    cancelDotSelections();

    var archs = d3.selectAll(".dot.archPlot")[0].filter(function(d){
        if(d3.select(d).attr("paretoRank")=="-1"){
            return true;
        }
    });
    if (archs.length==0){
        return;
    }

    var rank=0;
    while(archs.length > 0){

        var numArchs = archs.length;
        if (rank>15){
            break;
        }

        for (var i=0; i<numArchs; i++){
            var non_dominated = true;
            var thisArch = archs[i];

            for (var j=0;j<numArchs;j++){
                if (i==j) continue;
                if (
                    (thisArch.__data__.science <= archs[j].__data__.science &&
                    thisArch.__data__.cost > archs[j].__data__.cost) || 
                    (thisArch.__data__.science < archs[j].__data__.science &&
                    thisArch.__data__.cost >= archs[j].__data__.cost) 
                ){
                    non_dominated = false;
                }
            }
            if (non_dominated == true){
                d3.select(thisArch).attr("paretoRank",""+rank);
            } 
        }
        archs = d3.selectAll(".dot.archPlot")[0].filter(function(d){
            if(d3.select(d).attr("paretoRank")=="-1"){
                return true;
            }
        });
        rank++;
    }

}


function highlight_support_panel(){

    d3.select("[id=scatterPlotFigure]")
    	.style("border-width","1px");
	d3.select("#supportPanel")
		.style("border-width","3.3px");
	supportPanel_active=true;
}


function unhighlight_support_panel(){

    d3.select("[id=scatterPlotFigure]")
			.style("border-width","3.3px");
	d3.select("#supportPanel")
			.style("border-width","1px");
	supportPanel_active=false;
}


function initialize_tabs(){
	initialize_tabs_inspection();
	initialize_tabs_filter_options();
	initialize_tabs_driving_features();
	initialize_tabs_classification_tree();
}


function initialize_tabs_inspection(){
	d3.select("#supportPanel").select("[id=view1]").select("g").remove();
	d3.select("#supportPanel").select("[id=view1]").append("g")
			.append("div")
			.style("width","900px")
			.style("margin","auto")
			.append("div")
			.style("width","100%")
			.style("font-size","21px")
			.text("If you hover the mouse over a design, relevant information will be displayed here.");
}

function initialize_tabs_filter_options(){
    openFilterOptions(); 
}






function initialize_tabs_driving_features(){
	

	selection_changed=true;
	
	
	d3.select("#supportPanel").select("[id=view3]").select("g").remove();
	var guideline = d3.select("#supportPanel").select("[id=view3]")
			.append("g")
			.append("div")
			.style("width","900px")
			.style("margin","auto")
			
	guideline.append("div")
			.style("width","100%")
			.style("font-size","21px")
			.text("To run data mining, select target solutions on the scatter plot. Then click the button below.");

	guideline.append("div")
			.style("width","300px")
			.style("margin","auto")
			.append("button")
			.attr("id","getDrivingFeaturesButton")
			.style("margin-top","30px")
			.style("width","200px")
			.style("font-size","19px")
			.text("Run data mining");
	d3.selectAll("[id=getDrivingFeaturesButton]").on("click", runDataMining);
    
    
}




function set_selection_option(selected_option){

	if(selected_option=="1"){
		d3.select("#zoom-pan")[0][0].checked=true;
		d3.select("#drag-select")[0][0].checked=false;
		d3.select("#de-select")[0][0].checked=false;
	}else if(selected_option=="2"){
		d3.select("#zoom-pan")[0][0].checked=false;
		d3.select("#drag-select")[0][0].checked=true;
		d3.select("#de-select")[0][0].checked=false;
	}else{
		d3.select("#zoom-pan")[0][0].checked=false;
		d3.select("#drag-select")[0][0].checked=false;
		d3.select("#de-select")[0][0].checked=true;
	}
	scatterPlot_selection_option(selected_option)
}





function get_selected_arch_ids(){
	var target_string = "";
	d3.selectAll('.dot.archPlot.selected')[0].forEach(function(d){
		target_string = target_string + "," + d.__data__.id;
	});
	return target_string.substring(1,target_string.length);
}

function get_selected_arch_ids_list(){
	var target = [];
	d3.selectAll('.dot.archPlot.selected')[0].forEach(function(d){
		target.push(d.__data__.id);
	});
	return target;
}


function select_archs_using_ids(target_ids_string){

	var target_ids_split = target_ids_string.split(',');
	var target_ids =[];
	for(var i=0;i<target_ids_split.length;i++){
		var id = + target_ids_split[i];
		target_ids.push(id);
	}
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
    	if(target_ids.indexOf(d.__data__.id)!=-1){
    		d3.select(d)
    			.classed('selected',true)
    			.style("fill", selectedColor);
    	}
    });

}



var high_cost_high_perf = "1703,1704,1705,1731,1738,1740,1741,1742,1744,1746,1747,1748,1762,1789,1790,1791,1792,1794,1797,1799,1800,1804,1805,1806,1807,1822,1823,1825,1830,1832,1835,1843,1853,1857,1859,1863,1875,1878,1879,1884,1885,1888,1890,1895,1903,1908,1914,1916,1926,1928,1930,1933,1946,1951,1983,1991,1993,1994,2000,2004,2014,2015,2017,2024,2026,2034,2046,2047,2059,2076,2084,2086,2124,2179,2181,2186,2188,2189,2190,2191,2197,2202,2237,2239,2241,2247,2251,2253,2257,2262,2264,2276,2278,2282,2283,2284,2289,2290,2295,2298,2305,2310,2314,2322,2338,2346,2355,2360,2361,2363,2374,2378,2411,2466,2469,2474,2476,2481,2482,2483,2484,2487,2489,2493,2497,2507,2512,2536,2544,2569,2574,2586,2607,2610,2611,2617";
var mid_cost_mid_perf = "1695,1719,1720,1722,1723,1724,1725,1726,1727,1728,1729,1733,1734,1735,1737,1760,1761,1762,1763,1765,1767,1775,1776,1784,1785,1786,1788,1812,1814,1817,1819,1820,1821,1822,1825,1843,1849,1850,1855,1856,1864,1865,1869,1871,1875,1876,1879,1888,1889,1890,1891,1894,1896,1907,1908,1909,1920,1922,1926,1928,1934,1936,1937,1939,1941,1947,2026,2034,2035,2051,2053,2069,2158,2165,2182,2186,2192,2195,2204,2208,2210,2212,2247,2250,2258,2265,2268,2269,2272,2274,2293,2295,2302,2303,2305,2308,2310,2322,2327,2332,2355,2364,2378,2379,2380,2382,2402,2403,2405,2411,2413,2416,2417,2421,2452,2453,2456,2457,2460,2496,2503,2519,2522,2523,2536,2539,2541,2543,2555,2575,2598,2604,2614,2617";
var low_cost_low_perf = "19,25,26,34,44,77,81,106,108,161,170,1692,1694,1697,1698,1699,1700,1708,1709,1712,1715,1720,1721,1754,1759,1765,1767,1772,1773,1775,1778,1779,1781,1783,1808,1810,1811,1812,1815,1817,1819,1837,1838,1839,1840,1846,1850,1851,1852,1854,1856,1858,1860,1868,1869,1870,1871,1907,1909,1912,1915,1918,1919,1927,1935,1936,1943,1945,1947,1956,1958,1962,1963,1967,2029,2035,2049,2051,2054,2064,2088,2090,2107,2109,2117,2125,2138,2145,2148,2155,2158,2159,2165,2167,2176,2204,2207,2208,2215,2219,2224,2227,2265,2273,2321,2327,2336,2348,2356,2391,2393,2419,2427,2428,2435,2438,2439,2446,2450,2452,2490,2496,2498,2515,2522,2529,2533,2534,2546,2547,2551,2554,2555,2556,2561,2578,2581,2598,2604";



function turn_highlighted_to_selection(){
	
    d3.selectAll('.dot.archPlot.selected')
		.classed('selected',false)
        .classed('highlighted',false)
	    .style("fill", defaultColor); 
    
	d3.selectAll('.dot.archPlot.highlighted')
        .classed('selected',true)
		.classed('highlighted',false)
		.style("fill", selectedColor);  
}




