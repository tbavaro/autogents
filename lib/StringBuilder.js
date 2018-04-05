"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StringBuilder {
    constructor() {
        this.strings = [];
    }
    lastLine() {
        return (this.strings.length === 0
            ? undefined
            : this.strings[this.strings.length - 1]);
    }
    lastLineNeedsNewline() {
        const lastLine = this.lastLine();
        if (lastLine === undefined) {
            return false;
        }
        else {
            return !lastLine.endsWith("\n");
        }
    }
    append(str) {
        if (str !== "") {
            this.strings.push(str);
        }
        return this;
    }
    appendNewLine() {
        return this.append("\n");
    }
    appendBlankLine() {
        if (this.strings.length === 0) {
            return this;
        }
        else {
            if (this.lastLineNeedsNewline()) {
                this.appendNewLine();
            }
            return this.appendNewLine();
        }
    }
    appendAsNewLine(str) {
        return this.appendLines([str]);
    }
    appendLines(strs) {
        if (this.lastLineNeedsNewline()) {
            this.appendNewLine();
        }
        for (const str of strs) {
            this.append(str).appendNewLine();
        }
        return this;
    }
    build() {
        return this.strings.join("");
    }
}
exports.default = StringBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RyaW5nQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9TdHJpbmdCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7SUFBQTtRQUNVLFlBQU8sR0FBYSxFQUFFLENBQUM7SUEwRGpDLENBQUM7SUF4RFMsUUFBUTtRQUNkLE9BQU8sQ0FDTCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxTQUFTO1lBQ1gsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQzFDLENBQUM7SUFDSixDQUFDO0lBRU8sb0JBQW9CO1FBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDMUIsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNO1lBQ0wsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQVc7UUFDdkIsSUFBSSxHQUFHLEtBQUssRUFBRSxFQUFFO1lBQ2QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDeEI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxhQUFhO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRU0sZUFBZTtRQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM3QixPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFO2dCQUMvQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDdEI7WUFDRCxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM3QjtJQUNILENBQUM7SUFFTSxlQUFlLENBQUMsR0FBVztRQUNoQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTSxXQUFXLENBQUMsSUFBYztRQUMvQixJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFO1lBQy9CLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUN0QjtRQUNELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDbEM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxLQUFLO1FBQ1YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0Y7QUEzREQsZ0NBMkRDIn0=