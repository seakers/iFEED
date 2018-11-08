// Experiment setup
        
class Experiment{

    constructor(ifeed){

        this.ifeed = ifeed;
        this.data_mining = null;
        this.filter = null;

        this.data = null;

        this.duration = + 10 * 60 * 1000; // 10 minutes
        this.timer = new Timer();

        // Flag indicating whether the current session timed out
        this.session_timed_out = null;

        // Set the order of the task (target region) and the treatment condition
        this.task_number = 0;
        this.condition_order = this.shuffleArray([0, 1, 2]); // DSE, sorted fetaures list, FSE
        this.problem_order = this.shuffleArray([0, 1, 2]); 

        // Randomize variable order
        this.orbitOrderStore = [
                                [3, 1, 0, 4, 2],  // Problem 0
                                [4, 2, 3, 0, 1],  // Problem 1
                                [1, 0, 2, 3, 4]   // Problem 2
                                                ];

        this.instrOrderStore = [
                                [6, 9, 1, 10, 4, 8, 5, 11, 2, 0, 3, 7],
                                [3, 1, 8, 7, 5, 6, 2, 0, 4, 9, 11, 10],
                                [7, 0, 11, 2, 5, 4, 3, 1, 8, 10, 9, 6]
                                                                        ];

        this.condition_number = this.condition_order[0];
        this.problem_number = this.problem_order[0];
        this.orbitOrder = [0, 1, 2, 3, 4];
        this.instrOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        // this.orbitOrder = this.orbitOrderStore[this.problem_number];
        // this.instrOrder = this.instrOrderStore[this.problem_number];
        this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);    
        this.norb = this.orbitOrder.length;
        this.ninstr = this.instrOrder.length;

        // Participant-specific info store
        this.account_id = "";
        for(let i = 0; i < 10; i++){
            this.account_id += "" + Math.floor(Math.random()*10)
        }

        this.counter_design_viewed = 0;
        this.counter_feature_viewed = 0;
        this.counter_new_design_evaluated = 0;
        this.counter_design_local_search = 0;
        this.counter_conjunctive_local_search = 0;
        this.counter_disjunctive_local_search = 0;
        this.counter_new_feature_tested = 0;
        this.best_features_found = [];
        
        this.store_design_viewed = [];
        this.store_feature_viewed = [];
        this.store_new_design_evaluated = [];
        this.store_design_local_search = [];
        this.store_conjunctive_local_search = [];
        this.store_disjunctive_local_search = [];
        this.store_new_feature_tested = [];
        this.store_best_features_found = [];

        PubSub.subscribe(EXPERIMENT_START, (msg, data) => {
            this.update_task_direction();
        });    
    }
    
    selectSubsetOfSamples(prob){
        this.data = this.ifeed.data;
        let subset = select_subset(this.data, prob);
        PubSub.publish(DATA_IMPORTED, subset);
    }

    next_task(){

        //store_task_specific_information();

        if (this.task_number === this.condition_order.length - 1){
            // finished all tasks

            clearInterval(that.timeinterval);
            that.session_timed_out = true;

            d3.select('body').selectAll('div').remove();
            session_timeout();
            var key_number = that.account_id;

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
                .text("Now follow the link to do a survey: https://cornell.qualtrics.com/jfe/form/SV_3xVqMtpF6vR8Qvj").style("width","1200px").style("margin","auto");
            d3.select('body').append('div').style("width","100%").style("height","30px"); 

            print_experiment_summary();
            return;

        } else {
            this.task_number += 1;
            this.condition_number = this.condition_order[this.task_number];
            this.problem_number = this.problem_order[this.task_number];
            this.orbitOrder = this.orbitOrderStore[this.problem_number];
            this.instrOrder = this.instrOrderStore[this.problem_number];
            this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);    
        } 

        this.update_task_direction();
    }

    previous_task(){
        
        this.task_number -= 1;

        if(this.task_number === 0){
            // pass

        }else{
            this.task_number += 1;
            this.condition_number = this.condition_order[this.task_number];
            this.problem_number = this.problem_order[this.task_number];
            this.orbitOrder = this.orbitOrderStore[this.problem_number];
            this.instrOrder = this.instrOrderStore[this.problem_number];
            this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);   
        }
        that.update_task_direction();
    }

    update_task_direction(){

        // Reset features
        this.data_mining.initialize();

        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);










        let options = ["optionA", "optionB", "optionC"];

        d3.select("#prompt_header").text("Answer the following question:");
        
        let form = d3.select("#prompt_content")
                        .append("form")
                        .attr("id", "answer_form")
                        .attr("action","javascript:void(0);");


