

function ExperimentTutorial(ifeed,experiment){
    
    var self = this;
    
    self.current_view = 0;
    self.max_view = 30;
    
    
    self.max_view_reached = 0;
    self.view_actions = 0;
    
    self.currently_highlighted=[];
    
    
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

    d3.select("#move_backward_button").on("click",self.tutorial_go_back);
    d3.select("#move_forward_button").on("click",self.tutorial_continue);


    self.tutorial_continue = function(){
        self.current_view++;
        self.display_views();
    }
    

    self.tutorial_go_back = function(){
        
//        if(self.current_view==5){
//            var path = "index.html?" + testType + "-" + account_id;
//            window.location.replace(path);
//        }
        self.current_view--;
        self.display_views();
    }
    
    

    self.write_tutorial_prompt = function(title,body){

        d3.select("#prompt_header").text(title);
        d3.select("#prompt_body_text_1").html(body);

    }

    self.highlight_border = function(obj_list){

        for(var i=0;i<obj_list.length;i++){
            var tag = obj_list[i];
            d3.select(tag).style('border-width','5px').style('border-color','#FF2D65');
        }

        self.currently_highlighted = obj_list;
    }
    
    self.unhighlight_border = function(){

        for(var i=0;i<self.currently_highlighted.length;i++){
            
            var tag = self.currently_highlighted[i];
            d3.select(tag).style('border-width','1px').style('border-color','#000000');
            
        }
        self.currently_highlighted = [];
    }
    
    
    self.clear_view = function(){

        self.unhighlight_border();
    }

    

self.display_views = function(){
	
    // Initialize
    self.clear_view();

    // Set the page number
    d3.select('#prompt_page_number').text("" + self.current_view + "/"+ self.max_view);
    
    if(self.current_view==5){ // Scatter plot panel

        var title = 'Scatter Plot Panel';
        var body = '<p>The scatter plot panel (box highlighted in red) displays thousands of different designs of '
                                           +'satellite systems. Each dot corresponds to one design, and its location indicates the corresponding cost and science benefit score of the design. </p>'
                                           +'<p>You can zoom in and zoom out using your mouse wheel, or using pinching motion if you are using a trackpad. You can also pan using your mouse.</p>'
                                          +'<p>Note: During the tutorial, please focus on the part that is currently highlighted. Explanation about other parts of the interface may be provided later in the tutorial. </p>';
        
        self.write_tutorial_header(title,body);
        self.highlight_border([d3.select('.main_plot.figure')[0][0]]);
    }
    
    else if(self.current_view==6){ // Target solutions

        var title = "Target designs";
        var body = '<p>For each task, a group of dots will be highlighted in a light blue color. '
                                           +'These dots represent the target designs that you need to investigate. Your goal is to find patterns that are shared uniquely by these designs.';

        self.write_tutorial_header(title,body);
        self.highlight_border(d3.select('.main_plot.figure')[0]);

        experiment.select_archs_using_ids(tutorial_selection);
        d3.select("#num_of_selected_archs").text(""+ifeed.main_plot.get_num_of_selected_archs());   
    }

    
    else if(self.current_view==7){ // Number of designs shown

        
        var title = "Number of designs";
        var body = '<p>The total number of designs and the number of target designs are displayed in the boxes '
                                           +'above the scatter plot.</p>';
        
        self.write_tutorial_header(title,body);
        self.highlight_border(d3.selectAll('#status_display > div')[0]);
    }

    else if(self.current_view==8){ 
        
        var title = "Analysis Panel";
        var body = '<p>The analysis panel is located below the scatter plot panel.</p>';

        self.write_tutorial_header(title,body);
        self.highlight_border(d3.selectAll('#support_panel')[0]);
        
    }
    else if(self.current_view==9){
        
        if(self.max_view_reached < 9){
            self.deactivate_continue_button();
        }
        
        var title = "Design Inspection";
        var body = '<p>If you hover your mouse over a design on the scatter plot, the relevant information '
                                           +'will be displayed on the \"Inspect Design\" tab. The displayed information contains the science benefit score and the cost, as well as a figure that shows what instruments are assigned to each orbit. </p>'

                                           +'<p>The borderline of either the scatter plot or the analysis panel will be represented by bold lines. The bold line means that the panel is currently focused. When the analysis panel is focused, hovering the mouse over a dot on the scatter plot will not change the information already displayed on the analysis panel. To enable the inspection of designs by hovering, click the scatter plot to bring the focus back to the scatter plot. </p>'

                                           +'<p>To continue, try alternating the focus by clicking on the scatter plot and the analysis panel.</p>';

        self.write_tutorial_prompt(title,body);
        self.highlight_border(d3.selectAll('#support_panel')[0]);
        
        document.getElementById('tab1').click();
        
        ifeed.main_plot.cancel_selection();        
        ifeed.main_plot.unhighlight_support_panel();
    }

    else if(self.current_view==10){

        var title = 'Finding "good" features';
        var body = '<p>Now, we will define what a good feature is. Your goal in this experiment is to find “good” features that explain the target region well. Below are some examples of how features might look like (these are just examples, so you don\'t have to pay attention to the details): </p>'

            +'<p>1. Instrument A is assigned to orbit 1000 </p>'
            +'<p>2. Instrument A and instrument B are assigned together in one orbit</p>'
            +'<p>3. Instrument C and instrument D are not assigned to the same orbit</p>'
            +'<p>4. Orbit 2000 is empty </p>'
            +'<p>5. At least two instruments out of instruments A, B, C are assigned to the same orbit </p>'
            +'<p>6. Instrument D is assigned to either orbit 1000 or orbit 2000</p>'
            +'<p>7. Orbit 1000 is assigned only two instruments</p>'                                   

            +'<p>You can think of these features as descriptions of the target designs. A “good” feature should explain most of the target designs, while not being too general. </p>';   
        
    }
    
    else if(self.current_view==11){

        ifeed.main_plot.cancel_selection();
        experiment.select_archs_using_ids(tutorial_selection);

        var title = 'Coverage of target designs';
        var body = 
            '<p>Consider the following description: </p>'
            +'<p>(a) At least one of the instruments A and G is used in the design</p>'
            +'<p>Try clicking the button below to show what designs have the feature (a). The pink and purple dots in the scatter plot are all the designs that have feature (a), meaning that they use either instrument A or G (or both) in their designs. Purple dots are the overlap between the pink dots (designs with the feature) and the blue dots (target). Note that many of the target designs share this feature (as shown by the purple dots). We say that this feature has a large coverage of target designs. Such large coverage is desired in a good feature. </p>'

            +'<p>However, (a) is not necessarily what we are looking for. It is too general, meaning that it also applies to many of the non-target designs as well. This leads us to the next criterion for a good feature. </p>';

        var buttons = d3.select('#tutorial_buttons').append('g')

        buttons.append('button')
                .attr('id','tutorial_button')
                .text('Highlight designs with feature (a)')
                .style('margin-right','20px')
                .style('font-size','18px')
                .on('click',function(d){
                    applyComplexFilter('{present[;0;]}||{present[;6;]}');
                });
    }
    
else if(current_view==12){
    
    cancelDotSelections();
    select_archs_using_ids(tutorial_selection);
    
    d3.select('#tutorial_header').text('Specificity');
    d3.select('#tutorial_text_1').html(
        
        '<p>Now let\'s look at another description (Just see how it looks. The details are not important!):</p>'
        +'<p>(b) Instrument B is used, and D is not used in the design, and E and C are never assigned to the same orbit. Instrument E is not assigned to orbit 1000. Instrument B, C, E, H, I are not assigned to orbit 3000, instruments A, B, F, J are not assigned to orbit 4000. Moreover, instrument A and instrument C are not assigned to orbit 5000.</p>'
        
        +'<p>Pretty complicated, right? Now try clicking the button below to highlight the designs with this feature. If you look closely, you will see that many of the pink dots have disappeared. This is good becuase we wanted to find a feature that uniquely describes the target region and does not cover the non-target region. We say that feature (b) is highly specific to the target region, and this is the second criterion that we require from a good feature.</p>'
        
        +'<p>However, if you look closely, you will notice that now many of the purple dots (target designs covered by the feature) have also disappeared. Only very small portion of the targets are in purple color now. Therefore, (b) is too specific, meaning that it only accounts for a small number of targets. Or you can say that the coverage of target designs have decreased. </p>'
        
        +'<p>As you may have noticed, there are two conflicting criteria that we are seeking from a good feature. Let\'s summarize those points in the next section.</p>'
    );
    
    var buttons = d3.select('#tutorial_buttons').append('g')
    buttons.append('button')
            .attr('id','tutorial_button')
            .text('Highlight designs with feature (b)')
            .style('font-size','18px')
            .on('click',function(d){
                applyComplexFilter(tutorial_feature_example_b);
            });
    
}else if(current_view==13){
    
    cancelDotSelections();
    select_archs_using_ids(tutorial_selection);
    
    d3.select('#tutorial_header').text('The key is finding the balance');
    d3.select('#tutorial_text_1').html(
        '<p>In summary, a good feature should satisfy the following two conditions:</p>'
        +'<p>1. The feature should cover a large area of the target region (maximize the number of purple dots)</p>'
        +'<p>2. The feature should be specific enough, so that it does not cover the non-target region (minimize the number of pink dots)</p>'
        +'<p>As we have seen in the previous example, there is a trade-off between these two conditions. If you try to make a feature cover more targets, you might make it too general, and make it cover non-target designs as well (too many pink dots). On the other hand, if you try to make a feature too specific, it may not cover many target designs (too few purple dots). </p>'
        +'<p>Therefore, the key is finding the right balance between those two criteria. You can test the features again and see how they are distributed in the scatter plot by clicking the buttons below. (Reminder: Feature (a) is has good coverage but is not specific enough. Feature (b) is specific but has very low coverage of the targets.)</p>'
        +'<p>Understanding this concept is important. If you are not sure about the concept introduced here, please ask questions to the experimenter for clarification.</p>'
    );
    
    var buttons = d3.select('#tutorial_buttons').append('g')
    
    buttons.append('button')
            .attr('id','tutorial_button_1')
            .text('Highlight designs with feature (a)')
            .style('margin-right','20px')
            .style('font-size','18px')
            .on('click',function(d){
                cancelDotSelections('remove_highlighted');
                applyComplexFilter('{present[;0;]}||{present[;6;]}');
            });
    
    
    buttons.append('button')
            .attr('id','tutorial_button_2')
            .text('Highlight designs with feature (b)')
            .style('font-size','18px')
            .on('click',function(d){
                cancelDotSelections('remove_highlighted');
                applyComplexFilter(tutorial_feature_example_b);
            });
}
    
    
else if(current_view==14){
	d3.select("#tutorial_header").text("Filters")
	d3.select("#tutorial_text_1").html('<p>Now we will learn how to use iFEED as a tool to find good features. </p>'
                                       
                                       +'<p> In the analysis panel, you can find a tab for filter settings. Filters are used to highlight a group of designs that share the common feature that you define. For example, you can selectively highlight designs that use instrument C in any orbit, or highlight designs that assign instrument D and E to the orbit 4000. </p>'
                                       
                                       +'<p>The most basic and useful features have been identified and built into the filter options. You can select one of these preset filters to specify what patterns you want to investigate. We will test some of these preset filters in the following pages.</p>');

    // Run data mining
    runDataMining();
    
    
    d3.select('#test_feature_scheme')[0][0].disabled=true;  
    
    d3.selectAll('.dot.dfplot').remove();

    // Remove automatically generated placeholder
    d3.selectAll('.applied_feature').remove();
    current_feature_application = [];
    update_feature_expression();
    

    document.getElementById('tab2').click();
    highlight_support_panel();
    d3.select('#supportPanel')
        .style('border-width','5px')
        .style('border-style','solid')
        .style('border-color','#FF2D65');
	
}


else if(current_view==15){
	if(max_view_reached < 15){
		deactivate_continue_button();
	}
    
    cancelDotSelections('remove_highlighted');
    
	d3.select("#tutorial_header").text("Preset Filters: Present")
	d3.select("#tutorial_text_1").html('<p>The filter called \'Present\' '
			+'is used to selectively highlight designs that '
			+'contain a specific instrument. It takes in one instrument name as an argument,'
			+' and selects all designs that use that instrument. Follow the directions below to activate it:</p>'
			+'<p>1. Select \'Present\' option from the dropdown menu. </p>'
			+'<p>2. In the input field that appears, type in an instrument name. '
			+'The instrument should be an alphabet letter ranging from A to L. </p>'
			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>'
			+'<p>As a result of applying the feature, a group of dots on the scatter plot are highlighted in pink color. These dots represent designs that have the feature you just defined.</p>');
	
	document.getElementById('tab2').click();
	highlight_support_panel();
    
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');   
}


else if(current_view==16){
	if(max_view_reached<16){
		deactivate_continue_button();
	}
    
    cancelDotSelections('remove_highlighted');
    
	d3.select("#tutorial_header").text("Preset Filters: InOrbit")
	d3.select("#tutorial_text_1").html('<p>The filter called \'InOrbit\' is used to selectively highlight designs that assign a specific '
                                       +'instrument(s) to a given orbit. It takes in an orbit name and instrument name(s) as arguments. If more than one instrument name is given, then it highlights all designs that assign all those instruments into the specified orbit. To continue, follow the steps below:</p>'
			+'<p>1. Select \'InOrbit\' option from the dropdown menu. </p>'
			+'<p>2. In the first input field that appears, type in an orbit name. '
			+'The orbit name should be a number in thousands (1000, 2000, 3000, 4000, or 5000). </p>'
			+'<p>2. In the second input field, type in instrument names (1 or more). '
			+'The instrument should be an alphabet letter ranging from A to L. If there are more than one instruments,'
			+' the names should be separated by commas.</p>'
			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>');

	document.getElementById('tab2').click();
	highlight_support_panel();
	
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}
    
    
else if(current_view==17){
    
	d3.select("#tutorial_header").text("What happens when you apply a filter?")
	d3.select("#tutorial_text_1").html('<p>When you apply a filter, you will notice three changes are made in the interface:'
                                       +'<p>1. Some dots are highlighted in pink (and purple) color in the scatter plot. These dots represent all designs that have the particular feature you just defined.</p>'
                                       +'<p>2. If you go to the "Feature Analysis" tab, you will see a Venn diagram. The area of the pink circle is proportional to the number of pink dots in the scatter plot. Similarly, the area of the light blue circle corresponds to the number of blue dots in the scatter plot. The intersecting area corresponds to the purple dots, which are the target designs that have the specified feature. </p>'
                                       +'<p>3. On the feature application status panel (on the right side of the screen), you can see the current feature that is applied. </p>');

	document.getElementById('tab3').click();
	highlight_support_panel(); 
    
	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
    
    d3.select('#dfplot_venn_diagram')
        .style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
    
    d3.select('#scatterPlotFigure')
		.style('border-width','5px')
		.style('border-color','#FF2D65');

}
    
else if(current_view==18){
    
	if(max_view_reached<18){
		deactivate_continue_button();
	}
    
	d3.select("#tutorial_header").text("How to use Feature Application Status Panel")
	d3.select("#tutorial_text_1").html('<p>The Feature Application Status panel shows the currently applied feature in two different ways. First, the upper part displays the logical expression of the currently applied feature. The lower part is an interactive interface that you can use to combine multiple features and generate more complex features. '

                                      +'<p>The check box located on the left of each feature indicates whether a certain feature is being applied or not. If it is checked, it means that the corresponding feature is being used to highlight pink dots on the scatter plot. When multiple ones are checked, then it combines the effect of those features. </p>'
                                      
                                      +'<p>When you have multiple features defined, there appears a dropdown menu in between those two features. This allows you to select the logical connective used to combine the two features. For example, if AND is used, that means two features are combined using a logical conjunction (AND) to highlight pink dots.</p>'
                                      
                                      +'<p>To continue, try activating and deactivating some features, and also changing some logical connectives in between features. Note that the change is reflected on the upper part of the feature application status panel, as well as on the scatter plot in real time. </p>');
 
    
	document.getElementById('tab3').click();
	highlight_support_panel(); 
    
	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}
    
    
else if(current_view==19){
    
	if(max_view_reached<19){
		deactivate_continue_button();
	}
    
	d3.select("#tutorial_header").text("How to use Feature Application Status Panel - continued")
	d3.select("#tutorial_text_1").html('<p>The arrows next to a feature name allow you to change the location of each feature. By clicking left and right arrows, you can adjust the indentation levels of features. The indentation acts just like parentheses in a mathematical expression. If two features are at the same indentation level, they are evaluation together as if they are inside brackets. </p>'
                
                                       +'<p>For example, let\'s say you want to express A OR (B AND C), where A, B, and C are all an arbitrary feature. Then you need to place place features B and C in the same level indentation level different from A (more to the right). To continue, try generating a combined feature that has a form: \'A AND (B OR C)\', where A, B, and C are different features. You will also have to adjust the indentation of the logical connectives. </p>'
                                
                                       +'<p>(hint: Notice that whenever you make a change, you can see the current interpretation on the upper window labeled "Currently Applied Feature Expression". To implement \'A and (B or C)\', you first need to activate three features. Then, place B and C in the same indentation level. The logical connective between B and C need to be OR, and the connective between A and B need to be AND. If you have any question on how this work, please ask the experimenter.)</p>');
    
    
	document.getElementById('tab3').click();
	highlight_support_panel(); 
    
	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
} 
    
    

else if(current_view==20){
	if(max_view_reached<20){
		deactivate_continue_button();
	}
	d3.select("#tutorial_header").text("Preset Filters: together")
	d3.select("#tutorial_text_1").html('<p>Now let’s go back and try applying a few more filters.  The filter called \'together\' is used to selectively highlight designs that assign a group of instrument together in the same orbit. It is different from ‘inOrbit’ as the instruments can be assigned to any orbit. To continue, follow the steps below:</p>'
			+'<p>1. Select \'together\' option from the dropdown menu. </p>'
			+'<p>2. In the input field, type in multiple instrument names, separated by commas. '
			+'The instrument should be an alphabet letter ranging from A to L. </p>'
			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>');

	document.getElementById('tab2').click();
	highlight_support_panel();
	
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}

    
else if(current_view==21){
	if(max_view_reached<21){
		deactivate_continue_button();
	}
    
	d3.select("#tutorial_header").text("Preset Filters: Empty orbit")
	d3.select("#tutorial_text_1").html('<p>The filter called \'Empty orbit\' is used to selectively highlight designs that '
			+'do not assign any instrument to the specified orbit. It takes in a single orbit name '
			+'as an argument. To continue, follow the steps below:</p>'
			+'<p>1. Select \'Empty orbit\' option from the dropdown menu. </p>'
			+'<p>2. In the input field, type in an orbit name. '
			+'The orbit name should be a number in thousands (1000, 2000, 3000, 4000, or 5000). </p>'
			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>');

	document.getElementById('tab2').click();
	highlight_support_panel();
	
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}


else if(current_view==22){
	if(max_view_reached<22){
		deactivate_continue_button();
	}
	d3.select("#tutorial_header").text("Preset Filters: Number of instruments")
	d3.select("#tutorial_text_1").html('<p>The filter called \'Number of instruments\' is used to selectively highlight designs that '
			+'use the specified number of instruments. '
			+'It has some flexibility in what arguments you can enter to this filter. </p>'
			+'<p> - If orbit name and instrument names are not given (input field empty), '
			+'then it will count the number of all instruments used in the design. </p>'
			+'<p> - If orbit name is given, then it will count the number of instruments in that particular orbit. </p>'
			+'<p> - If instrument name is given, then it will count the number of those instruments. </p>'
			+'<p> (IMPORTANT: Either one of orbit name or instrument name should be empty)'
			+'<p>To continue, follow the steps below:</p>'
			+'<p>1. Select \'Number of instruments\' option from the dropdown menu. </p>'
			+'<p>2. Fill in the input fields. At least one of instrument or orbit names should be empty. The number cannot be empty.</p>'
			+'<p>3. Then click [Apply as new feature] button to apply the filter.</p>');

	document.getElementById('tab2').click();
	highlight_support_panel();
	
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}

else if(current_view==23){
	if(max_view_reached<23){
		deactivate_continue_button();
	}
	d3.select("#tutorial_header").text("Preset Filters: Num of instruments in a subset")
	d3.select("#tutorial_text_1").html('<p>The filter called \'Num of instruments in a subset\' is used to selectively highlight designs that assign to an orbit a certain number of instruments from a given set. For example, you can specify that at least 2 instruments out of {A,B,C,D,E} should be assigned to orbit 1000.To continue, follow the steps below:</p>'
            +'<p>1. Select \'Num of instruments in a subset\' option from the dropdown menu.</p>'
			+'<p>2. Put in an orbit name.</p>'
			+'<p>3. Put in the minimum and the maximum number of instruments.</p>'
			+'<p>4. Put in a group of instruments to be counted.</p>'
			+'<p>5. Then click [Apply as new feature] button to apply the filter.</p>'
			+'<p>Now We\'ve covered many of the preset filters, but not all of them. You can test other filters that we haven’t used and see if you understand what they do.</p>');

	document.getElementById('tab2').click();
	highlight_support_panel();
	
	d3.select('#filter_options').select('select')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
    
	d3.select('#applyFilterButton_new')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}

else if(current_view==24){

	d3.select("#tutorial_header").text("Different options to apply features")
	d3.select("#tutorial_text_1").html('<p>So far, we have only used [Apply new feature] button to apply the feature you define. This makes all the previous features listed in the Feature Application Status window automatically disabled.</p>'
                                      
                                      +'<p>You can also use [Apply OR] and [Apply AND] buttons. As the name suggests, [Apply OR] combines the new feature with the previous ones using logical disjunction (or). [Apply AND] combines the new feature with the previous ones using logical conjunction (and). [Replace placeholder] can be used to add the new feature to a certain location. The explanation about the placeholder will be provided later in the tutorial. </p>');

	document.getElementById('tab2').click();
	highlight_support_panel();

	d3.select('#applyFilterButton_add')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
	
    d3.select('#applyFilterButton_within')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');   
}
    
    


else if(current_view==25){ // Show only for testType= 3

    initialize_tabs_driving_features();
    select_archs_using_ids(tutorial_selection);
    
    d3.selectAll('.applied_feature').remove();
    current_feature_application = [];
    update_feature_expression();
    

	d3.select("#tutorial_header").text("Data Mining")
	d3.select("#tutorial_text_1").html('<p>iFEED also provides a data mining capability to help analyze the data.'
					+' The data mining capability extracts features that have a good coverage and those that have high specificity.'
					+' Extracting these patterns can be used as a starting point in finding the features that are both specific and have good coverage. </p>'
					+'<p>To run data mining, just go to the feature analysis tab and click the [Run data mining] button.</p>');
	
	document.getElementById('tab3').click();
	highlight_support_panel();
    
	d3.select('#getDrivingFeaturesButton')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');  
}

    
else if(current_view==26){ // Show only for testType= 3
	
	d3.select("#tutorial_header").text("Mined Features Explained")
	d3.select("#tutorial_text_1").html('<p>The features obtained using data mining are presented as as another scatter plot. Each triangle '
			+'represents one feature. The vertical axis represents the coverage of target region, and the horizontal axis represents the specificity'
			+' of the feature. The scores for coverage and specificity can range from 0 to 1 (larger is better).'
			+' As you hover your mouse over each triangle, the relevant information is presented in 4 ways.</p>'
			+'<p>1. Tooltip shows the scores for the coverage and specificity.</p>'
			+'<p>2. Scatterplot highlights all the designs that have the given feature (combined with whatever is shown on the Feature Application Status panel) with pink (and purple) dots. If you want to see the effect of a single feature only (without combining them with the previously added features), click [deactivate all features] button on the feature application status panel first, and then hover over the triangles. </p>'
			+'<p>3. A Venn Diagram is presented to show the composition of designs with the feature and the'
			+' selected designs.</p>'
            +'<p>4. The current feature replaces the placeholder displayed on the feature application status panel.</p>');            				
	
	document.getElementById('tab3').click();
	highlight_support_panel();
	d3.select('#supportPanel')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');  
    
	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
    
    d3.select('#dfplot_venn_diagram')
        .style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}
 
    
else if(current_view==27){ // Show only for testType= 3
	
	d3.select("#tutorial_header").text("Adding features to the feature application status panel")
	d3.select("#tutorial_text_1").html('<p>If you click one of the triangles, the feature is added to the feature application status panel.'
			                                 +' This way, you can easily add and combine multiple features to create better features.</p>'
                                      
                                      +'<p></p>');            				
	
	document.getElementById('tab3').click();
	highlight_support_panel();

	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}
  
    
else if(current_view==28){ // Show only for testType= 3
    
    d3.select('#test_feature_scheme')[0][0].disabled=false;  
	d3.select('#test_feature_scheme').on('click',test_feature);  
    
	d3.select("#tutorial_header").text("Testing features")
	d3.select("#tutorial_text_1").html('<p>Inside the feature analysis panel, there is a button [Test current feature].'
                                       +' Clicking this button will add a new point on the mined features plot as a green star. This new point shows how much coverage and specificity the currently applied feature has. The most recent one is presented as a star, but it turns into a triangle as you generate new points on the plot. </p>'
                                      
                                       +'<p>To make a feature more specific and cover many target designs, you should try to make a feature that is located at the top-right corner of the mined features plot.</p>'
                                      
                                      +'<p>Note that the features generated using data mining are provided as a starting point, and you should try to improve these features by combining them (using ANDs and ORs). Or, you can use the information you get from these basic features to try to define your own feature using Filter Settings.</p>');         				
	
	document.getElementById('tab3').click();
	highlight_support_panel();

	d3.select('#panel_2').select('div')
		.style('border-width','5px')
		.style('border-style','solid')
		.style('border-color','#FF2D65');
}
    
    
else if(current_view==29){ 
	
	d3.select("#tutorial_header").text("Basic strategies for new exploring features")
	d3.select("#tutorial_text_1").html('<p>1. When a feature is too general (covering many non-targets), you can combine it with other features using ANDs to make it more specific. Or if the current feature contains ORs, removing those OR connections help improving the spceficitiy of a feature.</p>'
                                      +'<p>2. When a feature is too specific, you can combine it with other features using ORs to make it more general. Or if the current feature contains ANDs, removing those AND connections improves the coverage of a feature. </p>'
                                      +'<p>3. You can generalize a feature by defining a new feature using Filter Settings. For example, if you are constantly seeing different combinations of instruments {A,B,C,D} in orbit 1000, you can define a new feature that says "At least 2 of A,B,C,D should be assigned to orbit 1000". </p>'
                                      
                                      +'<br><br><p>So, the recommended strategies for you to get started is:</p>'
                                      +'<p>1. Start from a general feature with a good coverage (shown in the top-left corner) and try to improve it by combining it with other general features (using AND) in order to remove pink dots.</p>'
                                      +'<p>2. Start from a specific feature with a good specificity (shown in the bottom-right corner) and try to improve it by combining it with other specific features (using OR) in order to add more purple dots.</p>'
                                      +'<p>You can use this as a starting point, but keep in mind that it is very likely that you should use both ANDs and ORs in combination in order to achieve good coverage and specificity at the same time.</p>');  
}

    
else if(current_view==30){ 
	deactivate_continue_button();
	
	d3.select("#tutorial_header").text("Tutorial Finished")
	d3.select("#tutorial_text_1").html('<p style="font-weight:bold;">This is the end of the tutorial. '
		+'Once you start the experiment, you will not be able to return to this tutorial. If you don\'t understand specific'
		+' part of this tool, you can go back to that section now and review the material or ask questions to the experimenter. </p>'
		+'<p style="font-weight:bold;">In the experiment, you will be given 3 tasks. For each task, you will be provided with a different set of capabilities to do the analysis. For some tasks, you will have only a subset tools introduced in this tutorial.</p>'
        +'<p>The goal of all tasks is to find good features that have good specificity and coverage.</p>'
		+'<p style="font-weight:bold">After each task is finished, you will be asked to verbally describe to us what interesting features you have just found. Please let the experimenter know when you finish each task. </p>'
		+'<p>Now you can move on to the experiment by clicking the button below. Good luck!</p>');  

	d3.select('#tutorial_text_1')
		.insert('button')
		.attr("type","button")
		.attr("id","experiment_start_button")
		.style("width","220px")
		.style("height","30px")
		.style("margin-top:20px");
	d3.select("#experiment_start_button")
		.text("Start the Experiment")
		.on("click", start_experiment);
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


//function start_experiment(){
//    window.location.replace("http://52.14.7.76/experiment?" + account_id);
//}


function clear_view(){
    
    view_actions = 0;	
    
    // Set the border to default
    d3.select('#supportPanel')
        .style('border-width','1px')
        .style('border-color','#000000');
        
    d3.select('#filter_options')
        .select('select')
        .style('border-width','0px')
        .style('border-color','#000000');

    d3.select('#getDrivingFeaturesButton')
        .style('border-width','0px')
        .style('border-color','#000000');

    d3.select('#applyFilterButton_new')
        .style('border-width','0px')
        .style('border-color','#000000');      

    d3.select('#applyFilterButton_add')
        .style('border-width','0px')
        .style('border-color','#000000');      

    d3.select('#applyFilterButton_within')
        .style('border-width','0px')
        .style('border-color','#000000');      

    
    d3.select('#StatusBar')
        .style('border-width','0px')
        .style('border-color','#000000');

	d3.select('#filter_application_status')
        .style('border-width','0px')
        .style('border-color','#000000');
    
	d3.select('#filter_application_save')
        .style('border-width','0px')
        .style('border-color','#000000'); 
    
    d3.select('#scatterPlotFigure')
        .style('border-width','1px')
        .style('border-color','#000000');
    
	d3.select('#panel_2').select('div')
        .style('border-width','1px')
        .style('border-color','#000000');
    
    d3.select('#dfplot_venn_diagram')
        .style('border-width','0px')
        .style('border-color','#000000');
    
    d3.select('#tutorial_buttons').select('g').remove();     

    // Clear the texts and images
	d3.select("#tutorial_header").text("");
	d3.select("#tutorial_text_1").text('');
	d3.select("#tutorial_img_1").attr("src","")
			.style("width","0%")
			.style("opacity",0);
	d3.select("#tutorial_img_2").remove();
	d3.select("#tutorial_text_2").attr("src","")
			.style("width","0%")
			.style("opacity",0);
	d3.select("#tutorial_img_credit").text("");
	activate_continue_button();
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


function get_selected_arch_ids(){
	var target_string = "";
	d3.selectAll('.dot.archPlot.selected')[0].forEach(function(d){
		target_string = target_string + "," + d.__data__.id;
	});
	return target_string.substring(1,target_string.length);
}


function get_selected_arch_ids_list(){
	var target = [];
	d3.selectAll('.dot.archPlot.selected')[0].forEach(function(d){
		target.push(d.__data__.id);
	});
	return target;
}


function select_archs_using_ids(target_ids_string){

	var target_ids_split = target_ids_string.split(',');
	var target_ids =[];
	for(var i=0;i<target_ids_split.length;i++){
		var id = + target_ids_split[i];
		target_ids.push(id);
	}
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
    	if(target_ids.indexOf(d.__data__.id)!=-1){
    		d3.select(d)
    			.classed('selected',true)
    			.style("fill", selectedColor);
    	}
    });
}


function highlight_archs_using_ids(target_ids_string){

	var target_ids_split = target_ids_string.split(',');
	var target_ids =[];
	for(var i=0;i<target_ids_split.length;i++){
		var id = + target_ids_split[i];
		target_ids.push(id);
	}
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
    	if(target_ids.indexOf(d.__data__.id)!=-1){
            var dot = d3.select(d);
            if(dot.classed('selected')){
                dot.classed('highlighted',true)
                    .style("fill", overlapColor);
            }else{
                dot.classed('highlighted',true)
                    .style("fill", highlightedColor);
            }
    	}
    });
}




var high_cost_high_perf = "1703,1704,1705,1731,1738,1740,1741,1742,1744,1746,1747,1748,1762,1789,1790,1791,1792,1794,1797,1799,1800,1804,1805,1806,1807,1822,1823,1825,1830,1832,1835,1843,1853,1857,1859,1863,1875,1878,1879,1884,1885,1888,1890,1895,1903,1908,1914,1916,1926,1928,1930,1933,1946,1951,1983,1991,1993,1994,2000,2004,2014,2015,2017,2024,2026,2034,2046,2047,2059,2076,2084,2086,2124,2179,2181,2186,2188,2189,2190,2191,2197,2202,2237,2239,2241,2247,2251,2253,2257,2262,2264,2276,2278,2282,2283,2284,2289,2290,2295,2298,2305,2310,2314,2322,2338,2346,2355,2360,2361,2363,2374,2378,2411,2466,2469,2474,2476,2481,2482,2483,2484,2487,2489,2493,2497,2507,2512,2536,2544,2569,2574,2586,2607,2610,2611,2617";
var mid_cost_mid_perf = "1695,1719,1720,1722,1723,1724,1725,1726,1727,1728,1729,1733,1734,1735,1737,1760,1761,1762,1763,1765,1767,1775,1776,1784,1785,1786,1788,1812,1814,1817,1819,1820,1821,1822,1825,1843,1849,1850,1855,1856,1864,1865,1869,1871,1875,1876,1879,1888,1889,1890,1891,1894,1896,1907,1908,1909,1920,1922,1926,1928,1934,1936,1937,1939,1941,1947,2026,2034,2035,2051,2053,2069,2158,2165,2182,2186,2192,2195,2204,2208,2210,2212,2247,2250,2258,2265,2268,2269,2272,2274,2293,2295,2302,2303,2305,2308,2310,2322,2327,2332,2355,2364,2378,2379,2380,2382,2402,2403,2405,2411,2413,2416,2417,2421,2452,2453,2456,2457,2460,2496,2503,2519,2522,2523,2536,2539,2541,2543,2555,2575,2598,2604,2614,2617";
var low_cost_low_perf = "19,25,26,34,44,77,81,106,108,161,170,1692,1694,1697,1698,1699,1700,1708,1709,1712,1715,1720,1721,1754,1759,1765,1767,1772,1773,1775,1778,1779,1781,1783,1808,1810,1811,1812,1815,1817,1819,1837,1838,1839,1840,1846,1850,1851,1852,1854,1856,1858,1860,1868,1869,1870,1871,1907,1909,1912,1915,1918,1919,1927,1935,1936,1943,1945,1947,1956,1958,1962,1963,1967,2029,2035,2049,2051,2054,2064,2088,2090,2107,2109,2117,2125,2138,2145,2148,2155,2158,2159,2165,2167,2176,2204,2207,2208,2215,2219,2224,2227,2265,2273,2321,2327,2336,2348,2356,2391,2393,2419,2427,2428,2435,2438,2439,2446,2450,2452,2490,2496,2498,2515,2522,2529,2533,2534,2546,2547,2551,2554,2555,2556,2561,2578,2581,2598,2604";



function turn_highlighted_to_selection(){
	
    d3.selectAll('.dot.archPlot.selected')
		.classed('selected',false)
        .classed('highlighted',false)
	    .style("fill", defaultColor); 
    
	d3.selectAll('.dot.archPlot.highlighted')
        .classed('selected',true)
		.classed('highlighted',false)
		.style("fill", selectedColor);  
}




var tutorial_feature_example_b = "{present[;1;]}&&{notInOrbit[2;1;]}&&{notInOrbit[3;1;]}&&{absent[;3;]}&&{notInOrbit[2;8;]}&&{notInOrbit[0;4;]}&&{notInOrbit[3;5;]}&&{notInOrbit[2;4;]}&&{separate[;4,2;]}&&{notInOrbit[2;7;]}&&{notInOrbit[4;0;]}&&{notInOrbit[3;0;]}&&{notInOrbit[2;2;]}&&{notInOrbit[3;9;]}&&{notInOrbit[4;2;]}&&{Placeholder}";



var tutorial_selection = "6,51,165,169,176,189,194,227,237,239,258,287,298,303,313,322,324,339,341,349,352,353,354,359,360,366,369,370,373,382,387,402,406,408,425,426,439,444,473,490,504,506,510,514,519,523,527,532,540,546,575,576,594,600,601,604,612,621,622,624,625,628,629,632,639,645,652,654,658,667,678,681,686,687,688,692,699,703,704,707,718,725,727,728,733,736,740,741,742,744,746,751,761,762,770,774,777,778,781,786,790,793,800,801,802,805,810,812,813,815,816,823,825,832,835,836,840,845,846,856,861,862,865,872,877,878,886,889,891,896,899,905,910,911,912,917,929,933,936,939,943,945,950,952,957,960,965,967,975,977,978,986,1003,1005,1010,1015,1018,1021,1024,1027,1029,1031,1032,1035,1036,1038,1042,1045,1051,1052,1053,1059,1064,1068,1070,1076,1077,1084,1085,1089,1094,1096,1101,1113,1117,1119,1120,1121,1124,1137,1149,1157,1158,1162,1163,1171,1172,1177,1181,1182,1190,1194,1195,1199,1214,1216,1224,1228,1238,1242,1249,1250,1251,1252,1262";



var tutorial_example_specific_feature = "{present[;1;]}&&{absent[;3;]}&&{absent[;4;]}&&{numOrbits[;;5]}&&{Placeholder}";


