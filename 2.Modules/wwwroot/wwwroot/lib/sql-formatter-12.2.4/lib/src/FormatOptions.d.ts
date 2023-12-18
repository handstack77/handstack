import { ParamItems } from './formatter/Params.js';
import { ParamTypes } from './lexer/TokenizerOptions.js';
export declare type IndentStyle = 'standard' | 'tabularLeft' | 'tabularRight';
export declare type KeywordCase = 'preserve' | 'upper' | 'lower';
export declare type CommaPosition = 'before' | 'after' | 'tabular';
export declare type LogicalOperatorNewline = 'before' | 'after';
export interface FormatOptions {
    tabWidth: number;
    useTabs: boolean;
    keywordCase: KeywordCase;
    indentStyle: IndentStyle;
    logicalOperatorNewline: LogicalOperatorNewline;
    tabulateAlias: boolean;
    commaPosition: CommaPosition;
    expressionWidth: number;
    linesBetweenQueries: number;
    denseOperators: boolean;
    newlineBeforeSemicolon: boolean;
    params?: ParamItems | string[];
    paramTypes?: ParamTypes;
}
