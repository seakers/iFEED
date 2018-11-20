

class ExperimentTutorial{

    constructor(problem, experiment){

        let that = this;

        this.problem = problem;
        this.experiment = experiment;
        this.intro = introJs();

        this.current_view = 5;
        this.max_view = 16;
        this.max_view_reached = 0;        

        let arrow_div = d3.select("#prompt_r2")
                            .insert("div", ":first-child")
                            .style("width","100%")
                            .attr("id","tutorial_arrow_div");

        arrow_div.append("img")
                    .attr("src","img/rightarrow.png")
                    .attr("class","img-hor-vert tutorial_move_button")
                    .attr("id", "tutorial_move_backward_button");

        arrow_div.append("img")
                    .attr("src","img/rightarrow.png")
                    .attr("class","tutorial_move_button")
                    .attr("id", "tutorial_move_forward_button");

        d3.select("#tutorial_move_backward_button").on("click", ()=>{
            this.tutorial_go_back();
        });
        
        d3.select('#tutorial_arrow_div')
            .insert('button','#tutorial_move_forward_button')
            .attr('id','reopen_intro_button')
            .text('Reopen messages')
            .on('click',function(){that.intro.start();});
        
        d3.select("#tutorial_move_forward_button").on("click", ()=>{
            this.tutorial_continue();
        });

        this.start_tutorial();
    }

    start_tutorial(){

        let that = this;

        // Import a different dataset
        problem.metadata.file_path = "EOSS_reduced_data.csv";

        // Reload the dataset
        PubSub.publish(LOAD_DATA, null);

        this.display_views();

        let d1 = 15 * 60 * 1000;
        let d2 = 20 * 60 * 1000;
        let a1 = function(){
            alert("15 minutes passed! This is just a friendly reminder that there are total " + that.max_view + " pages in this tutorial.");
            d3.select("#timer")
                .style("font-size","30px");
        };
        let a2 = function(){
            alert("20 minutes passed! Please try to wrap up the tutorial as quickly as possible. If you have any question, please let the experimenter know.");
            d3.select("#timer")
                .style("color","red"); 
        };
        let callback = [a1, a2];
        let duration = [d1, d2];
        this.experiment.clock.addCallback(callback);
        this.experiment.clock.addDuration(duration);
        this.experiment.clock.start();
    }
    
    move_to_page(page){
        this.current_view = page;
        this.max_view_reached = page-1;
        this.display_views();
    }
        
    deactivate_continue_button(){
        d3.select("#tutorial_move_forward_button")
            .on("click",null)
            .style('opacity',0.3);
    }

    activate_continue_button(){
        let that = this;
        d3.select('#tutorial_move_forward_button')
            .style('opacity',1)
            .on("click", that.tutorial_continue);
    }

    tutorial_continue(){
        this.current_view++;
        this.display_views();
    }

    tutorial_go_back(){
        if(this.current_view === 5){
            let path = "index.html";
            window.location.replace(path);
            return;
        }
        this.current_view--;
        this.display_views();
    }
    
    write_prompt(title, body){
        d3.select(".prompt_header.question").text(title);
        d3.select(".prompt_content.question").html(body);
    }
    
