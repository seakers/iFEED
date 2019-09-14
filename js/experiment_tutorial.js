

class ExperimentTutorial{

    constructor(problem, tradespace_plot, filter, data_mining, feature_application, label, experiment){
        this.problem = problem;
        this.tradespace_plot = tradespace_plot;
        this.filter = filter;
        this.data_mining = data_mining;
        this.feature_application = feature_application;
        this.label = label;
        this.experiment = experiment;
        this.treatmentCondition = experiment.treatmentCondition;
        this.treatmentConditionName = experiment.treatmentConditionName;
        this.participantID = experiment.participantID;

        // Setup introJS
        this.intro = introJs();
        this.intro._options.exitOnOverlayClick = false;
        this.introjs_nextButton_callback = null;
        
        // Tutorial context setup
        this.current_step = null; 
        this.max_visited_step = -1;
        this.event_subscription = null;

        this.stashed_stepIndex = null;
        this.stashed_keywords = null;
        this.stashed_placeholders = null;

        // Import the tutorial dataset
        problem.metadata.file_path = "EOSS_reduced_data.csv";
        PubSub.publish(LOAD_DATA, null);

        let that = this;
        PubSub.subscribe(EXPERIMENT_TUTORIAL_START, (msg, data) => {
            that.start_tutorial();
        }); 

        loadTutorialContent();
    }

    exit(){
        this.intro.exit();
    }

    skip_tutorial(){
        let that = this;
        this.intro.exit();

        // Load the data
        this.problem.metadata.file_path = "ClimateCentric_050819.csv";
        PubSub.publish(LOAD_DATA, null);

        // Generate sign in message
        that.experiment.generateSignInMessage(() => {
            that.experiment.load_learning_task();
            setTimeout(() => { PubSub.publish(EXPERIMENT_TUTORIAL_START, null);}, 300);
        });
    }

    start_tutorial(){
        let that = this;

        // Close all existing intro messages
        this.intro.exit();

        if(this.experiment.stage === "tutorial"){

            // Select the target region
            this.experiment.select_archs_using_ids(tutorial_selection);

            // Load the treatment condition
            this.experiment.load_treatment_condition();

            // Set timer callback events
            let d1 = 15 * 60 * 1000;
            let d2 = 20 * 60 * 1000;
            let a1 = function(){
                let diff = that.intro._introItems.length - that.intro._currentStep - 1;
                alert("15 minutes passed! This is just a friendly reminder that there are " + diff + " more pages in this tutorial.");
                d3.select("#timer")
                    .style("font-size","3.1vh")
                    .style("width", "26vw");
            };
            let a2 = function(){
                alert("20 minutes passed! Please try to wrap up the tutorial as quickly as possible. If you have any question, please let the experimenter know.");
                d3.select("#timer")
                    .style("color","red"); 
            };
            let callback = [a1, a2];
            let duration = [d1, d2];
            this.experiment.clock.setCallback(callback);
            this.experiment.clock.setDuration(duration);
            this.experiment.clock.start();

        }else if(this.experiment.stage === "learning"){
            this.experiment.clock.resetClock();

        }else if(this.experiment.stage === "feature_synthesis"){
            this.experiment.clock.resetClock();

        }else if(this.experiment.stage === "design_synthesis"){
            this.experiment.clock.resetClock();
        }

        this.set_tutorial_content(this.experiment.stage);
    }

