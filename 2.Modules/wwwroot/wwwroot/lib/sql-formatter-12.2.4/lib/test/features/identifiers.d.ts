import { FormatFn } from '../../src/sqlFormatter.js';
declare type IdentType = '""-qq' | '``' | '[]' | 'U&""';
export default function supportsIdentifiers(format: FormatFn, identifierTypes: IdentType[]): void;
export {};
