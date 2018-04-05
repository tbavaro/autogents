export default class StringBuilder {
  private strings: string[] = [];

  private lastLine(): string | undefined {
    return (
      this.strings.length === 0
        ? undefined
        : this.strings[this.strings.length - 1]
    );
  }

  private lastLineNeedsNewline(): boolean {
    const lastLine = this.lastLine();
    if (lastLine === undefined) {
      return false;
    } else {
      return !lastLine.endsWith("\n");
    }
  }

  public append(str: string): this {
    if (str !== "") {
      this.strings.push(str);
    }
    return this;
  }

  public appendNewLine(): this {
    return this.append("\n");
  }

  public appendBlankLine(): this {
    if (this.strings.length === 0) {
      return this;
    } else {
      if (this.lastLineNeedsNewline()) {
        this.appendNewLine();
      }
      return this.appendNewLine();
    }
  }

  public appendAsNewLine(str: string): this {
    return this.appendLines([str]);
  }

  public appendLines(strs: string[]): this {
    if (this.lastLineNeedsNewline()) {
      this.appendNewLine();
    }
    for (const str of strs) {
      this.append(str).appendNewLine();
    }
    return this;
  }

  public build(): string {
    return this.strings.join("");
  }
}
