import { lineColFromIndex } from '../lexer/lineColFromIndex.js';
import { TokenType } from '../lexer/token.js'; // Nearly type definitions say that Token must have a value field,
// which however is wrong.  Instead Nearley expects a text field.

export default class LexerAdapter {
  index = 0;
  tokens = [];
  input = '';

  constructor(tokenize) {
    this.tokenize = tokenize;
  }

  reset(chunk, _info) {
    this.input = chunk;
    this.index = 0;
    this.tokens = this.tokenize(chunk);
  }

  next() {
    return this.tokens[this.index++];
  }

  save() {}

  formatError(token) {
    const {
      line,
      col
    } = lineColFromIndex(this.input, token.start);
    return `Parse error at token: ${token.text} at line ${line} column ${col}`;
  }

  has(name) {
    return name in TokenType;
  }

}
//# sourceMappingURL=LexerAdapter.js.map