// <div class="slidecontainer">
//   <input type="range" min="1" max="100" value="50" class="slider" id="myRange">
// </div>

        let answers = form.append("div")
                            .attr("id", "answer_div");  

        d3.select("#answer_div")
            .append("div")
            .append("div")
            .text((d)=>{
                //d3.select(".experiment.answer.slider")
                return "50";
            });
            

        d3.select("#answer_div > div").append("input")
            .attr("class", "experiment answer slider")
            .attr("type","range")
            .attr("min","1")
            .attr("max","100")
            .attr("value","50")
            .style("width", "380px")
            .on("change",()=>{
                let val = d3.select(".experiment.answer.slider").node().value;
                d3.select("#answer_div > div > div").text(val);
            });

        d3.select("#answer_div")
            .selectAll("#answer_div > div")
            .data(options)
            .enter()
            .append("div")
            .text((d) => {
                return d;
            })
            .on("click", (d) => {

                let selected = d;

                d3.selectAll(".experiment.answer.options").nodes()
                    .forEach((d)=>{
                        if(d.value === selected){
                            d.checked = true;
                        }else{
                            d.checked = false;
                        }
                    })
            })
            .append("input")
            .attr("class", "experiment answer options")
            .attr("type","radio")
            .attr("value", function(d){
                return d;
            })
            .attr("text", function(d){
                return d;
            });

        form.append("input")
            .attr("type", "submit")
            .attr("value", "Submit")
            .on("click", () => {
                console.log("Answer submitted!");
            });







        //Change the prompt message and the target selection
        // if(this.condition_number === 0){

        //     if(this.task_number==0){
        //         d3.select("#prompt_header").text("Task "+(this.task_order.indexOf(this.task_number)+1)+": Target Region (a)");
        //     }else{
        //         d3.select("#prompt_header").text("Task "+(this.task_order.indexOf(this.task_number)+1)+": Target Region (b)");
        //     }

        //     d3.select('#prompt_body_text_1').html('<p> - You can hover your mouse over each design to see the relevant information.</p>'
        //                                 +'<p> - You can modify the existing design and check its performance and cost.</p>'
        //                                 +'<p> - You can run a local search that randomly tries several designs with the similar configurations.</p>'
        //                                 +'<p>** You are encouraged to take notes (either physically on a piece of paper or electronically using a notepad)</p>');

        //     d3.select('body').style('background-color','#FFFFFF');
        //     d3.select('#experiment_prompt_div').style('background-color','#FFC1D4');   
            
        // }
        // else if(this.condition_number === 1){
        //     if(that.task_number==0){
        //         d3.select("#prompt_header").text("Task "+(that.task_order.indexOf(that.task_number)+1)+": Target Region (a)");
        //         that.select_archs_using_ids(lower_cost_lower_perf);
        //     }else{
        //         d3.select("#prompt_header").text("Task "+(that.task_order.indexOf(that.task_number)+1)+": Target Region (b)");
        //         that.select_archs_using_ids(higher_cost_higher_perf);
        //     }
        //     d3.select('#prompt_body_text_1').html('<p> - You can hover your mouse over each design to see the relevant information.</p>'
        //                                 +'<p> - You can view the feature analysis tab with data mining results displayed on it.</p>'
        //                                 +'<p> - You can try making features more general or specific by modifying each feature. </p>'
        //                                 +'<p>** You are encouraged to take notes (either physically on a piece of paper or electronically using a notepad)</p>');


        //     d3.select('body').style('background-color','#FFFFFF');
        //     d3.select('#experiment_prompt_div').style('background-color','#ABFFB3');
        // }

                        
        




        // Experiment conditions
        if(this.condition_number === 0){ // DSE
            d3.select("#tab3").text('-');
            d3.select("#tab1").text('Inspect Design');  

            this.tradespace_plot.initialize();
            
        }else if(this.condition_number === 1){ // Bar plot
            d3.select("#tab1").text('-');
            d3.select("#view1").selectAll('g').remove();

            d3.select("#tab3").text('Feature Analysis');            
            this.data_mining.update = this.data_mining.update_bar;
                        
        }else if(this.condition_number === 2){ // FSE
            d3.select("#tab1").text('-');
            d3.select("#view1").selectAll('g').remove();

            d3.select("#tab3").text('Feature Analysis');            
            this.data_mining.update = this.data_mining.update_scatter;
        }

        // Load target selection and corresponding features
        this.data_mining.import_feature_data_and_compute_metrics("EpsilonMOEA_2018-10-25-10-53_1", this.filter);

        if(this.condition_number === 0){
            d3.select("#view3").selectAll('g').remove();
            document.getElementById('tab1').click();  
        }

        // Start timer
        this.timer.start();
    }
    

    










    print_experiment_summary(){

        // task_order, condition_order, account_id
        // orbitOrder, instrOrder

        var path = "";
        var filename = path + that.account_id + '.csv';

        var printout = [];

        var header = ['account_id','condition','task','design_viewed','feature_viewed','new_design_evaluated','design_local_search','conjunctive_local_search','disjunctive_local_search','new_feature_tested','best_features_found'];

        header = header.join(',');
        
        printout.push(header);

        for(var i=0;i<2;i++){

            var row = [];
            
            var condition = that.condition_order[i];
            var task = that.task_order[i];

            row=row.concat([that.account_id,condition,task]);
            row=row.concat([that.store_design_viewed[i],
                           that.store_feature_viewed[i],
                           that.store_new_design_evaluated[i],
                            that.store_design_local_search[i],
                            that.store_conjunctive_local_search[i],
                            that.store_disjunctive_local_search[i],
                            that.store_new_feature_tested[i],
                            that.store_best_features_found[i]
                           ]);

            row=row.join(",");
            printout.push(row);
        }

        printout = printout.join('\n');
        saveTextAsFile(filename, printout);
    }

    saveTextAsFile(filename, inputText){

        let textToWrite = inputText;
        let fileNameToSaveAs = filename;
        let textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
        let downloadLink = document.createElement("a");

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


    session_timeout(){
        return;
    }

    store_task_specific_information(){
        this.store_design_viewed.push(this.counter_design_viewed);
        this.store_feature_viewed.push(this.counter_feature_viewed);
        this.store_new_design_evaluated.push(this.counter_new_design_evaluated);
        this.store_design_local_search.push(this.counter_design_local_search);
        this.store_conjunctive_local_search.push(this.counter_conjunctive_local_search);
        this.store_disjunctive_local_search.push(this.counter_disjunctive_local_search);
        this.store_new_feature_tested.push(this.counter_new_feature_tested);
        this.store_best_features_found.push(JSON.stringify(this.best_features_found));        
        
        this.counter_design_viewed = 0;
        this.counter_feature_viewed = 0;
        this.counter_new_design_evaluated = 0;
        this.counter_design_local_search = 0;
        this.counter_conjunctive_local_search = 0;
        this.counter_disjunctive_local_search = 0;
        this.counter_new_feature_tested = 0;
        this.best_features_found = [];             
    }













    // d3.select("#move_backward_button").on("click",function(d){
    //     that.previous_task();
    // });
    // d3.select("#move_forward_button").on("click",function(d){
    //     that.next_task();
    // });
    
    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }



   















    get_selected_arch_ids(){
        var target_string = "";
        d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
            target_string = target_string + "," + d.__data__.id;
        });
        return target_string.substring(1,target_string.length);
    }

    get_selected_arch_ids_list(){
        var target = [];
        d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
            target.push(d.__data__.id);
        });
        return target;
    }

    select_archs_using_ids(target_ids_string){

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
    
    turn_highlighted_to_selected(){

        d3.selectAll('.dot.main_plot.selected')
            .classed('selected',false)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.default); 

        d3.selectAll('.dot.main_plot.highlighted')
            .classed('selected',true)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.selected);  
    }

    turn_selected_to_highlighted(){

        d3.selectAll('.dot.main_plot.highlighted')
            .classed('selected',false)
            .classed('highlighted',false)
            .style("fill", ifeed.main_plot.color.default); 

        d3.selectAll('.dot.main_plot.selected')
            .classed('selected',false)
            .classed('highlighted',true)
            .style("fill", ifeed.main_plot.color.highlighted);  
    }
}





