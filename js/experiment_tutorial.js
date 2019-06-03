

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
        this.participantID = experiment.participantID;

        // Setup introJS
        this.intro = introJs();
        this.intro._options.exitOnOverlayClick = false;
        this.introjs_nextButton_callback = null;
        
        // Tutorial context setup
        this.current_view = 5;
        this.max_view = 16;
        this.max_view_reached = 0;    


        this.current_step = null;  
        this.steps_to_skip = [];

        // Import the dataset
        problem.metadata.file_path = "EOSS_reduced_data.csv";
        PubSub.publish(LOAD_DATA, null);

        let that = this;
        PubSub.subscribe(EXPERIMENT_TUTORIAL_START, (msg, data) => {
            that.start_tutorial();
        }); 

        PubSub.subscribe(EXPERIMENT_CONDITION_CHANGE, (msg, data) => {
            that.treatmentCondition = that.experiment.treatmentCondition;
            that.participantID = that.experiment.participantID;
        });
    }

    skip_tutorial(){
        this.start_experiment();
    }

    start_tutorial(){
        let that = this;

        // Close all existing intro messages
        this.intro.exit();

        if(this.experiment.stage === "learning"){
            this.experiment.select_archs_using_ids(tutorial_selection);

            // Load the experiment condition
            let treatmentConditionName = "";
            if(this.treatmentCondition === 0){
                treatmentConditionName = "tutorial-manual-generalization";
                this.steps_to_skip = [];

            }else if(this.treatmentCondition === 1){
                treatmentConditionName = "tutorial-automated-generalization";
                // Disable filter
                d3.select("#tab2").text('-');
                d3.select("#view2").selectAll('g').remove();
                this.steps_to_skip = [];

            }else if(this.treatmentCondition === 2){
                treatmentConditionName = "tutorial-interactive-generalization";
                this.steps_to_skip = [];

            } 
            PubSub.publish(EXPERIMENT_SET_MODE, treatmentConditionName); 

            let d1 = 15 * 60 * 1000;
            let d2 = 20 * 60 * 1000;
            let a1 = function(){
                alert("15 minutes passed! This is just a friendly reminder that there are total " + that.max_view + " pages in this tutorial.");
                d3.select("#timer")
                    .style("font-size","30px")
                    .style("width", "350px");
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

        }else if(this.experiment.stage === "design_synthesis"){
            this.experiment.clock.resetClock();
            this.experiment.clock.start();

            // // Load the data
            // this.problem.metadata.file_path = "ClimateCentric_050819.csv";
            // PubSub.publish(LOAD_DATA, null);
        }

        this.set_tutorial_content(this.experiment.stage);
    }

    start_intro(objects, messages, classname, callback){
        
        if(messages.length === 1){
            this.intro.setOption('showButtons',false)
                        .setOption('showBullets', false);
        }else{
            this.intro.setOption('showButtons',true)
                        .setOption('showBullets', true);
        }
        
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
                        steps.push({element:last_object,intro:messages[i]});
                    }
                }else{
                    last_object = objects[i];
                    steps.push({element:objects[i],intro:messages[i]});
                }
            }
        }

        this.intro.setOptions({steps:steps, tooltipClass:classname})
            .setOption('showProgress', true)
            .onchange(callback)
            .start(); 

        let that = this;

        // Disable SKIP button until it reaches the last step
        $('.introjs-skipbutton').hide();
        this.intro.onafterchange(function(){          
            if (this._introItems.length - 1 == this._currentStep || this._introItems.length == 1) {
                $('.introjs-skipbutton').show();

                d3.select('.introjs-skipbutton')
                    .text("START EXPERIMENT")
                    .style('color','red')
                    .on("click", () => {
                        that.start_experiment();
                    });
            } 
        });
    }

    start_tutorial_event_listener(eventKeyword, targetStep, callback){
        let that = this;

        if(typeof callback === "undefined"){
            callback = () => {
                that.intro.nextStep();
            }
        }

        this.disable_introjs_nextButton();
        PubSub.subscribe(EXPERIMENT_TUTORIAL_EVENT, (msg, data) => {
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

    set_tutorial_content(stage){
        let that = this;
        let objects, contents, classname, callback;
        callback = function(){
            return undefined;
        };

        objects = [];
        contents = [];
        classname = 'introjs_tooltip_large';
        
        if(stage === 'learning' || typeof stage === 'undefined' || stage == null){
        
            objects = [
                        null,
                        d3.select('#timer').node(),
                        d3.select('.tradespace_plot.figure').node(),
                        null, // 3
                        d3.select('.column.c1').node(),
                        d3.selectAll('#support_panel').node(),
                        null, // 6
                        d3.select('.filter.options.dropdown').node(),
                        d3.selectAll('#support_panel').node(), // 8
                        null, // 9
                        d3.select('.tradespace_plot.figure').node(), // 10
                        d3.select('.column.c1').node(), // 11
                        null, // 12
                        null, // 13
                        undefined, // 14
                        null, // 15
                        d3.select('.tradespace_plot.figure').node(), // 16
                        null, // 17
                        null, // 18
                        null, // 19
                        null, // 20
                        d3.selectAll('#support_panel').node(), // 21
                        null, // 22
                        null, // 23
                        d3.select('#content').node(), // 24
                        d3.select('.column.c1').node(), // 25
                        d3.select('.column.c2').node(), // 26
                        d3.selectAll('#support_panel').node(), // 27
                        null, // 28
                        d3.select('.column.c2').node(), // 29
                        undefined // 30
                    ];
            
            contents = ["Now we will go over different parts of iFEED and explain how to use it.", 

                        "<p>The elapsed time is shown here. We expect this tutorial to take no more than 15 minutes.</p>"
                        +"<p>During the actual task, the remaining time will be displayed here.</p>",
                        
                        "The main display is the scatter plot of different architectures of a satellite system. "
                        +"Each dot corresponds to one architecture, and its location indicates the corresponding cost and the scientific benefit.", 
                        
                        "In the actual task, a group of dots will be highlighted in a light blue color. "
                        +"These dots represent the target architectures that you need to investigate. "
                        +"Your goal is to find patterns that are shared uniquely by these architectures.", // 3
                           
                        "If you hover the mouse over an architecture on the scatter plot, "
                        +"the relevant information will be displayed on the \"Inspect Design\" tab.",

                        "The displayed information contains the science benefit score and the cost, as well as a figure that shows "
                        +"which set of instruments are assigned to each orbit.",

                        "The filter setting tab allows you to highlight a group of architectures that share the common feature that you define", // 6

                        "<p>To use the filter, you need to first select the filter type from a given list of available filters. "
                        +"For example, try selecting the filter named \"Present\".</p>"
                        +"<p>(Select the filter Present to continue)</p>", // 7

                        "The filter \"Present\" is used to selectively highlight designs that contain a specific instrument. "
                        +"It takes in one instrument name as an argument, and selects all designs that use the specified instrument.", // 8

                        "<p>To apply the filter, you need to type in an argument to the input text field and click the 'Apply Filter' button. </p>"
                        +"<p>Type in one of the instrument names, and apply the filter to continue.</p>", // 9

                        "<p>Take a look at the scatter plot, and note that some dots have turned pink or purple. "
                        +"These dots are all the architectures that have the feature you just defined. In other words, these architectures "
                        +"use the instrument that you specified. </p>"
                        +"<p>The pink dots represent designs that have feature, but are not in the target region. "
                        +"The purple dots represent designs that have the feature and are inside the target region (highlighted in blue)</p>. ",// 10

                        "Let\'s explore few more filters. Select another filter called \"InOrbit\" to continue.", // 11

                        "<p>\"InOrbit\" is used to selectively highlight designs that assign a specific instrument(s) to a given orbit. </p>"
                        +"<p>It takes in an orbit name and instrument name(s) as arguments. "
                        +"If more than one instrument name is given, then it highlights all designs "
                        +"that assign all those instruments into the specified orbit.</p>"
                        +"<p>Type in an orbit name and multiple instrument names, and apply the filter to continue.</p>", // 12

                        "Again, the dots in pink or purple highlight the designs that have the feature you just defined.", // 13

                        "<p>So far, we have been using the term \"feature\" to refer to the description of a pattern that can be found "
                        +"among the target designs (highlighted in blue). Below are some examples of what features might look like:</p>"
                        +"<ul><li>OCE_SPEC is assigned to LEO-600-polar</li>"
                        +"<li>AERO_LID and CHEM_UVSPEC are assigned together in the same orbit</li>"
                        +"<li>Orbit SSO-800-PM is empty</li>"
                        +"<li>HYP_ERB is assigned to either LEO-600-polar or SSO-600-AM</li>"
                        +"</ul>"
                        +"<p>Some of these features are better than others in explaining the target designs. "
                        +"We use two different criteria to define the \"goodness\" of a feature.</p>", // 14

                        "<p>The first metric we use to define the \"goodness\" of a feature is called the coverage of a feature.</p>", // 15

                        "<p>The architectures currently highlighted in pink and purple represent architectures that \"do not assign HYP_ERB to any orbit\". "
                        +"Let\'s call this feature A.</p>" // 
                        +"<p>Note that many of the target designs share feature A (as indicated by the large number of purple dots). "
                        +"We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.</p>", // 16

                        "<p>However, feature A is not necessarily what we are looking for. It is too general, meaning that it also applies to "
                        +"many of the non-target designs as well (as indicated by the large number of pink dots). "
                        +"This leads us to the next criterion used to define a good feature.</p>", // 17 
                        
                        "<p>This time, the highlighted architectures have the feature "
                        +"\"AERO_LID and HYP_ERB are never used, and SAR_ALTIM is assigned to at least one of the orbits\". "
                        +"Let\'s call this feature B.</p>"
                        +"<p>If you look closely, you will find that many of the pink dots have disappeared. "
                        +"This is good becuase we wanted to find a feature that uniquely describes the target region "
                        +"and does not cover the non-target region. </p>"
                        +"<p>We say that feature B is specific to the target region, and this is the second criterion "
                        +"that we require from a good feature.</p>", // 18

                        "<p>However, you may notice that many of the purple dots (target designs covered by the feature) have also disappeared. "
                        +"Only a very small portion of the targets are in purple color now.</p>"
                        +"<p>Therefore, feature B is too specific, meaning that it only accounts for a small number of targets. "
                        +"Or you can say that the coverage of target designs have decreased. </p>", // 19

                        "<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature: </p>"
                        +"<ol><li>Coverage (The feature should cover a large area of the target region - maximize the number of purple dots)</li>"
                        +"<li>Specificity (The feature should be specific enough, so that it does not cover the non-target region - minimize the number of pink dots)</li></ol>"
                        +"<p>As we have seen in the previous example, there is a trade-off between these two conditions. </p>"
                        +"<p>If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). </p>"
                        +"<p>On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). "
                        +"Therefore, the key is finding the right balance between those two criteria</p>", // 20

                        "<p>Feature Analysis tab provides a visualization that shows how much coverage and specificity different features have.</p>", // 21

                        "<p>In this plot, each feature is represented by a triangle.</p>"
                        +"<p>The horizontal axis corresponds to the specificity, and the vertical axis corresponds to the coverage of a feature.</p>"
                        +"<p>The color of a triangle represents how complex a feature is. Features that are blue are the most simplest, "
                        +"and they get more complex as the color gets close to red.</p>", // 22

                        "<p>Again, a good feature must have both large specificity and large coverage.</p>", // 23

                        "<p>As you hover the mouse over each feature, you can notice two changes occurring in the interface.</p>", // 24

                        "<p>First, a group of dots on the scatter plot is highlighted in pink and purple color. </p>"
                        +"<p>Again, pink and purple dots represent designs have the feature that you are currently inspecting "
                        +"(purple is the overlap between pink and blue)</p>", // 25

                        "<p>Second, a graphical representation of the feature will appear in the Feature Application panel.</p>"
                        +"<p>The Feature Application panel shows the current feature that is applied.</p>", // 26

                        "<p>To add features to the Feature Application Panel, you have to click on one of the features shown on the Feature Analysis tab.</p>"
                        +"<p> Hovering your mouse over the features will result in temporary change in the Feature Application Panel, "
                        +"and by clicking you can fix the change.</p>"
                        +"<p>(To continue, click on a feature to fix the feature in Feature Application Panel)</p>", // 27

                        "Once a feature is added, you will see that one of the triangle is colored black and starts to blink. "
                        +"It shows where the current feature is located.", // 28

                        "<p>In the graphical representation of a feature, there exist the following two different types of nodes: </p>"
                        +"<ol><li>logical connectives (AND, OR)</li>"
                        +"<li>individual conditions</li></ol>"
                        +"<p>The logical connectives are used to specify how individual conditions should be combined logically.</p>", // 29

                        "<p>We just covered all the capabilities of iFEED, and now you are ready to start the experiment. "
                        +"Before proceeding to the next step, please read the following directions carefully." // 30

                        ];




                // +'<p style="font-weight:bold; font-size:23px">  - In the actual task, you will be asked to answer 36 questions about three different datasets. </p>'
                
                // +'<p style="font-weight:bold; font-size:23px"> - To answer each question, you will need to use iFEED to find good features shared by the target designs. '
                // +'Only a subset of capabilities introduced in this tutorial may be available for you to use.</p>'
                
                // +'<p style="font-weight:bold; font-size:23px">  - Try to answer each question as accurately as possible, and at the same time, as quickly as possible. Both accuracy and answer time are equally important in this experiment.</p>'
                        
                // +'<p style="font-weight:bold; font-size:23px">  - We expect each question to take around 1~2 minutes to answer. If it takes more than that, you are probably overthinking it. If you are not sure about the answer, simply select the answer that you think is right given the information you have.</p>'

                // +'<p>Now you are ready to start the experiment. You can move on to the experiment by clicking the button below. Good luck!</p>';
            


            classname = 'introjs_tooltip_large';
                        
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;
                that.set_introjs_moveButtonCallback(this._currentStep);

                if(this._currentStep === 1){
                    document.getElementById('tab1').click();

                } else if(this._currentStep === 3){

                } else if (this._currentStep === 4){
                    document.getElementById('tab1').click();
                    PubSub.publish(INSPECT_ARCH, that.problem.data[1039]);
                
                } else if (this._currentStep === 6){
                    document.getElementById('tab2').click();

                } else if (this._currentStep === 7){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_present", this._currentStep);
                    
                } else if (this._currentStep === 9){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);
                    
                } else if (this._currentStep === 10){
                    document.getElementById('tab2').click();

                } else if (this._currentStep === 11){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_inOrbit", this._currentStep);
                    
                } else if (this._currentStep === 12){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);

                } else if (this._currentStep === 13){
                    document.getElementById('tab2').click();

                } else if (this._currentStep === 16){
                    that.experiment.filter.apply_filter_expression(tutorial_feature_example_e);

                } else if (this._currentStep === 18){
                    that.experiment.filter.apply_filter_expression(tutorial_feature_example_f);

                } else if (this._currentStep === 21){
                    PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                    that.experiment.feature_application.clear_feature_application();

                } else if (this._currentStep === 26){
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_f);
                
                } else if (this._currentStep === 27){
                    PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                    that.experiment.feature_application.clear_feature_application();
                    that.start_tutorial_event_listener("feature_clicked", this._currentStep);
                } 
            }            
            

        } else if(stage === 'design_synthesis'){

            objects = [
                        null, // 0
                        null, // 1
                    ];
            
            contents = [

                "<p>In this step, we will test your ability to come up with new designs.</p>", // 0 

                "<p>The scatter plot is now empty, </p>" // 1

                        ];
            
            classname = 'introjs_tooltip_large';
                        
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;

                if(this._currentStep === 0){
                    document.getElementById('tab1').click();

                } else if (this._currentStep === 1){
                    document.getElementById('tab1').click();
                    PubSub.publish(INSPECT_ARCH, that.problem.data[1039]);
                
                } else if (this._currentStep === 6){
                    document.getElementById('tab2').click();
                    that.experiment.select_archs_using_ids(tutorial_selection);

                } else if (this._currentStep === 7){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_present", this._currentStep);
                    
                } else if (this._currentStep === 9){
                    document.getElementById('tab2').click();
                    that.experiment.select_archs_using_ids(tutorial_selection);
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);
                    
                } else if (this._currentStep === 10){
                    document.getElementById('tab2').click();

                } else if (this._currentStep === 11){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_inOrbit", this._currentStep);
                    
                } else if (this._currentStep === 12){
                    document.getElementById('tab2').click();
                    that.experiment.select_archs_using_ids(tutorial_selection);
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);

                } else if (this._currentStep === 13){
                    document.getElementById('tab2').click();

                } 
            }            
        }
                
        this.start_intro(objects, contents, classname, callback);
    }

    start_experiment(){
        let that = this;
        this.intro.exit();

        // Load the data
        this.problem.metadata.file_path = "ClimateCentric_050819.csv";
        PubSub.publish(LOAD_DATA, null);

        // Start the experiment after some delay
        setTimeout(() => {
            PubSub.publish(EXPERIMENT_START, null);
        }, 1000); // How long do you want the delay to be (in milliseconds)? 

        //window.location.replace("https://www.selva-research.com/experiment/");
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

    set_introjs_moveButtonCallback(currentStep){
        if(!$('.introjs-nextbutton').get(0) || !$('.introjs-prevbutton').get(0)){
            return;
        }
        let that = this;
        let nextStep = currentStep + 1;
        let prevStep = currentStep - 1;
        let max = this.intro._introItems.length - 1;
        let min = 0;

        if(currentStep !== max){
            while(true){
                if(that.steps_to_skip.indexOf(nextStep) !== -1){
                    nextStep += 1;
                }else{
                    break;
                }
            }

            $('.introjs-nextbutton').get(0).onclick = () => {
                that.intro.goToStepNumber(nextStep + 1);
            }            
        }

        if(currentStep !== min){
            while(true){
                if(that.steps_to_skip.indexOf(prevStep) !== -1){
                    prevStep -= 1;
                }else{
                    break;
                }
            }

            $('.introjs-prevbutton').get(0).onclick = () => {
                that.intro.goToStepNumber(prevStep + 1);
            }            
        }
    }

}




