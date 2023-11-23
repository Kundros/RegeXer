/* ----------------------------------------- */
/* ---- functions, classes & structures ---- */
/* ----------------------------------------- */

{
    const States = {
    	END: 0x0,
        NULL: 0x1,
        ROOT: 0x2,
        PRIMITIVE: 0x4,
        OPTION: 0x8,
        ITERATION_ZERO: 0x10,
        ITERATION_ONE: 0x20,
        ITERATION_END: 0x40,
        GROUP: 0x80,
        OPTIONAL: 0x100,
        P_LIST: 0x200,
        N_LIST: 0x400
    };
    
    const Modifiers = {
    	g: 0x1,
        m: 0x2,
        i: 0x4,
        y: 0x8,
        u: 0x10,
        v: 0x20,
        s: 0x40,
        d: 0x80
    }
    
    const Flags = {
        NONE: 0x1,
        DEFAULT: 0x2
    }
    
    class ParserHandler {
        handle(data, elements, state, flags=Flags.DEFAULT) 
        {
        	let pointer = 0;
            let offset = 0;
        	let outputElements = this.buildElement(state, data);
            
            if(outputElements?.AST?.children !== undefined)
            	outputElements.AST.children.push(...elements.map(element => element.AST));
            
            if(flags & Flags.DEFAULT)
            	this.addTransitionToElement(outputElements.NFA[pointer], null, ++pointer);
                
            if(state & States.PRIMITIVE)
            	this.addTransitionToElement(outputElements.NFA[pointer], outputElements.NFA[pointer].ASTelement.chr, ++pointer);
                
            if(state & States.OPTION)
            	this.handleOptionBefore(outputElements.NFA, elements);
                
            if(state & States.OPTIONAL)
            	this.handleOptionalBefore(outputElements.NFA, elements);
    		
            if(state & (States.P_LIST | States.N_LIST))
            {
            	this.handleListBefore(outputElements.NFA, elements, state);
                return outputElements;
    		}
            
            elements.forEach((element, id) => {
                offset += element.NFA.length;
                outputElements.NFA.push(...element.NFA);
            });
            
            if(state & States.ROOT)
            	this.handleRootAfter(outputElements.NFA);

			if(state & States.GROUP)
                this.handleGroupAfter(outputElements.NFA);

            if(state & (States.ITERATION_ZERO | States.ITERATION_ONE))
                this.handleIterationAfter(outputElements.NFA, state);
                
            return outputElements;
        }
        
        handleRootAfter(outputNFA){
        	outputNFA.push(States.END);

            // DEBUG
            /*outputNFA.forEach(element => {
            	if(element != 0) element.ASTelement = undefined;
            });*/
        }
        
        handleOptionBefore(outputNFA, elements)
        {
        	let offset = 1;
            const sumLength = elements.reduce((x, y) => x + y.NFA.length, 0);
            
        	elements.forEach((element, id) => {
            	element = element.NFA;
                let last = element[element.length-1];
                const input = last?.ASTelement?.type === States.PRIMITIVE ? last.ASTelement.chr : null;
                    
                last.transitions = last.transitions.filter(element => element[1] != 1);
               
               	/* if option most top element is one of these, must be redirected to option end */
                if(
                  element[0].ASTelement.type & (
                    States.ITERATION_ZERO |
                    States.ITERATION_ONE |
                    States.OPTIONAL
                  )
                )
                {
                    let transitions = element[0].transitions;
                    let biggestPosition = 0;
                        
                    transitions.forEach((transition, index) => {
                        if(transition[1] > transitions[biggestPosition][1])
                        biggestPosition = index;
                    });
                        
                    transitions[biggestPosition][1] = sumLength - offset + 1;
                }
                
                this.addTransitionToElement(last, input, sumLength - (offset + element.length) + 2);
                this.addTransitionToElement(outputNFA[0], null, offset);
                offset += Array.isArray(element) ? element.length : 1;
            });
        }
        
        handleOptionalBefore(outputNFA, elements)
        {
        	const sumLength = elements.reduce((x, y) => x + (Array.isArray(y.NFA) ? y.NFA.length : 1), 0);
        	this.addTransitionToElement(outputNFA[0], null, sumLength + 1);
        }
        
        handleListBefore(outputNFA, elements, state)
        {
        	if(state & States.P_LIST)
            {
                const transitionString = elements.reduce((x, y) => x + y,"");
                this.addTransitionToElement(outputNFA[0], transitionString, 1);
                return;
            }
            
            let mapCharacters = [];
            
            for(let i = 0; i < 256; i++)
            	mapCharacters.push(String.fromCharCode(i));
            
            elements.forEach(str => {
            	const length = str.length;
            	for (let i = 0; i < length; i++) { 
                	const code = str.charCodeAt(i);
                    mapCharacters[code] = undefined;
                };
            });
            
            const excluded = mapCharacters.filter(x => x != undefined).join('');
            this.addTransitionToElement(outputNFA[0], excluded, 1);
        }
        
        handleIterationAfter(outputNFA, state)
        {
        	const dataLength = outputNFA.length;
        
        	outputNFA.push(
                this.buildNFAwhithoutASTref(States.ITERATION_END, [
                    [null, -dataLength + 1],
                    [null, 1]
                ])
            );

            if(state & States.ITERATION_ZERO)
            	this.addTransitionToElement(outputNFA[0], null, outputNFA.length);
        }
        
        handleGroupAfter(outputNFA)
        {
        	outputNFA[0].ASTelement.end = outputNFA.length - 1;
        }
        
        buildElement(type, data={}, transitions = []) 
        {
        	let AST = {
              type,
              ...data
            };
        
        	if(type & ~(States.NULL | States.PRIMITIVE | States.P_LIST | States.N_LIST))
        		AST.children = []
        
        
        	let element = {
                AST,
                NFA: []
            };
            
            element.NFA.push({ASTelement: element.AST, transitions});
            
            return element;
        }
        
        buildNFAwhithoutASTref(type, transitions = [])
        {
        	return { transitions };
        }
        
        addTransitionToElement(element, input, by){
        	if(element.transitions === undefined) 
            	element.transitions = [];
                
            element.transitions.push([input, by]);
            
            return element;
        }
    }
    
    const handler = new ParserHandler();
}