class Timer{

    constructor(){
        // Duration needs to be set up to use this class as a timer. Otherwise, it will act as a stopwatch
        this.duration = null;
        this.timeinterval = null;
        this.startTime = null;
        this.endTime = null;
        this.timeElapsed = null;
        this.timerCallback = null;
    }

    setDuration(duration){
        this.duration = duration;
    }

    start(){
        clearInterval(this.timeinterval);
        this.startTime = Date.parse(new Date());
        this.endTime = null;
        this.timeElapsed = null;

        if(this.duration){
            let deadline = new Date(startTime + this.duration);
            this.startTimer(deadline);
        }else{
            this.startStopWatch();
        }
    }

    stop(){
        this.endTime = Date.parse(new Date());
        this.timeElapsed = this.endTime - this.startTime;
        clearInterval(this.timeinterval);
    }  

    getTimeRemaining(deadline){
      let t = Date.parse(deadline) - Date.parse(new Date());
      let seconds = Math.floor( (t/1000) % 60 );
      let minutes = Math.floor( t/1000/60 );
      return {
        'total': t,
        'minutes': minutes,
        'seconds': seconds
      };
    }

    getTimeElapsed(){
        let out;
        if(this.timeElapsed){
            out = this.timeElapsed / 1000;
        }else{
            out = (Date.parse(new Date()) - this.startTime) / 1000;
        }
        return out;
    }

