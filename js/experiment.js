// Experiment setup
        

function Experiment(ifeed){

    var self = this;
    

    self.timeinterval;
    self.session_timed_out;

    self.orbitOrder = [0,1,2,3,4];
    self.instrOrder = [0,1,2,3,4,5,6,7,8,9,10,11];

    self.norb = self.orbitOrder.length;
    self.ninstr = self.instrOrder.length;

    self.orbitList = ifeed.label.orbit_relabeled;
    self.instrList = ifeed.label.instrument_relabeled;

    self.orbitList_random = [];
    self.instrList_random = [];

    self.task_order = shuffleArray([0, 1, 2]); // low-cost-low-perf, mid-cost-mid-perf, high-cost-high-perf
    self.condition_order = shuffleArray([1, 2, 3]); // Scatter plot only, scatter plot + filter, scatter plot + filter + data mining
    self.variable_scheme_order = shuffleArray([0, 1, 2]); // variable ordering

    self.task_number = self.task_order[0];
    self.condition_number = self.condition_order[0];
    self.variable_scheme_number = self.variable_scheme_order[0];


    // Randomize variable order
    self.orbitOrderStore = [[3, 1, 0, 4, 2],
                       [4, 2, 3, 0, 1],
                       [0, 1, 4, 3, 2]];

    self.instrOrderStore = [[6, 9, 1, 10, 4, 8, 5, 11, 2, 0, 3, 7],
                       [3, 1, 8, 7, 5, 6, 2, 0, 4, 9, 11, 10],
                       [7, 8, 1, 9, 11, 5, 6, 2, 10, 0, 3, 4]];

    self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
    self.instrOrder = self.instrOrderStore[self.variable_scheme_number];


    var deadline;
    var remainingTime = + 10*60*1000; // 10 minutes
    
    self.label = new Label(this);


//    // Get account info
//    var sessionInfo = window.location.search;
//    
//    if(sessionInfo){
//        
//        sessionInfo = sessionInfo.substring(1);
//        account_id = sessionInfo;
//        
//    }else{
//        account_id = '123123123';
//    }
    
    
    
    self.account_id = '123123123';
    
    
    function getTimeRemaining(endtime){
          var t = Date.parse(endtime) - Date.parse(new Date());
          var seconds = Math.floor( (t/1000) % 60 );
          var minutes = Math.floor( (t/1000/60) % 60 );
          return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
          };
    }

    self.stopTimer = function(){
        clearInterval(self.timeinterval);
    }                  

    self.resetTimer = function(){
        clearInterval(self.timeinterval);
        var startTime = Date.parse(new Date());
        deadline = new Date(startTime+remainingTime);
        self.initializeClock(deadline);
    }


    self.initializeClock = function(endtime){

        var clock = document.getElementById('clockdiv');

        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        function updateClock(){
            var t = getTimeRemaining(endtime);

            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if(t.total<=0){
                self.stopTimer();
                alert('The task is finished! Please let the experimenter know that you have finished the task. Do not proceed unless directed to do so.')
                return;
            }
        }

        updateClock(); // run function once at first to avoid delay
        self.timeinterval = setInterval(updateClock,1000);
    }
    

    
    self.update_task_direction = function(){

        ifeed.main_plot.cancel_selection();
        ifeed.filter.initialize();
        ifeed.data_mining.initialize();
        ifeed.feature_application.clear_feature_application();
        

        // Change the prompt message and the target selection
        if(self.condition_number==1){

            d3.select("#prompt_header").text("Task "+(self.task_order.indexOf(self.task_number)+1)+": Find features using visual inspection");
            d3.select('#prompt_body_text_1').html('<p> - You can hover your mouse over each design to see the relevant information.</p>'
                                        +'<p>** for this task, you are encouraged to take notes (either physically on a piece of paper or electronically using a notepad</p>'
                                        +'<br><p>You have at maximum 10 minutes, but you can finish early if you feel like you found a good enough feature with good coverage and specificy. </p>');

            d3.select('body').style('background-color','#FFEDF3');
            d3.select('#experiment_prompt_div').style('background-color','#FFC1D4');   
        }
        else if(self.condition_number==2){
            d3.select("#prompt_header").text("Task "+(self.task_order.indexOf(self.task_number)+1)+": Find features using visual inspection and filters");
            d3.select('#prompt_body_text_1').html('<p> - You can hover your mouse over each design to see the relevant information.</p>'
                                        +'<p> - You can use filters to selectively highlight designs sharing certain features. </p>'
                                        +'<br><p>You have at maximum 10 minutes, but you can finish early if you feel like you found a good enough feature with good coverage and specificy. </p>');

            d3.select('body').style('background-color','#F0EBFF');
            d3.select('#experiment_prompt_div').style('background-color','#CDC1FF');        
        }
        else if(self.condition_number==3){
            d3.select("#prompt_header").text("Task "+(self.task_order.indexOf(self.task_number)+1)+": Find features using visual inspection, filters, and data mining");
            d3.select('#prompt_body_text_1').html('<p> - You can hover your mouse over each design to see the relevant information.</p>'
                                        +'<p> - You can use filters to selectively highlight designs sharing certain features. </p>'
                                        +'<p> - You can use data mining to automatically extract some features for you. </p>'
                                        +'<br><p>You have at maximum 10 minutes, but you can finish early if you feel like you found a good enough feature with good coverage and specificy. </p>');

            d3.select('body').style('background-color','#F5FFF6');
            d3.select('#experiment_prompt_div').style('background-color','#ABFFB3');
        }

        
        if(self.task_number==0){
            self.select_archs_using_ids(self.low_cost_low_perf);
        }else if(self.task_number==1){
            self.select_archs_using_ids(self.mid_cost_mid_perf);
        }else if(self.task_number==2){
            self.select_archs_using_ids(self.high_cost_high_perf);
        }

        
        d3.select("#num_of_archs").text(""+ifeed.main_plot.get_num_of_archs());
        

        //Experiment
        if(self.condition_number=="1"){

            d3.select("#tab2").text('-');
            d3.select("#view2").selectAll('g').remove();
            d3.select("#tab3").text('-');
            d3.select("#view3").selectAll('g').remove();

        }else if(self.condition_number=="2"){

            ifeed.data_mining.run();
            
            document.getElementById('tab1').click();

            d3.select("#tab2").text('Filter Setting');
            d3.select("#tab3").text('Feature Analysis');

        }else { // condition_number == "3"

            d3.select("#tab2").text('Filter Setting');
            d3.select("#tab3").text('Feature Analysis');

            ifeed.data_mining.run();
        }
        
        self.resetTimer();
    }
    
    
    
    
    
    self.previous_task = function(){
        var i = self.task_order.indexOf(self.task_number);
        if(i==0){
            // pass
        }else if(i==1){
            self.task_number = self.task_order[0];
            self.condition_number = self.condition_order[0];
            self.variable_scheme_number = self.variable_scheme_order[0];
            self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
            self.instrOrder = self.instrOrderStore[self.variable_scheme_number];
        }else if(i==2){
            self.task_number = self.task_order[1];
            self.condition_number = self.condition_order[1];
            self.variable_scheme_number = self.variable_scheme_order[1];
            self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
            self.instrOrder = self.instrOrderStore[self.variable_scheme_number];
        }
        self.update_task_direction();
    }
    
    
    self.next_task = function(){

        //store_task_specific_information();

        var i = self.task_order.indexOf(self.task_number);

        if(i==0){
            self.task_number = self.task_order[1];
            self.condition_number = self.condition_order[1];
            self.variable_scheme_number = self.variable_scheme_order[1];
            self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
            self.instrOrder = self.instrOrderStore[self.variable_scheme_number];
        }else if(i==1){
            self.task_number = self.task_order[2];
            self.condition_number = self.condition_order[2];
            self.variable_scheme_number = self.variable_scheme_order[2];
            self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
            self.instrOrder = self.instrOrderStore[self.variable_scheme_number];
        }else if(i==2){
            // finished all tasks

            clearInterval(self.timeinterval);
            self.session_timed_out = true;

            
            d3.select('body').selectAll('div').remove();
            session_timeout();
            var key_number = self.account_id;

            var img = $('<img />', {src : 'https://brand.cornell.edu/images/cornelllogo-stacked.png'});
            img.appendTo('body');
            d3.select('body').select('img').style("width","150px").style('margin','40px');

            d3.select('body').append('h1')
                .text('The session ended').style("width","1200px").style("margin","auto");

            d3.select('body').append('h2')
                .text("IMPORTANT: Please copy the key number below and paste it into the survey page (link provided below).").style("width","1200px").style("margin","auto");
            d3.select('body').append('h2')
                .text("Key number: "+ key_number).style("width","1200px").style("margin","auto");
            d3.select('body').append('h2')
                .text("Now follow the link to do a survey: https://www.surveymonkey.com/r/8X7QPBS").style("width","1200px").style("margin","auto");
            d3.select('body').append('div').style("width","100%").style("height","30px"); 

            //print_experiment_summary();
            return;

        }

        self.update_task_direction();
    }
    
    
    
    
    
    
    



    var buttonClickCount_applyFilter = 0;
    var buttonClickCount_testFeature = 0;
    var buttonClickCount_feature = 0;
    var numOfArchViewed =0;
    var numOfDrivingFeatureViewed = 0;

    var buttonClickCount_applyFilter_store = [];
    var buttonClickCount_testFeature_store = [];
    var buttonClickCount_feature_store = [];
    var numOfArchViewed_store = [];
    var numOfDrivingFeatureViewed_store = [];



    var added_features_store = [];
    var remainingTimeStore = [];



    function print_experiment_summary(){

        // task_order, condition_order, account_id
        // orbitOrder, instrOrder

        var path = "";
        var filename = path + account_id + '.csv';

        var printout = [];

        var header = ['account_id','condition','task','variable_scheme'];

        header = header.concat(['clkCnt_filter','clkCnt_feature','clkCnt_testFeature','numArchsViewed','numFeatureViewed']);

        header.push('timeSpent');
        header.push('addedFeatures');


        header = header.join(',');
        printout.push(header);

        for(var i=0;i<3;i++){

            var row = [];

            var condition = i+1;
            var index = condition_order.indexOf(condition);
            var task = task_order[index];
            var var_scheme = variable_scheme_order[index];

            var clkCnt_filter = buttonClickCount_applyFilter_store[index];
            var clkCnt_feature = buttonClickCount_feature_store[index];
            var clkCnt_testFeature = buttonClickCount_testFeature_store[index];
            var numArchsViewed = numOfArchViewed_store[index];
            var numFeatureViewed = numOfDrivingFeatureViewed_store[index];

            row=row.concat([account_id,condition,task,var_scheme]);
            row=row.concat([clkCnt_filter,clkCnt_feature,clkCnt_testFeature,numArchsViewed,numFeatureViewed]);

            row.push(600-remainingTimeStore[index]);

            var tmp_added_features = [];
            for(var j=0;j<added_features_store[index].length;j++){
                tmp_added_features.push(added_features_store[index][j].expression);
            }
            row.push(JSON.stringify(tmp_added_features));


            row=row.join(",");
            printout.push(row);
        }

        printout = printout.join('\n');
        saveTextAsFile(filename, printout);
    }


    function saveTextAsFile(filename, inputText){

        var textToWrite = inputText;
        var fileNameToSaveAs = filename;

        var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});

        var downloadLink = document.createElement("a");

        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";

        if (window.webkitURL != null){
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        }
        else{
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = document.body.removeChild(event.target);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }
        downloadLink.click();
    }



    function set_variable_and_task_order(task, variable_scheme){
        self.task_number=task;
        self.variable_scheme_number=variable_scheme;
        self.orbitOrder = self.orbitOrderStore[self.variable_scheme_number];
        self.instrOrder = self.instrOrderStore[self.variable_scheme_number];
        self.condition_number=3;
        self.update_task_direction();
        self.stopTimer();
        added_features=[];
    }




    function session_timeout(){
        return;
    }




    //function store_task_specific_information(){
    //    
    //    added_features_store.push(JSON.parse(JSON.stringify(added_features)));
    //    buttonClickCount_applyFilter_store.push(buttonClickCount_applyFilter);
    //    buttonClickCount_testFeature_store.push(buttonClickCount_testFeature);
    //    buttonClickCount_feature_store.push(buttonClickCount_feature);
    //    numOfArchViewed_store.push(numOfArchViewed);
    //    numOfDrivingFeatureViewed_store.push(numOfDrivingFeatureViewed);
    //    
    //    // Reset task-specific info
    //    added_features=[];
    //    buttonClickCount_applyFilter = 0;
    //    buttonClickCount_testFeature = 0;
    //    buttonClickCount_feature = 0;
    //    numOfArchViewed = 0
    //    numOfDrivingFeatureViewed = 0;
    //
    //    var rt = getTimeRemaining(deadline).total/1000;
    //    remainingTimeStore.push(rt);
    //    
    //}

    


    
    
    
    

    self.get_selected_arch_ids = function(){
        var target_string = "";
        d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
            target_string = target_string + "," + d.__data__.id;
        });
        return target_string.substring(1,target_string.length);
    }



    self.get_selected_arch_ids_list = function(){
        var target = [];
        d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
            target.push(d.__data__.id);
        });
        return target;
    }


    self.select_archs_using_ids = function(target_ids_string){

        var target_ids_split = target_ids_string.split(',');
        var target_ids =[];
        for(var i=0;i<target_ids_split.length;i++){
            var id = + target_ids_split[i];
            target_ids.push(id);
        }
        d3.selectAll('.dot.main_plot')[0].forEach(function(d){
            if(target_ids.indexOf(d.__data__.id)!=-1){
                d3.select(d).classed('selected',true).style("fill", ifeed.main_plot.color.selected);
            }
        });

    }
    


    self.high_cost_high_perf = "1701,1702,1703,1729,1736,1738,1739,1740,1741,1742,1744,1745,1746,1761,1786,1787,1788,1789,1790,1792,1795,1797,1798,1802,1803,1804,1805,1821,1828,1830,1833,1841,1851,1855,1857,1861,1873,1876,1877,1882,1883,1886,1888,1892,1893,1894,1901,1906,1912,1914,1924,1926,1928,1931,1944,1949,1981,1989,1991,1992,1998,2002,2012,2013,2015,2022,2024,2044,2045,2057,2074,2082,2084,2122,2177,2179,2180,2184,2186,2187,2188,2189,2195,2200,2235,2237,2239,2241,2245,2249,2251,2255,2260,2262,2274,2276,2280,2281,2282,2287,2288,2293,2296,2303,2308,2312,2336,2344,2353,2356,2358,2359,2360,2361,2372,2376,2409,2464,2467,2472,2474,2479,2480,2481,2482,2485,2487,2491,2495,2505,2510,2534,2542,2567,2572,2584,2605,2608,2609,2615";
    
    self.mid_cost_mid_perf = "1701,1702,1717,1718,1720,1721,1722,1723,1724,1725,1726,1727,1731,1732,1733,1735,1739,1741,1742,1758,1759,1760,1761,1762,1774,1782,1783,1784,1786,1788,1795,1802,1803,1812,1818,1819,1820,1821,1823,1828,1830,1833,1841,1847,1853,1854,1862,1863,1873,1874,1876,1877,1886,1887,1888,1889,1892,1894,1906,1918,1920,1924,1926,1928,1931,1932,1935,1937,1939,2002,2006,2012,2024,2026,2032,2044,2045,2049,2051,2057,2067,2120,2180,2184,2186,2188,2190,2193,2208,2210,2235,2239,2241,2245,2248,2255,2256,2263,2266,2267,2270,2272,2281,2291,2293,2300,2301,2303,2306,2308,2312,2320,2330,2353,2356,2358,2359,2360,2361,2362,2372,2376,2377,2378,2383,2400,2401,2403,2409,2411,2414,2415,2419,2451,2454,2455,2458,2495,2501,2517,2521,2534,2537,2539,2541,2567,2573,2584,2612,2615";
    
    self.low_cost_low_perf = "19,25,26,34,44,77,81,106,108,168,1690,1692,1693,1695,1696,1697,1698,1706,1707,1710,1713,1718,1719,1731,1732,1752,1757,1763,1765,1770,1771,1773,1774,1776,1777,1779,1781,1806,1808,1809,1810,1813,1815,1817,1835,1836,1837,1838,1844,1848,1849,1850,1852,1853,1854,1856,1858,1866,1867,1868,1869,1905,1907,1910,1913,1916,1917,1925,1933,1934,1941,1943,1945,1954,1956,1960,1961,1965,2027,2033,2047,2049,2052,2062,2086,2088,2105,2107,2115,2123,2136,2143,2146,2153,2156,2157,2163,2165,2174,2202,2205,2206,2213,2217,2222,2225,2248,2263,2271,2272,2306,2319,2325,2334,2346,2354,2380,2389,2391,2400,2417,2419,2425,2426,2433,2436,2437,2444,2448,2450,2488,2494,2496,2513,2520,2521,2527,2531,2532,2541,2544,2545,2549,2552,2553,2554,2559,2576,2579,2596,2602";
    
    
    self.higher_cost_higher_perf = "1701,1702,1703,1717,1725,1726,1727,1729,1739,1740,1741,1742,1744,1745,1746,1760,1761,1762,1783,1784,1786,1788,1795,1797,1798,1802,1803,1804,1805,1818,1820,1821,1823,1828,1830,1833,1841,1851,1855,1857,1861,1862,1863,1873,1874,1876,1877,1882,1883,1886,1887,1888,1892,1894,1901,1906,1912,1914,1920,1924,1926,1928,1931,1944,1992,1998,2002,2006,2012,2013,2015,2024,2026,2032,2044,2045,2051,2057,2074,2082,2084,2120,2179,2180,2184,2186,2187,2188,2189,2235,2237,2239,2241,2245,2249,2251,2255,2260,2262,2266,2267,2270,2281,2287,2291,2293,2300,2301,2303,2308,2312,2320,2330,2336,2344,2353,2356,2358,2359,2360,2361,2362,2372,2376,2377,2383,2401,2409,2464,2472,2474,2479,2481,2485,2487,2491,2495,2501,2505,2510,2534,2542,2567,2572,2584,2615";
    
    self.lower_cost_lower_perf = "1690,1692,1693,1696,1697,1698,1707,1710,1718,1719,1720,1721,1722,1723,1724,1731,1732,1733,1735,1752,1757,1758,1759,1763,1765,1770,1771,1773,1774,1782,1808,1809,1810,1812,1815,1817,1819,1835,1836,1837,1844,1847,1848,1849,1850,1853,1854,1856,1858,1867,1869,1889,1905,1907,1913,1916,1918,1932,1934,1935,1937,1939,1943,1945,2033,2049,2052,2067,2115,2123,2146,2156,2163,2165,2190,2193,2202,2205,2206,2208,2210,2225,2248,2263,2271,2272,2306,2325,2346,2354,2380,2391,2400,2403,2411,2417,2419,2425,2433,2436,2437,2450,2451,2454,2458,2494,2496,2513,2517,2520,2521,2527,2531,2532,2541,2545,2549,2553,2554,2559,2573,2596,2602,2612";
    
    
    


    self.turn_highlighted_to_selected = function(){

        d3.selectAll('.dot.main_plot.selected')
            .classed('selected',false)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.default); 

        d3.selectAll('.dot.main_plot.highlighted')
            .classed('selected',true)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.selected);  
    }


    self.turn_selected_to_highlighted = function(){

        d3.selectAll('.dot.main_plot.highlighted')
            .classed('selected',false)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.default); 

        d3.selectAll('.dot.main_plot.selected')
            .classed('selected',false)
            .classed('highlighted',true)
            .style("fill", ifeed.main_plot.color.highlighted);  
    }


    
    
    d3.select("#move_backward_button").on("click",function(d){
        self.previous_task();
    });
    d3.select("#move_forward_button").on("click",function(d){
        self.next_task();
    });
    
    
    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }


    self.encodeBitString = function(bitString){
        var new_bitString = "";
        for(var i=0;i<self.norb;i++){
            for(var j=0;j<self.ninstr;j++){
                new_bitString = new_bitString + bitString[self.orbitOrder[i]*self.ninstr+self.instrOrder[j]];
            }
        }
        return new_bitString;
    }


    self.encodeBitStringBool = function(bitString){
        var new_bitString = [];
        for(var i=0;i<self.norb;i++){
            for(var j=0;j<self.ninstr;j++){
                new_bitString.push(bitString[self.orbitOrder[i]*self.ninstr+self.instrOrder[j]]);
            }
        }
        return new_bitString;
    }   

    self.decodeBitString = function(bitString){
        var original_bitString = "";
        for(var i=0;i<self.norb;i++){
            var orbIndex = self.orbitOrder.indexOf(i);
            for(var j=0;j<self.ninstr;j++){
                var instIndex = self.instrOrder.indexOf(j);
                original_bitString = original_bitString + bitString[orbIndex*self.ninstr+instIndex];
            }
        }
        return original_bitString;
    }    
    
    
    
    
    
    
    
    function Label(experiment){
        
        
        var self = this;
        
        
        self.relabel_randomized_variable_single = function(expression){

            var exp = expression;
            if(exp[0]==="{"){
                exp = exp.substring(1,exp.length-1);
            }
            var featureName = exp.split("[")[0];

            if(featureName[0]=='~'){
                featureName = 'NOT '+ featureName.substring(1);
            }

            var featureArg = exp.split("[")[1];
            featureArg = featureArg.substring(0,featureArg.length-1);

            var orbits = featureArg.split(";")[0].split(",");
            var instruments = featureArg.split(";")[1].split(",");
            var numbers = featureArg.split(";")[2];

            var pporbits="";
            var ppinstruments="";
            
            for(var i=0;i<orbits.length;i++){
                if(orbits[i].length===0){
                    continue;
                }
                if(i>0){pporbits = pporbits + ",";}
                pporbits = pporbits + experiment.orbitOrder.indexOf(+orbits[i]);
            }
            
            for(var i=0;i<instruments.length;i++){
                if(instruments[i].length===0){
                    continue;
                }
                if(i>0){ppinstruments = ppinstruments + ",";}
                ppinstruments = ppinstruments + experiment.instrOrder.indexOf(+instruments[i]);
            }
            var ppexpression = featureName + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
            return ppexpression;
        }

        
        self.relabel_randomized_variable = function(expression){
            
            var output = '';

            var save = false;
            var savedString = '';

            for(var i=0;i<expression.length;i++){
                if(expression[i]=='{'){
                    save = true;
                    savedString = '{';
                }else if(expression[i]=='}'){
                    save = false;
                    savedString = savedString + '}';
                    feature_expression = savedString;
                    output = output + '{' + self.relabel_randomized_variable_single(feature_expression) + '}';
                }else{
                    if(save){
                        savedString = savedString + expression[i];
                    }else{
                        output = output + expression[i];
                    }
                }
            }
            return output;

        }
        
        

        self.restore_randomized_variable_single = function(expression, orbitOrder, instrOrder){
            
            if(!orbitOrder){
                orbitOrder = experiment.orbitOrder;
            }
            
            if(!instrOrder){
                instrOrder = experiment.instrOrder;
            }
            
            
            var exp = expression;
            if(exp[0]==="{"){
                exp = exp.substring(1,exp.length-1);
            }
            var featureName = exp.split("[")[0];

            if(featureName==="paretoFront" || featureName==='PLACEHOLDER'){return exp;}

            if(featureName[0]=='~'){
                featureName = 'NOT '+ featureName.substring(1);
            }

            var featureArg = exp.split("[")[1];
            featureArg = featureArg.substring(0,featureArg.length-1);

            var orbits = featureArg.split(";")[0].split(",");
            var instruments = featureArg.split(";")[1].split(",");
            var numbers = featureArg.split(";")[2];

            var pporbits="";
            var ppinstruments="";
            for(var i=0;i<orbits.length;i++){
                if(orbits[i].length===0){
                    continue;
                }
                if(i>0){pporbits = pporbits + ",";}
                pporbits = pporbits + orbitOrder[+orbits[i]];
            }
            for(var i=0;i<instruments.length;i++){
                if(instruments[i].length===0){
                    continue;
                }
                if(i>0){ppinstruments = ppinstruments + ",";}
                ppinstruments = ppinstruments + instrOrder[+instruments[i]];
            }
            var ppexpression = featureName + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
            return ppexpression;   
        }


        self.restore_randomized_variable = function(expression,orbitOrder,instrOrder){
            
            if(!orbitOrder){
                orbitOrder = experiment.orbitOrder;
            }
            
            if(!instrOrder){
                instrOrder = experiment.instrOrder;
            }
            

            var output = '';

            var save = false;
            var savedString = '';

            for(var i=0;i<expression.length;i++){
                if(expression[i]=='{'){
                    save = true;
                    savedString = '{';
                }else if(expression[i]=='}'){
                    save = false;
                    savedString = savedString + '}';
                    feature_expression = savedString;
                    output = output + '{' + self.restore_randomized_variable_single(feature_expression, orbitOrder, instrOrder) + '}';
                }else{
                    if(save){
                        savedString = savedString + expression[i];
                    }else{
                        output = output + expression[i];
                    }
                }
            }
            return output;

        }

        
    }
    
    
    
    
    PubSub.subscribe(EXPERIMENT_START, (msg, data) => {
        self.update_task_direction();
    });       
    
    
}










