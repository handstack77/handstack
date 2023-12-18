import { FormatFn } from '../../src/sqlFormatter.js';
interface CommentsConfig {
    hashComments?: boolean;
    doubleSlashComments?: boolean;
    nestedBlockComments?: boolean;
}
export default function supportsComments(format: FormatFn, opts?: CommentsConfig): void;
export {};
