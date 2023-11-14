import { Stack } from "@structures/Stack"
import { StringReader } from "@helpers/StringReader"
import { stateType } from "@structures/stateType";
import { RegexElement } from "@regexNFA/RegexElement";
import { RegexString } from "@regexNFA/RegexString";
import { RegexOption } from "@regexNFA/RegexOption";
import { RegexCapturing } from "@regexNFA/RegexCapturing";
import { RegCompileException } from "@exceptions/RegCompileException";

/**
 * Compiles string to executable regex NFA
 */
export class RegexParser
{
    constructor()
    {
        this.states_ = new Stack<stateType>();
        this.rootElement_ = new RegexElement();
        this.stackElements_ = new Stack<RegexElement>();
    }

    /**
     * Tries to compile string to Regex NFA for further execution.
     * [Throws exception on invalid string]
     * @param regexString Regex string to be compiled
     * @returns Reference to first element of parsed/compiled string.
     */
    public compile(regexString: string) : RegexElement
    {
        /* reset all internal variables */
        this.states_.clear();
        this.rootElement_ = new RegexElement();
        this.stackElements_.clear();
        /* push root to elements (for further calls) */
        this.stackElements_.push(this.rootElement_);

        /* init reader */
        const stringReader = new StringReader(regexString);
        
        /* Main loop compiling to executable regex NFA */
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            /* Special and escaped characters must be handeled first */
            if(this.handleSpecialCharacter(character)) continue;
            if(this.handleEscapedCharacter(character)) continue;
            
            if(this.handleOption(character)) continue;

            if(this.handleCapturing(character)) continue;
            if(this.handleCapturingEnd(character)) continue;

            if(this.handleCharacter(character)) continue;
        }

        return this.rootElement_;
    }

    private handleSpecialCharacter(character: string) : boolean
    {
        if(this.states_.top() !== stateType.ESCAPED)
            return false;

        if(RegexParser.specialCharacters_.includes(character))
        {
            this.states_.pop();
            return true;
        }

        return false;
    }

    private handleCharacter(character: string) : boolean
    {
        const characterCode = character.charCodeAt(0);

        if((characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122))
        {
            this.addCharacter(character);
            return true;
        }

        return false;
    }

    private handleEscapedCharacter(character: string) : boolean
    {
        if(this.states_.top() === stateType.ESCAPED)
        {
            this.addCharacter("\\" + character);
            this.states_.pop();
            return true;
        }
        
        if(character === '\\')
            this.states_.push(stateType.ESCAPED);

        return false;
    }

    private handleOption(character: string)
    {
        /* check if is option character */
        if(character !== '|')
        {
            /* we must remove option possible if exists */
            if(this.states_.top() === stateType.OPTION_POSSIBLE)
                this.states_.pop();

            return false;
        }

        let addElement : RegexElement;

        /* handle already existing option (option possible) */
        if(this.states_.top() === stateType.OPTION_POSSIBLE)
        {
            this.states_.pop();
            this.states_.push(stateType.OPTION);

            return true;
        }

        /* handle string */
        if(this.stackElements_.top() instanceof RegexString)
        {
            const stringElement = <RegexString>this.stackElements_.top();
            const lastCharacter = stringElement.pop();

            if(stringElement.length == 0)
                this.stackElements_.pop();

            addElement = new RegexString(lastCharacter);
        }
        else
        {
            addElement = this.stackElements_.pop();
        }

        this.handleAddElement(new RegexOption([addElement]));
        this.states_.push(stateType.OPTION);

        return true;
    }

    private handleCapturing(character: string)
    {
        if(character !== '(')
            return false;

        this.states_.push(stateType.CAPTURING);
        this.handleAddElement(new RegexCapturing());

        return true;
    }

    private handleCapturingEnd(character: string)
    {
        if(character !== ')')
            return false;

        if(this.states_.top() !== stateType.CAPTURING)
            throw new RegCompileException("Brackets are not matching.");

        /* note: if RegexCapturing element was found we need to skip it if was finalized */
        while(!(this.stackElements_.top() instanceof RegexCapturing) || (<RegexCapturing>this.stackElements_.top()).isFinalized())
            this.stackElements_.pop();

        /* finalize the current capturing group */
        (<RegexCapturing>this.stackElements_.top()).finalize();

        /* Remove capturing state */
        this.states_.pop();

        /* handle option if is at the top of stack */
        if(this.states_.top() === stateType.OPTION)
            this.handleAddElement(this.stackElements_.pop());

        return true;
    }

    private addCharacter(character: string) : void
    {
        if(this.stackElements_.top() instanceof RegexString)
        {
            (<RegexString>this.stackElements_.top()).append(character);
            return;
        }

        this.handleAddElement(new RegexString(character));
    }

    private handleAddElement(element: RegexElement)
    {
        /* if last element was an option then there is possibility to contain another option */
        if(this.states_.top() === stateType.OPTION && this.stackElements_.top() instanceof RegexOption)
        {
            (<RegexOption>this.stackElements_.top()).addOption(element);

            this.states_.pop();
            this.states_.push(stateType.OPTION_POSSIBLE); 

            return;
        }

        this.stackElements_.top().setNext(element);
        this.stackElements_.push(element);
    }


    private states_ : Stack<stateType>;
    private rootElement_ : RegexElement;
    private stackElements_ : Stack<RegexElement>;

    private static readonly specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}