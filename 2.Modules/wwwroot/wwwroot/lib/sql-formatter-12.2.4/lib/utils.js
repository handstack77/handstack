export const dedupe = arr => [...new Set(arr)]; // Last element from array

export const last = arr => arr[arr.length - 1]; // Sorts strings by length, so that longer ones are first
// Also sorts alphabetically after sorting by length.

export const sortByLengthDesc = strings => strings.sort((a, b) => b.length - a.length || a.localeCompare(b));
/** Get length of longest string in list of strings */

export const maxLength = strings => strings.reduce((max, cur) => Math.max(max, cur.length), 0); // replaces long whitespace sequences with just one space

export const equalizeWhitespace = s => s.replace(/\s+/gu, ' '); // Used for flattening keyword lists

export const flatKeywordList = obj => dedupe(Object.values(obj).flat()); // True when string contains multiple lines

export const isMultiline = text => /\n/.test(text); // Given a type and a field name, returns a type where this field is optional
//
// For example, these two type definitions are equivalent:
//
//   type Foo = Optional<{ foo: string, bar: number }, 'foo'>;
//   type Foo = { foo?: string, bar: number };
//
//# sourceMappingURL=utils.js.map