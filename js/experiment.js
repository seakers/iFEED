// Experiment setup
        
class Experiment{

    constructor(problem, tradespace_plot, filter, data_mining, feature_application, label){
        this.problem = problem;
        this.tradespace_plot = tradespace_plot;
        this.filter = filter;
        this.data_mining = data_mining;
        this.feature_application = feature_application;
        this.label = label;

        // Imported data store
        this.data = null;

        // Set the timer
        this.clock = new Clock();

        // Placeholder for callback function
        this.submit_callback = function(){
            alert("No action set up!");
        };

        // Placeholder for display architecture info
        this.display_arch_info = null;

        // Participant-specific info store
        this.participantID = "";
        for(let i = 0; i < 20; i++){
            this.participantID += "" + Math.floor(Math.random() * 10);
        }
        let date = new Date();
        let month = date.getMonth() + 1;
        this.participantID += "-" + month + "_" + date.getDate() + "_" + date.getHours() + "_" + date.getMinutes();

        // Set treatment condition
        var min = 0; 
        var max = 3;  
        var randomInt = Math.floor(Math.random() * (+max - +min)) + +min; 
        this.treatmentCondition = randomInt;

        this.initialize();

        PubSub.subscribe(EXPERIMENT_START, (msg, data) => {
            this.load_treatment_condition();
        });    
    }
    
    set_treatment_conditions(condition){
        this.treatmentCondition = condition;
    }

    initialize(){
        this.counter_design_viewed = 0;
        this.counter_feature_viewed = 0;
        this.counter_new_design_evaluated = 0;
        this.counter_design_local_search = 0;
        this.counter_conjunctive_local_search = 0;
        this.counter_disjunctive_local_search = 0;
        this.counter_new_feature_tested = 0;
        this.best_features_found = [];
    }

    load_treatment_condition(){

        // Reset features
        this.data_mining.initialize();
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

        // Set alert message given at the beginning of each task
        // Set stopwatch callback functions
        var d1 = 10 * 60 * 1000;
        var a1 = function(){
            alert("10 minutes seconds passed! Try not to overthink. If you are not sure about the answer, select whichever feels more right, and specify the level of confidence you feel on your answer.");
            d3.select("#timer")     
                .style("font-size","30px")
                .style("color","red"); 
        };
        var d2 = 20 * 60 * 1000;
        var a2 = function(){
            alert("20 minutes passed! Please submit the answer and move on to the next question.");
        };
        var alertMsg = "\n\nThis time, We will let you know when you spend more than 3 minutes on each question.";
        
        // Set callback functions
        let callback = [a1, a2];
        let duration = [d1, d2];
        this.clock.setCallback(callback);
        this.clock.setDuration(duration);

        // Select the target region
        this.select_archs_using_ids(fuzzy_pareto_front_4);

        var treatmentConditionName = "";
        if(this.treatmentCondition === 0){
            treatmentConditionName = "manual-generalization";

        }else if(this.treatmentCondition === 1){
            treatmentConditionName = "automated-generalization";
            // Disable filter
            d3.select("#tab2").text('-');
            d3.select("#view2").selectAll('g').remove();

        }else if(this.treatmentCondition === 2){
            treatmentConditionName = "interactive-generalization";

        } 
        PubSub.publish(EXPERIMENT_SET_MODE, treatmentConditionName);  

        document.getElementById('tab1').click();          
    }

    load_design_synthesis_task(){
        d3.select("#tab2").text('-');
        d3.select("#view2").selectAll('g').remove();
        d3.select("#tab3").text('-');
        d3.select("#view3").selectAll('g').remove();
        PubSub.publish(EXPERIMENT_SET_MODE, "design-synthesis");
    }


    // load_design_synthesis_task(){

    //     //store_task_specific_information();


    //     // finished all tasks
    //     this.clock.stop();

    //     // Save all answer data
    //     this.save_answer();

    //     d3.select('body').selectAll('div').remove();
    //     let key_number = this.participantID;

    //     d3.select('body')
    //         .append('div')
    //         .style('width','100%')
    //         .style('margin-top','120px');