    start_intro(objects, messages, classname, callback, stage, progress){
        if(typeof stage === "undefined" || stage == null){
            stage = this.experiment.stage;
        }

        this.intro.setOption('showButtons', true)
                    .setOption('showBullets', false)
                    .setOption('keyboardNavigation', false);
        
        if(!classname){
            classname = 'introjs_tooltip';
        }
        
        let steps = [];
        let last_object = null;
        
        for(let i = 0; i < messages.length; i++){
            if(!objects){
                steps.push({intro:messages[i]});

            }else{
                if(typeof objects[i] === "undefined"){
                    steps.push({intro:messages[i]});

                } else if(!objects[i]){
                    if(!last_object){
                        steps.push({intro:messages[i]});
                    }else{
                        steps.push({element:last_object, intro:messages[i]});
                    }
                }else{
                    last_object = objects[i];
                    steps.push({element:objects[i], intro:messages[i]});
                }
            }
        }

        this.intro.setOptions({steps:steps, tooltipClass:classname})
            .setOption('showProgress', true)
            .onchange(callback)
            .start(); 

        let that = this;

        d3.select('.introjs-skipbutton')
            .text(() => {
                if( stage === "tutorial"){
                    return "LOAD DATA ANALYSIS TASK";
                }else if(stage === "learning"){
                    return "START DATA ANALYSIS TASK";
                }else if(stage === "learning_end"){
                    return "NEXT";
                }else if(stage === "feature_synthesis"){
                    return "START FEATURE SYNTHESIS TASK";
                }else if(stage === "design_synthesis"){
                    return "START DESIGN SYNTHESIS TASK";
                }else{
                    return "DONE"
                }
            })
            .style('color','red');

        // Disable SKIP button until it reaches the last step
        if(messages.length > 1){
            $('.introjs-skipbutton').hide();
        }
        this.intro.onafterchange(function(){          
            if (this._introItems.length - 1 == this._currentStep || this._introItems.length == 1) {
                $('.introjs-skipbutton').show();

                d3.select('.introjs-skipbutton')
                    .text(() => {
                        if( stage === "tutorial"){
                            return "LOAD DATA ANALYSIS TASK";
                        }else if(stage === "learning"){
                            return "START DATA ANALYSIS TASK";
                        }else if(stage === "learning_end"){
                            return "NEXT";
                        }else if(stage === "feature_synthesis"){
                            return "START FEATURE SYNTHESIS TASK";
                        }else if(stage === "design_synthesis"){
                            return "START DESIGN SYNTHESIS TASK";
                        }else{
                            return "DONE"
                        }
                    })
                    .style('color','red');
            } 
        });

        this.intro.oncomplete(function() {
            if(stage === "tutorial"){
                that.experiment.clock.stop();

                // Load the data
                that.problem.metadata.file_path = "ClimateCentric_050819.csv";
                PubSub.publish(LOAD_DATA, null);

                // Generate sign in message
                that.experiment.generateSignInMessage(() => {
                    that.experiment.load_learning_task();
                    setTimeout(() => { PubSub.publish(EXPERIMENT_TUTORIAL_START, null);}, 2000);
                });

            }else if(stage === "learning"){
                that.intro.exit();
                that.experiment.start_learning_task();

            }else if(stage === "learning_end"){
                that.intro.exit();
                //window.open("https://cornell.qualtrics.com/jfe/form/SV_9vJTd6y3Pzri3s1", '_blank');

                //Move onto the next stage
                that.experiment.generateSignInMessage(() => {
                    that.experiment.load_feature_synthesis_task();
                    setTimeout(() => { PubSub.publish(EXPERIMENT_TUTORIAL_START, null);}, 2000);
                });

            }else if(stage === "feature_synthesis"){
                that.intro.exit();
                that.experiment.start_feature_synthesis_task();   

            }else if(stage === "design_synthesis"){
                that.intro.exit();
                that.experiment.start_design_synthesis_task();
            }
        });

        if(progress){
            this.intro.goToStep(progress);
        }
    }

    start_tutorial_event_listener(eventKeyword, targetStep, callback){
        let that = this;

        if(typeof callback === "undefined"){
            callback = () => {
                that.intro.nextStep();
            }
        }

        if(this.max_visited_step > targetStep){
            this.enable_introjs_nextButton();
        }else{
            this.disable_introjs_nextButton();
        }

        if(this.event_subscription){
            PubSub.unsubscribe(this.event_subscription);
        }

        this.event_subscription = PubSub.subscribe(EXPERIMENT_TUTORIAL_EVENT, function(msg, data){
            if(eventKeyword === data){
                if(that.current_step === targetStep){
                    that.enable_introjs_nextButton();

                    if(callback){
                        callback();
                    }
                }
            }
        });
    }

