import { FormatFn } from '../../src/sqlFormatter.js';
interface Options {
    without?: string[];
    additionally?: string[];
    supportsUsing?: boolean;
    supportsApply?: boolean;
}
export default function supportsJoin(format: FormatFn, { without, additionally, supportsUsing, supportsApply }?: Options): void;
export {};
