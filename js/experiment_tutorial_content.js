
var TUTORIAL_CONTENT = null;
function loadTutorialContent(){
    TUTORIAL_CONTENT = [
        {
            name: "tutorial-intro-opening",
            object: null, 
            content: "<p>In this experiment, you will use a web-based data analysis tool called iFEED. "
                    +"It is a program developed to help engineers solve complex system architecting problems. </p>"
                    +"<p>This tutorial will walk you through the capabilities of iFEED and explain how you can use them to analyze data.</p>"
                    +"<p>After this tutorial is finished, you will use the tool to analyze a given dataset. "
                    +"Then, you will be asked to answer a series of questions to test how much you have learned from analyzing the data. </p>", 
            callback: null,
        },
        {
            name: "tutorial-intro-timer",
            object: d3.select('#timer').node(), 
            content: "<p>The elapsed time is shown here. We expect this tutorial to take no more than 20 minutes.</p>"
                    +"<p>For certain tasks during this experiment, there may be time limits. "
                    +"In such cases, the remaining time will be displayed here.</p>",
            callback: function(currentStep){
                document.getElementById('tab1').click();
                PubSub.publish(INSPECT_ARCH, problem.data[1239]);
            },
        },
        {
            name: "tutorial-intro-task",
            object: undefined,
            content: "<p>The task at hand deals with architecting a constellation of satellites for Earth observation.</p>"
                    +"<p>Each design consists of multiple satellites carrying different sensors "
                    +"working together to satisfy some measurement requirements related to climate monitoring.</p>",
            callback: null,
        },
        { 
            name: "tutorial-problem-formulation",
            object: d3.select('#support_panel').node(),
            content: "<p>The diagram here shows how each design is defined. </p>"
                    +"<p>The architecture is defined by assigning a set of remote-sensing instruments "
                    +"(e.g. altimeter, radiometer, spectrometers, etc.) to spacecraft, "
                    +"which will fly in different orbits (determined by the altitude above the Earth, inclination with respect to the Equator, etc.).</p>"
                    +"<p>In the diagram, each row represents one spacecraft flying in the specified orbit. "
                    +"The columns represent what measurement instruments are onboard each of those spacecraft.</p>",
            callback: null,
        },
        {
            name: "tutorial-problem-formulation-candidate-orbits",
            object: null,
            content: "<p>In total, there are 5 candidate orbits, and 12 candidate instruments that are considered in this problem. "
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
            callback: null,
        },
        {
            name: "tutorial-problem-formulation-candidate-instruments",
            object: null,
            content: "<p>The following is the list of 12 candidate instruments considered in this problem.</p>"
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
            callback: null,
        },
        {
            name: "tutorial-problem-formulation-objectives",
            object: d3.select('#support_panel').node(),
            content: "<p>Each design has corresponding science benefit score and cost. The science benefit score "
                    +"is a number that tells us how much value each design brings to the climate monitoring community. </p>"
                    +"<p>The cost is a measure of how much it is going to cost (in million dollars) to design, implement, launch and operate "
                    +"those systems.</p>"
                    +"<p>Naturally, low-cost and high-science designs are desirable. Note that, depending on how instruments are assigned "
                    +"to different orbits, the science score and the cost may vary significantly.</p>",
            callback: null,
        },
        {
            name: "tutorial-ifeed",
            object: undefined, 
            content: "<p>Now that we have covered the basic information about the problem, "
                    +"we will go over different parts of iFEED and explain how to use it to analyze the data.</p>"
                    +"<p>iFEED is a tool that supports the discovery of the key knowledge on what constitutes good designs.</p>", 
            callback: null,
        },
        {
            name: "tutorial-ifeed-scatter-plot",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "The main display of iFEED is a scatter plot of different architectures of a satellite system. "
                    +"Each dot corresponds to one architecture, and its location indicates the corresponding cost and the scientific benefit.", 
            callback: null,
        },
        {
            name: "tutorial-ifeed-target-region",
            object: null,
            content: "<p>In a given task, a group of dots will be highlighted in a light blue color. "
                    +"These dots represent the target architectures that you need to investigate. </p>"
                    +"<p>The goal here is to find patterns that are shared uniquely by these architectures. </p>"
                    +"<p>Learning what constitutes good designs is useful, as you can learn more about the design problem and "
                    +"the model used to evaluate the architectures.</p>",
            callback: function(currentStep){},
        },
        {
            name: "tutorial-ifeed-inspecting-design",
            object: d3.select('.column.c1').node(),
            content: "If you hover the mouse over an architecture on the scatter plot, "
                    +"the relevant information will be displayed on the \"Inspect Design\" tab.", 
            callback: function(currentStep){
                document.getElementById('tab1').click();
                PubSub.publish(INSPECT_ARCH, tutorial.problem.data[1039]);
            },
        },
        {
            name: "tutorial-ifeed-inspecting-design-2",
            object: d3.selectAll('#support_panel').node(),
            content: "The displayed information contains the science benefit score and the cost, as well as a figure that shows "
                    +"which set of instruments are assigned to each orbit.", 
            callback: function(currentStep){
                document.getElementById('tab1').click();
            },
        },
        {
            name: "tutorial-ifeed-filter-intro-v1",
            object: null,
            content: "The filter setting tab allows you to highlight a group of architectures that share the common feature that you define", 
            callback: function(currentStep){
                document.getElementById('tab2').click();
            },
        },
        {
            name: "tutorial-ifeed-filter-intro-v2",
            object: null,
            content: "Adding new features can be done using the filter setting tab.", 
            callback: function(currentStep){
                document.getElementById('tab2').click();
            },
        },
        {
            name: "tutorial-ifeed-filter-options",
            object: d3.select('.filter.options.dropdown').node(),
            content: "<p>To use a filter, you need to first select the filter type from a given list of available filters. "
                    +"For example, try selecting the filter named \"Present\".</p>"
                    +"<p>(Select the filter Present to continue)</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_select_present", currentStep);
            },
        },
        {
            name: "tutorial-ifeed-filter-present",
            object: d3.select('#support_panel').node(),
            content: "The filter \"Present\" is used to selectively highlight designs that contain a specific instrument. "
                    +"It takes in one instrument as an argument, and selects all designs that use the specified instrument.", 
            callback: null,
        },
        {
            name: "tutorial-ifeed-filter-present-apply",
            object: null,
            content: "<p>To apply the filter, you need to select an instrument and click the 'Apply Filter' button. </p>"
                    +"<p>To continue, select an instrument and apply the filter.</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_applied", currentStep);
            },
        },
        {
            name: "tutorial-ifeed-filter-present-outcome",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>Take a look at the scatter plot, and note that some dots have turned pink or purple. "
                    +"These dots are all the architectures that have the feature you just defined. In other words, these architectures "
                    +"use the instrument [PLACEHOLDER]. </p>"
                    +"<p>The pink dots represent designs that have the feature, but are not in the target region. "
                    +"The purple dots represent designs that have the feature and are inside the target region (highlighted in blue). </p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                let keywords = [d3.select('.filterInputDiv.instrumentInput').select('select').node().value];
                let placeholders = ["[PLACEHOLDER]"];
                tutorial.fill_in_keyword_placeholder(currentStep, keywords, placeholders);
            },
        },
        {
            name: "tutorial-ifeed-filter-inOrbit",
            object: d3.select('#support_panel').node(),
            content: "Let\'s explore one more filter. Select another filter called \"InOrbit\" to continue.", 
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_select_inOrbit", currentStep);
            },
        }, 
        {
            name: "tutorial-ifeed-filter-inOrbit-apply",
            object: null,
            content: "<p>\"InOrbit\" is used to selectively highlight designs that assign a specific instrument(s) to a given orbit. </p>"
                    +"<p>It takes in one orbit and one or more instruments as arguments. "
                    +"If more than one instrument are given, then it highlights all designs "
                    +"that assign all those instruments into the specified orbit.</p>"
                    +"<p>To continue, select an orbit and more than one instruments as arguments, and click 'Apply Filter' button.</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_applied", currentStep);
            }
        },
        {
            name: "tutorial-ifeed-filter-inOrbit-outcome",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "Again, the dots in pink or purple highlight the designs that have the feature you just defined: "
                    +"\"[PLACEHOLDER2] is/are assigned to [PLACEHOLDER1]\"", 
            callback: function(currentStep){
                document.getElementById('tab2').click();

                let orbit = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                let instruments = [];
                let instrumentSelects = d3.selectAll('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                for(let i = 0; i < instrumentSelects.length; i++){
                    if(instrumentSelects[i].value !== "select"){
                        instruments.push(instrumentSelects[i].value);
                    }
                }
                let instrumentKeyword = "{" + instruments.join(", ") + "}";
                let keywords = [orbit, instrumentKeyword];
                let placeholders = ["[PLACEHOLDER1]", "[PLACEHOLDER2]"];
                tutorial.fill_in_keyword_placeholder(currentStep, keywords, placeholders);
            }
        }, 
        {
            name: "tutorial-ifeed-feature-intro-v1",
            object: undefined,
            content: "<p>So far, we have been using the term \"feature\" to refer to the description of a pattern that can be found "
                    +"among the target designs (highlighted in blue). Below are some examples of what features might look like:</p>"
                    +"<ul><li>OCE_SPEC is assigned to LEO-600-polar</li>"
                    +"<li>AERO_LID and CHEM_UVSPEC are assigned together in the same orbit</li>"
                    +"<li>Orbit SSO-800-PM is empty</li>"
                    +"<li>HYP_ERB is assigned to either LEO-600-polar or SSO-600-AM</li>"
                    +"</ul>"
                    +"<p>Some of these features are better than others in explaining the target designs. "
                    +"We use two different criteria to define the \"goodness\" of a feature.</p>", 
            callback: null
        }, 
        { 
            name: "tutorial-ifeed-feature-intro-v2",
            object: undefined,
            content: "<p>Now, we will introduce the term \"feature\". Feature is the description of a pattern that can be found "
                    +"among the target designs (highlighted in blue). Below are some examples of what features might look like:</p>"
                    +"<ul><li>OCE_SPEC is assigned to LEO-600-polar</li>"
                    +"<li>AERO_LID and CHEM_UVSPEC are assigned together in the same orbit</li>"
                    +"<li>Orbit SSO-800-PM is empty</li>"
                    +"<li>HYP_ERB is assigned to either LEO-600-polar or SSO-600-AM</li>"
                    +"</ul>"
                    +"<p>Some of these features are better than others in explaining the target designs. "
                    +"We use two different criteria to define the \"goodness\" of a feature.</p>", 
            callback: null,
        }, 
        {
            name: "tutorial-ifeed-feature-metric-coverage",
            object: undefined,
            content: "<p>The first metric we use to define the \"goodness\" of a feature is called the coverage of a feature.</p>",
            callback: null,
        }, 
        {
            name: "tutorial-ifeed-feature-metric-coverage-scatter-plot-v1",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>The architectures currently highlighted in pink and purple represent architectures "
                    +"that \"do not assign HYP_ERB to any orbit\". "
                    +"Let\'s call this feature A.</p>" 
                    +"<p>Note that many of the target designs share feature A (as indicated by the large number of purple dots). "
                    +"We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.</p>", 
            callback: function(currentStep){
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_e);
            },
        }, 
        {
            name: "tutorial-ifeed-feature-metric-coverage-scatter-plot-v2",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>The architectures currently highlighted in pink and purple represent architectures "
                    +"that \"do not assign HYP_ERB to any orbit\". "
                    +"Let\'s call this feature A.</p>" 
                    +"<p>The pink dots represent designs that have the feature, but are not in the target region. "
                    +"The purple dots represent designs that have the feature and are inside the target region (highlighted in blue). </p>"
                    +"<p>Note that many of the target designs share feature A (as indicated by the large number of purple dots). "
                    +"We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.</p>", 
            callback: function(currentStep){
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_e);
            },
        }, 
        { 
            name: "tutorial-ifeed-feature-metric-coverage-insufficiency",
            object: null,
            content: "<p>However, feature A is not necessarily what we are looking for. It is too general, meaning that it also applies to "
                    +"many of the non-target designs as well (as indicated by the large number of pink dots). "
                    +"This leads us to the next criterion used to define a good feature.</p>", 
            callback: null,
        }, 
        { 
            name: "tutorial-ifeed-feature-metric-specificity",
            object: null,
            content: "<p>This time, the highlighted architectures have the feature "
                    +"\"AERO_LID and HYP_ERB are never used, and SAR_ALTIM is assigned to at least one of the orbits.\" "
                    +"Let\'s call this feature B.</p>"
                    +"<p>If you look closely, you will find that many of the pink dots have disappeared. "
                    +"This is good becuase we wanted to find a feature that uniquely describes the target region "
                    +"and does not cover the non-target region. </p>"
                    +"<p>We say that feature B is specific to the target region, and this is the second criterion "
                    +"that we require from a good feature.</p>",
            callback: function(currentStep){
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_f);
            },
        }, 
        {
            name: "tutorial-ifeed-feature-metric-specificity-insufficiency",
            object: null,
            content: "<p>However, you may notice that many of the purple dots (target designs covered by the feature) have also disappeared. "
                    +"Only a small portion of the targets are in purple color now.</p>"
                    +"<p>Therefore, feature B is too specific, meaning that it only accounts for a small number of targets. "
                    +"Or you can say that the coverage of target designs has decreased. </p>", 
            callback: null,
        }, 
        {
            name: "tutorial-ifeed-feature-metric-tradeoff",
            object: null,
            content: "<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature: </p>"
                    +"<ol><li>Coverage (The feature should cover a large area of the target region - maximize the number of purple dots)</li>"
                    +"<li>Specificity (The feature should be specific enough, so that it does not cover the non-target region - minimize the number of pink dots)</li></ol>"
                    +"<p>As we have seen in the previous example, there is a trade-off between these two conditions. </p>"
                    +"<p>If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). </p>"
                    +"<p>On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). "
                    +"Therefore, the key is finding the right balance between those two criteria. </p>", 
            callback: null,
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>Feature Analysis tab provides a visualization that shows how much coverage and specificity different features have.</p>", 
            callback: function(currentStep){
                PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                experiment.feature_application.clear_feature_application();
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot-2",
            object: null,
            content: "<p>In this plot, each feature is represented as a triangle.</p>"
                    +"<p>The horizontal axis corresponds to the specificity, and the vertical axis corresponds to the coverage of a feature.</p>"
                    +"<p>The color of a triangle represents how complex a feature is. Features that are blue are the simplest, "
                    +"and they get more complex as the color gets close to red.</p>", 
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot-3",
            object: null, 
            content: "<p>Again, a good feature must have both large specificity and large coverage.</p>", 
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot-mouse-over",
            object: d3.select('#content').node(),
            content: "<p>As you hover the mouse over each feature, you can notice two changes occurring in the interface.</p>"
                    +"<p>(Try hovering the mouse over a feature before continuing)</p>", 
            callback: function(currentStep){
                tutorial.start_tutorial_event_listener("feature_mouse_hover", currentStep, null);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot-mouse-over-2",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>First, a group of dots on the scatter plot is highlighted in pink and purple color. </p>"
                    +"<p>Again, pink and purple dots represent designs have the feature that you are currently inspecting "
                    +"(purple is the overlap between pink and blue)</p>", 
            callback: function(currentStep){
                experiment.feature_application.update_feature_application("temp", tutorial_feature_example_f);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-space-plot-mouse-over-3",
            object: d3.select('.column.c2').node(),
            content: "<p>Second, a graphical representation of the feature will appear in the Feature Application panel.</p>"
                    +"<p>The Feature Application panel shows the current feature that is applied.</p>", 
        }, 
        {  
            name: "tutorial-ifeed-feature-space-plot-mouse-click",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>To add features to the Feature Application Panel, you have to click on one of the features shown on the Feature Analysis tab.</p>"
                    +"<p> Hovering your mouse over the features will result in a temporary change in the Feature Application Panel, "
                    +"and by clicking you can fix the change.</p>"
                    +"<p>(To continue, click on a feature to fix the feature in Feature Application Panel)</p>", 
            callback: function(currentStep){
                PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
                experiment.feature_application.clear_feature_application();
                tutorial.start_tutorial_event_listener("feature_clicked", currentStep);
            }
        },
        { 
            name: "tutorial-ifeed-feature-space-plot-mouse-click-cursor",
            object: null, 
            content: "Once a feature is clicked, you will see that a cursor appears. "
                    +"The cursor shows where the currently selected feature is located.", 
        }, 
        { 
            name: "tutorial-ifeed-feature-application-node-types",
            object: d3.select('#feature_application').node(),
            content: "<p>In the graphical representation of a feature, there exist two different types of nodes: </p>"
                    +"<ol><li>logical connectives (AND, OR)</li>"
                    +"<li>individual conditions</li></ol>"
                    +"<p>The logical connective nodes are colored blue, and they are used to specify how individual conditions "
                    +"should be combined logically.</p>"
                    +"<p>The current feature can be described in text as: \"[PLACEHOLDER]\"</p>", 
            callback: function(currentStep){
                document.getElementById('tab3').click();
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_f);
                let expression = tutorial.feature_application.parse_tree(tutorial.feature_application.data);
                let ppExpression = tutorial.label.pp_feature_description(expression);
                let keywords = [ppExpression];
                let placeholders = ["[PLACEHOLDER]"];
                tutorial.fill_in_keyword_placeholder(currentStep, keywords, placeholders);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-intro-v1",
            object: null, 
            content: "<p>The feature graph not only acts as a visualization, but also as an interface for "
                    +"interactively modifying existing features or defining new ones.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-intro-v2",
            object: null, 
            content: "<p>In this task, the feature graph not only acts as a visualization, but also as an interface for "
                    +"interactively modifying existing features or defining new ones.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-drag-and-drop",
            object: null,
            content: "<p>You can move an individual node and place it under a different parent node using drag and drop. "
                    +"When you drag each node, temporary pink circles will appear around all other logical connective nodes. "
                    +"If you drop a node in one of those circles, the node will be added under that particular logical connective.</p>"
                    +"<p>To continue, try moving one node and placing it under a different parent node. </p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_d);
                tutorial.start_tutorial_event_listener("node_drag_end", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-changes-reflected",
            object: d3.select('.column.c1').node(),
            content: "<p>Note that, as you make changes in the feature graph, the main scatter plot and the feature analysis "
                    +"tab reflect the changes in real time.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu",
            object: d3.select('#feature_application').node(),
            content: "<p>You can view the options for various actions by right-clicking on each node. "
                    +"<p>There may be different set of options depending on the type of each node. "
                    +"We will go over two of these options as examples. </p>", 
            callback: function(currentStep){
                document.getElementById('tab3').click();
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_d);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-add-child",
            object: null,
            content: "<p>First, right-click on one of the logical connective nodes (AND or OR), "
                    +"and select \"Add child node here\" option. "
                    +"(To continue, select \"Add child node here\" option)</p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                tutorial.filter.initialize();
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_d);
                tutorial.start_tutorial_event_listener("contextmenu_add_feature", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-add-child-2",
            object: null,
            content: "<p>Note that the color of the logical connective node turned red. This indicates when you add a condition, "
                    +"it will be added under this parent node.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-add-child-3",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>Note that the title (highlighted in red) changed to \"Feature addition mode\". This indicates that when you apply a filter, "
                    +"it will be added as a condition under the selected logical connective node. </p>"
                    +"<p>To add a new condition, simply define a filter and click the button \"Add new condition\".</p>"
                    +"<p>(To continue, define a new filter by clicking \"Add new condition\" button)</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_modification", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-add-child-4",
            object: d3.select('#feature_application').node(),
            content: "<p>Note that the new node ([PLACEHOLDER]) is added to the selected logical connective node. </p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                let featureExpression = filter.generate_filter_expression_from_input_field();
                let ppExpression = experiment.label.pp_feature_single(featureExpression);
                let keywords = [ppExpression];
                let placeholders = ["[PLACEHOLDER]"];
                tutorial.fill_in_keyword_placeholder(currentStep, keywords, placeholders);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-modify-feature",
            object: null, 
            content: "<p>Let\'s try another option. Right-click on one of the leaf nodes and "
                    +"select \"Modify this feature\" option. "
                    +"(Select \"Modify this feature\" option to continue)</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("contextmenu_modify_feature", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-modify-feature-2",
            object: null, 
            content: "<p>Similarly as before, the color of the node and its connection to the parent node changed to red. "
                    +"This indicates that when you test a new condition, it will replace the current node.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-modify-feature-3",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>Again, the title text (highlighted in red) indicates that you are currently in \"Feature modification mode\". "
                    +"<p>This time, the arguments of the selected condition have been copied to the filter setting tab. This "
                    +"makes it easier to make modifications to the currently selected condition.</p>"
                    +"<p>(To continue, try making a slight change to the current condition and apply it by clicking \"Modify the condition\" button)</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
                tutorial.start_tutorial_event_listener("filter_modification", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-modify-feature-4",
            object: d3.select('.column.c2').node(),
            content: "<p>The selected node has been replaced by the new condition.</p>",
            callback: function(currentStep){
                document.getElementById('tab2').click();
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-interaction-context-menu-other",
            object: null,
            content: "<p>Other possible actions that can be applied to the node of a feature tree include \"Add parent branch\", \"Deactivate\" and \"Delete\". "
                    +"These options are used to add a parent node, deactivate the current node, and to delete the node, respectively. </p>"
                    +"<p>You can try different options later, as you use the interactive graph during the task.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper",
            object: d3.select('#feature_expression_panel').node(), 
            content: "<p>While you can test different features by manually modifying the feature, "
                    +"there are also automatic helper functions "
                    +"that improve the currently selected feature. </p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                experiment.feature_application.clear_feature_application();
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_g);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper-local-search",
            object: d3.select('.column.c2').node(),
            content: "<p>Once a feature has been selected, you can click either \"Improve specificity\", or \"Improve coverage\" button to "
                    +"improve one of the metrics. </p>"
                    +"<p>\"Improve specificity\" button improves specificity by adding a new condition using AND (conjucntion), "
                    +"while \"Improve coverage\" improves coverage by adding a new condition using OR (disjunction). </p>"
                    +"<p>The current feature has good coverage and poor specificity. So, try clicking \"Improve specificity\" button.</p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                tutorial.start_tutorial_event_listener("local_search_conjunctive", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper-local-search-2",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>Note that some crosses appeared in the plot. If there are features that improve the current feature, "
                    +"they will appear in the Feature plot as crosses.</p>"
                    +"<p>You can use these helper functions to improve coverage and specificity of a feature up to a certain level. </p>"
                    +"<p>To continue, click one of the newly tested features (crosses)</p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                tutorial.start_tutorial_event_listener("new_feature_clicked", currentStep);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper-local-search-3",
            object: d3.select('#feature_application').node(),
            content: "<p>If you compare this feature to the previous one, the condition [PLACEHOLDER] has just been added. </p>"
                    +"Similarly, \"Improve coverage\" may be used to improve the coverage of a feature by adding new conditions under OR. </p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();
                let feature_application = experiment.feature_application;
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
                let ppExpression = experiment.label.pp_feature_single(addedBaseFeature.name);

                let keywords = [ppExpression, ppExpression];
                let placeholders = ["[PLACEHOLDER]", "[PLACEHOLDER]"];
                tutorial.fill_in_keyword_placeholder(currentStep, keywords, placeholders);
            }
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper-generalization",
            object: d3.select('.column.c2').node(),
            content: "<p>Another helper function that is available for use is generalizing the selected feature by clicking "
                    +"\"Generalize feature\" button.</p>"
                    +"<p>This button triggers a search for a more compact and general knowledge. It may help extracting information in a more "
                    +"useful form than what is represented in the current feature.</p>"
                    +"<p>To continue, click \"Generalize feature\" button</p>",
            callback: function(currentStep){
                document.getElementById('tab3').click();

                let listenerCallback = () => {
                    tutorial.intro.exit();
                    setTimeout(function() {
                        tutorial.set_tutorial_content("tutorial_end");
                    }, 1000);
                    return;
                }

                tutorial.start_tutorial_event_listener("generalization_suggestion", currentStep, listenerCallback);
                experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_h);
            }
        }, 
        {
            name: "tutorial-ifeed-feature-application-helper-generalization-popup",
            object: document.getElementsByClassName("iziToast-capsule")[0], 
            content: "<p>When the algorithm successfully finds a way to generalize the knowledge "
                    +"in the current feature, a popup message "
                    +"will appear as shown.</p>", 

            callback: function(currentStep){
                // Remove iziToast overlay layer
                d3.select('.iziToast-overlay').remove();

                // Get iziToast element
                let iziToastElement = document.querySelector('.iziToast-capsule');
                iziToastElement.parentNode.removeChild(iziToastElement);

                // Re-insert the iziToast element
                let body = document.querySelector('body');
                body.insertBefore(iziToastElement, body.childNodes[0]);

                let buttons = d3.selectAll(".iziToast-buttons-child.revealIn");
                for(let i = 0; i < buttons.nodes().length; i++){
                    buttons.nodes()[i].disabled = true;
                    buttons.select('b').style("opacity", "0.2");

                }
            },
        },
        { 
            name: "tutorial-ifeed-feature-application-helper-generalization-popup-2",
            object: null,
            content: "<p>The suggestion here is to generalize the knowledge by replacing instruments AERO_LID and HYP_IMAG "
                    +"to the concept \"Instrument that is capable of taking measurements related to vegetation (e.g. type, structure, leaf are)\"</p>"
                    +"<p>This generalization can be made as both instruments take measurements such as leaf area index.</p>",
        }, 
        { 
            name: "tutorial-ifeed-feature-application-helper-generalization-popup-3",
            object: null,
            content: "<p>You can either accept the suggestion or reject it, depending on whether you think the suggested generalization "
                    +"is useful or not. For now, click \"Accept\" to continue.</p>",
            
            callback: function(currentStep){
                tutorial.start_tutorial_event_listener("generalization_accept", currentStep);

                let buttons = d3.selectAll(".iziToast-buttons-child.revealIn");
                for(let i = 0; i < buttons.nodes().length; i++){
                    buttons.nodes()[i].disabled = false;
                    buttons.select('b').style("opacity", "1.0");
                }
            }
        },
        { 
            name: "tutorial-ifeed-feature-application-helper-generalization-outcome",
            object: d3.select('#feature_application_panel').node(),
            content: "<p>Note that a new node with generalized variable is added to the current feature. </p>"
                    +"<p>Generalization of knowledge may be helpful in finding useful knowledge that is otherwise very hard to identify.</p>",
        }, 
        { 
            name: "tutorial-ifeed-closing",
            object: undefined,
            content: "<p>We just covered all the capabilities of iFEED, and now you are ready to start the experiment. </p>"
                    +"<p>The first part of the experiment will be conducted on a separate window, which will be loaded automatically "
                    +"after clicking the next button below.</p>",
        },  
        { 
            name: "tutorial-open-concept-map",
            object: undefined, 
            content: "<p>Participant ID: "+ experiment.participantID +"</p>" ,
            callback: function(currentStep){
                window.open("https://www.selva-research.com/ifeed-experiment-conceptmap/");
            }
        },

        { 
            name: "learning-task-intro",
            object: undefined,
            content: "<p>In this step, you are given 30 minutes to analyze a dataset which is generated from running a "
                    +"multi-objective optimization algorithm.</p>"
                    +"<p>Your goal is to identify and record as many features as possible that are shared by the target designs.</p>" // 0
                    +"<p>Use the interactive concept graph provided in a separate window to record any interesting features that you find.</p>",
        }, 
        { 
            name: "learning-task-intro-2",
            object: undefined,
            content: "<p>After the 30-minute data analysis session, you will be asked to answer a series of questions about "
                    +"the given design problem and the dataset.</p>"
                    +"<p>Your answer to these questions will be used as a measure of how much you have learned during the data analysis session.</p>"
                    +"<p>Few sample questions are provided in a separate window (will be loaded automatically when you click next)</p>",
        },
        { 
            name: "learning-task-intro-3",
            object: undefined,
            content: "<p>As you answer the questions, you will only have access to the information you record in the interactive graph "
                    +"(separate window), and you will not be able to use iFEED.</p>"
                    +"<p>Therefore, try to record as much information as possible on the interactive graph.</p>",
            callback: function(){
                window.open("https://cornell.qualtrics.com/jfe/form/SV_bvZxj19eEYDWr5j");
            }
        },
        { 
            name: "learning-task-intro-4",
            object: undefined,
            content: "<p>The 30-minute data analysis session will begin now.</p>"
                    +"<p>If you have any question, please ask the experimenter before closing this window.</p>"
        },
        { 
            name: "learning-task-end",
            object: undefined,
            content: "<p>This is the end of the data analysis session. </p>"
                    +"<p>Now you will be asked to answer a series of questions to test how much you have learned.</p>"
                    +"<p>Please copy the participant ID (<b>"+ experiment.participantID +"</b>) "
                    +"and paste it into the survey page, which will be loaded when you click the finish button below</p>",
        },
        { 
            name: "feature-synthesis-intro",
            object: null,
            content: "<p>In this step, you are asked to create your own features based on what you have learned "
                    +"during the data analysis session.</p>",
            callback: function(){
                document.getElementById('tab3').click();
            }
        }, 
        { 
            name: "feature-synthesis-intro-2",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>The task here is to find the feature that has good coverage and good specificity.</p>"
                    +"<p>In other words, try to reach the top-right corner of this plot by adding new features.</p>",
            callback: function(){
                document.getElementById('tab3').click();
            }
        }, 
        {
            name: "feature-synthesis-intro-filter-setting",
            object: null,
            content: "<p>As before, you can define new features using the Filter Setting tab</p>",
            callback: function(){
                document.getElementById('tab2').click();
            }
        },  
        { 
            name: "feature-synthesis-intro-start",
            object: undefined,
            content: "<p>Now you are ready to start the task. Try to create the best feature based on what you have learned "
                    +"(features with high coverage and high specificity).</p>"
                    +"<p>Note that inspecting designs is disabled for this task.</p>"
                    +"<p>7 minutes will be given for this task.</p>",
        },
        { 
            name: "feature-synthesis-extra-filter-outcome",
            object: d3.select('.column.c2').node(),
            content: "<p>Once you use a filter, the corresponding feature will appear in the Feature Application Panel.</p>",
            callback: function(){
                document.getElementById('tab3').click();
            }
        },
        { 
            name: "design-synthesis-intro",
            object: null,
            content: "<p>In this step, you are asked to come up with your own designs based on what you have learned "
                    +"during the data analysis session.</p>",
            callback: function(){
                document.getElementById('tab1').click();
            }
        }, 
        {
            name: "design-synthesis-intro-2",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>The scatter plot is now empty, and the task here is to create as many architectures as possible "
                    +"that are close to, or inside the target region. </p>"
                    +"<p>The architectures from the previous task are displayed faintly, "
                    +"and can be used as a reference for determining how good your designs are.</p>",
        }, 
        { 
            name: "design-synthesis-intro-3",
            object: null,
            content: "<p>Creating a new architecture can be done by assigning instruments to orbits through drag and drop.</p>",
        }, 
        { 
            name: "design-synthesis-intro-4",
            object: d3.select('#instr_options_display').node(),
            content: "<p>The candidate instruments are provided here. You can drag an instrument from here.</p>",
        }, 
        { 
            name: "design-synthesis-intro-5",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>The candidate orbits are provided here. You can drop the instrument to any of the orbit slots.",
        }, 
        { 
            name: "design-synthesis-intro-6",
            object: d3.select('#content').node(), 
            content: "<p>To continue, try assigning any instrument to an empty orbit.</p>",
            callback: function(currentStep){
                tutorial.start_tutorial_event_listener("instrument_assigned", currentStep);
            }
        }, 
        { 
            name: "design-synthesis-intro-7",
            object: d3.selectAll('#support_panel').node(),
            content: "<p>You can also modify an architecture by moving instruments from one orbit to another.</p>"
                    +"<p>(To continue, try moving an instrument from one orbit to another)</p>",
            callback: function(currentStep){
                tutorial.start_tutorial_event_listener("architecture_modified", currentStep);
            }
        }, 
        {
            name: "design-synthesis-intro-8",
            object: d3.select('#evaluate_architecture_button').node(),   
            content: "<p>After modifying the architecture, you can evaluate its science score and cost by clicking \"Evaluate this design\" button.</p>"
                    +"<p>(To continue, click \"Evaluate this design\" button)</p>",
            callback: function(currentStep){
                tutorial.start_tutorial_event_listener("architecture_evaluated", currentStep);
            }
        }, 
        { 
            name: "design-synthesis-intro-9",
            object: d3.select('.tradespace_plot.figure').node(),
            content: "<p>The newly evaluated architecture will be highlighted in red.</p>",
        }, 
        { 
            name: "design-synthesis-intro-10",
            object: undefined,
            content: "<p>Now you are ready to start the task. Again, try to create as many architectures as possible that are close "
                    +"to, or inside the target region (highlighted in light blue color).</p>"
                    +"<p>7 minutes will be given for this task.</p>",
        }
    ];
}
        