/* ------------------------------------ */
/* ---- start of the regex grammar ---- */
/* ------------------------------------ */

start 
    = moded_start / general_start

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
    
      return {
        type: "group",
        // C - Capturing, NC - Non-Capturing, N - named
        detailedType,
        name: detailedType == 'N' ? type : undefined,
        elements
      }
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
    	return {
        	type: "option",
            elements
        }
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
    type:(
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
        	type == '*' ? 0 :
            type == '+' ? 1 : 
            type?.start;
            
        const end =
        	type?.end != undefined ? type?.end : undefined;
    
    	return {
        	type: "iteration",
            start,
            end,
            isLazy: lazy == '?',
            element
        }
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