    //     d3.select("body")
    //         .append("div")
    //         .style("margin","auto")
    //         .style("width","100%")
    //         .append("img")
    //         .attr("src", ()=>{
    //             return "img/cornell_logo.png";
    //         }); 

    //     d3.select('body').select('img')
    //             .style("width","200px")
    //             .style('margin','40px')
    //             .style('margin-left','70px');

    //     d3.select('body')
    //         .append('div')
    //         .style('margin','auto')
    //         .style('width','100%')
    //         .append('h1')
    //         .text('Session End').style("width","1200px").style("margin","auto");

    //     d3.select('body').append('h2')
    //         .text("IMPORTANT: Please copy the key number below and paste it into the survey page (link provided below).").style("width","1200px").style("margin","auto");
    //     d3.select('body').append('h2')
    //         .text("Key number: "+ key_number).style("width","1200px").style("margin","auto");
    //     d3.select('body').append('h2')
    //         .text("Now follow the link to do a survey: https://cornell.qualtrics.com/jfe/form/SV_6RR4hCbV57k7uhT").style("width","1200px").style("margin","auto");
    //     d3.select('body').append('div').style("width","100%").style("height","30px"); 

    //     //print_experiment_summary();
    //     return;
    // }








    
    record_answer(problem_type, problem_number){

        // problem types: pretest, pretest_text, design, feature

        // Record:
        // 1. problemSet number (orbit, instrument order)
        // 2. task_number (task order)
        // 3. condition_number (DSE or FSE)
        // 4. problem_number
        // 5. answer
        // 6. confidence
        // 7. time

        let answer = 0;
        let confidence = null;

        if(problem_type === "pretest_text"){
            answer = d3.select(".experiment.answer.container").node().value;
            problem_type = "pretest";

        }else{
            d3.selectAll(".experiment.answer.options").nodes()
                .forEach( (d) => {
                    if(d.checked){
                        answer = + d.value;
                    }
                })

            confidence = + d3.select(".experiment.answer.slider").node().value;
        }

        this.clock.stop();
        let time = this.clock.timeElapsed / 1000;

        let json = {
            "variable_ordering": this.problemSet_number,
            "task_number": this.task_number,
            "condition_number": this.condition_number,
            "problem_type": problem_type,
            "problem_number": problem_number,
            "answer": answer,
            "confidence": confidence,
            "time": time
        }
        this.answerData.push(json);

        console.log(json);
    }

    save_answer(){
        let path = "";
        let filename = path + this.account_id + '_answer.json';
        let inputText = JSON.stringify(this.answerData);
        this.saveTextAsFile(filename, inputText)
    }











    start_problem_sequence(){

        let that = this;

        // Remove existing submit button
        d3.select(".experiment.answer.submit").remove();

        let problem_sequence_design = [];
        let problem_sequence_feature = [];

        for(let i = 0; i < this.num_problem_design; i++){
            let index = this.task_number * this.num_problem_design + i;
            problem_sequence_design.push(this.problem_order_design[index]);
        }

        for(let i = 0; i < this.num_problem_feature; i++){
            let index = this.task_number * this.num_problem_feature + i;
            problem_sequence_feature.push(this.problem_order_feature[index]);
        }

        let problemSet = this.problemSet_number;

        // Display the first problem in the sequence
        this.current_problem_type = "design"; // pretest, pretest_text, design, feature
        this.current_problem_number = problem_sequence_design.splice(0,1)[0];
        this.display_problem(problemSet, this.current_problem_type, this.current_problem_number);

        this.submit_callback = function(){

            let question_answered = false;
            d3.selectAll(".experiment.answer.options").nodes()
                .forEach( (d) => {
                    if(d.checked){
                        question_answered = true;
                    }
                });

            if(question_answered){
                // Add delay in loading the next question
                setTimeout(function (){

                    that.record_answer(that.current_problem_type, that.current_problem_number);

                    if(problem_sequence_design.length === 0 && problem_sequence_feature.length !== 0){
                        // Display the next problem in the sequence
                        that.current_problem_count += 1;
                        that.current_problem_type = "feature"; // pretest, pretest_text, design, feature
                        that.current_problem_number = problem_sequence_feature.splice(0,1)[0];
                        that.display_problem(problemSet, that.current_problem_type, that.current_problem_number);

                    } else if(problem_sequence_design.length === 0 && problem_sequence_feature.length === 0){
                        // Start new condition
                        that.next_task();

                    }else{
                        // Display the next problem in the sequence
                        that.current_problem_count += 1;
                        if(that.current_problem_type == "design"){
                            that.current_problem_number = problem_sequence_design.splice(0,1)[0];
                        }else{
                            that.current_problem_number = problem_sequence_feature.splice(0,1)[0];
                        }
                        that.display_problem(problemSet, that.current_problem_type, that.current_problem_number);

                    }   
                }, 1300); // How long do you want the delay to be (in milliseconds)? 

            }else{
                alert("Please answer the question before submitting the answer!");
            }
        }

        d3.select("#prompt_r2")
            .insert("button", ":first-child")
            .attr("class", "experiment answer submit")
            .text("Submit")
            .on("click", this.submit_callback);
    }