/* ------------------------------------ */
/* ---- start of the regex grammar ---- */
/* ------------------------------------ */

start 
    = 
    type:(moded_start / general_start)
    {
    	const data = { modifiers: type?.modifiers };
        return handler.handle(data, type?.elements, States.ROOT);
    }

general_start
    = elements:any_element*
    {
    	return { 
        	modifiers: undefined,
        	elements 
        }
    }

moded_start
    = '/' elements:any_element* '/' modifiers:modes
    {
    	return {
        	modifiers,
        	elements
        }
    }

/* ---- modes ---- */

modes 
	= modifiers:(@modifiers:('m' / 'g' / 'i' / 'y' / 'u' / 'v' / 's' / 'd')*
    &{
    	let alreadyUsed = {};
        
        let parsable = true;
		modifiers.forEach((character) => {
        	if(Object.hasOwn(alreadyUsed, character))
            {
            	parsable = false;
            	return;
            }
            
         	alreadyUsed[character] = true;
        });
        
        return parsable;
    })
    {
    	return modifiers.reduce((x,y) => x | Modifiers[y], 0);
    }



/* -------------------------------------------------------- */
/* ---- options of possible paths (order is essential) ---- */
/* -------------------------------------------------------- */

general
    = list / primitive / lookaround / group / EOS / SOS

any_element 
    = option / iteration / optional / general

to_iterate
    = primitive / group / list

to_option
    = iteration / optional / general / null_transition

to_optional 
    = primitive / group / list

to_list
    = range_ascii / hexadecimal_ascii / [^\]\\] / is_escaped
    
/* ----------------------- */
/* ---- Regex grammar ---- */
/* ----------------------- */

escaped_primitive
	=
    '\\' /
    '.' /
    '+' /
    '*' /
    '?' /
    '[' /
    '^' /
    ']' /
    '$' /
    '(' /
    ')' /
    '{' /
    '}' /
    '=' /
    '!' /
    '<' /
    '>' /
    '|' /
    ':' /
    '-'
    