let tutorial_feature_example_a = "({present[;11;]}||{inOrbit[4;7;]})";

let tutorial_feature_example_b = "{present[;1;]}&&{notInOrbit[2;1;]}&&{notInOrbit[3;1;]}&&{absent[;3;]}&&{notInOrbit[2;8;]}&&{notInOrbit[0;4;]}&&{notInOrbit[3;5;]}&&{notInOrbit[2;4;]}&&{separate[;4,2;]}&&{notInOrbit[2;7;]}&&{notInOrbit[4;0;]}&&{notInOrbit[3;0;]}&&{notInOrbit[2;2;]}&&{notInOrbit[3;9;]}&&{notInOrbit[4;2;]}";

let tutorial_feature_example_c = "({present[;11;]}&&{absent[;2;]}&&{absent[;3;]}&&{separate[;4,8,9;]}&&{separate[;2,3,11;]}&&{separate[;2,5,11;]})";

let tutorial_feature_example_d = "({separate[;3,5,11;]}&&{present[;11;]}&&({separate[;2,4,8;]}||{absent[;3;]}||{inOrbit[3;0,4;]}))";

let tutorial_feature_example_e = "{absent[;3;]}";

let tutorial_feature_example_f = "({absent[;2;]}&&{absent[;3;]}&&{present[;11;]})";

