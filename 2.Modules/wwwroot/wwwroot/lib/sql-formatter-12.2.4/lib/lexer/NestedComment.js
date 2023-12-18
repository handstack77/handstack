/* eslint-disable no-cond-assign */
const START = /\/\*/uy; // matches: /*

const MIDDLE = /([^/*]|\*[^/]|\/[^*])+/uy; // matches text NOT containing /* or */

const END = /\*\//uy; // matches: */

/**
 * An object mimicking a regular expression,
 * for matching nested block-comments.
 */

export class NestedComment {
  lastIndex = 0;

  exec(input) {
    let result = '';
    let match;
    let nestLevel = 0;

    if (match = this.matchSection(START, input)) {
      result += match;
      nestLevel++;
    } else {
      return null;
    }

    while (nestLevel > 0) {
      if (match = this.matchSection(START, input)) {
        result += match;
        nestLevel++;
      } else if (match = this.matchSection(END, input)) {
        result += match;
        nestLevel--;
      } else if (match = this.matchSection(MIDDLE, input)) {
        result += match;
      } else {
        return null;
      }
    }

    return [result];
  }

  matchSection(regex, input) {
    regex.lastIndex = this.lastIndex;
    const matches = regex.exec(input);

    if (matches) {
      this.lastIndex += matches[0].length;
    }

    return matches ? matches[0] : null;
  }

}
//# sourceMappingURL=NestedComment.js.map