/*
    Removes the outermost parentheses from the expression
*/
function remove_outer_parentheses(expression, outer_level){
	
    var new_expression = expression;
    var out = {expression:new_expression,level:outer_level};
    
    
    if(expression===null){
       return '';
    }
	else if(expression[0]!="(" || expression[expression.length-1]!=")"){
		// Return if the expression does not start with "(" or ")".
	}else{
		var leng = expression.length;
		var level = 0;
		var paren_end = -1;
		for(var i=0;i<leng;i++){
			if(expression[i]==="("){
				level++;
			}
			else if(expression[i]===")"){
				level--;
				if(level==0){
					paren_end = i;
					break;
				}
			}
		}
		if(paren_end == leng-1){
            new_expression = expression.substring(1,leng-1);
            out = remove_outer_parentheses(new_expression, outer_level+1);
		}
	}
    
    if(typeof outer_level === "undefined" || outer_level === null){
        // If outer_level is undefined, return string expression
        return new_expression;
    }else{
        // If outer_level is given, return dict
        return out;
    }
}



function get_nested_parenthesis_depth(expression){
	var leng = expression.length;
	var level = 0;
	var maxLevel = 0;
	for(var i=0;i<leng;i++){
		if(expression[i]==="("){
			level++;
			if(level>maxLevel) maxLevel=level;
		}
		else if(expression[i]===")"){
			level--;
		}
	}
	return maxLevel;
}



function collapse_paren_into_symbol(expression){
	var leng = expression.length;
	var modified_expression = "";
	var level = 0;
	for(var i=0;i<leng;i++){

		if(expression[i]==="("){
			level++;
		}
		else if(expression[i]===")"){
			level--;
		}
		if(expression[i]==="(" && level==1){
			modified_expression=modified_expression + expression[i];
		}
		else if(level>=1){
			modified_expression=modified_expression + "X";
		}else{
			modified_expression=modified_expression + expression[i];
		}
	}
	return modified_expression;
}