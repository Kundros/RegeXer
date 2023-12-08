import './styles/main.less'
import { RegexVisualizer } from './models/RegexVisualizer'
import { TextEditor } from './models/TextEditor'

const regexVisualizer = new RegexVisualizer(
    new TextEditor(document.querySelector("#regex-wrapper > span"), document.querySelector("#regex-wrapper > canvas")),
    new TextEditor(document.querySelector("#match-wrapper > span"), document.querySelector("#match-wrapper > canvas"))
);