    set_tutorial_content(stage, progressKeyword){
        let that = this;
        let objects, contents, classname, callback;
        objects = [];
        contents = [];
        classname = 'introjs_tooltip_large';
        callback = function(){
            return undefined;
        };

        // Initialize the list of visitied steps
        this.max_visited_step = -1;

        let stageContent = [];
        if(stage === 'tutorial' || typeof stage === 'undefined' || stage == null){
            stageContent = this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial");
            
            // filter contents
            let contentsToSkip = [];
            if(this.treatmentConditionName.indexOf("design_inspection") !== -1){
                contentsToSkip = [
                    "tutorial-intro-opening-general",
                    "tutorial-ifeed-intro-general",
                    "tutorial-ifeed-filter",
                    "tutorial-ifeed-feature-intro-v1",
                    "tutorial-ifeed-feature-metric-coverage-scatter-plot-v1",
                    "tutorial-ifeed-feature-space-plot",
                    "tutorial-ifeed-feature-application",
                    "tutorial-ifeed-feature-interactive",
                    "tutorial-ifeed-closing-general",
                ];

            } else if (this.treatmentConditionName.indexOf("manual") !== -1){
                contentsToSkip = [
                    "design-inspection-only",
                    "tutorial-ifeed-filter-intro-v2",
                    "tutorial-ifeed-feature-intro-v2",
                    "tutorial-ifeed-feature-metric-coverage-scatter-plot-v2",
                    "tutorial-ifeed-feature-application-interaction-intro-v2",
                    "tutorial-ifeed-feature-application-interaction-context-menu-generalize-feature",
                    "tutorial-ifeed-feature-interactive",
                ];

            } else if (this.treatmentConditionName.indexOf("automated") !== -1){
                contentsToSkip = [
                    "design-inspection-only",
                    "tutorial-ifeed-filter",
                    "tutorial-ifeed-feature-intro-v1",
                    "tutorial-ifeed-feature-metric-coverage-scatter-plot-v1",
                    "tutorial-ifeed-feature-application-interaction",
                    "tutorial-ifeed-feature-interactive",
                ];

            } else if (this.treatmentConditionName.indexOf("interactive") !== -1){
                contentsToSkip = [
                    "design-inspection-only",
                    "tutorial-ifeed-filter-intro-v2",
                    "tutorial-ifeed-feature-intro-v2",
                    "tutorial-ifeed-feature-metric-coverage-scatter-plot-v2",
                    "tutorial-ifeed-feature-application-interaction-intro-v2",
                ];
            } 
            stageContent = this.filterContentByKeyword(stageContent, contentsToSkip);

            // Skip stages based on whether generalization is enabled or not
            contentsToSkip = [];
            if(this.experiment.generalizationEnabled){ // Generalization is enabled
                contentsToSkip.push("tutorial-ifeed-filter-instrument-options-no-generalization");
                
            }else{ // No generalization
                contentsToSkip.push("tutorial-ifeed-filter-instrument-options-with-generalization");
                contentsToSkip.push("tutorial-ifeed-feature-application-interaction-context-menu-generalize-feature");
            }
            stageContent = this.filterContentByKeyword(stageContent, contentsToSkip);

        } else if(stage === 'learning'){
            stageContent = this.getContentsHavingKeyword(TUTORIAL_CONTENT, "learning-task-intro");

            // filter contents
            if(this.treatmentConditionName.indexOf("design_inspection") !== -1){
                stageContent = this.filterContentByKeyword(stageContent, ["general-condition"]);
            } else {
                stageContent = this.filterContentByKeyword(stageContent, ["design-inspection-only"]);
            }

        } else if(stage === 'learning_end'){
            stageContent = this.getContentsHavingKeyword(TUTORIAL_CONTENT, "learning-task-end");

        } else if(stage === 'feature_synthesis'){
            stageContent = this.getContentsHavingKeyword(TUTORIAL_CONTENT, "feature-synthesis-intro");

            if(this.treatmentConditionName.indexOf("design_inspection") !== -1 ){
                stageContent = this.filterContentByKeyword(stageContent, [
                    "general-condition",
                    "feature-synthesis-intro-2",
                    "feature-synthesis-intro-filter-setting", 
                    "feature-synthesis-intro-start",
                ]);

                // Add filter explanation
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial-ifeed-filter"));
                stageContent = this.filterContentByKeyword(stageContent, [
                    "tutorial-ifeed-filter-intro-v1",
                    "tutorial-ifeed-filter-instrument-options-no-generalization",
                ]);

                // Add feature space explanation
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial-ifeed-feature-space-plot"));

                // Add feature tree explanation
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial-ifeed-feature-application"));
                stageContent = this.filterContentByKeyword(stageContent, [
                    "tutorial-ifeed-feature-application-interaction-intro-v2",
                    "tutorial-ifeed-feature-application-interaction-context-menu-generalize"
                ]);

                // Finish the explanation on the feature synthesis task
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "feature-synthesis-intro-2"));
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "feature-synthesis-intro-start"));

            } else if( this.treatmentConditionName.indexOf("automated") !== -1 ){
                stageContent = this.filterContentByKeyword(stageContent, [
                    "design-inspection-only", 
                    "feature-synthesis-intro-filter-setting", 
                    "feature-synthesis-intro-start"
                ]);

                // Add filter explanation
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial-ifeed-filter"));
                stageContent = this.filterContentByKeyword(stageContent, [
                    "tutorial-ifeed-filter-intro-v1",
                    "tutorial-ifeed-filter-present-outcome", 
                    "tutorial-ifeed-filter-inOrbit-outcome"
                ]);
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "feature-synthesis-extra-filter"));

                // Add feature tree interaction explanation
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "tutorial-ifeed-feature-application-interaction"));
                stageContent = this.filterContentByKeyword(stageContent, [
                    "tutorial-ifeed-feature-application-interaction-intro-v1",
                    "tutorial-ifeed-feature-application-interaction-context-menu-generalize",
                ]);
                stageContent = stageContent.concat(this.getContentsHavingKeyword(TUTORIAL_CONTENT, "feature-synthesis-intro-start"));
            
            } else {
                stageContent = this.filterContentByKeyword(stageContent, ["design-inspection-only"]);
            }

            // Skip stages based on whether generalization is enabled or not
            let contentsToSkip = [];
            if(this.experiment.generalizationEnabled){ // Generalization is enabled
                // Generalized variables were introduced during the learning task tutorial, so it can be skipped here
                contentsToSkip.push("feature-synthesis-intro-filter-setting-generalized-variables-intro");
                
            }else{ // No generalization
                // Generalized variables need to be explained
                contentsToSkip.push("feature-synthesis-intro-filter-setting-v1");
            }
            stageContent = this.filterContentByKeyword(stageContent, contentsToSkip);


        } else if(stage === 'design_synthesis'){
            stageContent = this.getContentsHavingKeyword(TUTORIAL_CONTENT, "design-synthesis-intro");
        }

        // Update the target object
        this.updateContentObject(stageContent, "tutorial-ifeed-filter-options", d3.select('.filter.options.dropdown').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-space-plot-2", d3.select('.feature_plot.figure').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-space-plot-mouse-over-3", d3.select('.feature_plot.venn_diagram').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-interactive-intro", d3.select('#feature_space_display_options_container').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-interactive-local-search-1", d3.select('.feature_space_interaction.localSearch.container').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-interactive-generalization-1", d3.select('.feature_space_interaction.generalization.container').node());
        this.updateContentObject(stageContent, "tutorial-ifeed-feature-application-interaction-context-menu-generalize-feature-3", document.getElementsByClassName("iziToast-capsule")[0]);
        this.updateContentObject(stageContent, "design-synthesis-intro-4", d3.select('#instr_options_display').node());

        callback = function(targetElement) {
            that.enable_introjs_nextButton();
            that.restore_keyword_placeholder();
            that.current_step = this._currentStep;

            let skipPrevStep = false;  
            if(this._currentStep !== 0){
                if(stageContent[this._currentStep - 1].name.indexOf("_delay_") !== -1){
                    skipPrevStep = true;
                }
            }
            that.set_introjs_moveButtonCallback(this._currentStep, skipPrevStep);

            if(that.max_visited_step < this._currentStep){
                that.max_visited_step = this._currentStep;
            }
            if(stageContent[this._currentStep].callback){
                stageContent[this._currentStep].callback(this._currentStep);
            }
        }

        let progress = null;
        for(let i = 0; i < stageContent.length; i++){
            if(progressKeyword){
                if(stageContent[i].name === progressKeyword){
                    progress = i + 1;
                }
            }
            objects.push(stageContent[i].object);
            contents.push(stageContent[i].content);
        }  

        this.start_intro(objects, contents, classname, callback, stage, progress);
    }

    fill_in_keyword_placeholder(stepIndex, keywords, placeholders){
        this.stashed_stepIndex = stepIndex;
        this.stashed_keywords = keywords;
        this.stashed_placeholders = placeholders;
        for(let i = 0; i < keywords.length; i++){
            this.intro._introItems[stepIndex].intro = this.intro._introItems[stepIndex].intro.replace(placeholders[i], keywords[i]);
        }
    }

    restore_keyword_placeholder(){
        if(!this){
            return;
        }
        if(this.stashed_stepIndex){
            for(let i = 0; i < this.stashed_keywords.length; i++){
                this.intro._introItems[this.stashed_stepIndex].intro = this.intro._introItems[this.stashed_stepIndex].intro.replace(this.stashed_keywords[i], this.stashed_placeholders[i]);
            }
            this.stashed_stepIndex = null;
            this.stashed_keywords = null;
            this.stashed_placeholders = null;
        }
    }

    disable_introjs_nextButton(){
        this.introjs_nextButton_callback = $('.introjs-nextbutton').get(0).onclick
        $('.introjs-nextbutton').addClass('introjs-disabled');
        $('.introjs-nextbutton').get(0).onclick = null;
        d3.select('.introjs-nextbutton').style('opacity','0.55');
    }

    enable_introjs_nextButton(){
        if(this.introjs_nextButton_callback){
            $('.introjs-nextbutton').removeClass('introjs-disabled');
            $('.introjs-nextbutton').get(0).onclick = this.introjs_nextButton_callback;
            d3.select('.introjs-nextbutton').style('opacity','1.0');
            this.introjs_nextButton_callback = null;
        }
    }

    set_introjs_moveButtonCallback(currentStep, skipPrevStep){
        if(!$('.introjs-nextbutton').get(0) || !$('.introjs-prevbutton').get(0)){
            return;
        }
        let that = this;
        let nextStep = currentStep + 1;
        let prevStep = currentStep - 1;
        if(skipPrevStep){
            prevStep = prevStep - 1;
        }
        let max = this.intro._introItems.length - 1;
        let min = 0;

        if(currentStep !== max){
            $('.introjs-nextbutton').get(0).onclick = () => {
                that.intro.goToStepNumber(nextStep + 1);
            }            
        }

        if(currentStep !== min){
            $('.introjs-prevbutton').get(0).onclick = () => {
                that.intro.goToStepNumber(prevStep + 1);
            }            
        }
    }

    move_to_step(stepNum){
        let that = this;

        this.start_tutorial();

        if(!this.max_visited_step || this.max_visited_step < stepNum){
            this.max_visited_step = stepNum;
        }
        this.intro.goToStepNumber(stepNum + 1);
    }

    filterContentByKeyword(content, keyword){
        let out = [];
        if(Array.isArray(keyword)){
            for(let i = 0; i < content.length; i++){
                let containsKeyword = false;
                for(let j = 0; j < keyword.length; j++){
                    if(content[i].name.indexOf(keyword[j]) !== -1){
                        containsKeyword = true;
                        break;
                    }
                }
                if(!containsKeyword){
                    out.push(content[i]);
                }
            }
        }else{
            for(let i = 0; i < content.length; i++){
                if(content[i].name.indexOf(keyword) === -1){
                    out.push(content[i]);
                }
            }
        }
        return out;
    }

    getContentsHavingKeyword(contents, keyword){
        let out = [];
        for(let i = 0; i < contents.length; i++){
            if(contents[i].name.indexOf(keyword) !== -1){
                out.push(contents[i]);
            }
        }
        return out;
    }

    findContentByKeyword(contents, keyword){
        let out = null;
        for(let i = 0; i < contents.length; i++){
            if(contents[i].name === keyword){
                out = contents[i];
            }
        }
        return out;
    }

    updateContentObject(contents, keyword, object){
        let content = this.findContentByKeyword(contents, keyword);
        if(content){
            content.object = object;
        }
    }
}


