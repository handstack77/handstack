import { FormatFn } from '../../src/sqlFormatter.js';
interface CreateViewConfig {
    orReplace?: boolean;
    materialized?: boolean;
    ifNotExists?: boolean;
}
export default function supportsCreateView(format: FormatFn, { orReplace, materialized, ifNotExists }?: CreateViewConfig): void;
export {};