    display_problem(problemSet, problem_type, problem_number){

        this.clock.start();
        d3.select("#timer")
            .style("color","black")
            .style("font-size","24px");

        let options = [0, 1];

        let questionText = "";
        if(problem_type == "design"){
            questionText = "Do you think the given design will be located in the target region?";
        } else {
            questionText = "Is the given feature a driving feature (a feature satisfying coverage > 0.6 and specificity > 0.6)?";
        }

        // Remove all existing forms
        d3.selectAll(".prompt_content").selectAll('div').remove();
        d3.selectAll(".prompt_content").selectAll("input").remove();
        d3.selectAll(".prompt_content").selectAll("textarea").remove();
        d3.select("#prompt_c2").selectAll("div").remove();

        d3.select(".prompt_header.question").text(questionText);
        d3.select(".prompt_header.confidence").html("<p>How confident do you feel about your answer?<br>(0: Not confident, 100: Fully confident)</p>");

        let containers = d3.select(".prompt_content.question")
            .append("div")
            .selectAll("label")
            .data(options)
            .enter()
            .append("label")
            .attr("class","experiment answer container")
            .text((d) => {
                if(d === 1){
                    return "Yes";
                }else{
                    return "No";
                }
            })
            .on("click", (d) => {
                let selected = d;
                d3.selectAll(".experiment.answer.options").nodes()
                    .forEach((d)=>{
                        if(d.value === selected + ""){
                            d.checked = true;
                        }else{
                            d.checked = false;
                        }
                    })
            })

        containers.append("input")
            .attr("class", "experiment answer options")
            .attr("type","radio")
            .attr("value", function(d){
                return d;
            });

        containers.append("span")
            .attr("class", "experiment answer checkmark")

        let slider_width = 400;

        d3.select(".prompt_content.confidence")
            .append("div")
            .style("margin-left", () => {
                let temp = slider_width/2;
                return temp + "px";
            })
            .text((d) => {
                return "50";
            })
            .style("font-size","22px");
            
        d3.select(".prompt_content.confidence")
            .append("input")
            .attr("class", "experiment answer slider")
            .attr("type","range")
            .attr("min","1")
            .attr("max","100")
            .attr("value","50")
            .style("width", slider_width + "px")
            .on("change",() => {
                let val = d3.select(".experiment.answer.slider").node().value;
                d3.select(".prompt_content.confidence > div").text(val);
            });

        d3.select("#prompt_c2")
            .append("div")
            .style("margin","auto")
            .style("width","85%")
            .append("img")
            .attr("src", () => {
                return "img/experiment/" + problem_type + "_" + problemSet + "_" + problem_number + ".png";
            })                
            .style("width","100%"); 

        d3.select("#prompt_problem_number").text("" + (this.current_problem_count + 1) + " / " + 36);
    }

