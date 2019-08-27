
//        A          B         C          D         E        F
// {"ACE_ORCA","ACE_POL","ACE_LID","CLAR_ERB","ACE_CPR","DESD_SAR",
// 
//       G        H           I            J         K              L
// "DESD_LID","GACM_VIS","GACM_SWIR","HYSP_TIR","POSTEPS_IRS","CNES_KaRIN"};
// 
//      1000                2000            3000        4000            5000
//{"LEO-600-polar-NA","SSO-600-SSO-AM","SSO-600-SSO-DD","SSO-800-SSO-DD","SSO-800-SSO-PM"};




class EOSSAssigningLabel extends Label{
    constructor(disabled){
        super(disabled);        
        
        this.orbit_list = [];
        this.instrument_list = [];
        this.orbit_extended_list = [];
        this.instrument_extended_list = [];

        this.orbit_relabeled_fixed = ["LEO-600-polar","SSO-600-AM","SSO-600-DD","SSO-800-DD","SSO-800-PM"];
        this.instrument_relabeled_fixed = ["OCE_SPEC","AERO_POL","AERO_LID",
            "HYP_ERB","CPR_RAD","VEG_INSAR","VEG_LID","CHEM_UVSPEC",
            "CHEM_SWIRSPEC","HYP_IMAG","HIRES_SOUND","SAR_ALTIM"];
        // this.instrument_relabeled = ["ACE_ORCA","ACE_POL","ACE_LID","CLAR_ERB","ACE_CPR","DESD_SAR","DESD_LID","GACM_VIS","GACM_SWIR","HYSP_TIR","POSTEPS_IRS","CNES_KaRIN"];
        // this.orbit_relabeled = ["1","2","3","4","5"];
        // this.instrument_relabeled = ["A","B","C","D","E","F","G","H","I","J","K","L"];

        this.orbit_relabeled = JSON.parse(JSON.stringify(this.orbit_relabeled_fixed));
        this.instrument_relabeled = JSON.parse(JSON.stringify(this.instrument_relabeled_fixed));

        this.feature_names = ["present","absent","inOrbit","notInOrbit","together",
                            "togetherInOrbit","separate","emptyOrbit","numOrbits", "numInstruments", "numInstrumentsInOrbit",
                            "absent_except", "emptyOrbit_except", "notInOrbit_except", "separate_except"];

        this.feature_display_order = ["notInOrbit", "separate", "absent", "emptyOrbit", 
                            "inOrbit", "together", "present",
                            "numOrbits", "numInstruments", "numInstrumentsInOrbit",
                            "absent_except", "emptyOrbit_except", "notInOrbit_except", "separate_except"];
        this.feature_relabeled = null;
        // this.feature_relabeled = ["present","absent","assignedTo","notAssignedTo","together","bothAssignedTo","notAssignedTogether","emptySlot","numSlots","AtLeastTwoItemsAssignedTo"];

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.orbit_list = data.orbit_list;
            this.instrument_list = data.instrument_list;
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });

        PubSub.subscribe(GENERALIZED_CONCEPTS_LOADED, (msg, data) => {
            this.orbit_extended_list = data["rightSet"];
            this.instrument_extended_list = data["leftSet"];
            this.instance_map = data["instanceMap"];
            this.superclass_map = data["superclassMap"];

            this.orbit_relabeled = JSON.parse(JSON.stringify(this.orbit_relabeled_fixed));
            this.instrument_relabeled = JSON.parse(JSON.stringify(this.instrument_relabeled_fixed));
            for(let i = this.orbit_relabeled.length; i < this.orbit_extended_list.length; i++){
                this.orbit_relabeled.push(this.orbit_extended_list[i]);
            }

            for(let i = this.instrument_relabeled.length; i < this.instrument_extended_list.length; i++){
                this.instrument_relabeled.push(this.instrument_extended_list[i]);
            }
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });
    }
    
    featureActualName2DisplayName(featureName){
        if(!this.feature_relabeled){
            return featureName;
        
        }else if(this.feature_names.indexOf(featureName) != -1){
            let index = this.feature_names.indexOf(featureName);
            return this.feature_relabeled[index];
        }
        return "FeatureNameNotFound";
    }
    
    /*
     * @param {int} index: Number indicating either an oribt or an instrument
     * @param {String} type: Type of the input name. Could be either "orbit" or "instrument"
     * @returns The actual name of an instrument or an orbit
     */
    index2ActualName(index, type){
        if(type=="orbit"){
            if(index  >= this.orbit_list.length && this.orbit_extended_list.length != 0){
                return this.orbit_extended_list[index];
            }else{
                return this.orbit_list[index];   
            }

        }else if(type=="instrument"){
            if(index >= this.instrument_list.length && this.instrument_extended_list.length != 0){
                return this.instrument_extended_list[index];
            }else{
                return this.instrument_list[index];
            }

        }else{
            return "Naming Error"
        }
    }
    
    /*
     * @param {int} index: Number indicating either an orbit or an instrument
     * @param {String} type: Type of the variable. Could be either "orbit" or "instrument"
     */
    index2DisplayName(index, type){
        
        if(this.disabled){
            return this.index2ActualName(index,type);
        }

        if(type === "orbit"){
            return this.orbit_relabeled[index];

        }else if(type === "instrument"){
            return this.instrument_relabeled[index];

        }else{
            return "Naming Error";
        }
    }
    
    actualName2Index(name, type){

        name = name.trim();
        if(name.indexOf(",") != -1){
            let names = name.split(",");
            let newNames = [];
            for(let i = 0; i < names.length; i++){
                newNames.push(this.actualName2Index(names[i], type));
            }
            return newNames.join(",");

        }else{
            if(type === "orbit"){
                if(this.orbit_list.includes(name)){
                    return this.orbit_list.indexOf(name);
                }else{
                    return this.orbit_extended_list.indexOf(name);
                }

            }else if(type === "instrument"){
                if(this.instrument_list.includes(name)){
                    return this.instrument_list.indexOf(name);
                }else{
                    return this.instrument_extended_list.indexOf(name);
                }
            }else{
                return "Wrong type specified: " + type;
            }        
        }
    }
    
    displayName2Index(input, type){
        if(this.disabled){
            return this.actualName2Index(input,type);
        }

        input = input.trim();
        let split = input.split(',');
        let output='';
        for(let i = 0; i < split.length; i++){
            let name = split[i];
            if(this.orbit_relabeled.indexOf(name) === -1 && this.instrument_relabeled.indexOf(name) === -1){
                return null;
            }
            if(i > 0) output = output + ",";

            if(type === "orbit"){
                output = output + $.inArray(name,this.orbit_relabeled);
            }else if(type === "instrument"){
                output = output + $.inArray(name,this.instrument_relabeled);
            }else{
                return "Naming Error";
            }
        }
        return output;
    }
    
    actualName2DisplayName(name,type){
        if(this.disabled){
            return name;
        }

        name = name.trim();
        if(type == "orbit"){
            
            let nth = $.inArray(name,this.orbit_list);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return this.orbit_relabeled[nth];
            
        } else if(type=="instrument"){
            let nth = $.inArray(name,this.instrument_list);
            if(nth==-1){ // Couldn't find gthe name from the list
                return name;
            }
            return this.instrument_relabeled[nth];
        } else{
            return name;
        }
    }
    
    displayName2ActualName(name,type){
        if(this.disabled){
            return name;
        }
        
        name = name.trim();
        if(type=="orbit"){
            let nth = $.inArray(name,this.orbit_relabeled);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return this.orbit_list[nth];
        } else if(type=="instrument"){
            let nth = $.inArray(name,this.instrument_relabeled);
            if(nth==-1){ // Couldn't find gthe name from the list
                return name;
            }
            return this.instrument_list[nth];
        } else{
            return name;
        }
    }
    
    pp_feature_type(expression){
        if(expression.indexOf('[')==-1){
            return expression;
        }

        let type = '';
        let erase = false;
        for(let i = 0; i < expression.length; i++){
            if(expression[i] === '['){
                erase = true;
            }else if(expression[i] === ']'){
                erase = false;
            }else if(expression[i] === '{' || expression[i] === '}'){
                // do nothing
                continue;
            }else if(!erase){
                type = type + expression[i];
            }
        }
        return type;
    }
    
    pp_feature_single(expression){
        let exp = expression;
        if(exp[0] === "{" && exp[exp.length - 1] === "}"){
            exp = exp.substring(1, exp.length - 1);
        }

        let numComponents = exp.split("[").length - 1;
        let names = [];
        let argSetString = [];

        if(numComponents === 0){
            let name = exp;
            if(name === "paretoFront" || name === 'FeatureToBeAdded' 
            || name === 'AND' || name === 'OR' 
            || name === 'IF_THEN'){
                return exp;
            }

        } else {
            for(let i = 0; i < numComponents; i++){
                let component = exp.split("]")[i];
                names.push(component.split("[")[0]);
                argSetString.push(component.split("[")[1]);
            }

            let combinedFeatureName = names.join("_");
            if(combinedFeatureName[0] === '~'){
                combinedFeatureName = 'NOT '+ combinedFeatureName.substring(1);
            }
        }

        let ppExpression = [];
        for(let i = 0; i < numComponents; i++){
            let name = names[i];
            let componentArgs = argSetString[i];
            let orbits = componentArgs.split(";")[0].split(",");
            let instruments = componentArgs.split(";")[1].split(",");
            let numbers = componentArgs.split(";")[2];

            let pporbits = [];
            let ppinstruments = [];
            for(let j = 0; j < orbits.length; j++){
                if(orbits[j].length === 0){
                    continue;
                }else{
                    pporbits.push(this.index2DisplayName(orbits[j], "orbit"));
                }
            }

            for(let j = 0; j < instruments.length; j++){
                if(instruments[j].length === 0){
                    continue;
                }else{
                    if(+instruments[j] >= this.instrument_list.length){
                        ppinstruments.push(this.index2DisplayName(instruments[j], "instrument"));
                    }
                }
            }
            for(let j = 0; j < instruments.length; j++){
                if(instruments[j].length === 0){
                    continue;
                }else{
                    if(+instruments[j] < this.instrument_list.length){
                        ppinstruments.push(this.index2DisplayName(instruments[j], "instrument"));
                    }
                }
            }

            let ppComponent = this.featureActualName2DisplayName(name) + "[" + pporbits.join(", ") + ";  " + ppinstruments.join(", ") + ";  " + numbers + "]";
            ppExpression.push(ppComponent)
        }
        return ppExpression.join(" ");
    }
    
    pp_feature(expression){
        let output = '';

    //    if(expression.indexOf('{FeatureToBeAdded}')>-1){
    //        expression=expression.replace('&&{FeatureToBeAdded}','');
    //        expression=expression.replace('||{FeatureToBeAdded}','');
    //        expression=expression.replace('{FeatureToBeAdded}&&','');
    //        expression=expression.replace('{FeatureToBeAdded}||','');
    //    }

        let save = false;
        let savedString = '';

        for(let i = 0; i < expression.length; i++){
            if(expression[i] === '{'){
                save = true;
                savedString = '{';
            } else if (expression[i] === '}'){
                save = false;
                savedString = savedString + '}';
                let feature_expression = savedString;
                output = output + '{' + this.pp_feature_single(feature_expression) + '}';
            } else {
                if(save){
                    savedString = savedString + expression[i];
                }else{
                    output = output + expression[i];
                }
            }
        }
        return output;
    }

    pp_feature_single_variable_tagged(expression){
        let exp = expression;
        if(exp[0] === "{" && exp[exp.length - 1] === "}"){
            exp = exp.substring(1, exp.length - 1);
        }

        let numComponents = exp.split("[").length - 1;
        let names = [];
        let argSetString = [];

        if(numComponents === 0){
            if(exp === "paretoFront" || exp === 'FeatureToBeAdded' 
            || exp === 'AND' || exp === 'OR' 
            || exp === 'IF_THEN'){
                return exp;
            }

        } else {
            for(let i = 0; i < numComponents; i++){
                let component = exp.split("]")[i];
                names.push(component.split("[")[0]);
                argSetString.push(component.split("[")[1]);
            }

            let combinedFeatureName = names.join("_");
            if(combinedFeatureName[0] === '~'){
                combinedFeatureName = 'NOT '+ combinedFeatureName.substring(1);
            }
        }

        let ppExpression = [];
        for(let i = 0; i < numComponents; i++){
            let name = names[i];
            let componentArgs = argSetString[i];
            let orbits = componentArgs.split(";")[0].split(",");
            let instruments = componentArgs.split(";")[1].split(",");
            let numbers = componentArgs.split(";")[2];

            let pporbits = [];
            let ppinstruments = [];

            // Orbit variables
            for(let j = 0; j < orbits.length; j++){
                if(orbits[j].length === 0){
                    continue;
                }else{
                    let varname = this.index2DisplayName(orbits[j], "orbit");
                    let classname = "";
                    if(+orbits[j] >= this.orbit_list.length){
                        // Generalized variable
                        classname = "baseFeatureComponent generalizedVariable orbit";
                    } else {
                        classname = "baseFeatureComponent instanceVariable orbit";
                    }
                    pporbits.push("<tspan class=\"" + classname + "\">" + varname + "</tspan>");
                }
            }

            // Generalized variables
            for(let j = 0; j < instruments.length; j++){
                if(instruments[j].length === 0){
                    continue;
                }else{
                    if(+instruments[j] >= this.instrument_list.length){
                        let varname = this.index2DisplayName(instruments[j], "instrument");
                        let classname = "baseFeatureComponent generalizedVariable instrument";
                        ppinstruments.push("<tspan class=\"" + classname + "\">" + varname + "</tspan>");
                    }
                }
            }

            // Instance variables
            for(let j = 0; j < instruments.length; j++){
                if(instruments[j].length === 0){
                    continue;
                }else{
                    if(+instruments[j] < this.instrument_list.length){
                        let varname = this.index2DisplayName(instruments[j], "instrument");
                        let classname = "baseFeatureComponent instanceVariable instrument";
                        ppinstruments.push("<tspan class=\"" + classname + "\">" + varname + "</tspan>");
                    }
                }
            }

            let taggedFeatureName = "<tspan class=\"baseFeatureComponent featureName\">" + this.featureActualName2DisplayName(name) + "</tspan>";
            let ppComponent = taggedFeatureName + "[" + pporbits.join(", ") + ";  " + ppinstruments.join(", ") + ";  " + numbers + "]";
            ppExpression.push(ppComponent)
        }
        return ppExpression.join(" ");
    }
    
    pp_generalization_description(description){

        let cnt = 0;
        let tempColors = ["#6DA365", "#C9813A", "#3ABEC9", "#9134C9"];
        for (let classname in this.instance_map){
            let class_and_instance_found = false;
            if(description.indexOf(classname) !== -1){
                let instances = this.instance_map[classname];
                for(let i = 0; i < instances.length; i++){
                    if(description.indexOf(instances[i]) !== -1){
                        class_and_instance_found = true;
                        break;
                    }
                }
                if(class_and_instance_found){
                    let regex = new RegExp(classname, 'g');
                    description = description.replace(regex, "<span style=\"color:"+ tempColors[cnt] +"\">"+ classname +"</span>");
                    for(let i = 0; i < instances.length; i++){
                        let regex2 = new RegExp(instances[i], 'g');
                        description = description.replace(regex2, "<span style=\"color:"+ tempColors[cnt] +"\">"+ instances[i] +"</span>");
                    }
                    cnt += 1;
                }else{
                    continue;
                }                
            }
        }

        // Replace orbit names
        for(let i = 0; i < this.orbit_list.length; i++){
            if(description.indexOf(this.orbit_list[i]) !== -1){
                let regex = new RegExp(this.orbit_list[i], 'g');
                description = description.replace(regex, this.orbit_relabeled[i]);
            }
        }

        // Replace instrument names
        for(let i = 0; i < this.instrument_list.length; i++){
            if(description.indexOf(this.instrument_list[i]) !== -1){
                let regex = new RegExp(this.instrument_list[i], 'g');
                description = description.replace(regex, this.instrument_relabeled[i]);
            }
        }

        return description;
    }

    get_feature_description_single(expression){
        let exp = expression;
        if(exp[0] === "{"){
            // Remove the outer curly bracket
            exp = exp.substring(1, exp.length-1);
        }
        let featureName = exp.split("[")[0];

        if(featureName === "paretoFront" || featureName === 'FeatureToBeAdded' 
            || featureName === 'AND' || featureName === 'OR' 
            || featureName === 'IF_THEN'){
            return exp;

        }else if(this.feature_names.indexOf(exp) !== -1){
            return exp;
        }

        let featureArg = exp.split("[")[1];
        featureArg = featureArg.substring(0, featureArg.length-1);

        let orbits = featureArg.split(";")[0].split(",");
        let instruments = featureArg.split(";")[1].split(",");
        let numbers = featureArg.split(";")[2];

        let orbitList = [];
        let instrumentList = [];
        for(let i = 0; i < orbits.length; i++){
            if(orbits[i].length === 0){
                continue;
            }
            orbitList.push(this.index2DisplayName(orbits[i], "orbit"));
        }
        for(let i = 0; i < instruments.length; i++){
            if(instruments[i].length === 0){
                continue;
            }
            instrumentList.push(this.index2DisplayName(instruments[i], "instrument"));
        }
        let pporbits = orbitList.join(", ");
        let ppinstruments = instrumentList.join(", ");

        let out = null;
        if(featureName === "present"){
            out = ppinstruments + " is used";

        } else if(featureName === "absent"){
            out = ppinstruments + " is not assigned to any orbit";

        } else if(featureName === "inOrbit"){
            if(instrumentList.length === 1){
                out = ppinstruments + " is assigned to " + pporbits;
            }else{
                out = "{" + ppinstruments + "} are assigned to " + pporbits; 
            }

        } else if(featureName === "notInOrbit"){
            if(instrumentList.length === 1){
                out = ppinstruments + " is not assigned to " + pporbits;
            }else{
                out = "{" + ppinstruments + "} are not assigned to " + pporbits; 
            }
            
        } else if(featureName === "together"){
            out = "{" + ppinstruments + "} are assigned together in one of the orbits"; 

        } else if(featureName === "separate"){
            out = "{" + ppinstruments + "} are never assigned together in one orbit"; 

        } else if(featureName === "emptyOrbit"){
            out = pporbits + " is empty"; 

        } else if(featureName === "numOrbits"){
            out = numbers + " orbits are used"; 
            
        }  

        // "present","absent","inOrbit","notInOrbit","together",
        // "togetherInOrbit","separate","emptyOrbit","numOrbits",
        // "subsetOfInstruments", "absentExceptInOrbit", "notInOrbitExceptInstrument", "notInOrbitExceptOrbit"
        return out;
    }
    
    get_feature_description(expression){
        let output = '';
        let save = false;
        let savedString = '';

        for(let i = 0; i < expression.length; i++){
            if(expression[i] === '{'){
                save = true;
                savedString = '{';
            } else if (expression[i] === '}'){
                save = false;
                savedString = savedString + '}';
                let feature_expression = savedString;
                output = output + this.get_feature_description_single(feature_expression);
            } else {
                if(save){
                    savedString = savedString + expression[i];
                }else{
                    output = output + expression[i];
                }
            }
        }

        output = output.replace(/&&/g, " AND ");
        output = output.replace(/\|\|/g, " OR ");
        return output;
    }
}




