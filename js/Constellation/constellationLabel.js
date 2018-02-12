

class ConstellationLabel extends Label{

    constructor(disabled){

        super(disabled);        

        this.input_list = [];
        this.output_list = [];

        // this.computer_actual_names = ["0","1","2","3"];
        // this.sensor_actual_names = ["0","1","2","3"];

        // this.computer_display_names = ["0","A","B","C"];
        // this.sensor_display_names = ["0","A","B","C"];

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.input_list = data.metadata.input_list;
            this.output_list = data.metadata.output_list;
            PubSub.publish(LABELING_SCHEME_LOADED, this);
        });
    }
    
    actualName2DisplayName(name,type){

        let value = +name;

        if(this.disabled){
            return value;
        }else if(value === 0){
            // do nothing
        }else if(!name){
            return null;
        }

        if(type.indexOf("sma") != -1){
            type = "length";
        }else if(type.indexOf("inc") != -1 || type.indexOf("raan") != -1 || type.indexOf("ta") != -1 ){
            type = "angle";
        }

        if(type != "length" && type != "angle"){
            return value;
        }
        
        if(type === "length"){

            value = value / 1000 - 6370;  // meters to kilometers
            return value;
            
        } else if(type === "angle"){

            value = value / Math.PI * 180;
            return value.toFixed(2);
        } 
    }
    
    displayName2ActualName(name,type){

        let value =  +name;

        if(this.disabled){
            return value;
        }else if(value === 0){
            // do nothing
        }else if(!name){
            return null;
        }

        if(type != "length" && type != "angle"){
            return value;
        }

        if(type === "length"){
            // kilometers to meters
            value = (6370 + value) * 1000;  
            return value;
            
        } else if(type === "angle"){
            // Degree to radian
            value = value / 180 * Math.PI;
            return value;
        } 
    }
    
    pp_feature_type(expression){
        
        if(expression.indexOf('[') === -1){
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

        if(featureName.indexOf("inclination") != -1 || featureName.indexOf("semiMajorAxis") != -1 
            || featureName.indexOf("meanDiffRAAN") != -1){

            let lb = featureArg.split(";")[0];
            let ub = featureArg.split(";")[1];
            let num = featureArg.split(";")[2];

            let type = null;
            if(featureName === "inclination" || featureName === "meanDiffRAAN"){
                type = "angle";
            }else if(featureName === "semiMajorAxis"){
                type = "length";
            }else{
                type = null;
            }

            lb = this.actualName2DisplayName(lb, type);
            ub = this.actualName2DisplayName(ub, type);

            featureArg = lb + ";" + ub + ";" + num;
        }

        if(featureName[0]=='~'){
            featureName = 'NOT '+ featureName.substring(1);
        }

        var ppexpression = featureName + "[" + featureArg + "]";
        
        return ppexpression;
    }

    pp_feature(expression){

        let output = '';

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