    start_pretest_sequence(){
        
        let that = this;

        // Remove previously-existing submit button
        d3.select(".experiment.answer.submit").remove();

        this.current_problem_count = 0;

        // Display the first problem in the sequence
        this.display_pretest_problem(this.current_problem_count);

        this.submit_callback = function(){

            let text_answer = false;
            let question_answered = false;

            d3.selectAll(".experiment.answer.options").nodes()
                .forEach( (d) => {
                    if(d.checked){
                        question_answered = true;
                    }
                })

            if(that.current_problem_count > 9){
                question_answered = true;
                text_answer = true;
            }

            if(question_answered){
                // Add delay in loading the next question
                setTimeout(function (){

                    if(text_answer){
                        that.record_answer("pretest_text", that.current_problem_count);
                    }else{
                        that.record_answer("pretest", that.current_problem_count);
                    }
                    
                    // Display the next problem
                    that.current_problem_count += 1;

                    if(that.current_problem_count === 12){
                        that.next_task();

                    }else{
                        that.display_pretest_problem(that.current_problem_count);
                    }
                
                }, 1300); // How long do you want the delay to be (in milliseconds)? 
            }else{
                alert("Please answer the question before submitting the answer!");
            }
        }

        d3.select("#prompt_r2")
            .insert("button", ":first-child")
            .attr("class", "experiment answer submit")
            .text("Submit")
            .on("click", this.submit_callback);
    }






    display_pretest_problem(problem_number){

        this.clock.start();
        d3.select("#timer")
            .style("color","black")
            .style("font-size","24px");

        let options = [0, 1];
        let options_text = null;
        let questionText = "";

        let type1 = [0, 1, 3, 4, 6, 8]; // Questions asking whether a design satisfies the given feature
        let type2 = [2, 7]; // Questions asking participants to select the feature that has good higher coverage/specificity
        let type3 = [5, 9]; // Question asking whether the feature has large coverage/specificity
        let type4 = [10, 11];

        if(problem_number === 2){
            // Questions asking participants to select the feature that has good higher coverage/specificity
            questionText = "Which of the two features (marked in the figure) explains more of the target designs?";
            options_text = ["1", "2"];
        
        }else if(problem_number === 7){
            // Questions asking participants to select the feature that has good higher coverage/specificity
            questionText = "Which of the two features (marked in the figure) does a better job in highlighting the differences between the target designs and other designs?";
            options_text = ["1", "2"];
        
        }else if(problem_number === 5 || problem_number === 9){
            // Question asking whether the feature has large coverage/specificity
            questionText = "The scatter plot highlights designs satisfying a certain feature. Does this feature have high coverage or high specificity?";
            options_text = ["coverage", "specificity"];

        }else{
            // Questions asking whether a design satisfies the given feature
            questionText = "Does the design satisfy the given feature (shown on the bottom)?";
            options_text = ["No", "Yes"];
        }

        // Remove all existing forms
        d3.selectAll(".prompt_content").selectAll('div').remove();
        d3.selectAll(".prompt_content").selectAll("input").remove();
        d3.selectAll(".prompt_content").selectAll("textarea").remove();
        d3.select("#prompt_c2").selectAll("div").remove();

        if(type4.indexOf(problem_number) != -1){

            if(problem_number === 10){
                questionText = "Describe in one or two sentences what it means for a feature to have a large coverage. ";
            }else{
                questionText = "Describe in one or two sentences what it means for a feature to have a large specificity. ";
            }
            d3.select(".prompt_header.question").text(questionText);
            d3.select(".prompt_header.confidence").html("");

            d3.select("#prompt_c1")
                .select(".prompt_content.question")
                .append("textarea")
                .attr("class", "experiment answer container")
                .attr("value", "Type your answer here.")
                .style("width","560px")
                .style("height","200px")
                .style("cols","200")
                .style("rows","20");

            let d1 = 1 * 90 * 1000;
            let a1 = function(){
                alert("90 seconds passed! Please wrap up writing the answer and move on to the next question.");
                d3.select("#timer")     
                    .style("font-size","30px")
                    .style("color","red"); 
            };
            let callback = [a1];
            let duration = [d1];
            this.clock.setCallback(callback);
            this.clock.setDuration(duration);

        }else{

            d3.select(".prompt_header.question").text(questionText);
            d3.select(".prompt_header.confidence").html("<p>How confident do you feel about your answer?<br>(0: Not confident, 100: Fully confident)</p>");

            let containers = d3.select(".prompt_content.question")
                .append("div")
                .selectAll("label")
                .data(options)
                .enter()
                .append("label")
                .attr("class","experiment answer container")
                .text((d) => {
                    return options_text[d];
                })
                .on("click", (d) => {
                    let selected = d;
                    d3.selectAll(".experiment.answer.options").nodes()
                        .forEach((d)=>{
                            if(d.value === selected + ""){
                                d.checked = true;
                            }else{
                                d.checked = false;
                            }
                        })
                })

            containers.append("input")
                .attr("class", "experiment answer options")
                .attr("type","radio")
                .attr("value", function(d){
                    return d;
                });

            containers.append("span")
                .attr("class", "experiment answer checkmark")

            let slider_width = 400;

            d3.select(".prompt_content.confidence")
                .append("div")
                .style("margin-left", ()=>{
                    let temp = slider_width/2;
                    return temp + "px";
                })
                .text((d) => {
                    return "50";
                })
                .style("font-size","22px");
                
            d3.select(".prompt_content.confidence")
                .append("input")
                .attr("class", "experiment answer slider")
                .attr("type","range")
                .attr("min","1")
                .attr("max","100")
                .attr("value","50")
                .style("width", slider_width + "px")
                .on("change",() => {
                    let val = d3.select(".experiment.answer.slider").node().value;
                    d3.select(".prompt_content.confidence > div").text(val);
                });

            if(type1.indexOf(problem_number) != -1){

                d3.select("#prompt_c2")
                    .append("div")
                    .style("margin","auto")
                    .style("width","85%")
                    .append("img")
                    .attr("src", ()=>{
                        return "img/pre_experiment_test/" + problem_number + "_" + 0 + ".png";
                    });

                d3.select("#prompt_c2")
                    .append("div")
                    .style("margin","auto")
                    .style("width","85%")
                    .append("img")
                    .attr("src", ()=>{
                        return "img/pre_experiment_test/" + problem_number + "_" + 1 + ".png";
                    })
                    .on("load", () => {
                        d3.select("#prompt_c2")
                            .selectAll("img")
                            .nodes()
                            .forEach((d) => {
                                if(d.width > 770){
                                    d3.select(d).style("width","770px");
                                }
                            });
                    }); 

            } else {
                d3.select("#prompt_c2")
                    .append("div")
                    .style("margin","auto")
                    .style("width","85%")
                    .append("img")
                    .attr("src", ()=>{
                        return "img/pre_experiment_test/" + problem_number + ".png";
                    })
                    .style("width","770px");
            }
        }

        d3.select("#prompt_problem_number").text("" + (this.current_problem_count + 1) + " / "+ 36);
    }
