    getTimeElapsedInMinutesAndSeconds(){
        let t = this.getTimeElapsed();
        let seconds = Math.floor( t % 60 );
        let minutes = Math.floor( (t/60) );
        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    startStopWatch(){
        let that = this;
        function updateClock(){
            let t = that.getTimeElapsedInMinutesAndSeconds();
            let minutes = t.minutes;
            let seconds = t.seconds;

            // Display the result in the element with id="timer"
            document.getElementById("timer").innerHTML = "Elapsed time: " + minutes + "m " + seconds + "s ";
        }
        updateClock(); // run function once at first to avoid delay
        this.timeinterval = setInterval(updateClock, 1000);
    }

    startTimer(endtime){
        let that = this;
        function updateClock(){
            let t = that.getTimeRemaining(endtime);
            let minutes = t.minutes;
            let seconds = t.seconds;

            // Display the result in the element with id="timer"
            document.getElementById("timer").innerHTML = minutes + "m " + seconds + "s ";

            if(t.total <= 0){
                this.timerCallback();
            }
        }
        updateClock(); // run function once at first to avoid delay
        this.timeinterval = setInterval(updateClock, 1000);
    }
}

class RandomizedVariable{

    constructor(orbitOrder, instrOrder){
        this.orbitOrder = orbitOrder;
        this.instrOrder = instrOrder;
        this.norb = this.orbitOrder.length;
        this.ninstr = this.instrOrder.length;
    }

    getOrbitLabel(o){
        return this.orbitOrder.indexOf(o);
    }

    getInstrLabel(i){
        return this.instrOrder.indexOf(i);
    }

    restoreOrbitLabel(o){
        return this.orbitOrder[o];
    }

    restoreInstrLabel(i){
        return this.instrOrder[i];
    }

    encodeBitString(bitString){
        let new_bitString = "";
        for(let i = 0; i < this.norb; i++){
            for(let j = 0; j < this.ninstr; j++){
                new_bitString = new_bitString + bitString[this.orbitOrder[i] * this.ninstr + this.instrOrder[j]];
            }
        }
        return new_bitString;
    }

    encodeBitStringBool(bitString){
        let new_bitString = [];
        for(let i = 0; i < this.norb; i++){
            for(let j = 0; j < this.ninstr; j++){
                new_bitString.push(bitString[this.orbitOrder[i] * this.ninstr + this.instrOrder[j]]);
            }
        }
        return new_bitString;
    }   

    decodeBitString(bitString){
        let original_bitString = "";
        for(let i = 0; i < this.norb; i++){
            let orbIndex = this.orbitOrder.indexOf(i);
            for(let j = 0; j < this.ninstr; j++){
                let instIndex = this.instrOrder.indexOf(j);
                original_bitString = original_bitString + bitString[orbIndex * this.ninstr + instIndex];
            }
        }
        return original_bitString;
    }    
    
    relabel_randomized_variable_single(expression){

        let exp = expression;
        if(exp[0]==="{"){
            exp = exp.substring(1,exp.length-1);
        }
        let featureName = exp.split("[")[0];

        if(featureName[0]=='~'){
            featureName = 'NOT '+ featureName.substring(1);
        }

        let featureArg = exp.split("[")[1];
        featureArg = featureArg.substring(0,featureArg.length-1);

        let orbits = featureArg.split(";")[0].split(",");
        let instruments = featureArg.split(";")[1].split(",");
        let numbers = featureArg.split(";")[2];

        let pporbits = "";
        let ppinstruments = "";
        
        for(let i = 0; i < orbits.length; i++){
            if(orbits[i].length === 0){
                continue;
            }
            if(i > 0){pporbits = pporbits + ",";}
            pporbits = pporbits + this.getOrbitLabel(+orbits[i]);
        }
        
        for(let i = 0; i < instruments.length; i++){
            if(instruments[i].length === 0){
                continue;
            }
            if(i > 0){ppinstruments = ppinstruments + ",";}
            ppinstruments = ppinstruments + this.getInstrLabel(+instruments[i]);
        }
        let ppexpression = featureName + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
        return ppexpression;
    }