let tutorial_selection = "3,6,8,12,13,14,15,17,19,20,25,26,27,37,38,42,46,47,50,51,53,55,58,60,61,64,68,72,76,77,81,88,91,93,94,95,96,100,101,102,104,106,108,111,118,119,120,121,122,123,125,128,129,130,135,139,143,144,148,149,153,165,167,168,169,173,175,176,177,179,186,189,191,194,196,199,200,217,219,221,223,224,225,227,229,230,231,232,234,237,239,240,248,249,250,255,258,261,266,268,273,280,282,287,288,289,298,303,312,313,322,324,325,332,337,339,341,342,349,352,353,354,359,360,363,365,366,368,369,370,372,373,375,379,381,382,384,387,388,397,402,408,409,420,423,425,439,442,444,461,473,476,490,504,506,510,514,519,523,527,532,540,546,561,571,575,594,600,601,604,611,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,686,687,688,692,699,703,704,707,718,720,725,727,728,733,736,740,741,742,744,746,751,761,762,769,770,774,778,781,786,790,793,800,801,805,810,812,813,815,816,823,825,832,835,840,846,856,861,862,865,872,877,886,889,891,896,899,905,910,911,912,917,929,933,939,943,945,950,952,960,965,967,975,977,978,986,1003,1005,1010,1018,1021,1024,1027,1029,1031,1032,1035,1036,1042,1045,1052,1053,1058,1059,1068,1070,1076,1077,1084,1085,1089,1094,1096,1113,1117,1119,1120,1121,1124,1137,1157,1158,1162,1163,1172,1177,1181,1182,1194,1195,1214,1224,1228,1242,1254,1262,1263";

let tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}";
