import { Token } from './token.js';
import { ParamTypes, TokenizerOptions } from './TokenizerOptions.js';
export default class Tokenizer {
    private cfg;
    private rulesBeforeParams;
    private rulesAfterParams;
    constructor(cfg: TokenizerOptions);
    tokenize(input: string, paramTypesOverrides: ParamTypes): Token[];
    private buildRulesBeforeParams;
    private buildRulesAfterParams;
    private buildParamRules;
    private validRules;
}
