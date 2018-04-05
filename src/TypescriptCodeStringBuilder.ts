import * as Prettier from "prettier";
import StringBuilder from "./StringBuilder";

export default class TypescriptCodeStringBuilder extends StringBuilder {
  public appendSection(str: string, func: (builder: this) => void): this {
    this.appendBlankLine();
    this.appendAsNewLine(`/*** BEGIN ${str} */`);
    func(this);
    this.appendAsNewLine(`/*** END ${str} */`);
    return this;
  }

  public buildPretty(): string {
    const uglyOutput = this.build();
    return Prettier.format(uglyOutput, {
      parser: "typescript"
    });
  }
}
