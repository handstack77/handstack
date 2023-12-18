import { FormatFn } from '../../src/sqlFormatter.js';
interface TruncateTableConfig {
    withoutTable?: boolean;
}
export default function supportsTruncateTable(format: FormatFn, { withoutTable }?: TruncateTableConfig): void;
export {};