    make_target_selection(id_list){
        this.data_mining.make_target_selection(id_list);
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



   















    get_selected_arch_ids_string(){
        var list = this.get_selected_arch_ids_list();
        var out = "" + list[0];
        for(let i = 1; i < list.length; i++){
            out = out + "," + list[i];
        }
        return out;
    }

    get_selected_arch_ids_list(){
        var selected = [];
        this.tradespace_plot.data.forEach((d) => {
            if(d.selected){
                selected.push(d.id);
            }
        })
        return selected;
    }

    select_archs_using_ids(target_ids_string){
        let target_ids_split = target_ids_string.split(',');
        let target_ids =[];
        for(let i = 0; i < target_ids_split.length; i++){
            let id = + target_ids_split[i];
            target_ids.push(id);
        }

        var selected_data = [];
        this.tradespace_plot.data.forEach((d) => {
            if(target_ids.indexOf(d.id) !== -1){
                d.selected = true;
                selected_data.push(d);
            }
        })
        this.tradespace_plot.update(true);
        PubSub.publish(SELECTION_UPDATED, selected_data);  
    }
    
    // turn_highlighted_to_selected(){

    //     d3.selectAll('.dot.main_plot.selected')
    //         .classed('selected',false)
    //         .classed('highlighted',false)
    //         .style("fill", ifeed.main_plot.color.default); 

    //     d3.selectAll('.dot.main_plot.highlighted')
    //         .classed('selected',true)
    //         .classed('highlighted',false)
    //         .style("fill", ifeed.main_plot.color.selected);  
    // }

    // turn_selected_to_highlighted(){

    //     d3.selectAll('.dot.main_plot.highlighted')
    //         .classed('selected',false)
    //         .classed('highlighted',false)
    //         .style("fill", ifeed.main_plot.color.default); 

    //     d3.selectAll('.dot.main_plot.selected')
    //         .classed('selected',false)
    //         .classed('highlighted',true)
    //         .style("fill", ifeed.main_plot.color.highlighted);  
    // }
}


class Clock{

