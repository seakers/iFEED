

function ExperimentTutorial(ifeed,experiment){
    
    var self = this;
    
    self.current_view = 5;
    self.max_view = 25;
    
    self.max_view_reached = 0;
    
    self.current_items=[];
    self.intro = introJs();
    
    self.tutorial_utopia_point_x = 0.28;
    self.tutorial_utopia_point_y = 0.85;
    
    self.move_to_page = function(page){
        
        self.current_view = page;
        self.max_view_reached = page-1;
        self.display_views();
    }
        
    self.deactivate_continue_button = function(){
        d3.select("#move_forward_button")
            .on("click",null)
            .style('opacity',0.3);
    }

    self.activate_continue_button = function(){
        d3.select('#move_forward_button')
            .style('opacity',1)
            .on("click",self.tutorial_continue);
    }

    self.tutorial_continue = function(){
        self.current_view++;
        self.display_views();
    }
    
    self.tutorial_go_back = function(){
        if(self.current_view==5){
            var path = "index.html";
            window.location.replace(path);
            return;
        }
        self.current_view--;
        self.display_views();
    }
    
    
    d3.select("#move_backward_button").on("click",self.tutorial_go_back);
    
    d3.select('#arrow_div').insert('button','#move_forward_button')
            .attr('id','reopen_intro_button')
            .text('Reopen messages')
            .on('click',function(){self.intro.start();});
    
    d3.select("#move_forward_button").on("click",self.tutorial_continue);
    
    
    
    self.write_prompt = function(title,body){
        d3.select("#prompt_header").text(title);
        d3.select("#prompt_body_text_1").html(body);
    }
    
    
    self.start_intro = function(objects, messages, classname, callback){
        
        if(messages.length==1){
            self.intro.setOption('showButtons',false).setOption('showBullets',false);
        }else{
            self.intro.setOption('showButtons',true).setOption('showBullets',true);
        }
        
        if(!classname){
            classname = 'introjs_tooltip';
        }
        
        var steps = [];
        var last_object = null;
        
        for(var i=0;i<messages.length;i++){

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

        self.current_items = objects;
        
        self.intro.setOptions({steps:steps,tooltipClass:classname}).onchange(callback).start(); 
    }

    
    self.clear_view = function(){
        
        self.current_items = [];
        self.intro.setOptions({steps:[]});
        self.write_prompt("","");
        
        
        d3.select('#tutorial_button_1').remove();
        d3.select('#tutorial_button_2').remove();
        
    }

    

    self.display_views = function(){

        // Initialize
        self.clear_view();

        // Set the page number
        d3.select('#prompt_page_number > div').text("" + self.current_view + "/"+ self.max_view);

        var objects,contents,classname,callback;
        var title, prompt;
        
        callback = function(){return undefined;};
        
        if(self.current_view==5){
        
            objects = [null,null,d3.select('#arrow_div')[0][0],d3.select('#experiment_prompt_div')[0][0],d3.select('#clock')[0][0]];
            
            contents = ["Now we will go through each component of iFEED interface.", 
                        
                           "During this part of the tutorial, please focus on the part that is currently being explained. Explanation about other parts of the interface may be provided later in the tutorial.",
                        
                       "Each page will cover different topic. To go back to the previous topic, click the left-arrow button. To continue, click the right-arrow button. To review these explanations, click the \"Re-open messages\" button.",
                        
                       "For some pages, you will have to do certain tasks to proceed. The detailed directions on how to do those tasks will be provided here.",
                       
                        "You are given total 25 minutes to finish this part of the tutorial. Now you can proceed by clicking \"done\" button and then the right arrow button."];
            
            classname=null;
                        
            title = 'Overview';
            prompt = "";
        }
        
        else if(self.current_view==6){ // Scatter plot panel

            objects = d3.select('.main_plot.figure')[0];
            
            contents = ['The scatter plot panel displays thousands of different designs of satellite systems. Each dot corresponds to one design, and its location indicates the corresponding cost and science benefit score of the design.', // 0
                            'You can zoom in and zoom out as well as pan using your mouse wheel.', // 1
                            'For each task, a group of dots will be highlighted in a light blue color.', // 2
                            'These dots represent the target designs that you need to investigate. Your goal is to find patterns that are shared uniquely by these designs.' // 3
                           ];
            
            classname = 'introjs_tooltip_large';
            callback = function(targetElement) {
                if(this._currentStep==2){
                    experiment.select_archs_using_ids(tutorial_selection);
                    d3.select("#num_of_selected_archs").text(""+ifeed.main_plot.get_num_of_selected_archs());   
                }
            }            
            
            title = 'Scatter Plot Panel';
            prompt = '';
        }


        else if(self.current_view==7){ // Number of designs shown

            objects = [d3.select('#status_display')[0][0],d3.selectAll('#status_display > div')[0][0],d3.selectAll('#status_display > div')[0][1]];
            
            contents = ['The number of designs are displayed in the boxes above the scatter plot.','This shows the total number of designs','This shows the number of target designs (highlighted in blue)'];
            
            classname = 'introjs_tooltip_small';
            
            title='Number of designs';
            prompt = '';
        }
        
        else if(self.current_view==8){ 
            
            document.getElementById('tab1').click();
            ifeed.main_plot.unhighlight_support_panel();
            
            objects = [d3.selectAll('#support_panel')[0][0],d3.select('.column.c1')[0][0]];
            
            contents = ['The analysis panel is located below the scatter plot panel.',
                       'If you hover your mouse over a design on the scatter plot, the relevant information will be displayed on the \"Inspect Design\" tab.',
                        'The displayed information contains the science benefit score and the cost, as well as a figure that shows what instruments are assigned to each orbit.'];

            classname = 'introjs_tooltip_large';
            
            title = "Analysis Panel and Inspecting Design by Hovering";
            prompt = '';
        }
        
        else if(self.current_view==9){ 
            
            document.getElementById('tab1').click();
            ifeed.main_plot.unhighlight_support_panel();
            
            objects = [d3.selectAll('#support_panel')[0][0],d3.select('.column.c1')[0][0]];
            
            contents = ['The analysis panel is located below the scatter plot panel.',
                       'If you hover your mouse over a design on the scatter plot, the relevant information will be displayed on the \"Inspect Design\" tab.',
                        'The displayed information contains the science benefit score and the cost, as well as a figure that shows what instruments are assigned to each orbit.'];

            classname = 'introjs_tooltip_large';
            
            title = "Modifying designs";
            prompt = '';
        }        
        
        
        
        
        else if(self.current_view==9){

            if(self.max_view_reached < 9){
                
                self.counter = 0;
                
                var highlight_support_panel = function(){
                    
                    if(self.current_view==9){
                        if(self.counter >1){
                            self.activate_continue_button();
                            if(self.max_view_reached<9)  self.max_view_reached=9;
                        }else{
                            if(!ifeed.UI_states.support_panel_active){
                                self.counter++;
                            }
                        }                    
                    }
                    
                    ifeed.main_plot.highlight_support_panel.apply();
                }
                
                
                var unhighlight_support_panel = function(){
                                        
                    if(self.current_view==9){
                        
                        if(self.counter >1){
                            self.activate_continue_button();
                            if(self.max_view_reached<9)  self.max_view_reached=9;
                        }else{
                            if(ifeed.UI_states.support_panel_active){
                                self.counter++;
                            }
                        }                    
                    }
                    
                    ifeed.main_plot.unhighlight_support_panel.apply();
                }
                
                d3.select(".main_plot.figure").on("click",unhighlight_support_panel);
                d3.select("#support_panel").on("click",highlight_support_panel);
                self.deactivate_continue_button();
            }

            
            objects = d3.select('.column.c1')[0];
            contents = ['The borderline of either the scatter plot or the analysis panel is highlighted using bold lines. The bold line means that the panel is currently focused.',
                        'When the analysis panel is focused, hovering the mouse over a dot on the scatter plot will not change the information already displayed on the analysis panel. ',
                        'To enable the inspection of designs by hovering, click the scatter plot to bring the focus back to the scatter plot.'];
            
            classname = 'introjs_tooltip_large';
            callback = function(targetElement) {
                if(this._currentStep==1){
                    ifeed.main_plot.highlight_support_panel();
                }
            }    
            
            title = "Activating Panels";
            prompt = 'To continue, try alternating the focus by clicking on the scatter plot and the analysis panel.';

            document.getElementById('tab1').click();
            ifeed.main_plot.unhighlight_support_panel();
        }

        
        else if(self.current_view==10){

            title = 'The features of the designs';
            
            objects = null;
            contents = ['Now, we will define what features are. Your goal in this experiment is to find the “good” features that explain the target region well.',
                        
                       '<p> Below are some examples of how features might look like (these are just examples, so you don\'t have to pay attention to the details): </p>'
                        +'<p>   1. Instrument A is assigned to orbit 1000 </p>'
                        +'<p>   2. Instrument A and instrument B are assigned together in one orbit</p>'
                        +'<p>   3. Instrument C and instrument D are not assigned to the same orbit</p>'
                        +'<p>   4. Orbit 2000 is empty </p>'
                        +'<p>   5. At least two instruments out of instruments A, B, C are assigned to the same orbit </p>'
                        +'<p>   6. Instrument D is assigned to either orbit 1000 or orbit 2000</p>'
                        +'<p>   7. Orbit 1000 is assigned only two instruments</p>',
                        
                       'You can think of these features as descriptions of the target designs (highlighted in blue).'];

            classname='introjs_tooltip_large';
            
            prompt = '';
        }

        else if(self.current_view==11){

            ifeed.main_plot.cancel_selection();
            experiment.select_archs_using_ids(tutorial_selection);

            title = 'Coverage of target designs';
            
            objects = [null, d3.select('.main_plot.figure')[0][0]];
            
            contents = ['We will define "goodness" of a feature using two metrics. The first metric is called the coverage of a feature.',
                
                        '<p>Consider the following description: </p>'
                        +'<p>(a) At least one of the instruments A and G is used in the design</p>'
                        +'<p>Take a look at the scatter plot, and note that some dots have turned pink or purple. The pink and purple dots are all the designs that have feature (a), meaning that they use either instrument A or G (or both) in their designs.',
                        
                        '<p>Pink dots represent designs that have the feature (a), but are not in the target region. Purple dots represent designs that have the feature (a) and are inside the target region. </p>',
                        
                       'Note that many of the target designs share this feature (as shown by the large number of purple dots). We say that this feature has a good coverage of target designs. Such good coverage is desired in a good feature.',
                        
                       'However, feature (a) is not necessarily what we are looking for. It is too general, meaning that it also applies to many of the non-target designs as well (as shown by the large number of pink dots). This leads us to the next criterion to define a good feature.'];
            
            classname='introjs_tooltip_large';
            callback = function(targetElement) {

                if(this._currentStep==1){
                    ifeed.filter.apply_filter_expression('{present[;0;]}||{present[;6;]}');
                }
            } 
            prompt = '';
        }
        

        else if(self.current_view==12){
            
            ifeed.main_plot.cancel_selection();
            experiment.select_archs_using_ids(tutorial_selection);
            
            title = 'Specificity of target designs';
            objects = [null, d3.select('.main_plot.figure')[0][0]];
            
            contents = ['<p>Now let\'s look at another description (Just see how it looks. The details are not important!):</p>'
                +'<p>(b) Instrument B is used, and D is not used in the design, and E and C are never assigned to the same orbit. Instrument E is not assigned to orbit 1000. Instrument B, C, E, H, I are not assigned to orbit 3000, instruments A, B, F, J are not assigned to orbit 4000. Moreover, instrument A and instrument C are not assigned to orbit 5000.</p>',
                        
                        '<p>Note that different dots are now in pink and purple colors. If you look closely, you will find that many of the pink dots have disappeared. This is good becuase we wanted to find a feature that uniquely describes the target region and does not cover the non-target region. </p><p>We say that feature (b) is specific to the target region, and this is the second criterion that we require from a good feature.</p>',
                        
                        '<p>However, you may notice that many of the purple dots (target designs covered by the feature) have also disappeared. Only very small portion of the targets are in purple color now.</p><p>Therefore, (b) is too specific, meaning that it only accounts for a small number of targets. Or you can say that the coverage of target designs have decreased. </p>',
                        
                        '<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature. Let\'s summarize those points in the next section.</p>'
                       ];
            
            classname='introjs_tooltip_large';
            callback = function(targetElement) {

                if(this._currentStep==1){
                    experiment.highlight_archs_using_ids(tutorial_selection2);
                }
            } 
            prompt = '';
        }
        

    else if(self.current_view==13){
        
        ifeed.main_plot.cancel_selection();
        experiment.select_archs_using_ids(tutorial_selection);
        

        var buttons = d3.select('#prompt_body').append('g')
        
        buttons.append('button')
                .attr('id','tutorial_button_1')
                .text('Highlight designs with feature (a)')
                .style('margin-right','20px')
                .style('font-size','18px')
                .on('click',function(d){
                    ifeed.main_plot.cancel_selection('remove_highlighted');
                    ifeed.filter.apply_filter_expression('{present[;0;]}||{present[;6;]}');
                });
        
        
        buttons.append('button')
                .attr('id','tutorial_button_2')
                .text('Highlight designs with feature (b)')
                .style('font-size','18px')
                .on('click',function(d){
                    ifeed.main_plot.cancel_selection('remove_highlighted');
                    experiment.highlight_archs_using_ids(tutorial_selection2);
                });
        
            
        title = 'The key is finding the balance';
        objects = [null, d3.select('.main_plot.figure')[0][0]];

        contents = ['<p>In summary, a good feature should satisfy the following two conditions:</p>'
            +'<p>1. The feature should cover a large area of the target region (maximize the number of purple dots)</p>'
            +'<p>2. The feature should be specific enough, so that it does not cover the non-target region (minimize the number of pink dots)</p>',
                    
            '<p>As we have seen in the previous example, there is a trade-off between these two conditions. If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). </p>',
                    
            '<p>Therefore, the key is finding the right balance between those two criteria. You can test the features again and see how they are distributed in the scatter plot by clicking the buttons shown on the experiment prompt box.</p>',
                    
            '<p>Understanding this concept is important. If you are not sure about the concept introduced here, please ask questions to the experimenter for clarification.</p>']

        classname='introjs_tooltip_extra_large';
        prompt = '<p>Highlight and compare the two features by clicking the buttons below.</p> <p>Note: Feature (a) is has good coverage but is not specific enough. Feature (b) is specific but has very low coverage of the targets.</p>';
        
        
    }
        
        
    else if(self.current_view==14){
        
        ifeed.main_plot.cancel_selection();
        experiment.select_archs_using_ids(tutorial_selection);
        
        ifeed.main_plot.highlight_support_panel();
        document.getElementById('tab2').click();

        title = 'Filters';
        objects = [d3.selectAll('#support_panel')[0][0], d3.select('.filter .options .div')[0][0]];

        contents = ['<p>Now we will learn how to use iFEED as a tool to find good features. </p>'
                    +'<p> In the analysis panel, you can find a tab for filter settings. Filters are used to highlight a group of designs that share the common feature that you define. </p>',
                    
                    '<p>The most basic and useful features have been identified and built into the filter options. You can select one of these preset filters to specify what patterns you want to investigate. We will test some of these preset filters in the following pages.</p>']

        classname='introjs_tooltip_large';
        prompt = '';
    }


    else if(self.current_view==15){
        
    	if(self.max_view_reached < 15){

            var applyFilter = function(){
                
                var filter_return_successful = ifeed.filter.applyFilter();

                if(self.current_view==15){
                    var dropdown = d3.select(".filter.options.dropdown")[0][0].value;                    
                    if(dropdown=="present" && filter_return_successful){
                        self.activate_continue_button();
                        if(self.max_view_reached < 15)  self.max_view_reached=15;
                    }                
                }
            }

            self.deactivate_continue_button();
            d3.select(".filter.buttons")
                    .select('#apply_filter_button')
                    .on("click",applyFilter);
            
    	}
        

        ifeed.feature_application.clear_feature_application();
        
    	document.getElementById('tab2').click();
    	ifeed.main_plot.highlight_support_panel();
                
        d3.select('.filter.options.dropdown')[0][0].value = "present";
        ifeed.filter.initialize_preset_filter_input("present"); 
        
        
        title = 'Preset Filters: Present';
        objects = [d3.selectAll('#support_panel')[0][0]];

        contents = ["<p>The filter called \'Present\' is used to selectively highlight designs that contain a specific instrument. It takes in one instrument name as an argument, and selects all designs that use that instrument.</p>",
                    
                   "<p>To apply the filter, type in an argument to the input text field and click [Apply Filter] button. </p>",
                    
                    "<p>As a result of applying the filter, a group of dots on the scatter plot is highlighted in pink color. These dots represent designs that have the feature you just defined.</p>"]

        classname='introjs_tooltip';
        
        prompt = '<p>To continue, follow the steps below:</p>'
                +'<p>1. Select \'Present\' option from the dropdown menu. </p>'
    			+'<p>2. In the input field that appears, type in an instrument name. The instrument should be an alphabet letter ranging from A to L. </p>'
    			+'<p>3. Then click [Apply Filter] button to apply the filter.</p>';
  
    }
        
        
    else if(self.current_view==16){
        
    	if(self.max_view_reached < 16){

            var applyFilter = function(){
                
                var filter_return_successful = ifeed.filter.applyFilter();

                if(self.current_view==16){
                    
                    var dropdown = d3.select(".filter.options.dropdown")[0][0].value;                    
                    if(dropdown=="inOrbit" && filter_return_successful){
                        self.activate_continue_button();
                        if(self.max_view_reached < 16)  self.max_view_reached=16;
                    }                
                }
            }

            self.deactivate_continue_button();
            d3.select(".filter.buttons")
                    .select('#apply_filter_button')
                    .on("click",applyFilter);
            
    	}
        

        ifeed.feature_application.clear_feature_application();
    	document.getElementById('tab2').click();
    	ifeed.main_plot.highlight_support_panel();
                
        d3.select('.filter.options.dropdown')[0][0].value = "inOrbit";
        ifeed.filter.initialize_preset_filter_input("inOrbit"); 
        
        
        title = "Preset Filters: InOrbit";
        objects = [d3.selectAll('#support_panel')[0][0]];

        contents = ["<p>The filter called \'InOrbit\' is used to selectively highlight designs that assign a specific instrument(s) to a given orbit. </p>",
                    "<p>It takes in an orbit name and instrument name(s) as arguments. If more than one instrument name is given, then it highlights all designs that assign all those instruments into the specified orbit.</p>"]

        classname='introjs_tooltip';
        
        prompt = '<p>To continue, follow the steps below:</p>'
    			+'<p>1. Select \'InOrbit\' option from the dropdown menu. </p>'
    			+'<p>2. In the first input field that appears, type in an orbit name. '
    			+'The orbit name should be a number in thousands (1000, 2000, 3000, 4000, or 5000). </p>'
    			+'<p>2. In the second input field, type in instrument names (1 or more). '
    			+'The instrument should be an alphabet letter ranging from A to L. If there are more than one instrument, the names should be separated by commas.</p>'
    			+'<p>3. Then click [Apply Filter] button to apply the filter.</p>';        
    }        
    else if(self.current_view==17){
    	
    	if(self.max_view_reached < 17){

            var applyFilter = function(){
                
                var filter_return_successful = ifeed.filter.applyFilter();
                if(self.current_view==17){
                    
                    var dropdown = d3.select(".filter.options.dropdown")[0][0].value;                    
                    if(dropdown=="together" && filter_return_successful){
                        self.activate_continue_button();
                        if(self.max_view_reached < 17)  self.max_view_reached=17;
                    }                
                }
            }

            self.deactivate_continue_button();
            d3.select(".filter.buttons")
                    .select('#apply_filter_button')
                    .on("click",applyFilter);
            
    	}
        
        ifeed.feature_application.clear_feature_application();
    	document.getElementById('tab2').click();
    	ifeed.main_plot.highlight_support_panel();
                
        d3.select('.filter.options.dropdown')[0][0].value = "together";
        ifeed.filter.initialize_preset_filter_input("together"); 
        
        
        title = "Preset Filters: Together";
        objects = [d3.selectAll('#support_panel')[0][0]];

        contents = ["The filter called \'together\' is used to selectively highlight designs that assign a group of instrument together in the same orbit. It is different from ‘inOrbit’ as the instruments can be assigned to any orbit."]

        classname='introjs_tooltip';
        
        prompt = '<p> To continue, follow the steps below:</p>'
    			+'<p>1. Select \'together\' option from the dropdown menu. </p>'
    			+'<p>2. In the input field, type in multiple instrument names, separated by commas. '
    			+'The instrument should be an alphabet letter ranging from A to L. </p>'
    			+'<p>3. Then click [Apply Filter] button to apply the filter.</p>';           
    }     
    else if(self.current_view==18){
    	
    	if(self.max_view_reached < 18){

            var applyFilter = function(){
                
                var filter_return_successful = ifeed.filter.applyFilter();
                if(self.current_view==18){
                    
                    var dropdown = d3.select(".filter.options.dropdown")[0][0].value;                    
                    if(dropdown=="emptyOrbit" && filter_return_successful){
                        self.activate_continue_button();
                        if(self.max_view_reached < 18)  self.max_view_reached=18;
                    }                
                }
            }

            self.deactivate_continue_button();
            d3.select(".filter.buttons")
                    .select('#apply_filter_button')
                    .on("click",applyFilter);
            
    	}
        
        ifeed.feature_application.clear_feature_application();
        
    	document.getElementById('tab2').click();
    	ifeed.main_plot.highlight_support_panel();
                
        d3.select('.filter.options.dropdown')[0][0].value = "emptyOrbit";
        ifeed.filter.initialize_preset_filter_input("emptyOrbit"); 
        
        title = "Preset Filters: Empty orbit";
        objects = [d3.selectAll('#support_panel')[0][0]];

        contents = ["<p>The filter called \'Empty orbit\' is used to selectively highlight designs that do not assign any instrument to the specified orbit. It takes in a single orbit name as an argument.</p>"];

        classname='introjs_tooltip';
        
        prompt = '<p>To continue, follow the steps below:</p>'
    			+'<p>1. Select \'Empty orbit\' option from the dropdown menu. </p>'
    			+'<p>2. In the input field, type in an orbit name. '
    			+'The orbit name should be a number in thousands (1000, 2000, 3000, 4000, or 5000). </p>'
    			+'<p>3. Then click [Apply Filter] button to apply the filter.</p>';   
    }
        
        
//    else if(self.current_view==19){        
//    	if(self.max_view_reached < 19){
//
//            var applyFilter = function(){
//                
//                var filter_return_successful = ifeed.filter.applyFilter();
//                if(self.current_view==19){
//                    
//                    var dropdown = d3.select(".filter.options.dropdown")[0][0].value;                    
//                    if(dropdown=="numOfInstruments" && filter_return_successful){
//                        self.activate_continue_button();
//                        if(self.max_view_reached < 19)  self.max_view_reached=19;
//                    }                
//                }
//            }
//
//            self.deactivate_continue_button();
//            d3.select(".filter.buttons")
//                    .select('#apply_filter_button')
//                    .on("click",applyFilter);
//            
//    	}
//        
//        ifeed.main_plot.cancel_selection('remove_highlighted');
//    	document.getElementById('tab2').click();
//    	ifeed.main_plot.highlight_support_panel();
//                
//        d3.select('.filter.options.dropdown')[0][0].value = "numOfInstruments";
//        ifeed.filter.initialize_preset_filter_input("numOfInstruments"); 
//        
//        title = "Preset Filters: Number of instruments";
//        objects = [d3.selectAll('#support_panel')[0][0]];
//
//        contents = ['<p>The filter called \'Number of instruments\' is used to selectively highlight designs that '
//    			+'use the specified number of instruments. '
//    			+'It has some flexibility in what arguments you can enter to this filter. </p>'
//    			+'<p> - If orbit name and instrument names are not given (input field empty), '
//    			+'then it will count the number of all instruments used in the design. </p>'
//    			+'<p> - If orbit name is given, then it will count the number of instruments in that particular orbit. </p>'
//    			+'<p> - If instrument name is given, then it will count the number of those instruments. </p>'
//    			+'<p> (IMPORTANT: Either one of orbit name or instrument name should be empty)'];
//
//        classname='introjs_tooltip';
//        
//        prompt = '<p>To continue, follow the steps below:</p>'
//                +'<p>1. Select \'Number of instruments\' option from the dropdown menu. </p>'
//    			+'<p>2. Fill in the input fields. At least one of instrument or orbit names should be empty. The number cannot be empty.</p>'
//    			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>';   
//    }
//    else if(current_view==23){
//    	if(max_view_reached<23){
//    		deactivate_continue_button();
//    	}
//    	d3.select("#tutorial_header").text("Preset Filters: Num of instruments in a subset")
//    	d3.select("#tutorial_text_1").html('<p>The filter called \'Num of instruments in a subset\' is used to selectively highlight designs that assign to an orbit a certain number of instruments from a given set. For example, you can specify that at least 2 instruments out of {A,B,C,D,E} should be assigned to orbit 1000.To continue, follow the steps below:</p>'
//                +'<p>1. Select \'Num of instruments in a subset\' option from the dropdown menu.</p>'
//    			+'<p>2. Put in an orbit name.</p>'
//    			+'<p>3. Put in the minimum and the maximum number of instruments.</p>'
//    			+'<p>4. Put in a group of instruments to be counted.</p>'
//    			+'<p>5. Then click [Apply as new feature] button to apply the filter.</p>'
//    			+'<p>Now We\'ve covered many of the preset filters, but not all of them. You can test other filters that we haven’t used and see if you understand what they do.</p>');
//    
//    	document.getElementById('tab2').click();
//    	highlight_support_panel();
//    	
//    	d3.select('#filter_options').select('select')
//    		.style('border-width','5px')
//    		.style('border-style','solid')
//    		.style('border-color','#FF2D65');
//        
//    	d3.select('#applyFilterButton_new')
//    		.style('border-width','5px')
//    		.style('border-style','solid')
//    		.style('border-color','#FF2D65');
//    }

    else if(self.current_view==19){
        
        ifeed.main_plot.cancel_selection();
        experiment.select_archs_using_ids(tutorial_selection);
        experiment.condition_number=3;
        
//        // Run data mining
        ifeed.UI_states.selection_changed= true;
        
        ifeed.data_mining.initialize();
        ifeed.data_mining.run();
    	        
        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        
        title = 'Feature Analysis';
        objects = [d3.selectAll('#support_panel')[0][0]];

        contents = ["Feature Analysis tab contains a plot that shows how much coverage and specificity each feature has. ",
                    
                    "Each feature is represented by a triangle or a cross. Crosses represent the features that are added recently, and the rest of the features are represented by triangles.",
                    
                   "<p>The horizontal axis corresponds to the specificity, and the vertical axis corresponds to the coverage of a feature. </p><p>Since we want both high specificity and good coverage, your goal is to find features that will be located on the top-right corner of the plot. The star on the top-right shows the goal that you should try to reach.</p>"];

        classname = 'introjs_tooltip';
                
        prompt = "";
        
    }
    else if(self.current_view==20){
                
        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        ifeed.feature_application.clear_feature_application();
        
        title = 'Feature Analysis - Inspecting Features';
        objects = [d3.selectAll('#support_panel')[0][0], d3.select('.main_plot.figure')[0][0], d3.selectAll('#support_panel')[0][0], d3.select(".column.c2")[0][0]];

        contents = ["If you hover your mouse over each feature, you will notice three changes occurring in the interface.",
                   
                   "First, a set of dots on the scatter plot will be highlighted in pink and purple color, in the same way as when you used the filter. Again, those designs have the feature that you are currently inspecting.",
                   
                   "<p>Second, a Venn diagram appears on the right side of the Feature Analysis tab. The Venn diagram shows the composition of the designs under different sets.</p><p> The size of the blue circle corresponds to the number of designs that are inside the target region, and the size of the pink circle corresponds to the number of designs that have the current feature.</p>",
                   
                   "<p>Third, a logical expression and a graphical representation of the feature will appear in the Feature Application panel. </p><p>The logical expression is shown on the upper part of the panel, and the lower part will display the graphical representation.</p><p>More explanation about this will be provided in the next section.</p>"];

        classname = 'introjs_tooltip_large';
        
        callback = function(targetElement) {
            if(this._currentStep==1){
                ifeed.feature_application.update_feature_application("direct-update","({absent[;10;]}&&{notInOrbit[0;1,11;]})");
            }
        }    
        
        prompt = "";
        
    }        
    else if(self.current_view==21){

        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        ifeed.feature_application.clear_feature_application();
        
        title = 'Feature Application Panel';
        
        objects = [d3.select('.column.c2')[0][0],
                   d3.selectAll('#support_panel')[0][0],
                   null,
                   d3.select('#feature_application_panel')[0][0],
                  null,
                  d3.select('#feature_expression_panel:first-child')[0][0],
                  d3.select('#feature_application_panel')[0][0]
                  ];

        contents = ["Feature Application Panel allows you to modify and combine different features to create more complicated ones.",
                   
                   "<p>To add features to the Feature Application Panel, you have to click on one of the features shown on the Feature Analysis tab.</p><p> Hovering your mouse over the features will result in temporary change in the Feature Application Panel, and by clicking you can fix the change.</p>",
                    
                   "Once a feature is added, you will see a black cross blinking in the figure. It shows where the current feature is located",
                   
                   "Now you can modify the feature using the graphical representation shown in the lower part of the Feautre Application Status Panel.",
                   
                   "In the graphical representation, there are two kinds of nodes: nodes for logical connectives and nodes for individual features. The logical connectives are colored in blue, and they can be either AND or OR.",
                    
                   "As shown in the corresponding feature expression, all feature nodes inside the same logical connective node are inside the same bracket and are combined using the same logical connection.",
                   
                   "You can view possible actions by right-clicking on each node. There may be different set of options depending on which node it is. We will go over these in the next section."];

        classname = 'introjs_tooltip_large';
        
        prompt = "";        
    }
    else if(self.current_view==22){

        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        
        title = 'Interaction with Nodes in Feature Application Panel';
        
        objects = [d3.select('.column.c2')[0][0],
                  null,
                  null,
                  null,
                  null,
                  d3.select('#support_panel')[0][0],
                  d3.select('.column.c2')[0][0]];

        contents = ["<p>We will go over some of the options associated with each node. </p><p>First, right-click on one of the feature nodes, and select \"Add Parent Branch\". It adds a new logical connective node as a parent.</p>",
                   
                   "Right-click the same node and select \"Duplicate\". A new branch will appear, duplicating the content of the original node.",
                   
                   "Right-click any of the node and select \"Deactivate\". The node and the connected links will turn gray. If you check the feature expression that is displayed on the upper part of the panel, you will be able to see that the expression corresponding to the deactivated branch has disappeared.",
                   
                   "You can also delete nodes by selecting \"Delete\" option.",
                   
                   "<p>Logical connective nodes have an option called \"Add Feature\". If you select this option, the color of the node will turn red. </p><p>This indicates that when you add a new feature, it will be added under this selected node.</p>",
                   
                   "<p>Try adding a new feature by hovering your mouse over one of the features in the Feature Analysis tab. </p><p>You will see that the new feature does not replace the whole graphical representation, but is simply added to the current one. </p><p>To finalize the addition of the new feature, you need to click the feature.</p>",
                   
                   "<p>You can change the location of each node by drag and drop (with the exception of the root node - the leftmost node). </p><p>When you drag each node, temporary circles will appear around all other logical connective nodes. If you drop a node in one of those circles, the node will be added under that particular logical connective.</p><p>If the movement happens within the same parent node, the node will be added to the lower location.</p>",
                                       
                   ];

        classname = 'introjs_tooltip_large';
        
        prompt = "";    
        
        
    }   
    else if(self.current_view==23){

        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        ifeed.feature_application.clear_feature_application();
        
        title = 'Improving Specificity and Coverage of a Feature';
        
        objects = [d3.select('#feature_expression_panel')[0][0],
                  d3.select('#support_panel')[0][0],
                  d3.select('#feature_expression_panel')[0][0],
                  d3.select('#support_panel')[0][0],
                   null,
                  d3.select('#clear_all_features')[0][0]];
        

        contents = ["You can automatically improve the currently selected feature by clicking the buttons in Feature Application Panel.",
                   
                   "First, select a feature that you want to improve, and add it to the feature application panel by clicking it",
                   
                   "Then click either \"Improve specificity\", or \"Improve coverage\" button to improve one of the metrics",
                    
                    "If there is a feature that improves currently existing set of features, it will appear in the Feature plot as a cross.",
                    
                    "You can use this capability to improve features until you get close to the utopia point.",
                   
                   "Finally, you can remove the current feature by clicking \"clear\" button."];

        classname = 'introjs_tooltip';
        
        prompt = "";    
        
        
    }          
    else if(self.current_view==24){ 
        
        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        ifeed.feature_application.clear_feature_application();
        
        title = 'Basic strategies for exploring new features';
        
        objects = [d3.select('.columns')[0][0]];

        contents = ["<p>We went over all the features of iFEED! Here you will learn some basic strategies you can take to find the good features. </p><p>Try to follow the directions now and generate your own feature. </p>",
                    
                    "<p>First, it is a good idea to build upon the features that are found by the data mining, as they provide relatively good starting points.</p><p>Start with a general feature (having good coverage), and try to combine it with other features using ANDs to make it more specific.</p>",
                    
                    "<p>In other words, start with a feature that is on the top-left corner (in the figure inside Feature Analysis tab), and try to move the cursur to the right side of the plot.</p>",
                    
                    "<p>If you think the feature is too specific (having poor coverage), then put it inside an OR node by using \"Add Parent Branch\" on the root node (the leftmost node). </p><p>Then, add a new general feature inside the OR node.</p>",
                    
                    "<p>Now try to make it specific again by adding new nodes under the newly created AND node.</p>",        
        
                    '<p>A good feature will likely consist of both ANDs and ORs in combination.</p>'];

        classname = 'introjs_tooltip_large';
        
        prompt = "";
        
        
    }    
    else if(self.current_view==25){ 
    	self.deactivate_continue_button();
    	
        document.getElementById('tab3').click();
        ifeed.main_plot.highlight_support_panel();
        ifeed.feature_application.clear_feature_application();
        
        title = 'Tutorial Finished';
        
        objects = [null];

        contents = [null];

        classname = 'introjs_tooltip_large';
        
        prompt = '<p style="font-weight:bold;">This is the end of the tutorial. '
    		+'Once you start the experiment, you will not be able to return to this tutorial. If you don\'t understand specific'
    		+' part of this tool, you can go back to that section now and review the material or ask questions to the experimenter. </p>'
    		+'<p style="font-weight:bold;">In the experiment, you will be given 3 tasks. For each task, you will be provided with a different set of capabilities to do the analysis. For some tasks, you will have only a subset tools introduced in this tutorial.</p>'
            +'<p>The goal of all tasks is to find good features that have good specificity and coverage.</p>'
    		+'<p style="font-weight:bold">After each task is finished, you will be asked to verbally describe to us what interesting features you have just found. Please let the experimenter know when you finish each task. </p>'
    		+'<p>Now you can move on to the experiment by clicking the button below. Good luck!</p>';
        
        
        d3.select('#prompt_body')
                .append('g')
                .append('button')
                .attr('id','tutorial_button_1')
                .style('margin-right','20px')
                .style('font-size','18px')
                .text('Start the Experiment')
                .on('click',start_experiment);

        
//    	d3.select('#tutorial_text_1')
//    		.insert('button')
//    		.attr("type","button")
//    		.attr("id","experiment_start_button")
//    		.style("width","220px")
//    		.style("height","30px")
//    		.style("margin-top:20px");
//    	d3.select("#experiment_start_button")
//    		.text("Start the Experiment")
//    		.on("click", start_experiment);
    }
        
    
    self.write_prompt(title,prompt);
    
    if(self.current_view!=25){
        self.start_intro(objects,contents,classname,callback);
    }    

    }
    
}







//function credential_check(){
//
//    var cred = window.location.search;
//    if(cred){
//        cred = cred.substring(1);
//        account_id = cred;
//        testType = "3";
//    }else{
//        testType = "3";
//        account_id = "3123123123";
//    }
//    
//
//    max_view_reached = 5;
//    current_view=5;
//    displayed_view=5;
//
//    // Import data with reduced data set for tutorial
//    import_new_data("/results/reduced_data.csv");
//    display_views();
//    unhighlight_support_panel();
//}


function start_experiment(){
    window.location.replace("http://52.14.7.76/experiment");
}



function select_driving_features(expression){
	
    var was_selected = false;
    var id = -1;
    for(var i=0;i<selected_features.length;i++){
        if(selected_features_expressions[i]===expression){
            was_selected = true;
            id = selected_features[i];            
        }
    }
    if(!was_selected){
        d3.selectAll('.bar')[0].forEach(function(d){
        	if(d.__data__.expression==expression){
        		id = d.__data__.id;
        		selected_features.push(id);
        		selected_features_expressions.push(expression);
        	}
        });
        update_df_application_status(expression);
        d3.selectAll("[class=bar]").filter(function(d){
            if(d.id===id){
                return true;
            }else{
                return false;
            }
        }).style("stroke-width",3); 
    }
}





var tutorial_feature_example_b = "{present[;1;]}&&{notInOrbit[2;1;]}&&{notInOrbit[3;1;]}&&{absent[;3;]}&&{notInOrbit[2;8;]}&&{notInOrbit[0;4;]}&&{notInOrbit[3;5;]}&&{notInOrbit[2;4;]}&&{separate[;4,2;]}&&{notInOrbit[2;7;]}&&{notInOrbit[4;0;]}&&{notInOrbit[3;0;]}&&{notInOrbit[2;2;]}&&{notInOrbit[3;9;]}&&{notInOrbit[4;2;]}";

var tutorial_selection = "6,51,165,169,176,189,194,227,237,239,258,287,298,303,313,322,324,339,341,349,352,353,354,359,360,366,369,370,373,382,387,402,406,408,425,426,439,444,473,490,504,506,510,514,519,523,527,532,540,546,575,576,594,600,601,604,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,681,686,687,688,692,699,703,704,707,718,725,727,728,733,736,740,741,742,744,746,751,761,762,770,774,777,778,781,786,790,793,800,801,802,805,810,812,813,815,816,823,825,832,835,836,840,845,846,856,861,862,865,872,877,878,886,889,891,896,899,905,910,911,912,917,929,933,936,939,943,945,950,952,957,960,965,967,975,977,978,986,1003,1005,1010,1015,1018,1021,1024,1027,1029,1031,1032,1035,1036,1038,1042,1045,1051,1052,1053,1059,1064,1068,1070,1076,1077,1084,1085,1089,1094,1096,1101,1113,1117,1119,1120,1121,1124,1137,1149,1157,1158,1162,1163,1171,1172,1177,1181,1182,1190,1194,1195,1199,1214,1216,1224,1228,1238,1242,1249,1250,1251,1252,1262";

var tutorial_selection2 = "0,19,44,50,67,75,91,132,157,160,165,169,227,258,262,264,266,287,303,316,330,339,444,460,473,504,508,622,624,647,653,659,667,670,687,692,693,698,699,701,707,718,725,736,739,758,770,790,796,812,824,835,856,864,865,883,912,929,950,960,965,982,1005,1029,1038,1117,1119,1120,1157,1182,1188,1216,1224,1254";

var tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}";


