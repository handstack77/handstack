import { FormatFn } from '../../src/sqlFormatter.js';
interface ParamsTypes {
    positional?: boolean;
    numbered?: ('?' | '$' | ':')[];
    named?: (':' | '$' | '@')[];
    quoted?: ('@""' | '@[]' | '@``')[];
}
export default function supportsParams(format: FormatFn, params: ParamsTypes): void;
export {};