    constructor(){        
        this.timeinterval = null;
        this.startTime = null;
        this.endTime = null;
        this.timeElapsed = null;

        // Flag to indicate whether this class would be used as a stopwatch (true) or timer (false).
        this.stopwatch = true;

        // Duration needs to be set up to use this class as a timer
        this.duration = [];
        this.callback = [];
    }

    callbackExists(){
        if(this.callback.length === 0){
            return false;
        }else{
            return true;
        }
    }

    setCallback(callback){
        if(callback instanceof Array){
            this.callback = callback;
        }else{
            this.callback = [callback];
        }
    }

    setDuration(duration){
        if(duration instanceof Array){
            this.duration = duration;
        }else{
            this.duration = [duration];
        }
    }

    addCallback(callback){
        if(callback instanceof Array){
            this.callback = this.callback.concat(callback);
        }else{
            this.callback.push(callback);
        }
    }

    addDuration(duration){
        if(duration instanceof Array){
            this.duration = this.duration.concat(duration);
        }else{
            this.duration.push(duration);
        }
    }

    resetClock(){
        this.stop();

        this.timeinterval = null;
        this.startTime = null;
        this.endTime = null;
        this.timeElapsed = null;

        // Flag to indicate whether this class would be used as a stopwatch (true) or timer (false).
        this.stopwatch = true;

        // Duration needs to be set up to use this class as a timer
        this.duration = [];
        this.callback = [];
    }

    clearCallback(){
        this.callback = [];
        this.duration = [];
    }

    start(){
        clearInterval(this.timeinterval);
        this.startTime = Date.parse(new Date());
        this.endTime = null;
        this.timeElapsed = null;

        if(this.stopwatch){

            let durationClone = [];
            let callbackClone = [];
            for(let i = 0; i < this.duration.length; i++){
                durationClone.push(this.duration[i]);
                callbackClone.push(this.callback[i]);
            }
            this.startStopWatch(durationClone, callbackClone);

        } else{            
            if(this.duration.length === 0){
                alert("Duration needs to be set in order to use Clock as a timer.");

            }else{
                let deadline = new Date(startTime + this.duration[0]);
                this.startTimer(deadline, this.callback);
            }
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
            out = this.timeElapsed;
        }else{
            out = Date.parse(new Date()) - this.startTime;
        }
        return out;
    }

