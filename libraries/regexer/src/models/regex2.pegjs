/* -------------------------------- */
/* ---- functions & structures ---- */
/* -------------------------------- */

{{
    const ProcessType = {
      DEFAULT: 0x1,
      OPTION: 0x2,
      ITERATION_ZERO: 0x4,
      ITERATION_ONE: 0x8
    };
    
	function processElements(data, elements, flags = ProcessType.DEFAULT) {
    	let offset = 1;
        let pointer = 0;
        const numberOfElements = elements;
        
        if((flags & ProcessType.DEFAULT) != 0)
        	data[0].transitions.push({input: null, move_by: 1});
    
		elements.forEach((element, id) => {
        	if(Array.isArray(element))
            {
            	offset += element.length;
                Object.assign(data, data.concat(element));
            }
            else if(typeof element === "string")
          	{
                  data.push({type: "primitive", transitions: []});
                 
                  if((flags & ProcessType.DEFAULT) != 0)
                    pointer++;
                    
                  data[data.length-1].transitions.push({input: element, move_by: 1});
            }
            else
            {
            	offset++;
                data.push(element);
                data[pointer].transitions.push({input: null, move_by: offset});
            }
        });
        
        const dataLength = data.length;
        
        if((flags & ProcessType.OPTION) != 0)
        {
        	data.forEach((element, id) => {
            	if(element?.type === "primitive")
                {
                	element.transitions[0].move_by = dataLength - id;
                    data[0].transitions.push({input: null, move_by: id});
                }
            });
        }
        
        if((flags & (ProcessType.ITERATION_ZERO | ProcessType.ITERATION_ONE)) != 0)
        {
        	data.push({
            	type: "iteration_repeat",
                data: {},
            	transitions: [
                	{input: null, move_by: -dataLength + 1},
                    {input: null, move_by: 1}
               	]
            });
        }
        
        if((flags & ProcessType.ITERATION_ZERO) != 0)
        {
        	data[0].transitions.push({input: null, move_by: data.length});
        }
	}
}}


/* ------------------------------------ */
/* ---- start of the regex grammar ---- */
/* ------------------------------------ */

start 
    = whichStart:(moded_start / general_start)
    {
    	let data = [
        	{
            	type: whichStart?.type,
                data: {
                	modes: whichStart?.modes
                },
                transitions: []
            }
        ];
        
        processElements(data, whichStart?.elements);
        
        data.push({type: "end"});
        
        return data;
    }

general_start
    = elements:any_element*
    {
    	return { 
        	type: "root",
        	modes: undefined,
        	elements 
        }
    }

moded_start
    = '/' elements:any_element* '/' modes:modes
    {
    	return {
        	type: "root",
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
    
      let data = [{
        type: "group",
        // C - Capturing, NC - Non-Capturing, N - named
        data: {
        	detailedType,
            name: detailedType == 'N' ? type : undefined,
            end: 0
        },
        transitions: []
      }];
      
      processElements(data, elements);
      
      data[0].data.end = data.length-1;

	  return data;
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
    	let data = [{
        	type: "option",
            data: {},
            transitions: []
        }];
    
    	processElements(data, elements, ProcessType.OPTION);
    
        return data;
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
    
    	let data = [{
        	type: "iteration",
            data: {
            	detailedType,
                start,
                end,
                lazy: lazy != undefined
            },
            transitions: []
        }];
        
        const iterationType = detailedType == '*' ? ProcessType.ITERATION_ZERO : ProcessType.ITERATION_ONE;
        
        processElements(data, [element], iterationType | ProcessType.DEFAULT);
    
    	return data;
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