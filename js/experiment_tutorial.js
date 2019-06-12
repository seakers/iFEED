

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
        this.current_step = null;  
        this.steps_to_skip = [];

        // Import the tutorial dataset
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
            this.experiment.select_archs_using_ids(tutorial_selection);

            // Set steps to skip
            if(this.treatmentCondition === 0){
                this.steps_to_skip = [21];
            }else if(this.treatmentCondition === 1){
                this.steps_to_skip = [20];
            }else if(this.treatmentCondition === 2){
                this.steps_to_skip = [21];
            } 

            // Load the treatment condition
            this.experiment.load_treatment_condition(true);

            // Set timer callback events
            let d1 = 15 * 60 * 1000;
            let d2 = 20 * 60 * 1000;
            let a1 = function(){
                let diff = that.intro._introItems.length - that.intro._currentStep - 1;
                alert("15 minutes passed! This is just a friendly reminder that there are " + diff + " more pages in this tutorial.");
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

        }else if(this.experiment.stage === "learning"){
            this.experiment.clock.resetClock();

        }else if(this.experiment.stage === "design_synthesis"){
            this.experiment.clock.resetClock();
        }

        this.set_tutorial_content(this.experiment.stage);
    }

    start_intro(objects, messages, classname, callback){
        
        if(messages.length === 1){
            this.intro.setOption('showButtons',true)
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
        if(messages.length > 1){
            $('.introjs-skipbutton').hide();
        }
        this.intro.onafterchange(function(){          
            if (this._introItems.length - 1 == this._currentStep || this._introItems.length == 1) {

                if(that.experiment.stage !== "tutorial"){
                    $('.introjs-skipbutton').show();
                }

                d3.select('.introjs-skipbutton')
                    .text(() => {
                        if(that.experiment.stage === "tutorial"){
                            return "START EXPERIMENT";
                        }else if(that.experiment.stage === "learning"){
                            return "START DESIGN ANALYSIS TASK";
                        }else if(that.experiment.stage === "design_synthesis"){
                            return "START DESIGN SYNTHESIS TASK";
                        }else if(that.experiment.stage === "learning_end"){
                            return "LOAD PROBLEM SET";
                        }else{
                            return "DONE"
                        }
                    })
                    .style('color','red');
            } 
        });

        this.intro.oncomplete(function() {
            if(that.experiment.stage === "tutorial"){ 

                // Load the data
                that.problem.metadata.file_path = "ClimateCentric_050819.csv";
                PubSub.publish(LOAD_DATA, null);

                // Generate sign in message
                that.experiment.generateSignInMessage(() => {
                    that.experiment.load_learning_task();
                    setTimeout(() => { PubSub.publish(EXPERIMENT_TUTORIAL_START, null);}, 300);
                });

            }else if(that.experiment.stage === "learning"){
                that.intro.exit();
                that.experiment.start_learning_task();

            }else if(that.experiment.stage === "learning_end"){
                that.intro.exit();
                window.open("https://cornell.qualtrics.com/jfe/form/SV_1Y9xdlpqH9gJSfz");

                //Move onto the next stage
                that.experiment.generateSignInMessage(() => {
                    that.experiment.load_design_synthesis_task();
                    setTimeout(() => { PubSub.publish(EXPERIMENT_TUTORIAL_START, null);}, 300);
                });

            }else if(that.experiment.stage === "design_synthesis"){
                that.intro.exit();
                that.experiment.start_design_synthesis_task();
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
        
        if(stage === 'tutorial' || typeof stage === 'undefined' || stage == null){
        
            objects = [
                null, // 0
                d3.select('#timer').node(), // 1
                undefined, // 2
                d3.select('#support_panel').node(), // 3
                null, // 4
                null, // 5
                d3.select('#support_panel').node(), // 6
                undefined, // 7
                d3.select('.tradespace_plot.figure').node(), // 8
                null, // 9
                d3.select('.column.c1').node(), // 10
                d3.selectAll('#support_panel').node(), // 11
                null, // 12
                d3.select('.filter.options.dropdown').node(), // 13
                d3.select('#support_panel').node(), // 14
                null, // 15
                d3.select('.tradespace_plot.figure').node(), // 16
                d3.select('#support_panel').node(), // 17
                null, // 18
                d3.select('.tradespace_plot.figure').node(), // 19
                undefined, // 20
                undefined, // 21
                undefined, // 22
                d3.select('.tradespace_plot.figure').node(), // 23
                null, // 24
                null, // 25
                null, // 26
                null, // 27
                d3.selectAll('#support_panel').node(), // 28
                null, // 29
                null, // 30
                d3.select('#content').node(), // 31
                d3.select('.tradespace_plot.figure').node(), // 32
                d3.select('.column.c2').node(), // 33
                d3.selectAll('#support_panel').node(), // 34
                null, // 35
                d3.select('#feature_application').node(), // 36
                null, // 37
                null, // 38
                d3.select('.column.c1').node(), // 39
                d3.select('#feature_application').node(), // 40
                null, // 41
                null, // 42
                d3.selectAll('#support_panel').node(), // 43
                d3.select('#feature_application').node(), // 44
                null, // 45
                null, // 46
                d3.select('.column.c2').node(), // 47
                d3.select('#feature_expression_panel').node(), // 48
                d3.selectAll('#support_panel').node(), // 49
                d3.select('#feature_application').node(), // 50
                d3.select('.column.c2').node(), // 51
            ];

            contents = [
                // 0
                "<p>In this experiment, you will use a web-based data analysis tool called iFEED. "
                +"It is a program developed to help engineers solve complex system architecting problems. </p>"
                +"<p>This tutorial will walk you through the capabilities of iFEED and explain how you can use them to analyze data.</p>"
                +"<p>After this tutorial is finished, you will use the tool to analyze a given dataset. "
                +"Then, you will be asked to answer a series of questions to test how much you have learned from analyzing the data. </p>", 

                // 1
                "<p>The elapsed time is shown here. We expect this tutorial to take no more than 20 minutes.</p>"
                +"<p>For certain tasks during this experiment, time limit may be applied. "
                +"In this case, the remaining time will be displayed here.</p>", 

                // 2
                "<p>The task at hand deals with architecting a constellation of satellites for Earth observation.</p>"
                +"<p>Each design consists of multiple satellites carrying different sensors "
                +"working together to satisfy some measurement requirements related to climate monitoring.</p>",

                // 3
                "<p>The diagram here shows how each design is defined. </p>"
                +"<p>The architecture is defined by assigning a set of remote-sensing instruments "
                +"(e.g. altimeter, radiometer, spectrometers, etc.) to spacecraft, "
                +"which will fly in different orbits (determined by the altitude above the Earth, inclination with respect to the Equator, etc.).</p>"
                +"<p>In the diagram, each row represents one spacecraft flying in the specified orbit. "
                +"The columns represent what measurement instruments are onboard each of those spacecraft.</p>",

                // 4
                "<p>In total, there are 5 candidate orbits, and 12 candidate instruments that are considered in this problem. "
                +"The following is the list of 5 candidate orbits.</p>"
                +'<table class="tg">'
                +'<tr><th class="tg-llyw">Candidate orbits</th><th class="tg-llyw">Description</th></tr>'
                +'<tr><td class="tg-0pky">LEO-600-polar</td><td class="tg-0pky">LEO with polar inclination at 600km altitude</td></tr>'
                +'<tr><td class="tg-0pky">SSO-600-AM<br></td><td class="tg-0pky">SSO with morning LTAN at 600km altitude</td></tr>'
                +'<tr><td class="tg-0pky">SSO-600-DD</td><td class="tg-0pky">SSO with dawn-dusk LTAN at 600km altitude</td></tr>'
                +'<tr><td class="tg-0lax">SSO-800-DD</td><td class="tg-0lax">SSO with dawn-dusk LTAN at 800km altitude</td></tr>'
                +'<tr><td class="tg-0lax">SSO-800-PM</td><td class="tg-0lax">SSO with afternoon LTAN at 600km altitude</td></tr>'
                +'</table>'
                +"<p>(LEO = Low Earth Orbit, SSO = Sun-Synchronous Orbit, AM = morning, PM = afternoonm, DD = dawn-dusk, "
                +"LTAN = Local Time of the Ascending Node)</p>",

                // 5
                "<p>The following is the list of 12 candidate instruments considered in this problem.</p>"
                +'<table class="tg">'
                +'<tr><th class="tg-r87d">Instrument</th><th class="tg-r87d">Description</th></tr>'
                +'<tr><td class="tg-s268">OCE_SPEC</td><td class="tg-s268">Ocean color spectrometer</td></tr>'
                +'<tr><td class="tg-s268">AERO_POL</td><td class="tg-s268">Aerosol polarimeter</td></tr>'
                +'<tr><td class="tg-s268">AERO_LID</td><td class="tg-s268">Differential absorption lidar</td></tr>'
                +'<tr><td class="tg-s268">HYP_ERB</td><td class="tg-s268">Short-wave / long-wave radiation budget</td></tr>'
                +'<tr><td class="tg-0lax">CPR_RAD</td><td class="tg-0lax">Cloud and precipitation radar</td></tr>'
                +'<tr><td class="tg-0lax">VEG_INSAR</td><td class="tg-0lax">Polarimetric L-band SAR</td></tr>'
                +'<tr><td class="tg-0lax">VEG_LID</td><td class="tg-0lax">Vegetation/ice green lidar</td></tr>'
                +'<tr><td class="tg-0lax">CHEM_UVSPEC</td><td class="tg-0lax">UV/VIS limb spectrometer</td></tr>'
                +'<tr><td class="tg-0lax">CHEM_SWIRSPEC</td><td class="tg-0lax">SWIR nadir spectrometer</td></tr>'
                +'<tr><td class="tg-0lax">HYP_IMAG</td><td class="tg-0lax">SWIR-TIR hyperspectral imager</td></tr>'
                +'<tr><td class="tg-0lax">HIRES_SOUND</td><td class="tg-0lax">IR atmospheric sounder</td></tr>'
                +'<tr><td class="tg-0lax">SAT_ALTIM</td><td class="tg-0lax">Wide-swath radar altimeter</td></tr>'
                +'</table>'
                +"<p>(SAR = Synthetic Aperture Radar, UV = Ultra Violet, VIS = VISible, SWIR = Short Wave InfraRed, "
                +"TIR = Thermal InfraRed, IR = InfraRed)</p>",

                // 6
                "<p>Each design has corresponding science benefit score and cost. The science benefit score "
                +"is a number that tells us how much value each design brings to the climate monitoring community. </p>"
                +"<p>The cost is a measure of how much it is going to cost (in million dollars) to design, implement, launch and operate "
                +"those systems.</p>"
                +"<p>Naturally, low-cost and high-science designs are desirable. Note that, depending on how instruments are assigned "
                +"to different orbits, the science score and the cost may vary significantly.</p>",
        
                // 7
                "<p>Now that we have covered the basic information about the problem, "
                +"we will go over different parts of iFEED and explain how to use it to analyze the data.</p>"
                +"<p>iFEED is a tool that supports the discovery of the key knowledge on what constitutes good designs.</p>", 

                // 8
                "The main display of iFEED is a scatter plot of different architectures of a satellite system. "
                +"Each dot corresponds to one architecture, and its location indicates the corresponding cost and the scientific benefit.", 
                
                // 9
                "<p>In a given task, a group of dots will be highlighted in a light blue color. "
                +"These dots represent the target architectures that you need to investigate. </p>"
                +"<p>The goal here is to find patterns that are shared uniquely by these architectures. </p>"
                +"<p>Learning what constitutes good designs is useful, as you can learn more about the design problem and "
                +"the model used to evaluate the architectures.</p>",
   
                // 10
                "If you hover the mouse over an architecture on the scatter plot, "
                +"the relevant information will be displayed on the \"Inspect Design\" tab.", 

                // 11
                "The displayed information contains the science benefit score and the cost, as well as a figure that shows "
                +"which set of instruments are assigned to each orbit.", 

                // 12 Filter 
                "The filter setting tab allows you to highlight a group of architectures that share the common feature that you define", 

                // 13 
                "<p>To use a filter, you need to first select the filter type from a given list of available filters. "
                +"For example, try selecting the filter named \"Present\".</p>"
                +"<p>(Select the filter Present to continue)</p>", 

                // 14
                "The filter \"Present\" is used to selectively highlight designs that contain a specific instrument. "
                +"It takes in one instrument name as an argument, and selects all designs that use the specified instrument.", 

                // 15
                "<p>To apply the filter, you need to type in an argument to the input text field and click the 'Apply Filter' button. </p>"
                +"<p>Type in one of the instrument names, and apply the filter to continue.</p>", 

                // 16
                "<p>Take a look at the scatter plot, and note that some dots have turned pink or purple. "
                +"These dots are all the architectures that have the feature you just defined. In other words, these architectures "
                +"use the instrument [PLACEHOLDER]. </p>"
                +"<p>The pink dots represent designs that have the feature, but are not in the target region. "
                +"The purple dots represent designs that have the feature and are inside the target region (highlighted in blue)</p>. ",

                // 17
                "Let\'s explore one more filter. Select another filter called \"InOrbit\" to continue.", 

                // 18
                "<p>\"InOrbit\" is used to selectively highlight designs that assign a specific instrument(s) to a given orbit. </p>"
                +"<p>It takes in an orbit name and instrument name(s) as arguments. "
                +"If more than one instrument name is given, then it highlights all designs "
                +"that assign all those instruments into the specified orbit.</p>"
                +"<p>Type in an orbit name and multiple instrument names, and apply the filter to continue.</p>", 

                // 19
                "Again, the dots in pink or purple highlight the designs that have the feature you just defined ([PLACEHOLDER1] is/are assigned to [PLACEHOLDER2])", 

                // 20 Feature intro
                "<p>So far, we have been using the term \"feature\" to refer to the description of a pattern that can be found "
                +"among the target designs (highlighted in blue). Below are some examples of what features might look like:</p>"
                +"<ul><li>OCE_SPEC is assigned to LEO-600-polar</li>"
                +"<li>AERO_LID and CHEM_UVSPEC are assigned together in the same orbit</li>"
                +"<li>Orbit SSO-800-PM is empty</li>"
                +"<li>HYP_ERB is assigned to either LEO-600-polar or SSO-600-AM</li>"
                +"</ul>"
                +"<p>Some of these features are better than others in explaining the target designs. "
                +"We use two different criteria to define the \"goodness\" of a feature.</p>", 

                // 21 Feature intro 2
                "<p>Now, we will introduce the term \"feature\". Feature is the description of a pattern that can be found "
                +"among the target designs (highlighted in blue). Below are some examples of what features might look like:</p>"
                +"<ul><li>OCE_SPEC is assigned to LEO-600-polar</li>"
                +"<li>AERO_LID and CHEM_UVSPEC are assigned together in the same orbit</li>"
                +"<li>Orbit SSO-800-PM is empty</li>"
                +"<li>HYP_ERB is assigned to either LEO-600-polar or SSO-600-AM</li>"
                +"</ul>"
                +"<p>Some of these features are better than others in explaining the target designs. "
                +"We use two different criteria to define the \"goodness\" of a feature.</p>", 

                // 22
                "<p>The first metric we use to define the \"goodness\" of a feature is called the coverage of a feature.</p>", 

                // 23
                "<p>The architectures currently highlighted in pink and purple represent architectures that \"do not assign HYP_ERB to any orbit\". "
                +"Let\'s call this feature A.</p>" 
                +"<p>Note that many of the target designs share feature A (as indicated by the large number of purple dots). "
                +"We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.</p>", 

                // 24
                "<p>However, feature A is not necessarily what we are looking for. It is too general, meaning that it also applies to "
                +"many of the non-target designs as well (as indicated by the large number of pink dots). "
                +"This leads us to the next criterion used to define a good feature.</p>", 
                
                // 25
                "<p>This time, the highlighted architectures have the feature "
                +"\"AERO_LID and HYP_ERB are never used, and SAR_ALTIM is assigned to at least one of the orbits\". "
                +"Let\'s call this feature B.</p>"
                +"<p>If you look closely, you will find that many of the pink dots have disappeared. "
                +"This is good becuase we wanted to find a feature that uniquely describes the target region "
                +"and does not cover the non-target region. </p>"
                +"<p>We say that feature B is specific to the target region, and this is the second criterion "
                +"that we require from a good feature.</p>", 

                // 26
                "<p>However, you may notice that many of the purple dots (target designs covered by the feature) have also disappeared. "
                +"Only a small portion of the targets are in purple color now.</p>"
                +"<p>Therefore, feature B is too specific, meaning that it only accounts for a small number of targets. "
                +"Or you can say that the coverage of target designs has decreased. </p>", 

                // 27
                "<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature: </p>"
                +"<ol><li>Coverage (The feature should cover a large area of the target region - maximize the number of purple dots)</li>"
                +"<li>Specificity (The feature should be specific enough, so that it does not cover the non-target region - minimize the number of pink dots)</li></ol>"
                +"<p>As we have seen in the previous example, there is a trade-off between these two conditions. </p>"
                +"<p>If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). </p>"
                +"<p>On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). "
                +"Therefore, the key is finding the right balance between those two criteria</p>", 

                // 28 Feature space plot
                "<p>Feature Analysis tab provides a visualization that shows how much coverage and specificity different features have.</p>", 

                // 29
                "<p>In this plot, each feature is represented as a triangle.</p>"
                +"<p>The horizontal axis corresponds to the specificity, and the vertical axis corresponds to the coverage of a feature.</p>"
                +"<p>The color of a triangle represents how complex a feature is. Features that are blue are the simplest, "
                +"and they get more complex as the color gets close to red.</p>", 

                // 30
                "<p>Again, a good feature must have both large specificity and large coverage.</p>", 

                // 31
                "<p>As you hover the mouse over each feature, you can notice two changes occurring in the interface.</p>"
                +"<p>(Try hovering the mouse over a feature before continuing)</p>", 

                // 32
                "<p>First, a group of dots on the scatter plot is highlighted in pink and purple color. </p>"
                +"<p>Again, pink and purple dots represent designs have the feature that you are currently inspecting "
                +"(purple is the overlap between pink and blue)</p>", 

                // 33
                "<p>Second, a graphical representation of the feature will appear in the Feature Application panel.</p>"
                +"<p>The Feature Application panel shows the current feature that is applied.</p>", 

                // 34
                "<p>To add features to the Feature Application Panel, you have to click on one of the features shown on the Feature Analysis tab.</p>"
                +"<p> Hovering your mouse over the features will result in a temporary change in the Feature Application Panel, "
                +"and by clicking you can fix the change.</p>"
                +"<p>(To continue, click on a feature to fix the feature in Feature Application Panel)</p>", 

                // 35
                "Once a feature is clicked, you will see that a cursor appears. "
                +"The cursor shows where the currently selected feature is located.", 

                // 36
                "<p>In the graphical representation of a feature, there exist two different types of nodes: </p>"
                +"<ol><li>logical connectives (AND, OR)</li>"
                +"<li>individual conditions</li></ol>"
                +"<p>The logical connective nodes are colored blue, and they are used to specify how individual conditions "
                +"should be combined logically.</p>"
                +"<p>The current feature can be described in text as: \"[PLACEHOLDER]\"</p>", 

                // 37
                "<p>The feature graph not only acts as a visualization, but also as an interface for "
                +"interactively modifying existing features or defining new ones.</p>",

                // 38
                "<p>You can move an individual node and place it under a different parent node using drag and drop. "
                +"When you drag each node, temporary pink circles will appear around all other logical connective nodes. "
                +"If you drop a node in one of those circles, the node will be added under that particular logical connective.</p>"
                +"<p>To continue, try moving one node and placing it under a different parent node. </p>",

                // 39
                "<p>Note that, as you make changes in the feature graph, the main scatter plot and the feature analysis "
                +"tab reflect the changes in real time.</p>",

                // 40
                "<p>You can view the options for various actions by right-clicking on each node. "
                +"<p>There may be different set of options depending on the type of each node. "
                +"We will go over two of these options as examples. </p>", 

                // 41
                "<p>First, right-click on one of the logical connective nodes (AND or OR), and select \"Add feature\" option. "
                +"(Select \"Add feature\" option to continue)</p>",

                // 42
                "<p>Note that the color of the logical connective node turned red. This indicates when you add a new feature, "
                +"it will be added under this parent node.</p>",

                // 43
                "<p>To add a new feature, go to \"Filter Setting\" tab, and apply any filter (To continue, add a new "
                +"feature by applying a filter).</p>",

                // 44
                "<p>Note that a new node is added to the selected logical connective node. </p>",

                // 45
                "<p>Let\'s try another option. Right-click on one of the condition nodes and select \"Add parent branch\" option. "
                +"(Select \"Add parent branch\" option to continue)</p>",

                // 46
                "<p>This adds a new parent logical connective node to the selected node. This may be used to introduce a nested structure.</p>"
                +"<p>Other possible actions include \"Deactivate\" and \"Delete\". These options are used to "
                +"deactivate and to delete the current node (or branch), respectively. </p>",

                // 47
                "<p>While you can test different features by manually modifying the feature, there are also automatic helper functions "
                +"that improve the currently selected feature. </p>",

                // 48
                "<p>Once a feature has been selected, you can click either \"Improve specificity\", or \"Improve coverage\" button to "
                +"improve one of the metrics. </p>"
                +"<p>\"Improve specificity\" button improves specificity by adding a new condition using AND (conjucntion), "
                +"while \"Improve coverage\" improves coverage by adding a new condition using OR (disjunction). </p>"
                +"<p>The current feature has good coverage and poor specificity. So, try clicking \"Improve specificity\" button.</p>",

                // 49
                "<p>Note that some crosses appeared in the plot. If there are features that improve the current feature, "
                +"they will appear in the Feature plot as crosses.</p>"
                +"<p>You can use these helper functions to improve coverage and specificity of a feature up to a certain level. </p>"
                +"<p>To continue, click one of the newly tested features (crosses)</p>",
                
                // 50
                "<p>If you compare this feature to the previous one, the condition [PLACEHOLDER] has just been added. </p>"
                +"<p>Since \"Improve specificity\" button was clicked, the condition [PLACEHOLDER] was added under the logical connective AND. "
                +"Similarly, \"Improve coverage\" may be used to improve the coverage of a feature by adding new conditions under OR. </p>",

                // 51
                "<p>Another helper function that is available for use is generalizing the selected feature by clicking "
                +"\"Generalize feature\" button.</p>"
                +"<p>This button triggers a search for a more compact and general knowledge. It may help extracting information in a more "
                +"useful form than what is represented in the current feature.</p>"
                +"<p>To continue, click \"Generalize feature\" button</p>",
            ];

            classname = 'introjs_tooltip_large';
                        
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;
                that.set_introjs_moveButtonCallback(this._currentStep);

                if(this._currentStep === 1){
                    document.getElementById('tab1').click();
                    PubSub.publish(INSPECT_ARCH, problem.data[1239]);

                } else if (this._currentStep === 10){
                    document.getElementById('tab1').click();
                    PubSub.publish(INSPECT_ARCH, that.problem.data[1039]);
                
                } else if (this._currentStep === 12){
                    document.getElementById('tab2').click();

                } else if (this._currentStep === 13){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_present", this._currentStep);
                    
                } else if (this._currentStep === 15){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);
                    
                } else if (this._currentStep === 16){
                    document.getElementById('tab2').click();

                    let presentInstrumentName = d3.selectAll('.filter.inputs.div').select('#filter_input_1').select('input').node().value;
                    that.intro._introItems[this._currentStep].intro = that.intro._introItems[this._currentStep].intro.replace("[PLACEHOLDER]", presentInstrumentName);

                } else if (this._currentStep === 17){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_select_inOrbit", this._currentStep);
                    
                } else if (this._currentStep === 18){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);

                } else if (this._currentStep === 19){
                    document.getElementById('tab2').click();
                    let inOrbitOrbName = d3.selectAll('.filter.inputs.div').select('#filter_input_1').select('input').node().value;
                    let inOrbitInstrName = d3.selectAll('.filter.inputs.div').select('#filter_input_2').select('input').node().value;
                    that.intro._introItems[this._currentStep].intro = that.intro._introItems[this._currentStep].intro.replace("[PLACEHOLDER1]", inOrbitInstrName);
                    that.intro._introItems[this._currentStep].intro = that.intro._introItems[this._currentStep].intro.replace("[PLACEHOLDER2]", inOrbitOrbName);

                } else if (this._currentStep === 23){
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_e);

                } else if (this._currentStep === 25){
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_f);

                } else if (this._currentStep === 28){
                    PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                    that.experiment.feature_application.clear_feature_application();

                } else if (this._currentStep === 31){
                    that.start_tutorial_event_listener("feature_mouse_hover", this._currentStep, null);

                } else if (this._currentStep === 32){
                    that.experiment.feature_application.update_feature_application("temp", tutorial_feature_example_f);
                
                } else if (this._currentStep === 34){
                    PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                    that.experiment.feature_application.clear_feature_application();
                    that.start_tutorial_event_listener("feature_clicked", this._currentStep);

                } else if(this._currentStep === 36){
                    document.getElementById('tab3').click();
                    let expression = that.feature_application.parse_tree(that.feature_application.data);
                    let ppExpression = that.label.pp_feature_description(expression);
                    that.intro._introItems[this._currentStep].intro = that.intro._introItems[this._currentStep].intro.replace("[PLACEHOLDER]", ppExpression);
                
                } else if(this._currentStep === 38){
                    document.getElementById('tab3').click();
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_d);
                    that.start_tutorial_event_listener("node_drag_end", this._currentStep);
                
                } else if(this._currentStep === 41){
                    document.getElementById('tab3').click();
                    that.start_tutorial_event_listener("contextmenu_add_feature", this._currentStep);
                
                } else if(this._currentStep === 43){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("filter_applied", this._currentStep);
                
                } else if(this._currentStep === 45){
                    document.getElementById('tab2').click();
                    that.start_tutorial_event_listener("contextmenu_add_parent", this._currentStep);
                
                } else if(this._currentStep === 47){
                    document.getElementById('tab3').click();
                    that.experiment.feature_application.clear_feature_application();
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_g);
                    
                } else if(this._currentStep === 48){
                    document.getElementById('tab3').click();
                    that.start_tutorial_event_listener("local_search_conjunctive", this._currentStep);

                } else if(this._currentStep === 49){
                    document.getElementById('tab3').click();
                    that.start_tutorial_event_listener("new_feature_clicked", this._currentStep);

                } else if(this._currentStep === 50){
                    document.getElementById('tab3').click();

                    let feature_application = that.experiment.feature_application;
                    let previousFeature = feature_application.construct_tree(feature_application, tutorial_feature_example_g);
                    let newFeature = feature_application.data;

                    let addedBaseFeature = null;
                    feature_application.visit_nodes(newFeature, (d1) => {
                        let matchFound = false;
                        feature_application.visit_nodes(previousFeature, (d2) => {
                            if(d1.name === d2.name){
                                matchFound = true;
                                return;
                            }
                        })
                        if(!matchFound){
                            addedBaseFeature = d1;
                        }
                    })

                    let ppExpression = that.experiment.label.pp_feature_single(addedBaseFeature.name);
                    that.intro._introItems[this._currentStep].intro = that.intro._introItems[this._currentStep].intro.replace(/\[PLACEHOLDER\]/g, ppExpression);
                
                } else if(this._currentStep === 51){
                    document.getElementById('tab3').click();

                    let listenerCallback = function(){
                        that.intro.exit();
                        setTimeout(function() {
                            that.set_tutorial_content("tutorial_end");
                        }, 3000);
                        return;
                    }

                    that.start_tutorial_event_listener("generalization", this._currentStep, listenerCallback);
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_h);
                }
            }

        } else if(stage === 'tutorial_end'){

            objects = [
                        document.getElementsByClassName("iziToast-capsule")[0], // 0
                        null,
                        null,
                        undefined,
                        undefined
                    ];
            
            contents = [

                "<p>When the algorithm successfully finds a way to generalize the knowledge in the current feature, a popup message "
                +"will appear as shown.</p>",

                "<p>The suggestion here is to generalize the knowledge by replacing instruments AERO_LID and HYP_IMAG "
                +"to the concept \"Instrument that is capable of taking measurements related to vegetation (e.g. type, structure, leaf are)\"</p>"
                +"<p>This generalization can be made as both instruments take measurements such as leaf area index.</p>",

                +"<p>You can either accept the suggestion or reject it, depending on whether you think the suggested generalization "
                +"is useful or not. For now, click \"Accept\" to continue.</p>",

                "<p>Generalization of knowledge may be helpful in finding useful knowledge that is otherwise very hard to extract.</p>",
                
                // 
                "<p>We just covered all the capabilities of iFEED, and now you are ready to start the experiment. </p>"
                +"<p>The first part of the experiment will be conducted on a separate window, which will be loaded automatically "
                +"after clicking the next button below.</p>",

                "<p>Participant ID: "+ that.experiment.participantID +"</p>" ,

                ];
                                    
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;

                if(this._currentStep === 0){
                    // Remove iziToast overlay layer
                    d3.select('.iziToast-overlay.fadeIn').remove();

                    // Get iziToast element
                    let iziToastElement = document.querySelector('.iziToast-capsule');
                    iziToastElement.parentNode.removeChild(iziToastElement);

                    // Re-insert the iziToast element
                    let body = document.querySelector('body');
                    body.insertBefore(iziToastElement, body.childNodes[0]);
                
                } else if(this._currentStep === 2){
                    that.start_tutorial_event_listener("generalization_accept", this._currentStep);

                } else if(this._currentStep === 5){
                    window.open("https://www.selva-research.com/ifeed-experiment-conceptmap/")
                }
            }  
  
        } else if(stage === 'learning'){

            objects = [
                        undefined, // 0
                    ];
            
            contents = [

                "<p>In this step, you are given 30 minutes to analyze a dataset which is generated from running a "
                +"multi-objective optimization algorithm</p>"
                +"<p>Your goal is to identify and record as many features as possible that are shared by the target designs.</p>" // 0
                +"<p>Use the interactive concept graph provided in a separate window to record any interesting features that you find.</p>",

                "<p>After the 30-minute learning session, you will be asked to answer a series of questions about "
                +"the given design problem and the dataset.</p>"
                +"<p>Your answer to these questions will be used as a measure of how much you have learned during the learning session.</p>"
                +"<p>Few sample questions are provided in a separate window (will be loaded automatically when you click next)</p>",

                "<p>As you answer the questions, you will only have access to the information you record in the interactive graph "
                +"(separate window), and you will not be able to use iFEED.</p>"
                +"<p>Therefore, try to record as much information as possible on the interactive graph.</p>",

                "<p>The 30-minute learning session will begin now.</p>"
                +"<p>If you have any question, please ask the experimenter before closing this window.</p>"

                ];
                                    
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;

                if(this._currentStep === 2){
                    window.open("https://cornell.qualtrics.com/jfe/form/SV_6gR0KArSoPVbfw1 ");
                } 
            }          

        } else if(stage === 'learning_end'){
            objects = [
                        undefined, // 0
                    ];
            contents = [
                "<p>This is the end of the data analysis session. </p>"
                +"<p>Now you will be asked to answer a series of questions to test how much you have learned.</p>"
                +"<p>Please copy the participant ID (<b>"+ that.experiment.participantID +"</b>) "
                +"and paste it into the survey page, which will be loaded when you click the finish button below</p>",
                ];
                           
        } else if(stage === 'design_synthesis'){

            objects = [
                        null, // 0
                        d3.select('.tradespace_plot.figure').node(), // 1
                        null, // 2
                        d3.select('#instr_options_display').node(), // 3
                        d3.selectAll('#support_panel').node(), // 4
                        d3.select('#content').node(), // 5
                        d3.selectAll('#support_panel').node(), // 6
                        d3.select('#evaluate_architecture_button').node(), // 7
                        d3.select('.tradespace_plot.figure').node(), // 8
                        undefined,
                    ];
            
            contents = [

                "<p>In this step, you are asked to come up with your own designs based on what you have learned "
                +"during the learning session.</p>", // 0 

                "<p>The scatter plot is now empty, and the task here is to create as many architectures as possible "
                +"that are close to the Pareto front (architectures having high science score and low cost)</p>"
                +"<p>The architectures from the previous task are displayed faintly, "
                +"and can be used as a reference for determining how good your designs are.</p>", // 1

                "<p>Creating a new architecture can be done by assigning instruments to orbits through drag and drop.</p>", // 2

                "<p>The candidate instruments are provided here. You can drag an instrument from here.</p>", // 3

                "<p>The candidate orbits are provided here. You can drop the instrument to any of the orbit slots.", // 4

                "<p>To continue, try assigning any instrument to an empty orbit.</p>", // 5

                "<p>You can also modify an architecture by moving instruments from one orbit to another.</p>"
                +"<p>(To continue, try moving an instrument from one orbit to another)</p>", // 6

                "<p>After modifying the architecture, you can evaluate its science score and cost by clicking \"Evaluate this design\" button.</p>"
                +"<p>(To continue, click \"Evaluate this design\" button)</p>", // 7

                "<p>The newly evaluated architecture will be highlighted in red.</p>", // 8

                "<p>Now you are ready to start the task. Again, try to create as many architectures as possible that are close "
                +"to the Pareto front (architectures having high science score and low cost).</p>"
                +"<p>15 minutes will be given for this task.</p>", // 9

                        ];
            
            classname = 'introjs_tooltip_large';
                        
            callback = function(targetElement) {
                that.enable_introjs_nextButton();
                that.current_step = this._currentStep;

                if(this._currentStep === 0){
                    document.getElementById('tab1').click();

                } else if (this._currentStep === 5){                
                    that.start_tutorial_event_listener("instrument_assigned", this._currentStep);
                    
                } else if (this._currentStep === 6){
                    that.start_tutorial_event_listener("architecture_modified", this._currentStep);

                } else if (this._currentStep === 7){
                    that.start_tutorial_event_listener("architecture_evaluated", this._currentStep);
                } 
            }            
        }
                
        this.start_intro(objects, contents, classname, callback);
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