    relabel_randomized_variable(expression){
        
        let output = '';

        let save = false;
        let savedString = '';

        for(let i = 0; i < expression.length; i++){
            if(expression[i]=='{'){
                save = true;
                savedString = '{';
            }else if(expression[i]=='}'){
                save = false;
                savedString = savedString + '}';
                feature_expression = savedString;
                output = output + '{' + that.relabel_randomized_variable_single(feature_expression) + '}';
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
    
    restore_randomized_variable_single(expression){
        
        let exp = expression;
        if(exp[0]==="{"){
            exp = exp.substring(1,exp.length-1);
        }
        let featureName = exp.split("[")[0];

        if(featureName==="paretoFront" || featureName==='PLACEHOLDER'){return exp;}

        if(featureName[0]=='~'){
            featureName = 'NOT '+ featureName.substring(1);
        }

        let featureArg = exp.split("[")[1];
        featureArg = featureArg.substring(0,featureArg.length-1);

        let orbits = featureArg.split(";")[0].split(",");
        let instruments = featureArg.split(";")[1].split(",");
        let numbers = featureArg.split(";")[2];

        let pporbits="";
        let ppinstruments="";
        for(let i = 0; i < orbits.length; i++){
            if(orbits[i].length===0){
                continue;
            }
            if(i>0){pporbits = pporbits + ",";}
            pporbits = pporbits + this.restoreOrbitLabel(+orbits[i]);
        }
        for(let i = 0; i < instruments.length; i++){
            if(instruments[i].length===0){
                continue;
            }
            if(i>0){ppinstruments = ppinstruments + ",";}
            ppinstruments = ppinstruments + this.restoreInstrLabel(+instruments[i]);
        }
        let ppexpression = featureName + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
        return ppexpression;   
    }

    restore_randomized_variable(expression,orbitOrder,instrOrder){

        let output = '';

        let save = false;
        let savedString = '';

        for(let i = 0; i < expression.length; i++){
            if(expression[i]=='{'){
                save = true;
                savedString = '{';
            }else if(expression[i]=='}'){
                save = false;
                savedString = savedString + '}';
                feature_expression = savedString;
                output = output + '{' + that.restore_randomized_variable_single(feature_expression, orbitOrder, instrOrder) + '}';
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



























function select_subset(inputList, prob){

    let out = [];
    for(let i = 0; i < inputList.length; i++){
        if(Math.random() < prob){
            out.push(inputList[i]);
        }else{
            // pass
            continue;
        }
    }
    return out;
}

var encodeArch = function(inputString){
    
    let inputSplit = inputString.split(";");
    
    let bitString = [];
    for(let i = 0; i < 60; i++){
        bitString.push(false);
    }
    
    for(let i = 0; i < 5; i++){
        var thisOrbitRelabeled = experiment.orbitOrder.indexOf(i);
        var instruments = inputSplit[i];
        for(let j = 0; j < instruments.length; j++){
            var thisInstr = experiment.instrList.indexOf(instruments[j]);
            var thisInstrRelabeled = experiment.instrOrder.indexOf(thisInstr);
            bitString[thisOrbitRelabeled*12+thisInstrRelabeled]=true;
        }
    }
    
    var out = "";
    for(let i = 0; i < 5; i++){
        for(let j = 0; j < 12; j++){
            if(bitString[i*12+j]){
                out = out + experiment.instrList[j];
            }
        }
        out=out+";";
    }
    return out;
}

var decodeArch = function(inputString){
    
    var inputSplit = inputString.split(";");
    
    var bitString = [];
    for(var i=0;i<60;i++){
        bitString.push(false);
    }
    
    for(var i=0;i<5;i++){
        var thisOrbitRelabeled = experiment.orbitOrder[i];
        var instruments = inputSplit[i];
        for(var j=0;j<instruments.length;j++){
            var thisInstrRelabeled = experiment.instrOrder[instruments[j]];
            bitString[thisOrbitRelabeled*12+thisInstrRelabeled]=true;
        }
    }
                //ppinstruments = ppinstruments + instrOrder[+instruments[i]];

    var out = "";
    for(var i=0;i<5;i++){
        for(var j=0;j<12;j++){
            if(bitString[i*12+j]){
                out = out + experiment.instrList[j];
            }
        }
        out=out+";";
    }
    return out;
}
