// Experiment setup
        
class Experiment{

    constructor(ifeed){

        this.ifeed = ifeed;
        this.problem = null;
        this.data_mining = null;
        this.filter = null;
        this.feature_application = null;

        // Imported data store
        this.data = null;

        // Set the timer
        this.clock = new Clock();

        // Set the order of the task (target region) and the treatment condition
        this.task_number = -2;
        this.condition_order = this.shuffleArray([0, 1, 2]); // condition number: DSE, sorted fetaures list, FSE
        this.problemSet_order = this.shuffleArray([0, 1, 2]); // problem set number

        this.problem_order_design = this.shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        this.problem_order_feature = this.shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]);

        this.current_problem_count = -1;
        this.current_problem_number = 0;
        this.current_problem_type = "design"; // pretest, pretest_text, design, feature
        this.num_problem_design = 4;
        this.num_problem_feature = 3;

        // Placeholder for callback function
        this.submit_callback = function(){
            alert("No action set up!");
        };

        // Placeholder for display architecture info
        this.display_arch_info = null;


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

        this.condition_number = -1;
        this.problemSet_number = -1;

        this.orbitOrder = [0, 1, 2, 3, 4];
        this.instrOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);    
        this.norb = this.orbitOrder.length;
        this.ninstr = this.instrOrder.length;

        // Participant-specific info store
        this.account_id = "";
        for(let i = 0; i < 10; i++){
            this.account_id += "" + Math.floor(Math.random()*10)
        }

        // Answers
        this.answerData = [];
        this.gradedAnswerData = [];

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
            this.next_task();
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
            this.clock.stop();

            // Save all answer data
            this.save_answer();

            d3.select('body').selectAll('div').remove();
            let key_number = this.account_id;

            d3.select('body')
                .append('div')
                .style('width','100%')
                .style('margin-top','120px');

            d3.select("body")
                .append("div")
                .style("margin","auto")
                .style("width","100%")
                .append("img")
                .attr("src", ()=>{
                    return "img/cornell_logo.png";
                }); 

            d3.select('body').select('img')
                    .style("width","200px")
                    .style('margin','40px')
                    .style('margin-left','70px');

            d3.select('body')
                .append('div')
                .style('margin','auto')
                .style('width','100%')
                .append('h1')
                .text('Session End').style("width","1200px").style("margin","auto");

            d3.select('body').append('h2')
                .text("IMPORTANT: Please copy the key number below and paste it into the survey page (link provided below).").style("width","1200px").style("margin","auto");
            d3.select('body').append('h2')
                .text("Key number: "+ key_number).style("width","1200px").style("margin","auto");
            d3.select('body').append('h2')
                .text("Now follow the link to do a survey: https://cornell.qualtrics.com/jfe/form/SV_3xVqMtpF6vR8Qvj").style("width","1200px").style("margin","auto");
            d3.select('body').append('div').style("width","100%").style("height","30px"); 

            //print_experiment_summary();
            return;

        } else if(this.task_number < -1){
            // Pre-experiment test
            this.task_number += 1;

        } else {
            this.task_number += 1;
            this.condition_number = this.condition_order[this.task_number];
            this.problemSet_number = this.problemSet_order[this.task_number];
            this.orbitOrder = this.orbitOrderStore[this.problemSet_number];
            this.instrOrder = this.instrOrderStore[this.problemSet_number];
            this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);    
        } 

        this.update_task();
    }

    previous_task(){

        if(this.task_number === -1){
            // pass

        }else{
            this.task_number -= 1;
            this.condition_number = this.condition_order[this.task_number];
            this.problemSet_number = this.problemSet_order[this.task_number];
            this.orbitOrder = this.orbitOrderStore[this.problemSet_number];
            this.instrOrder = this.instrOrderStore[this.problemSet_number];
            this.randomized = new RandomizedVariable(this.orbitOrder, this.instrOrder);   
        }
        this.update_task();
    }

    update_task(){

        // Reset features
        this.data_mining.initialize();
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

        // Set stopwatch callback functions
        if(!this.clock.callbackExists()){
            let d1 = 3 * 60 * 1000;
            let a1 = function(){
                alert("3 minutes passed! Please try to answer the question as quickly as possible.");
                d3.select("#timer")     
                    .style("font-size","30px")
                    .style("color","red"); 
            };
            let callback = [a1];
            let duration = [d1];
            this.clock.addCallback(callback);
            this.clock.addDuration(duration);
        }

        if(this.task_number === -1){

            d3.select("#tab3").text('-');
            d3.select("#tab1").text('-');

            d3.select("#view1").selectAll('g').remove();
            d3.select("#view3").selectAll('g').remove();

            // Disable design inspection
            if(this.display_arch_info == null){
                this.display_arch_info = this.problem.display_arch_info;
            }
            this.problem.display_arch_info = function(){};

            alert("In each part of the experiment, a set of questions will be asked. In this part, you do NOT need any of the capabilities of iFEED to answer the questions. All relevant information will be provided in figures.");
                  
            this.start_pretest_sequence(); 

        }else{
            // Experiment conditions
            if(this.condition_number === 0){ // DSE
                d3.select("#tab3").text('-');
                d3.select("#tab1").text('Inspect Design');  

                this.tradespace_plot.initialize();

                if(this.display_arch_info != null){
                    this.problem.display_arch_info = this.display_arch_info;
                }
                
                alert("In the next part of the experiment, try to answer the questions using iFEED's design inspection capability. Note that a new dataset has been loaded for this task.");

            }else if(this.condition_number === 1){ // Bar plot
                d3.select("#tab1").text('-');
                d3.select("#view1").selectAll('g').remove();

                d3.select("#tab3").text('Feature Analysis');            
                this.data_mining.update = this.data_mining.update_bar;

                // Disable design inspection
                this.problem.display_arch_info = function(){};

                alert("In the next part of the experiment, try to answer the questions using iFEED's feature analysis capability with a bar graph. Note that a new dataset has been loaded for this task.");

            }else if(this.condition_number === 2){ // FSE
                d3.select("#tab1").text('-');
                d3.select("#view1").selectAll('g').remove();

                d3.select("#tab3").text('Feature Analysis');            
                this.data_mining.update = this.data_mining.update_scatter;

                // Disable design inspection
                this.problem.display_arch_info = function(){};

                alert("In the next part of the experiment, try to answer the questions using iFEED's feature analysis capability with a scatter plot. Note that a new dataset has been loaded for this task.");
            }
            // Load target selection and corresponding features
            this.data_mining.import_feature_data_and_compute_metrics("EpsilonMOEA_2018-10-25-10-53_1", this.filter);

            if(this.condition_number === 0){
                d3.select("#view3").selectAll('g').remove();
                document.getElementById('tab1').click();  
            }

            this.start_problem_sequence();
        }
    }
    
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

        let options = [0, 1];

        let questionText = "";
        if(problem_type == "design"){
            questionText = "Do you think the given design will be located in the target region?";
        } else {
            questionText = "Is the given feature a driving feature?";
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

        d3.select("#prompt_problem_number").text("" + (this.current_problem_count + 1) + " / " + 32);
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
                questionText = "Describe what it means for a feature to have a large coverage. ";
            }else{
                questionText = "Describe what it means for a feature to have a large specificity. ";
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

        d3.select("#prompt_problem_number").text("" + (this.current_problem_count + 1) + " / "+ 32);
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
        // this.store_design_viewed.push(this.counter_design_viewed);
        // this.store_feature_viewed.push(this.counter_feature_viewed);
        // this.store_new_design_evaluated.push(this.counter_new_design_evaluated);
        // this.store_design_local_search.push(this.counter_design_local_search);
        // this.store_conjunctive_local_search.push(this.counter_conjunctive_local_search);
        // this.store_disjunctive_local_search.push(this.counter_disjunctive_local_search);
        // this.store_new_feature_tested.push(this.counter_new_feature_tested);
        // this.store_best_features_found.push(JSON.stringify(this.best_features_found));        
        
        // this.counter_design_viewed = 0;
        // this.counter_feature_viewed = 0;
        // this.counter_new_design_evaluated = 0;
        // this.counter_design_local_search = 0;
        // this.counter_conjunctive_local_search = 0;
        // this.counter_disjunctive_local_search = 0;
        // this.counter_new_feature_tested = 0;
        // this.best_features_found = [];             
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

        let target_ids_split = target_ids_string.split(',');
        let target_ids =[];
        for(let i = 0; i < target_ids_split.length; i++){
            let id = + target_ids_split[i];
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
            this.startStopWatch(this.duration, this.callback);
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

let encodeArch = function(inputString){
    
    let inputSplit = inputString.split(";");
    
    let bitString = [];
    for(let i = 0; i < 60; i++){
        bitString.push(false);
    }
    
    for(let i = 0; i < 5; i++){
        let thisOrbitRelabeled = experiment.orbitOrder.indexOf(i);
        let instruments = inputSplit[i];
        for(let j = 0; j < instruments.length; j++){
            let thisInstr = experiment.instrList.indexOf(instruments[j]);
            let thisInstrRelabeled = experiment.instrOrder.indexOf(thisInstr);
            bitString[thisOrbitRelabeled*12+thisInstrRelabeled]=true;
        }
    }
    
    let out = "";
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

let decodeArch = function(inputString){
    
    let inputSplit = inputString.split(";");
    
    let bitString = [];
    for(let i = 0; i < 60; i++){
        bitString.push(false);
    }
    
    for(let i = 0; i < 5; i++){
        let thisOrbitRelabeled = experiment.orbitOrder[i];
        let instruments = inputSplit[i];
        for(let j = 0; j < instruments.length; j++){
            let thisInstrRelabeled = experiment.instrOrder[instruments[j]];
            bitString[thisOrbitRelabeled*12+thisInstrRelabeled]=true;
        }
    }
                //ppinstruments = ppinstruments + instrOrder[+instruments[i]];

    let out = "";
    for(let i = 0; i < 5; i++){
        for(let j = 0; j < 12; j++){
            if(bitString[i * 12 + j]){
                out = out + experiment.instrList[j];
            }
        }
        out = out + ";";
    }
    return out;
}
