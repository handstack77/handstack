import { FormatFn } from '../../src/sqlFormatter.js';
interface DeleteFromConfig {
    withoutFrom?: boolean;
}
export default function supportsDeleteFrom(format: FormatFn, { withoutFrom }?: DeleteFromConfig): void;
export {};
