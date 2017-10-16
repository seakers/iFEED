/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




//        A          B         C          D         E        F
// {"ACE_ORCA","ACE_POL","ACE_LID","CLAR_ERB","ACE_CPR","DESD_SAR",
// 
//       G        H           I            J         K              L
// "DESD_LID","GACM_VIS","GACM_SWIR","HYSP_TIR","POSTEPS_IRS","CNES_KaRIN"};
// 
//      1000                2000            3000        4000            5000
//{"LEO-600-polar-NA","SSO-600-SSO-AM","SSO-600-SSO-DD","SSO-800-SSO-DD","SSO-800-SSO-PM"};



function EOSSLabel(eoss){
    
    self = this;
    
    self.disabled = false;
    
    self.orbit_relabeled = ["1000","2000","3000","4000","5000"];
    self.instrument_relabeled = ["A","B","C","D","E","F","G","H","I","J","K","L"];
    
    
    /*
     * @param {int} index: Number indicating either an oribt or an instrument
     * @param {String} type: Type of the input name. Could be either "orbit" or "instrument"
     * @returns The actual name of an instrument or an orbit
     */
    self.index2ActualName = function(index, type){
        if(type=="orbit"){
            return eoss.orbit_list[index];
        }else if(type=="instrument"){
            return eoss.instrument_list[index];
        }else{
            return "Naming Error"
        }
    }
    
    
    /*
     * @param {int} index: Number indicating either an orbit or an instrument
     * @param {String} type: Type of the variable. Could be either "orbit" or "instrument"
     */
    self.index2DisplayName = function(index, type){
        
        if(self.disabled){
            return self.index2ActualName(index,type);
        }

        if(type=="orbit"){
            return self.orbit_relabeled[index];
        }else if(type=="instrument"){
            return self.instrument_relabeled[index];
        }else{
            return "Naming Error";
        }
    }
    
    
    self.actualName2Index = function(name, type){
        
        var name=name.trim();
        if(name.indexOf(",")!=-1){
            var names = name.split(",");
            var newName = "";
            for(var i=0;i<names.length;i++){
                var comma = ",";
                if(i==0){
                    comma = "";
                }
                if(type=="orbit"){
                    newName = newName + comma + $.inArray(names[i],eoss.orbit_list);
                }else if(type=="instrument"){
                    newName = newName + comma + $.inArray(names[i],eoss.instrument_list);
                }else{
                    newName = newName + comma + "Naming Error";
                }              
            }
            return newName;
        }else{
            if(type=="orbit"){
                return $.inArray(name,eoss.orbit_list);
            }else if(type=="instrument"){
                return $.inArray(name,eoss.instrument_list);
            }else{
                return "Naming Error";
            }        
        }
    }
    
 
    
    self.displayName2Index = function(input, type){
        if(self.disabled){
            return self.actualName2Index(input,type);
        }

        var input=input.trim();
        var split = input.split(',');
        var output='';
        for(var i=0;i<split.length;i++){
            var name = split[i];

            if(self.orbit_relabeled.indexOf(name)==-1 && self.instrument_relabeled.indexOf(name)==-1){
                //alert('Invalid input argument');
                return null;
            }
            if(i>0) output=output+",";

            if(type=="orbit"){
                output=output+$.inArray(name,self.orbit_relabeled);
            }else if(type=="instrument"){
                output=output+$.inArray(name,self.instrument_relabeled);
            }else{
                return "Naming Error";
            }
        }
        return output;
    }
    
    
    self.actualName2DisplayName = function(name,type){
        if(self.disabled){
            return name;
        }

        var name = name.trim();
        if(type=="orbit"){
            
            var nth = $.inArray(name,eoss.orbit_list);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return self.orbit_relabeled[nth];
            
        } else if(type=="instrument"){
            var nth = $.inArray(name,eoss.instrument_list);
            if(nth==-1){ // Couldn't find gthe name from the list
                return name;
            }
            return self.instrument_relabeled[nth];
        } else{
            return name;
        }
    }
    
    self.displayName2ActualName = function(name,type){
        if(self.disabled){
            return name;
        }
        var name = name.trim();
        if(type=="orbit"){
            var nth = $.inArray(name,self.orbit_relabeled);
            if(nth==-1){// Couldn't find the name from the list
                return name;
            }
            return eoss.orbit_list[nth];
        } else if(type=="instrument"){
            var nth = $.inArray(name,self.instrument_relabeled);
            if(nth==-1){ // Couldn't find gthe name from the list
                return name;
            }
            return eoss.instrument_list[nth];
        } else{
            return name;
        }
    }
    
    
    
    
    self.pp_feature_type = function(expression){
        
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

    
    
    
    self.pp_feature_single = function(expression){
        
        var exp = expression;
        if(exp[0]==="{"){
            exp = exp.substring(1,exp.length-1);
        }
        var featureName = exp.split("[")[0];

        if(featureName==="paretoFront" || featureName==='FeatureToBeAdded' || featureName==='AND' || featureName==='OR'){return exp;}

        if(featureName[0]=='~'){
            featureName = 'NOT '+ featureName.substring(1);
        }

        var featureArg = exp.split("[")[1];
        featureArg = featureArg.substring(0,featureArg.length-1);

        var orbits = featureArg.split(";")[0].split(",");
        var instruments = featureArg.split(";")[1].split(",");
        var numbers = featureArg.split(";")[2];

        var pporbits="";
        var ppinstruments="";
        for(var i=0;i<orbits.length;i++){
            if(orbits[i].length===0){
                continue;
            }
            if(i>0){pporbits = pporbits + ",";}
            pporbits = pporbits + self.index2DisplayName(orbits[i], "orbit");
        }
        for(var i=0;i<instruments.length;i++){
            if(instruments[i].length===0){
                continue;
            }
            if(i>0){ppinstruments = ppinstruments + ",";}
            ppinstruments = ppinstruments + self.index2DisplayName(instruments[i], "instrument");
        }
        var ppexpression = featureName + "[" + pporbits + ";" + ppinstruments + ";" + numbers + "]";
        
        return ppexpression;
    }
    
    
    
    
    


    self.pp_feature = function(expression){

        var output = '';

    //    if(expression.indexOf('{FeatureToBeAdded}')>-1){
    //        expression=expression.replace('&&{FeatureToBeAdded}','');
    //        expression=expression.replace('||{FeatureToBeAdded}','');
    //        expression=expression.replace('{FeatureToBeAdded}&&','');
    //        expression=expression.replace('{FeatureToBeAdded}||','');
    //    }

        var save = false;
        var savedString = '';

        for(var i=0;i<expression.length;i++){
            if(expression[i]=='{'){
                save = true;
                savedString = '{';
            }else if(expression[i]=='}'){
                save = false;
                savedString = savedString + '}';
                feature_expression = savedString;
                output = output + '{' + self.pp_feature_single(feature_expression) + '}';
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




