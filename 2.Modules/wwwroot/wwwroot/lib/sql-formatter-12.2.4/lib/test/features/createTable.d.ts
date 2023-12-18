import { FormatFn } from '../../src/sqlFormatter.js';
interface CreateTableConfig {
    orReplace?: boolean;
    ifNotExists?: boolean;
}
export default function supportsCreateTable(format: FormatFn, { orReplace, ifNotExists }?: CreateTableConfig): void;
export {};