null_transition 
	= ""
    { return handler.handle({}, [], States.NULL, Flags.NONE); }

integer_digit
	= digit:[0-9] { return parseInt(digit, 10); }

integer
  	= digits:[0-9]+ { return parseInt(digits.join(""), 10); }
    
ascii 
	= [\x00-\xFF]
    
reserved_character
	= [.+*?^$()\[\]{}|\\]
    
unreserved_character
	= [^.+*?^$()\[\]{}|\\]
    
is_escaped
	=
    '\\' escaped:escaped_primitive
    { return escaped; }
    
range_ascii
	= 
    first:(hexadecimal_ascii / [^\]\\] / is_escaped) '-' second:(hexadecimal_ascii / [^\]\\] / is_escaped) 
    &{
    	return first.charCodeAt(0) <= second.charCodeAt(0);
    }
    {
    	let stringCharacters = "";
        
        const start = first.charCodeAt(0);
        const end = second.charCodeAt(0);
        
        for(let i = start; i <= end; i++)
            stringCharacters += String.fromCharCode(i);
    
    	return stringCharacters;
    }
    
hexadecimal_ascii
	=
    '\\x' code:([0-9a-fA-F]) |2|
    {
    	return String.fromCharCode(parseInt(code.join(''), 16));
    }

primitive
    = 
    character:(
        hexadecimal_ascii /
        is_escaped /
        unreserved_character
    )
    {
    	return handler.handle({ chr: character }, [], States.PRIMITIVE, Flags.NONE);
    }
    
group 
    = 
    '(' 
        
        type:(
            '?:' / 
            (
                '?<' name:[a-zA-Z]+ '>'
                {
                    return name.join('');
                }
            )
        )?
          
        elements:any_element*  
    ')'
    {
        const detailedType = 
            type == undefined ? 'C' : 
            type == '?:' ? 'NC' :
            'N';
    
        const data = {
            detailedType,
            name: detailedType == 'N' ? type : undefined,
            end: 0
        };
      
	    return handler.handle(data, elements, States.GROUP);
    }

lookaround 
    = 
    '(?' 
        behind:'<'? 
        type:('=' / '!')
        elements:any_element* 
    ')'
    {
    	return {
        	type: "lookaround",
        	// P - positive, N - negative, B - behind, F - forward
            detailedType: (type == '=' ? 'P' : 'N') + (behind == '<' ? 'B' : 'F'),
          	elements
        };
    }

option 
    = 
    elements:(to_option |2..,'|'|)
    {
    	return handler.handle({}, elements, States.OPTION, Flags.NONE);
    }

optional 
    = 
    element:to_optional '?'
    {
        return handler.handle({}, [element], States.OPTIONAL);
    }

iteration
    = 
    element:to_iterate 
    detailedType:(
        '*' /
        '+' / 
        (
            '{' 
                start:integer
                end:(
                    ',' end:(@end:$integer? &{ return start <= end })?
                    { return end != undefined ? parseInt(end, 10) : undefined; }
                )? 
            '}'
            { 
                return {
                    start,
                    end
                }
            }
        )
    )
   	lazy:'?'?
    {
    	const start = 
        	detailedType == '*' ? 0 :
            detailedType == '+' ? 1 : 
            detailedType?.start;
            
        const end =
        	detailedType?.end != undefined ? detailedType?.end : undefined;
    
    	const data = {
            detailedType,
            start,
            end,
            lazy: lazy != undefined
        };
        
        const iterationType = detailedType == '*' ? States.ITERATION_ZERO : States.ITERATION_ONE;
        return handler.handle(data, [element], iterationType);
    }

list
    = 
    '['
        negation:'^'? 
        elements:to_list+
    ']'
    {
    	return handler.handle(
        	{ neg: negation === '^'}, 
            elements, 
            negation === '^' ? States.N_LIST : States.P_LIST, 
            Flags.NONE
        );
    }

EOS = '$' // end of string
SOS = '^' // start of string