    start_intro(objects, messages, classname, callback){
        
        if(messages.length==1){
            this.intro.setOption('showButtons',false).setOption('showBullets', false);
        }else{
            this.intro.setOption('showButtons',true).setOption('showBullets', true);
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
                if(!objects[i]){
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

        this.current_items = objects;
        
        this.intro.setOptions({steps:steps, tooltipClass:classname}).onchange(callback).start(); 
    }

    clear_view(){
        this.current_items = [];
        this.intro.setOptions({steps:[]});
        this.write_prompt("","");

        d3.selectAll("#tutorial_buttons").remove();
    }

    display_views(){

        let that = this;

        // Initialize
        this.clear_view();

        // Set the page number
        d3.select('#prompt_problem_number').text("" + this.current_view + " / "+ this.max_view);

        let objects,contents,classname,callback;
        let title, prompt;
        
        callback = function(){
            return undefined;
        };
        
        if(this.current_view === 5){
        
            objects = [null,
                        d3.select('#tutorial_arrow_div').node(),
                        d3.select('#timer').node(),
                        d3.select('#tutorial_move_forward_button').node()];
            
            contents = ["Now we will go through different parts of iFEED interface.", 
                                                
                       "Different sections will cover different topics. To go back to the previous topic, click the left-arrow button. To continue, click the right-arrow button. To review these explanations, click the \"Reopen messages\" button.",
                                               
                        "The elapsed time is shown here. We expect this tutorial to take no more than 15 minutes.",

                        "Now you can proceed by clicking \"done\" button and then the right arrow button."];
            
            classname = null;
                        
            title = 'Overview';
            prompt = "<p>Click the right arrow button to continue.</p>";

        } else if(this.current_view === 6){ // Scatter plot panel

            objects = [d3.select('.tradespace_plot.figure').node()];
            
            contents = ['The scatter plot displays different designs of satellite systems. Each dot corresponds to one design, and its location indicates the corresponding cost and science score of the design.', // 0
                            'In the actual task, a group of dots will be highlighted in a light blue color.', // 1
                            'These dots represent the target designs that you need to investigate. Your goal is to find patterns that are shared uniquely by these designs.' // 3
                           ];
            
            classname = 'introjs_tooltip_large';

            callback = function(targetElement) {
                if(this._currentStep === 1){
                    that.experiment.make_target_selection(tutorial_selection);
                }
            }            
            
            title = 'Scatter Plot Panel';
            prompt = '';

        } else if(this.current_view === 7){ 
            
            document.getElementById('tab1').click();
            
            objects = [d3.select('.column.c1').node(),
                        d3.selectAll('#support_panel').node()];
            
            contents = ['If you hover your mouse over a design on the scatter plot, the relevant information will be displayed on the \"Inspect Design\" tab.',
                        'The displayed information contains the science benefit score and the cost, as well as a figure that shows what items are assigned to each slot.'];

            classname = 'introjs_tooltip_large';
            
            title = "Inspecting Design by Hovering";
            prompt = '';
        
        } else if(this.current_view === 8){

            this.experiment.make_target_selection(tutorial_selection);

            title = 'The features of the designs';
            
            objects = null;
            contents = ['We will define a concept called \'feature\'. You can think of a feature as a description of a pattern that can be found among the target designs (highlighted in blue).',
                        
                       '<p> Below are some examples of what features might look like (these are just examples, so you don\'t have to pay attention to the details): </p>'
                        +'<p>   1. Item A is assigned to slot 1000 </p>'
                        +'<p>   2. Item A and item B are assigned together in the same slot</p>'
                        +'<p>   3. Item C and item D are never assigned to the same slot</p>'
                        +'<p>   4. Slot 2000 is empty </p>'
                        +'<p>   5. At least two items out of items A, B, C are assigned to the same slot </p>'
                        +'<p>   6. Item D is assigned to either slot 1000 or slot 2000</p>',
                        
                       'Some features may explain the target designs well, while other features may be inaccurate.'];

            classname='introjs_tooltip_large';
            
            prompt = '';

        } else if(this.current_view === 9){

            this.experiment.make_target_selection(tutorial_selection);

            title = 'Coverage of target designs';
            
            objects = [null, 
                        d3.select('.tradespace_plot.figure').node()];
            
            contents = ['We will define the "goodness" of a feature using two metrics. The first metric is called the coverage of a feature.',
                
                        '<p>Consider the following description: </p>'
                        +'<p>(a) Item L is used, or item H is assigned to slot 5000. </p>'
                        +'<p>Take a look at the scatter plot, and note that some dots have turned pink or purple. The pink and purple dots are all the designs that have feature (a), meaning that they either use item L in the design or assigns item H to slot 5000.',
                        
                        '<p>Pink dots represent designs that have the feature (a), but are not in the target region. Purple dots represent designs that have the feature (a) and are inside the target region. </p>',
                        
                       'Note that many of the target designs share this feature (as indicated by the large number of purple dots). We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.',
                        
                       'However, feature (a) is not necessarily what we are looking for. It is too general, meaning that it also applies to many of the non-target designs as well (as indicated by the large number of pink dots). This leads us to the next criterion to define a good feature.'];
            
            classname='introjs_tooltip_large';

            callback = function(targetElement) {

                if(this._currentStep === 1){
                    that.experiment.filter.apply_filter_expression(tutorial_feature_example_a);
                }
            } 
            prompt = '';
        
        }else if(this.current_view === 10){

            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

            this.experiment.make_target_selection(tutorial_selection);
                        
            title = 'Specificity of target designs';
            objects = [null, 
                        d3.select('.tradespace_plot.figure').node()];
            
            contents = ['<p>Now let\'s look at another description (Just see how it looks. The details are not important!):</p>'
                +'<p>(b) Item L is used in the design AND item C, item D are never used in the design AND items E, I, J are never assigned together AND items C, D, L are never assigned together, and items C, F, L are never assigned together.</p>',
                        
                        '<p>Note that different dots are now in pink and purple colors. If you look closely, you will find that many of the pink dots have disappeared. This is good becuase we wanted to find a feature that uniquely describes the target region and does not cover the non-target region. </p><p>We say that feature (b) is specific to the target region, and this is the second criterion that we require from a good feature.</p>',
                        
                        '<p>However, you may notice that many of the purple dots (target designs covered by the feature) have also disappeared. Only very small portion of the targets are in purple color now.</p><p>Therefore, (b) is too specific, meaning that it only accounts for a small number of targets. Or you can say that the coverage of target designs have decreased. </p>',
                        
                        '<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature. Let\'s summarize those points in the next section.</p>'
                       ];
            
            classname='introjs_tooltip_large';
            callback = function(targetElement) {

                if(this._currentStep==1){
                    that.experiment.filter.apply_filter_expression(tutorial_feature_example_c);                    
                }
            } 
            prompt = '';
        
        } else if (this.current_view === 11){

            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            this.experiment.make_target_selection(tutorial_selection);
            
            let buttons = d3.select('.prompt_content.confidence')
                                .append('g')
                                .attr('id','tutorial_buttons');
            
            buttons.append('button')
                    .attr('id','tutorial_button_1')
                    .text('Highlight designs with feature (a)')
                    .style('margin-right','20px')
                    .style('font-size','18px')
                    .on('click',() => {
                        that.experiment.filter.apply_filter_expression(tutorial_feature_example_a);
                    });
            
            
            buttons.append('button')
                    .attr('id','tutorial_button_2')
                    .text('Highlight designs with feature (b)')
                    .style('font-size','18px')
                    .on('click',() => {
                        that.experiment.filter.apply_filter_expression(tutorial_feature_example_c); 
                    });
            
            title = 'The key is finding the balance';
            objects = [null];

            contents = ['<p>In summary, a good feature should satisfy the following two conditions:</p>'
                +'<p>1. The feature should cover a large area of the target region (maximize the number of purple dots)</p>'
                +'<p>2. The feature should be specific enough, so that it does not cover the non-target region (minimize the number of pink dots)</p>',
                        
                '<p>As we have seen in the previous example, there is a trade-off between these two conditions. If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). </p>',
                        
                '<p>Therefore, the key is finding the right balance between those two criteria. You can test the features again and see how they are distributed in the scatter plot by clicking the buttons shown on the experiment prompt box.</p>',
                        
                '<p>Understanding this concept is important. If you are not sure about the concept introduced here, please ask questions to the experimenter for clarification.</p>']

            classname='introjs_tooltip_extra_large';
            prompt = '<p>Highlight and compare the two features by clicking the buttons below.</p> <p>Note: Feature (a) is has good coverage but is not specific enough. Feature (b) is specific but has very low coverage of the targets.</p>';
            
        }else if(this.current_view === 12){

            document.getElementById('tab3').click();
                    
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            this.experiment.make_target_selection(tutorial_selection);
            
            this.experiment.data_mining.import_feature_data("EpsilonMOEA_2018-11-14-04-33_28", false, false);

            
            title = 'Feature Analysis';
            objects = [d3.selectAll('#support_panel').node()];

            contents = ["Feature Analysis tab contains a plot that shows how much coverage and specificity different features have. ",
                                            
                        "Each feature is represented by a triangle. The features shown in the plot are obtianed by running a data mining algorithm. ",
                                                
                       "<p>In the plot, the horizontal axis corresponds to the specificity, and the vertical axis corresponds to the coverage of a feature.</p>"
                       + "<p>Again, a good feature must have both large specificity and large coverage.</p>"];

            classname = 'introjs_tooltip';
                    
            prompt = "";
            
        } else if (this.current_view === 13){
                    
            document.getElementById('tab3').click();

            this.experiment.feature_application.clear_feature_application();
            
            title = 'Feature Analysis - Inspecting Features';
            objects = [d3.selectAll('#support_panel').node(), 
                        d3.select('.tradespace_plot.figure').node(), 
                        d3.select(".column.c2").node()];

            contents = ["If you hover your mouse over each feature, you will notice two changes occurring in the interface.",
                       
                       "First, a set of dots on the scatter plot will be highlighted in pink and purple color. Again, pink and purple dots represent designs have the feature that you are currently inspecting (purple is the overlap between pink and blue)",
                                              
                       "<p>Second, a logical expression and a graphical representation of the feature will appear in the Feature Application panel. </p><p>The logical expression is shown on the upper part of the panel, and the lower part will display the graphical representation.</p>"
                       + "<p>More explanation about this will be provided in the next section.</p>"];

            classname = 'introjs_tooltip_large';
            
            callback = function(targetElement) {
                if(this._currentStep==1){
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_c);
                }
            }    
            
            prompt = "";
            
        } else if (this.current_view === 14){

            document.getElementById('tab3').click();

            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            this.experiment.make_target_selection(tutorial_selection);

            this.experiment.data_mining.update = this.experiment.data_mining.update_scatter;
            this.experiment.data_mining.import_feature_data("EpsilonMOEA_2018-11-14-04-33_28", false, false);

            title = 'Feature Application Panel';
            
            objects = [d3.select('.column.c2').node(),
                       d3.selectAll('#support_panel').node(),
                       null,
                       d3.select(".column.c2").node(),
                        d3.select('#feature_expression').node()
                      ];

            contents = ["Feature Application Panel shows the current feature that is applied.",
                       
                       "<p>To add features to the Feature Application Panel, you have to click on one of the features shown on the Feature Analysis tab.</p><p> Hovering your mouse over the features will result in temporary change in the Feature Application Panel, and by clicking you can fix the change.</p>",
                        
                       "Once a feature is added, you will see that the outline of the triangle is highlighted in bold. It shows where the current feature is located",
                                              
                       "In the graphical representation of a feature, there exist two different kinds of nodes: nodes for logical connectives and nodes for individual features. The logical connectives are colored in blue, and they can be either AND or OR.",
                        
                       "As shown in the corresponding feature expression, all feature nodes inside the same logical connective node are inside the same brackets and are combined using the same logical connection."];

            classname = 'introjs_tooltip_large';

            callback = function(targetElement) {
                if(this._currentStep === 3){
                    that.experiment.feature_application.update_feature_application("direct-update", tutorial_feature_example_d);
                }
            }    
            
            prompt = "";  

        } else if (this.current_view === 15){

            document.getElementById('tab3').click();
                    
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            this.experiment.make_target_selection(tutorial_selection);

            this.experiment.data_mining.update = this.experiment.data_mining.update_bar;
            this.experiment.data_mining.import_feature_data("EpsilonMOEA_2018-11-14-04-33_28", false, false);

            title = 'Bar Graph for Feature Analysis';
            
            objects = [null,
                        d3.selectAll('#support_panel').node(),
                        d3.select("#feature_sortby_div").node()
                       ];

            contents = ["In this experiment, different treatment conditions will contain different components of the interface introduced so far.",

                        "<p>Under one of the conditions, a bar graph is used to represent features instead of a scatter plot. Each bar represents one feature. </p>"
                        + "<p>Similar to the scatter plot, you can hover the mouse over each feature for viewing and click to make a selection. </p>",

                        "You can choose to sort features by either specificity or coverage. "];

            classname = 'introjs_tooltip_large';
            
            prompt = "";        
                            
        } else if(this.current_view === 16){ 

        	this.deactivate_continue_button();
        	
            document.getElementById('tab3').click();

            this.experiment.feature_application.clear_feature_application();
            
            title = 'End of the tutorial';
            
            objects = [null];

            contents = [null];

            classname = 'introjs_tooltip_large';
            
            prompt = '<p>We just covered all the capabilities of iFEED, and now you are ready to start the experiment. Before proceeding to the next step, please read the following directions carefully.'

        		+'<p style="font-weight:bold;">  - In the actual task, you will be asked to answer 18 questions about three different datasets. </p>'
                
                +'<p style="font-weight:bold;"> - To answer each question, you will need to use iFEED to find good features shared by the target designs. '
                +'Only a subset of capabilities introduced in this tutorial may be available for you to use.</p>'
                
                +'<p style="font-weight:bold;">  - Try to answer each question as accurately as possible, and at the same time, as quickly as possible. Both accuracy and answer time are equally important in this experiment.</p>'
                                    
        		+'<p>Now you are ready to start the experiment. You can move on to the experiment by clicking the button below. Good luck!</p>';
            
            d3.select('.prompt_content.confidence')
                    .append('g')
                    .attr('id','tutorial_buttons')
                    .append('button')
                    .attr('id','tutorial_button_1')
                    .style('margin-right','20px')
                    .style('font-size','18px')
                    .text('Start the Experiment')
                    .on('click', ()=>{
                         that.start_experiment();
                    });
        }
        
        this.write_prompt(title,prompt);
        
        if(this.current_view != 16){
            this.start_intro(objects, contents, classname, callback);
        }
    }

    start_experiment(){

        this.problem.metadata.file_path = "EOSS_data_recalculated.csv";
        PubSub.publish(LOAD_DATA, null);

        this.clear_view();

        d3.select("#tutorial_arrow_div").remove();

        d3.select("#timer")
            .style("color","black")
            .style("font-size","24px");

        this.experiment.clock.resetClock();

        setTimeout(function (){
            PubSub.publish(EXPERIMENT_START, null);
        }, 500); // How long do you want the delay to be (in milliseconds)? 

        //window.location.replace("https://www.selva-research.com/experiment/");
    }
}











function select_driving_features(expression){
	
    let was_selected = false;
    let id = -1;
    
    for(let i = 0; i < selected_features.length; i++){
        if(selected_features_expressions[i] === expression){
            was_selected = true;
            id = selected_features[i];            
        }
    }

    if(!was_selected){
        d3.selectAll('.bar')[0].forEach(function(d){
        	if(d.__data__.expression === expression){
        		id = d.__data__.id;
        		selected_features.push(id);
        		selected_features_expressions.push(expression);
        	}
        });
        update_df_application_status(expression);
        d3.selectAll("[class=bar]").filter(function(d){
            if(d.id === id){
                return true;
            }else{
                return false;
            }
        }).style("stroke-width",3); 
    }
}

let tutorial_feature_example_a = "({present[;11;]}||{inOrbit[4;7;]})";

let tutorial_feature_example_b = "{present[;1;]}&&{notInOrbit[2;1;]}&&{notInOrbit[3;1;]}&&{absent[;3;]}&&{notInOrbit[2;8;]}&&{notInOrbit[0;4;]}&&{notInOrbit[3;5;]}&&{notInOrbit[2;4;]}&&{separate[;4,2;]}&&{notInOrbit[2;7;]}&&{notInOrbit[4;0;]}&&{notInOrbit[3;0;]}&&{notInOrbit[2;2;]}&&{notInOrbit[3;9;]}&&{notInOrbit[4;2;]}";

let tutorial_feature_example_c = "({present[;11;]}&&{absent[;2;]}&&{absent[;3;]}&&{separate[;4,8,9;]}&&{separate[;2,3,11;]}&&{separate[;2,5,11;]})";

let tutorial_feature_example_d = "({separate[;3,5,11;]}&&{present[;11;]}&&({separate[;2,4,8;]}||{absent[;3;]}||{inOrbit[3;0,4;]}))";

let tutorial_selection = [];
//let tutorial_selection_string = "6,38,51,165,169,176,189,194,227,230,231,237,239,258,287,298,303,313,322,324,339,341,349,352,353,354,359,360,366,369,370,373,382,387,402,408,425,439,444,473,490,504,506,510,514,519,523,527,532,540,546,575,594,600,601,604,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,686,687,688,692,699,703,704,707,718,720,725,727,728,733,736,740,741,742,744,746,751,761,762,770,774,778,781,786,790,793,800,801,805,810,812,813,815,816,823,825,832,835,840,846,856,861,862,865,872,877,886,889,891,896,899,905,910,911,912,917,929,933,939,943,945,950,952,960,965,967,975,977,978,986,1003,1005,1010,1018,1021,1024,1027,1029,1031,1032,1035,1036,1042,1045,1052,1053,1058,1059,1068,1070,1076,1077,1084,1085,1089,1094,1096,1113,1117,1119,1120,1121,1124,1137,1157,1158,1162,1163,1172,1177,1181,1182,1194,1195,1214,1224,1228,1242,1254,1262,1263";
let tutorial_selection_string = "3,6,8,12,13,14,15,17,19,20,25,26,27,37,38,42,46,47,50,51,53,55,58,60,61,64,68,72,76,77,81,88,91,93,94,95,96,100,101,102,104,106,108,111,118,119,120,121,122,123,125,128,129,130,135,139,143,144,148,149,153,165,167,168,169,173,175,176,177,179,186,189,191,194,196,199,200,217,219,221,223,224,225,227,229,230,231,232,234,237,239,240,248,249,250,255,258,261,266,268,273,280,282,287,288,289,298,303,312,313,322,324,325,332,337,339,341,342,349,352,353,354,359,360,363,365,366,368,369,370,372,373,375,379,381,382,384,387,388,397,402,408,409,420,423,425,439,442,444,461,473,476,490,504,506,510,514,519,523,527,532,540,546,561,571,575,594,600,601,604,611,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,686,687,688,692,699,703,704,707,718,720,725,727,728,733,736,740,741,742,744,746,751,761,762,769,770,774,778,781,786,790,793,800,801,805,810,812,813,815,816,823,825,832,835,840,846,856,861,862,865,872,877,886,889,891,896,899,905,910,911,912,917,929,933,939,943,945,950,952,960,965,967,975,977,978,986,1003,1005,1010,1018,1021,1024,1027,1029,1031,1032,1035,1036,1042,1045,1052,1053,1058,1059,1068,1070,1076,1077,1084,1085,1089,1094,1096,1113,1117,1119,1120,1121,1124,1137,1157,1158,1162,1163,1172,1177,1181,1182,1194,1195,1214,1224,1228,1242,1254,1262,1263";

let tutorial_selection_split = tutorial_selection_string.split(",");
for(let i = 0; i < tutorial_selection_split.length; i++){
    tutorial_selection.push(+ tutorial_selection_split[i]);
}

let tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}";