let tutorial_feature_example_a = "({present[;11;]}||{inOrbit[4;7;]})";

let tutorial_feature_example_b = "{present[;1;]}&&{notInOrbit[2;1;]}&&{notInOrbit[3;1;]}&&{absent[;3;]}&&{notInOrbit[2;8;]}&&{notInOrbit[0;4;]}&&{notInOrbit[3;5;]}&&{notInOrbit[2;4;]}&&{separate[;4,2;]}&&{notInOrbit[2;7;]}&&{notInOrbit[4;0;]}&&{notInOrbit[3;0;]}&&{notInOrbit[2;2;]}&&{notInOrbit[3;9;]}&&{notInOrbit[4;2;]}";

let tutorial_feature_example_c = "({present[;11;]}&&{absent[;2;]}&&{absent[;3;]}&&{separate[;4,8,9;]}&&{separate[;2,3,11;]}&&{separate[;2,5,11;]})";

let tutorial_feature_example_d = "({separate[;3,5,11;]}&&{present[;11;]}&&({separate[;2,4,8;]}||{absent[;3;]}||{inOrbit[3;0,4;]}))";

let tutorial_feature_example_e = "{absent[;3;]}";

let tutorial_feature_example_f = "({absent[;2;]}&&{absent[;3;]}&&{present[;11;]})";

