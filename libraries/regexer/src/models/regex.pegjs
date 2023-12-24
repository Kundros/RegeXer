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
        OPTION_END: 0x10,
        ITERATION_ZERO: 0x20,
        ITERATION_ONE: 0x40,
        ITERATION_RANGE: 0x80,
        ITERATION_END: 0x100,
        GROUP: 0x200,
        OPTIONAL: 0x400,
        P_LIST: 0x800,
        N_LIST: 0x1000,
        LIST_END: 0x2000,
        START_STRING: 0x4000,
        END_STRING: 0x8000,
        SPECIAL: 0x10000
    };
    
    const Modifiers = {
        NONE: 0x0,
    	g: 0x1,
        m: 0x2,
        i: 0x4,
        y: 0x8,
        u: 0x10,
        v: 0x20,
        s: 0x40,
        d: 0x80
    }
    
    let allAscii = new Set();

    for(let i = 0 ; i < 256 ; i++)
        allAscii.add(String.fromCharCode(i));

    let numbersSet = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    let nonNumbersSet = new Set(allAscii);
    let wordSet = new Set();
    let nonWordSet = new Set(allAscii);
    let whiteSpaceSet = new Set(['\t', '\n', '\v', '\f', '\r', ' ', '\xA0']);
    let nonWhiteSpaceSet = new Set(allAscii);

    for(let i = 0 ; i < 10 ; i++)
    {
        const numChar = String.fromCharCode(i + 48);

        nonNumbersSet.delete(numChar);
        wordSet.add(numChar);
        nonWordSet.delete(numChar);
    }

    for(let i = 0 ; i < 26 ; i++)
    {
        const letter = String.fromCharCode(i + 97);
        const capital = String.fromCharCode(i + 65);

        wordSet.add(letter);
        wordSet.add(capital);

        nonWordSet.delete(letter);
        nonWordSet.delete(capital);
    }

    const underscore = String.fromCharCode(95);
    wordSet.add(underscore);
    nonWordSet.delete(underscore);

    nonWhiteSpaceSet.delete('\t');
    nonWhiteSpaceSet.delete('\n');
    nonWhiteSpaceSet.delete('\v');
    nonWhiteSpaceSet.delete('\f');
    nonWhiteSpaceSet.delete('\r');
    nonWhiteSpaceSet.delete(' ');
    nonWhiteSpaceSet.delete('\xA0');
    
    const noChildren = ~(
        States.NULL | 
        States.PRIMITIVE | 
        States.P_LIST | 
        States.N_LIST | 
        States.LIST_END | 
        States.OPTION_END | 
        States.END_STRING | 
        States.START_STRING | 
        States.SPECIAL
    );

    const noDefaultTransition = ~(
        States.NULL | 
        States.SPECIAL | 
        States.PRIMITIVE | 
        States.OPTION | 
        States.START_STRING | 
        States.END_STRING | 
        States.N_LIST | 
        States.P_LIST
    );

    /// Parsing class creating creating AST + NFA structure
    class ParserHandler {
        handle(data, elements, state) 
        {
        	let pointer = 0;
            let offset = 0;
        	let outputElements = this.buildElement(state, data);
            
            if(outputElements?.AST?.children !== undefined)
            {
            	elements.forEach(element => {
                	if(state & States.OPTION)
                		outputElements.AST.children.push([...element.map(el => el.AST)]);
                    else 
                    	outputElements.AST.children.push(element.AST);
                });
            }
            
            if(state & noDefaultTransition)
            	this.addTransitionToElement(outputElements.NFA[pointer], null, ++pointer);
                
            if(state & States.PRIMITIVE)
            	this.addTransitionToElement(outputElements.NFA[pointer], outputElements.NFA[pointer].ASTelement.chr, ++pointer); 
                
            if(state & States.OPTIONAL)
            	this.handleOptionalBefore(outputElements.NFA, elements);
                
            if(state & (States.END_STRING | States.START_STRING))
            	this.handleEndStartString(outputElements.NFA);
                
            if(state & States.SPECIAL){
            	this.handleSpecialBefore(outputElements.NFA, elements);
                return outputElements;
            }
                
            if(state & States.OPTION)
            {
            	this.handleOptionBefore(outputElements.NFA, elements);
                return outputElements;
            }
    		
            if(state & (States.P_LIST | States.N_LIST))
            {
            	this.handleListBefore(outputElements.NFA, elements, state);
                return outputElements;
    		}
            
            elements.forEach(element => {
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
        
        handleSpecialBefore(outputNFA, elements){
        	outputNFA[0].transitions = elements;
        }
        
        handleRootAfter(outputNFA){
        	outputNFA.push(this.buildElement(States.END).NFA[0]);

            // DEBUG
            /*outputNFA.forEach(element => {
            	if(element != 0) element.ASTelement = undefined;
            });*/
        }
        
        handleEndStartString(outputNFA){
        	this.addTransitionToElement(outputNFA[0], null, 1);
        }
        
        handleOptionBefore(outputNFA, elements)
        {
        	let offset = 1;
            let toEnd = 0;
            const sumLength = elements.reduce((x, y) => 
            	x + y.reduce((a,b) => a + b.NFA.length, 1)
            , 0);
            
        	elements.forEach((option, id) => {
                this.addTransitionToElement(outputNFA[0], null, offset);
                
                toEnd = sumLength - offset;
                option.forEach(element => {
                	outputNFA.push(...element.NFA);
                    toEnd -= element.NFA.length;
                    offset += element.NFA.length;
                });
                offset++;
                toEnd++;
                
                outputNFA.push(this.buildElement(States.OPTION_END, {}, [
                    [null, toEnd]
                ]).NFA[0]);
            });
        }
        
        handleOptionalBefore(outputNFA, elements)
        {
        	const sumLength = elements.reduce((x, y) => x + (Array.isArray(y.NFA) ? y.NFA.length : 1), 0);
        	this.addTransitionToElement(outputNFA[0], null, sumLength + 1);
        }
        
        handleListBefore(outputNFA, elements, state)
        {
        	outputNFA.push(this.buildElement(States.LIST_END).NFA[0]);
            this.addTransitionToElement(outputNFA[1], null, 1);

            outputNFA[0].transitions = new Set();
            
        	if(state & States.P_LIST)
            {
                elements.forEach((element) => {
                	if(Array.isArray(element))
                    {
                    	element.forEach((str) => {
                        	outputNFA[0].transitions.add(str);
                        });
                        return;
                    }
                    
                    if(typeof element === "object" && (element.AST.type & States.SPECIAL))
                    {
                    	element.NFA[0].transitions.forEach((str) => {
                        	outputNFA[0].transitions.add(str);
                        });
                        return;
                    }
                    
                	outputNFA[0].transitions.add(element);
                });
                return;
            }
            
            for(let i = 0; i < 256; i++)
            	outputNFA[0].transitions.add(String.fromCharCode(i));
            
            elements.forEach(element => {
            	if(Array.isArray(element))
                {
                    element.forEach((str) => {
                    	outputNFA[0].transitions.delete(str);
                    });
                    return;
                }
                
                if(typeof element === "object" && (element.AST.type & States.SPECIAL))
                {
                    element.NFA[0].transitions.forEach((str) => {
                    	outputNFA[0].transitions.delete(str);
                    });
                    return;
                }
                
                outputNFA[0].transitions.delete(element);
            });
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
        	outputNFA[0].ASTelement.endNFA = outputNFA.length - 1;
        }

        buildElement(type, data={}, transitions = []) 
        {
        	let AST = {
                type,
                ...data
            };
        
        	if(type & noChildren)
        		AST.children = []

            if(type & ~(States.OPTION_END))
            {
                AST.start = range().start;
                AST.end = range().end;
            }
        
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
        	modifiers: Modifiers.NONE,
        	elements 
        }
    }

moded_start
    = '/' elements:any_element* '/' modifiers:modifiers
    {
    	return {
        	modifiers,
        	elements
        }
    }

/* ---- modifiers ---- */

modifiers 
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
    = list / escaped_special / primitive / lookaround / group / EOS / SOS

any_element 
    = option / iteration / optional / general

to_iterate
    = escaped_special / primitive / group / list

to_option
    = iteration / optional / general

to_optional 
    = primitive / group / list

to_list
    = escaped_special / range_ascii / hexadecimal_ascii / [^\]\\] / is_escaped
    
/* ----------------------- */
/* ---- Regex grammar ---- */
/* ----------------------- */

escaped_primitive
	=
    [\\\.+*?\[^\]$(){}=!<>|:-]
    
escaped_ascii
	= 
    [0tnvrf]
    
escaped_special
	=
    '\\' special:[dDwWsS]
    { 
    	switch(special)
        {
        	case 'd': return handler.handle({special: 'd'}, numbersSet, States.SPECIAL);
            case 'D': return handler.handle({special: 'D'}, nonNumbersSet, States.SPECIAL);
            case 'w': return handler.handle({special: 'w'}, wordSet, States.SPECIAL);
            case 'W': return handler.handle({special: 'W'}, nonWordSet, States.SPECIAL);
            case 's': return handler.handle({special: 's'}, whiteSpaceSet, States.SPECIAL);
            case 'S': return handler.handle({special: 'S'}, nonWhiteSpaceSet, States.SPECIAL);
        }
    }
    
null_transition 
	= ""
    { return handler.handle({}, [], States.NULL); }

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
    { return escaped; } /
    '\\' escaped:escaped_ascii 
    { 
    	switch(escaped){
        	case '0': return '\0';
            case 'n': return '\n';
            case 't': return '\t';
            case 'v': return '\v';
            case 'r': return '\r';
            case 'f': return '\f';
        }
    }
    
range_ascii
	= 
    first:(hexadecimal_ascii / [^\]\\] / is_escaped) '-' second:(hexadecimal_ascii / [^\]\\] / is_escaped) 
    &{
    	return first.charCodeAt(0) <= second.charCodeAt(0);
    }
    {
    	let stringCharacters = [];
        
        const start = first.charCodeAt(0);
        const end = second.charCodeAt(0);
        
        for(let i = start; i <= end; i++)
            stringCharacters.push(String.fromCharCode(i));
    
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
    	return handler.handle({ chr: character }, [], States.PRIMITIVE);
    }
    
group 
    = 
    '(' 
        
        type:(
            '?:' / 
            (
                '?<' name:([_a-zA-Z][0-9a-zA-Z_]*) '>'
                {
                    return name[0] + name[1].join('');
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
            name: detailedType == 'N' ? type : undefined
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
    elements:((to_option*) |2..,'|'|)
    {
    	return handler.handle({}, elements, States.OPTION);
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
            range: [start, end],
            lazy: lazy != undefined
        };
        
        const iterationType = 
            detailedType == '*' ? States.ITERATION_ZERO :
            detailedType == '+' ? States.ITERATION_ONE :
            States.ITERATION_RANGE;

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
            negation === '^' ? States.N_LIST : States.P_LIST
        );
    }

EOS 
	= '$' // end of string
    {
    	return handler.handle(
        	{},
            [],
            States.END_STRING
        );
    }
    
SOS 
	= '^' // start of string
    {
    	return handler.handle(
        	{},
            [],
            States.START_STRING
        );
    }