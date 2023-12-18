import { FormatFn } from '../../src/sqlFormatter.js';
interface UpdateConfig {
    whereCurrentOf?: boolean;
}
export default function supportsUpdate(format: FormatFn, { whereCurrentOf }?: UpdateConfig): void;
export {};
