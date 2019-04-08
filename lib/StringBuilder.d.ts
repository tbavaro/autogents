export default class StringBuilder {
    private strings;
    private lastLine;
    private lastLineNeedsNewline;
    append(str: string): this;
    appendNewLine(): this;
    appendBlankLine(): this;
    appendAsNewLine(str: string): this;
    appendLines(strs: string[]): this;
    build(): string;
}
