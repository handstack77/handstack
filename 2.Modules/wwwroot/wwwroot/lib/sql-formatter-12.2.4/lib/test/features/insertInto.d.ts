import { FormatFn } from '../../src/sqlFormatter.js';
interface InsertIntoConfig {
    withoutInto?: boolean;
}
export default function supportsInsertInto(format: FormatFn, { withoutInto }?: InsertIntoConfig): void;
export {};
