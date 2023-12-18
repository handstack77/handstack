import { FormatFn } from '../../src/sqlFormatter.js';
interface LimitingTypes {
    limit?: boolean;
    offset?: boolean;
    fetchFirst?: boolean;
    fetchNext?: boolean;
}
export default function supportsLimiting(format: FormatFn, types: LimitingTypes): void;
export {};