let tutorial_feature_example_g = "({separate[;2,4,8;]}&&({absent[;2;]}||{present[;11;]})&&({present[;11;]}||{absent[;3;]}))";

let tutorial_feature_example_h = "({absent[;3;]}&&({present[;11;]}||{notInOrbit[3;1,2,9;]}))";

let tutorial_feature_example_i = "({separate[;2,5,10;]}&&{absent[;3;]}&&({absent[;2;]}||{inOrbit[2;1,6,11;]}||{present[;11;]})&&({notInOrbit[3;1,2,9;]}||{present[;11;]}))";

let tutorial_selection = "3,6,8,12,13,14,15,17,19,20,25,26,27,37,38,42,46,47,50,51,53,55,58,60,61,64,68,72,76,77,81,88,91,93,94,95,96,100,101,102,104,106,108,111,118,119,120,121,122,123,125,128,129,130,135,139,143,144,148,149,153,165,167,168,169,173,175,176,177,179,186,189,191,194,196,199,200,217,219,221,223,224,225,227,229,230,231,232,234,237,239,240,248,249,250,255,258,261,266,268,273,280,282,287,288,289,298,303,312,313,322,324,325,332,337,339,341,342,349,352,353,354,359,360,363,365,366,368,369,370,372,373,375,379,381,382,384,387,388,397,402,408,409,420,423,425,439,442,444,461,473,476,490,504,506,510,514,519,523,527,532,540,546,561,571,575,594,600,601,604,611,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,686,687,688,692,699,703,704,707,718,720,725,727,728,733,736,740,741,742,744,746,751,761,762,769,770,774,778,781,786,790,793,800,801,805,810,812,813,815,816,823,825,832,835,840,846,856,861,862,865,872,877,886,889,891,896,899,905,910,911,912,917,929,933,939,943,945,950,952,960,965,967,975,977,978,986,1003,1005,1010,1018,1021,1024,1027,1029,1031,1032,1035,1036,1042,1045,1052,1053,1058,1059,1068,1070,1076,1077,1084,1085,1089,1094,1096,1113,1117,1119,1120,1121,1124,1137,1157,1158,1162,1163,1172,1177,1181,1182,1194,1195,1214,1224,1228,1242,1254,1262,1263";

let tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}";
