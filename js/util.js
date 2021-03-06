/*
    Removes the outermost parentheses from the expression
*/
function remove_outer_parentheses(expression, outer_level){
	
    var new_expression = expression;
    var out = {expression:new_expression, level:outer_level};
    
    if(expression === null){
       return '';
    }else if(expression[0] !== "(" || expression[expression.length-1] !== ")"){
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
	let leng = expression.length;
	let level = 0;
	let maxLevel = 0;
	for(let i = 0; i < leng; i++){
		if(expression[i] === "("){
			level++;
			if(level > maxLevel) maxLevel = level;
		}
		else if(expression[i] === ")"){
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

function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);
    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }
    out.push(end);
    return out;
}


function round_num(num,decimal){
    if(decimal){
        return num.toFixed(decimal);
    }else{
        return num.toFixed(3);   
    }
}

function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function dominates(metrics1, metrics2, objective){
    let at_least_as_good_as = true;
    let better_than_in_one = false;
    
    if(!objective){
        // Assumes all metrics are "larger-is-better"
        objective = [];
        for(let i = 0; i < metrics1.length; i++){
            objective.push(1);
        }
    }
    
    for(let i = 0; i < metrics1.length; i++){
        let val1 = objective[i] * metrics1[i];
        let val2 = objective[i] * metrics2[i];
        
        if(val1 > val2){
            // First better than Second
            better_than_in_one = true;
            
        }else if(val1 < val2){
            // First is worse than Second
            at_least_as_good_as = false;
        }
    }
    
    if(at_least_as_good_as && better_than_in_one){
        return true; // First dominates Second
    }else{
        return false;
    }
}

// Returns if a value is an array
function isArray (value) {
	return value && typeof value === 'object' && value.constructor === Array;
};

// Get function from string, with or without scopes (by Nicolas Gauthier: https://stackoverflow.com/questions/912596/how-to-turn-a-string-into-a-javascript-function-call)
function getFunctionFromString(string)
{
    var scope = this;
    console.log(scope);
    var scopeSplit = string.split('.');
    for (i = 0; i < scopeSplit.length - 1; i++)
    {
        scope = scope[scopeSplit[i]];

        if (scope == undefined) return;
    }

    return scope[scopeSplit[scopeSplit.length - 1]];
}

// Take multiple elements out from an array by their indices
Array.prototype.multisplice = function(){
    let args = Array.apply(null, arguments)[0];
    args.sort(function(a, b){
        return a - b;
    });
    let out = [];
    for(let i = 0; i < args.length; i++){
        let index = args[i] - i;
        let removed = this.splice(index, 1);
        out.push(removed[0]);
    }
    return out;        
}

function cartesianProduct(a, b, ...c) {
    /**
    * Computes the cartesian product of two or more lists.
    * Source: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
    */
    let f = (a, b) => [].concat(...a.map(a => b.map(b => [].concat(a, b))));
    let cartesian = (a, b, ...c) => b ? cartesian(f(a, b), ...c) : a;
    return cartesian(a, b, ...c);
}

function cartesianProductSet(a, b, ...c) {
    /**
    * Computes the cartesian product of two or more lists.
    * Source: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
    */

    let list_of_lists = cartesianProduct(a, b, ...c);
    let list_of_sets = [];
    for(let i = 0; i < list_of_lists.length; i++){
        list_of_sets.push(new Set(list_of_lists[i]));
    }

    return list_of_sets;
}

function setEquals(set1, set2){
    if (set1.size !== set2.size){
        return false;
    } 
    for (let a of set1){
        if (!set2.has(a)) {
            return false;
        }
    } 
    return true;
}

class SetOfSets{

    constructor(list_of_sets){
        this.set_of_sets = new Set();
        for(let i = 0; i < list_of_sets.length; i++){
            let duplicate_found = false;
            for(let j = i + 1; j < list_of_sets.length; j++){
                if(setEquals(list_of_sets[i], list_of_sets[j])){
                    duplicate_found = true;
                }
            }

            if(duplicate_found){
                continue;

            }else{
                this.set_of_sets.add(list_of_sets[i]);
            }
        }
    }
    
    has(test_set){
        for (let set of this.set_of_sets) {
            if(setEquals(test_set, set)){
                return true;
            }
        }
        return false;
    }

    getSets(){
        return this.set_of_sets;
    }
}

class MultiSet{

    constructor(input_list){
        this.set = new Set();
        this.counter = {};
        for(let i = 0; i < input_list.length; i++){
            let val = input_list[i];
            if(this.set.has(val)){
                this.counter[val] = this.counter[val] + 1;
            }else{
                this.counter[val] = 1;
                this.set.add(val);
            }
        }
    }
    
    equals(multiset){
        if(multiset instanceof MultiSet){
            that = multiset;
            let as = this.set;
            let bs = that.set;
            if (as.size !== bs.size){
                return false;
            } 
            for (let a of as){
                if (!bs.has(a) || this.counter[a] != that.counter[a]) {
                    return false;
                }
            } 
            return true;
        }else{
            return false;
        }
    }

    has(val){
        return this.set.has(val);
    }
}

function generateEOSSInput(length){
    let out = [];
    for(let i = 0; i < length; i++){
        out.push(false);
    }
    return out;
}

function EOSSSetInputInstrument(input, orbit, instrument){
    // Instruments and orbits
    let instrumentList = [
            "ACE_ORCA","ACE_POL","ACE_LID",
            "CLAR_ERB","ACE_CPR","DESD_SAR",
            "DESD_LID","GACM_VIS","GACM_SWIR",
            "HYSP_TIR","POSTEPS_IRS","CNES_KaRIN"];
    let orbitList = ["LEO-600-polar-NA","SSO-600-SSO-AM","SSO-600-SSO-DD","SSO-800-SSO-DD","SSO-800-SSO-PM"];

    let instrIndex = instrumentList.indexOf(instrument);
    let orbitIndex = orbitList.indexOf(orbit);

    input[orbitIndex * instrumentList.length + instrIndex] = true;
    return input;
}

function copyStringToClipboard (str) {
   // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = str;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   // Remove temporary element
   document.body.removeChild(el);

}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

