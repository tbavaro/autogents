import StringBuilder from "./StringBuilder";
export default class TypescriptCodeStringBuilder extends StringBuilder {
    appendSection(str: string, func: (builder: this) => void): this;
    buildPretty(): string;
}
