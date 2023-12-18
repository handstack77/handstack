import { FormatFn } from '../../src/sqlFormatter.js';
interface DropTableConfig {
    ifExists?: boolean;
}
export default function supportsDropTable(format: FormatFn, { ifExists }?: DropTableConfig): void;
export {};
