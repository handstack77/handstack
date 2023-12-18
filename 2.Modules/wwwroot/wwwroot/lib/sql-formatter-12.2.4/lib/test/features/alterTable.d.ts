import { FormatFn } from '../../src/sqlFormatter.js';
interface AlterTableConfig {
    addColumn?: boolean;
    dropColumn?: boolean;
    modify?: boolean;
    renameTo?: boolean;
    renameColumn?: boolean;
}
export default function supportsAlterTable(format: FormatFn, cfg?: AlterTableConfig): void;
export {};
