import { FormatFn } from '../../src/sqlFormatter.js';
declare type StringType = '""-qq' | '""-bs' | "''-qq" | "''-bs" | "U&''" | "N''" | "X''" | 'X""' | "B''" | 'B""' | "R''" | 'R""';
export default function supportsStrings(format: FormatFn, stringTypes: StringType[]): void;
export {};
