
//        A          B         C          D         E        F
// {"ACE_ORCA","ACE_POL","ACE_LID","CLAR_ERB","ACE_CPR","DESD_SAR",
// 
//       G        H           I            J         K              L
// "DESD_LID","GACM_VIS","GACM_SWIR","HYSP_TIR","POSTEPS_IRS","CNES_KaRIN"};
// 
//      1000                2000            3000        4000            5000
//{"LEO-600-polar-NA","SSO-600-SSO-AM","SSO-600-SSO-DD","SSO-800-SSO-DD","SSO-800-SSO-PM"};


class GNCLabel extends Label{

    constructor(disabled){

        super(disabled);        

        this.input_list = [];
        this.output_list = [];

        this.computer_actual_names = ["0","1","2","3"];
        this.sensor_actual_names = ["0","1","2","3"];

        this.computer_display_names = ["0","A","B","C"];
        this.sensor_display_names = ["0","A","B","C"];

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.input_list = data.metadata.input_list;
            this.output_list = data.metadata.output_list;
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });
    }

    
    actualName2DisplayName(name,type){

        if(this.disabled){
            return name;
        }

        if(type != "sensors" && type != "computers"){
            return name;
        }

        name = name.trim();
        
        if(type === "sensors"){

            let newName = null;
            let nth = $.inArray(name, this.sensor_actual_names);
            if(nth === -1){// Couldn't find the name from the list
                return name;
            }else{
                newName = this.sensor_display_names[nth];
            }
            return newName;
            
        } else if(type === "computers"){

            let newName = "";
            let nth = $.inArray(name, this.computer_actual_names);
            if(nth === -1){// Couldn't find the name from the list
                return name;
            }else{
                newName = this.computer_display_names[nth];
            }
            return newName;
        } 
        return name;
    }
    
    displayName2ActualName(name,type){

        if(this.disabled){
            return name;
        }

        if(type != "sensors" && type != "computers"){
            return name;
        }

        name = name.trim();
        
        if(type === "sensors"){

            let newName = null;
            let nth = $.inArray(name, this.sensor_display_names);
            if(nth === -1){// Couldn't find the name from the list
                return name;
            }else{
                newName = this.sensor_actual_names[nth];
            }
            return newName;
            
        } else if(type === "computers"){

            let newName = "";
            let nth = $.inArray(name, this.computer_display_names);
            if(nth === -1){// Couldn't find the name from the list
                return name;
            }else{
                newName = this.computer_actual_names[nth];
            }
            return newName;
        } 
        return name;
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

        let featureArg = exp.split("[")[1];
        featureArg = featureArg.substring(0, featureArg.length - 1);   

        if(featureName === "numSensorOfType" || featureName === "numComputerOfType"){

            let name = featureArg.split(";")[0];
            let number = featureArg.split(";")[1];

            let type = null;
            if(featureName === "numSensorOfType"){
                type = "sensors";
            }else{
                type = "computers";
            }

            name = this.actualName2DisplayName(name, type);

            featureArg = name + ";" + number;
        }

        if(featureName[0]=='~'){
            featureName = 'NOT '+ featureName.substring(1);
        }

        var ppexpression = featureName + "[" + featureArg + "]";
        
        return ppexpression;
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

        for(let i=0;i<expression.length;i++){
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