    getTimeElapsedInMinutesAndSeconds(){
        let t = this.getTimeElapsed();
        let seconds = Math.floor( (t/1000) % 60 );
        let minutes = Math.floor( t/1000/60 );
        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    startStopWatch(duration, callback){
        let that = this;

        function updateClock(){
            let t = that.getTimeElapsedInMinutesAndSeconds();
            let minutes = t.minutes;
            let seconds = t.seconds;

            if(callback.length != 0){
                if(t.total > duration[0]){
                    callback[0]();
                    callback.splice(0,1);
                    duration.splice(0,1);
                }
            }

            // Display the result in the element with id="timer"
            document.getElementById("timer").innerHTML = "Elapsed time: " + minutes + "m " + seconds + "s ";
        }

        updateClock(); // run function once at first to avoid delay
        this.timeinterval = setInterval(updateClock, 1000);
    }

    startTimer(endtime, callback){
        let that = this;
        function updateClock(){
            let t = that.getTimeRemaining(endtime);
            let minutes = t.minutes;
            let seconds = t.seconds;

            if(t.total <= 0){
                if(callback.length != 0){
                    callback[0]();

                }else{
                    alert("Timer finished!");
                }

                that.stop();
                return;
            }

            // Display the result in the element with id="timer"
            document.getElementById("timer").innerHTML = minutes + "m " + seconds + "s ";
        }

        updateClock(); // run function once at first to avoid delay
        this.timeinterval = setInterval(updateClock, 1000);
    }
}



var fuzzy_pareto_front_4 = "15,41,43,44,52,75,118,134,211,268,305,323,335,458,505,526,533,535,537,576,598,601,606,618,619,622,678,699,700,"
+"704,740,757,762,766,770,810,830,843,856,861,884,996,1071,1083,1086,1092,1095,1099,1101,1104,1106,1108,1109,1110,1112,1114,1115,1116,1119,"
+"1121,1122,1123,1124,1126,1127,1128,1129,1130,1131,1132,1134,1136,1139,1140,1141,1143,1144,1145,1150,1152,1154,1156,1157,1160,1166,1167,"
+"1168,1170,1175,1177,1179,1180,1181,1183,1184,1187,1189,1192,1197,1202,1203,1204,1205,1215,1216,1217,1218,1224,1225,1227,1228,1231,1232,"
+"1233,1235,1236,1237,1239,1240,1241,1243,1245,1247,1248,1250,1251,1254,1258,1259,1260,1261,1263,1266,1267,1270,1271,1272,1275,1276,1277,"
+"1280,1283,1289,1291,1293,1295,1298,1299,1302,1305,1306,1307,1308,1311,1312,1313,1316,1318,1320,1323,1324,1325,1326,1327,1328,1329,1330,"
+"1333,1334,1336,1337,1339,1340,1341,1342,1343,1344,1346,1347,1348,1349,1350,1351,1352,1354,1355,1357,1358,1359,1360,1361,1365,1366,1367,"
+"1368,1369,1371,1373,1374,1375,1380,1381,1382,1383,1384,1385,1386,1387,1388,1390,1391,1392,1393,1395,1396,1399,1400,1401,1402,1403,1405,"
+"1406,1407,1408,1409,1410,1411,1412,1413,1414,1415,1416,1420,1424,1434,1435,1437,1439,1442,1451,1456,1457,1465,1466,1471,1472,1475,1478,"
+"1482,1498,1519,1532,1550,1554,1562,1564,1591,1600,1603,1610,1623,1651,1708,2413,2426,2432,2447,2453,2464,2465,2469,2470,2474,2476,2481,"
+"2483,2484,2486,2487,2491,2493,2496,2497,2501,2502,2504,2505,2741,3467,3476,3482,3484,3485,3486,3493,3497,3508,3526,3545,3557,3577,3589,"
+"3630,3658,3659,3661,3678,3681,3702,3705,3708,3713,3717,3719,3724,3737,3741,3745,3747,3754,3756,3762,3769,3777,3781,3782,3785,3786,3792,"
+"3799,3800,3802,4253,4254,4257,4259,4260,4261,4262,4264,4265,4266,4270,4272,4273,4275,4276,4277,4278,4280,4281,4282,4283,4286,4287,4289,"
+"4290,4295,4296,4297,4298,4299,4300,4304,4305,4309,4311,4312,4313,4314,4317,4318,4319,4320,4321,4322,4323,4328,4329,4330,4331,4332,4333,"
+"4334,4335,4336,4338,4339,4340,4341,4343,4344,4345,4346,4348,4349,4350,4352,4353,4355,4356,4361,4363,4365,4366,4367,4368,4372,4373,4374,"
+"4376,4377,4378,4383,4385,4386,4388,4390,4392,4394,4395,4397,4398,4402,4403,4405,4406,4407,4409,4410,4413,4416,4417,4418,4419,4422,4423,"
+"4424,4425,4427,4434,4442,4444,4447,4453,4456,4462,4467,4468,4469,4479,4480,4486,4487,4496,4508,4509,4521,4523,4524,4536,4538,4541,4542,"
+"4546,4549,4550,4552,4553,4556,4558,4560,4562,4565,4566,4567,4568,4569,4570,4571,4572,4574,4576,5457,5458,5459,5460,5462,5464,5465,5467,"
+"5468,5469,5470,5472,5473,5474,5475,5476,5477,5478,5479,5480,5482,5483,5484,5485,5486,5488,5490,5492,5493,5496,5497,5499,5500,5501,5502,"
+"5503,5505,5506,5508,5509,5510,5518,5542,5552,5553,5556,5557,5558,5560,5561,5562,5567,5575,5579,5582,5587,5597,5598,5599";


