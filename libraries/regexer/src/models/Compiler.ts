import { Stack } from "@regexer/structures/Stack"
import { StringReader } from "@regexer/helpers/StringReader"
import { stateType } from "@regexer/structures/stateType";
import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { RegexString } from "@regexer/models/regexNFA/RegexString";
import { RegexOption } from "./regexNFA/RegexOption";
import { RegexCapturing } from "./regexNFA/RegexCapturing";
import { RegCompileException } from "@regexer/exceptions/RegCompileException";

/**
 * Compiles string to executable regex NFA
 */
export class Compiler
{
    public compile(regexString: string) : RegexElement
    {
        const stringReader = new StringReader(regexString);

        this.stackElements_.push(this.rootElement_);
        
        /* Main loop compiling to executable regex NFA */
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            /* Special and escaped characters must be handeled first */
            if(this.handleSpecialCharacter(character)) continue;
            if(this.handleEscapedCharacter(character)) continue;
            
            if(this.handleCapturing(character)) continue;
            if(this.handleOption(character)) continue;
            if(this.handleCapturingEnd(character)) continue;

            if(this.handleCharacter(character)) continue;
        }

        return this.rootElement_;
    }

    private handleSpecialCharacter(character: string) : boolean
    {
        if(this.states_.top() !== stateType.ESCAPED)
            return false;

        if(Compiler.specialCharacters_.includes(character))
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

        const captureElement = (<RegexCapturing>this.stackElements_.top());

        captureElement.finalize();

        this.states_.pop();

        console.log(this.states_.top());
        /* handle option if is in stack */
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


    private states_ = new Stack<stateType>();
    private rootElement_ = new RegexElement();
    private stackElements_ = new Stack<RegexElement>();

    private static readonly specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}