let tutorial_feature_example_g = "({separate[;2,4,8;]}&&({absent[;2;]}||{present[;11;]})&&({present[;11;]}||{absent[;3;]}))";

let tutorial_feature_example_h = "({absent[;3;]}&&({present[;11;]}||{notInOrbit[3;1,2,9;]}))";

let tutorial_selection = "3,6,8,12,13,14,15,17,19,20,25,26,27,37,38,42,46,47,50,51,53,55,58,60,61,64,68,72,76,77,81,88,91,93,94,95,96,100,101,102,104,106,108,111,118,119,120,121,122,123,125,128,129,130,135,139,143,144,148,149,153,165,167,168,169,173,175,176,177,179,186,189,191,194,196,199,200,217,219,221,223,224,225,227,229,230,231,232,234,237,239,240,248,249,250,255,258,261,266,268,273,280,282,287,288,289,298,303,312,313,322,324,325,332,337,339,341,342,349,352,353,354,359,360,363,365,366,368,369,370,372,373,375,379,381,382,384,387,388,397,402,408,409,420,423,425,439,442,444,461,473,476,490,504,506,510,514,519,523,527,532,540,546,561,571,575,594,600,601,604,611,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,686,687,688,692,699,703,704,707,718,720,725,727,728,733,736,740,741,742,744,746,751,761,762,769,770,774,778,781,786,790,793,800,801,805,810,812,813,815,816,823,825,832,835,840,846,856,861,862,865,872,877,886,889,891,896,899,905,910,911,912,917,929,933,939,943,945,950,952,960,965,967,975,977,978,986,1003,1005,1010,1018,1021,1024,1027,1029,1031,1032,1035,1036,1042,1045,1052,1053,1058,1059,1068,1070,1076,1077,1084,1085,1089,1094,1096,1113,1117,1119,1120,1121,1124,1137,1157,1158,1162,1163,1172,1177,1181,1182,1194,1195,1214,1224,1228,1242,1254,1262,1263";

let tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}";
