"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Prettier = require("prettier");
const StringBuilder_1 = require("./StringBuilder");
class TypescriptCodeStringBuilder extends StringBuilder_1.default {
    appendSection(str, func) {
        this.appendBlankLine();
        this.appendAsNewLine(`/*** BEGIN ${str} */`);
        func(this);
        this.appendAsNewLine(`/*** END ${str} */`);
        return this;
    }
    buildPretty() {
        const uglyOutput = this.build();
        return Prettier.format(uglyOutput, {
            parser: "typescript"
        });
    }
}
exports.default = TypescriptCodeStringBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXNjcmlwdENvZGVTdHJpbmdCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1R5cGVzY3JpcHRDb2RlU3RyaW5nQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFxQztBQUNyQyxtREFBNEM7QUFFNUMsTUFBcUIsMkJBQTRCLFNBQVEsdUJBQWE7SUFDN0QsYUFBYSxDQUFDLEdBQVcsRUFBRSxJQUE2QjtRQUM3RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDM0MsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sV0FBVztRQUNoQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtZQUNqQyxNQUFNLEVBQUUsWUFBWTtTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFmRCw4Q0FlQyJ9