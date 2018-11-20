
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
        this.orbit_generalization = [];
        this.instrument_generalization = [];

        this.orbit_relabeled = ["1000","2000","3000","4000","5000"];
        this.instrument_relabeld = ["A","B","C","D","E","F","G","H","I","J","K","L"];
        // this.orbit_relabeled = ["slot1","slot2","slot3","slot4","slot5"];
        // this.instrument_relabeld = ["A","B","C","D","E","F","G","H","I","J","K","L"];

        this.feature_names = ["present","absent","inOrbit","notInOrbit","together","togetherInOrbit","separate","emptyOrbit","numOrbits","subsetOfInstruments"];
        this.feature_relabeled = null;
        // this.feature_relabeled = ["present","absent","assignedTo","notAssignedTo","together","bothAssignedTo","notAssignedTogether","emptySlot","numSlots","AtLeastTwoItemsAssignedTo"];

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.orbit_list = data.orbit_list;
            this.instrument_list = data.instrument_list;
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });

        PubSub.subscribe(INPUT_GENERALIZATION_LOADED, (msg, data) => {
            this.orbit_generalization = data.orbit_generalization;
            this.instrument_generalization = data.instrument_generalization;
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });

        this.experiment = null;
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
            if(index  >= this.orbit_list.length && this.orbit_generalization.length != 0){
                return this.orbit_generalization[index];
            }else{
                return this.orbit_list[index];   
            }

        }else if(type=="instrument"){
            if(index >= this.instrument_list.length && this.instrument_generalization.length != 0){
                return this.instrument_generalization[index];
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
        if(type=="orbit"){
            return this.orbit_relabeled[index];

        }else if(type=="instrument"){
            return this.instrument_relabeld[index];

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
                    return this.orbit_generalization.indexOf(name);
                }

            }else if(type === "instrument"){
                if(this.instrument_list.includes(name)){
                    return this.instrument_list.indexOf(name);
                }else{
                    return this.instrument_generalization.indexOf(name);
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
            var name = split[i];
            if(this.orbit_relabeled.indexOf(name)==-1 && this.instrument_relabeld.indexOf(name)==-1){
                return null;
            }
            if(i > 0) output = output + ",";

            if(type == "orbit"){
                output = output + $.inArray(name,this.orbit_relabeled);
            }else if(type == "instrument"){
                output = output + $.inArray(name,this.instrument_relabeld);
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
            
            var nth = $.inArray(name,this.orbit_list);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return this.orbit_relabeled[nth];
            
        } else if(type=="instrument"){
            var nth = $.inArray(name,this.instrument_list);
            if(nth==-1){ // Couldn't find gthe name from the list
                return name;
            }
            return this.instrument_relabeld[nth];
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
            var nth = $.inArray(name,this.orbit_relabeled);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return this.orbit_list[nth];
        } else if(type=="instrument"){
            var nth = $.inArray(name,this.instrument_relabeld);
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
        var type='';
        var erase = false;
        for(var i=0;i<expression.length;i++){
            if(expression[i]=='['){
                erase=true;
            }else if(expression[i]==']'){
                erase=false;
            }else if(!erase){
                type=type+expression[i];
            }
        }
        return type;
    }
    
    pp_feature_single(expression){
        
        let exp = expression;
        if(exp[0]==="{"){
            exp = exp.substring(1,exp.length-1);
        }
        let featureName = exp.split("[")[0];

        if(featureName==="paretoFront" || featureName==='FeatureToBeAdded' || featureName==='AND' || featureName==='OR'){
            return exp;
        }

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
            if(orbits[i].length === 0){
                continue;
            }
            if(i > 0){
                pporbits = pporbits + ",";
            }

            let orb = null;
            if(this.experiment){
                orb = this.experiment.randomized.getOrbitLabel(+orbits[i]);
            }else{
                orb = + orbits[i];
            }
            pporbits = pporbits + this.index2DisplayName(orb, "orbit");
        }

        for(let i = 0; i < instruments.length; i++){
            if(instruments[i].length===0){
                continue;
            }
            if(i > 0){
                ppinstruments = ppinstruments + ",";
            }

            let instr = null;
            if(this.experiment){
                instr = this.experiment.randomized.getInstrLabel(+instruments[i]);
            }else{
                instr = + instruments[i];
            }

            ppinstruments = ppinstruments + this.index2DisplayName(instr, "instrument");
        }

        let ppexpression = null;
        if(featureName === "inOrbit"){
            if(ppinstruments.indexOf(",") === -1){
                ppexpression = ppinstruments + " is assigned to " + pporbits;
            }else{
                ppexpression = ppinstruments + " are assigned to " + pporbits;
            }
        }else if(featureName === "notInOrbit"){
            if(ppinstruments.indexOf(",") === -1){
                ppexpression = ppinstruments + " is never assigned to " + pporbits;
            }else{
                ppexpression = ppinstruments + " are never assigned to " + pporbits;
            }
        }else if(featureName === "present"){
            ppexpression = ppinstruments + " is used";
        }else if(featureName === "absent"){
            ppexpression = ppinstruments + " is never used";
        }else if(featureName === "together"){
            ppexpression = ppinstruments + " are assigned together"
        }else if(featureName === "separate"){
            ppexpression = ppinstruments + " are never assigned together"
        }else if(featureName === "emptyOrbit"){
            ppexpression = pporbits + " is empty"
        }else{
            let ppexpression = this.featureActualName2DisplayName(featureName) + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
        }
        
        return ppexpression;
    }
    
    pp_feature(expression){

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
                let feature_expression = savedString;
                output = output + '{' + this.pp_feature_single(feature_expression) + '}';
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




