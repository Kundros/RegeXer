/* ----------------------------------------- */
/* ---- functions, classes & structures ---- */
/* ----------------------------------------- */

{{
    const ProcessType = {
   	  NONE: 0x0,
      ROOT: 0x1,
      DEFAULT: 0x2,
      OPTION: 0x4,
      ITERATION_ZERO: 0x8,
      ITERATION_ONE: 0x10,
      GROUP: 0x20
    };

	const MapType = new Map(
    	[
        	[ProcessType.ROOT, 'root'],
            [ProcessType.OPTION, 'option'],
            [ProcessType.ITERATION_ZERO, 'iteration'],
            [ProcessType.ITERATION_ONE, 'iteration'],
            [ProcessType.GROUP, 'group']
        ]
    );
    
    class ParserHandler {
        handle(data, elements, flags=ProcessType.DEFAULT) 
        {
        	let pointer = 0;
            let offset = 0;
        	let outputElements = [this.buildElement(MapType.get(flags & (~ProcessType.DEFAULT)), data)];
            
            if(flags & ProcessType.DEFAULT)
            	this.addTransitionToElement(outputElements[pointer++], null, pointer);
            
            if(flags & ProcessType.OPTION)
            	this.handleOptionBefore(outputElements, elements);
    
            elements.forEach((element, id) => {
                if(Array.isArray(element))
                {
                    offset += element.length;
                    outputElements.push(...element);
                    return;
                }
                
                if(element?.type === 'primitive')
                {
                	outputElements.push(element);
                	return;
                }
                
                offset++;
                outputElements.push(this.addTransitionToElement(element, null, offset));
            });
            
            if(flags & ProcessType.ROOT)
            	this.handleRootAfter(outputElements);

			if(flags & ProcessType.GROUP)
                this.handleGroupAfter(outputElements);

            if(flags & (ProcessType.ITERATION_ZERO | ProcessType.ITERATION_ONE))
                this.handleIterationAfter(outputElements, flags);
                
            return outputElements;
        }
        
        handleRootAfter(outputElements){
        	outputElements.push({type: 'end'});
        }
        
        handleOptionBefore(outputElements, elements)
        {
        	let offset = 1;
            let sumLength = elements.reduce((x, y) => x + (Array.isArray(y) ? y.length : 1), 0);
            
        	elements.forEach((element, id) => {
            	if(Array.isArray(element))
                {
                	let input = null;
                	if(element[element.length-1]?.type === "primitive") {
                		input = element[element.length-1]?.data?.character;
                        
                        element[element.length-1].transitions.get(input).pop();
                    }
                    else if(element[element.length-1].transitions.has(null))
                    	element[element.length-1].transitions.get(null).pop()
                    	
                	this.addTransitionToElement(element[element.length-1], input, sumLength - (offset + element.length) + 2);
                }
                else if(element?.type === "primitive")
                {
                	let input = element?.data?.character;
                	element.transitions.get(input).pop();
                	this.addTransitionToElement(element, element?.data?.character, sumLength - offset + 1);
                }
                
                this.addTransitionToElement(outputElements[0], null, offset);
                offset += Array.isArray(element) ? element.length : 1;
            });
        }
        
        handleIterationAfter(outputElements, flags)
        {
        	const dataLength = outputElements.length;
        
        	outputElements.push(
              this.buildElement("iteration_end", {}, new Map([
                [null, [-dataLength + 1, 1]]
              ]))
            );

            if(flags & ProcessType.ITERATION_ZERO)
            	this.addTransitionToElement(outputElements[0], null, outputElements.length);
        }
        
        handleGroupAfter(outputElements)
        {
        	outputElements[0].data.end = outputElements.length - 1;
        }
        
        buildElement(type, data={}, transitions = new Map()) {
        	return {
            	type,
                data,
                transitions
            };
        }
        
        addTransitionToElement(element, input, by){
        	if(element.transitions === undefined) 
            	element.transitions = new Map();
            if(!element.transitions.has(input))
            	element.transitions.set(input, []);
            
        	element.transitions.get(input).push(by);
            return element;
        }
    }
    
    const handler = new ParserHandler();
}}


/* ------------------------------------ */
/* ---- start of the regex grammar ---- */
/* ------------------------------------ */

start 
    = 
    type:(moded_start / general_start)
    {
    	const data = { modes: type?.modes };
        return handler.handle(data, type?.elements, ProcessType.ROOT | ProcessType.DEFAULT);
    }

general_start
    = elements:any_element*
    {
    	return { 
        	modes: undefined,
        	elements 
        }
    }

moded_start
    = '/' elements:any_element* '/' modes:modes
    {
    	return {
        	modes,
        	elements
        }
    }

/* ---- modes ---- */

modes 
	= @modes:('m' / 'g' / 'i' / 'y' / 'u' / 'v' / 's' / 'd')*
    &{
    	let alreadyUsed = {};
        
        let parsable = true;
		modes.forEach((character) => {
        	if(Object.hasOwn(alreadyUsed, character))
            {
            	parsable = false;
            	return;
            }
            
         	alreadyUsed[character] = true;
        });
        
        return parsable;
    }



/* -------------------------------------------------------- */
/* ---- options of possible paths (order is essential) ---- */
/* -------------------------------------------------------- */

general
    = list / primitive / lookaround / group / EOS / SOS

any_element 
    = iteration / option / optional / general

to_iterate
    = primitive / group / list

to_option
    = iteration / general

to_optional 
    = primitive / group / list

to_list
    = 
    @element:(range_ascii / hexadecimal_ascii / '\\]' / [^\]]) 
    &{
    	if(element?.type != "range")
        	return true;
    	return element?.start <= element?.end;
    }
    
    
    
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

integer_digit
	= digit:[0-9] { return parseInt(digit, 10); }

integer
  	= digits:[0-9]+ { return parseInt(digits.join(""), 10); }
    
ascii 
	= [\x00-\x7F]
    
range_ascii
	= 
    first:(hexadecimal_ascii / ascii) '-' second:(hexadecimal_ascii / ascii)
    {
    	return {
        	type: "range",
            start: first,
            end: second
        }
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
      [a-zA-Z0-9 ] / 
      '.' /
      (
      	'\\' escaped:escaped_primitive
        { return escaped; }
      )
    )
    {
    	return handler.buildElement('primitive', { character }, new Map([[character, [1]]]));
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
      
	  return handler.handle(data, elements, ProcessType.GROUP | ProcessType.DEFAULT);
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
    elements:to_option |2..,'|'|
    {
    	return handler.handle({}, elements, ProcessType.OPTION);
    }

optional 
    = 
    element:to_optional '?'
    {
    	return {
        	type: "optional",
            element
        }
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
        
        const iterationType = detailedType == '*' ? ProcessType.ITERATION_ZERO : ProcessType.ITERATION_ONE;
        return handler.handle(data, [element], iterationType | ProcessType.DEFAULT);
    }

list
    = 
    '['
        negation:'^'? 
        elements:to_list* 
    ']'
    {
    	return {
        	type: "list",
            // N - negative, P - positive
            detailedType: negation == '^' ? 'N' : 'P',
            elements
        }
    }

EOS = '$' // end of string
SOS = '^' // start of string