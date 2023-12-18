import { maxLength } from '../utils.js';
const PRECEDING_WHITESPACE_REGEX = /^\s+/u;
/**
 * Handles comma placement - either before, after or tabulated
 */

export default function formatCommaPositions(query, commaPosition, indent) {
  return groupCommaDelimitedLines(query.split('\n')).flatMap(commaLines => {
    if (commaLines.length === 1) {
      return commaLines;
    } else if (commaPosition === 'tabular') {
      return formatTabular(commaLines);
    } else if (commaPosition === 'before') {
      return formatBefore(commaLines, indent);
    } else {
      throw new Error(`Unexpected commaPosition: ${commaPosition}`);
    }
  }).join('\n');
}
/**
 * Given lines like this:
 *
 *     [
 *       'SELECT',
 *       '  foo,',
 *       '  bar, --comment',
 *       '  baz',
 *       'FROM'
 *     ]
 *
 * Returns groups like this:
 *
 *     [
 *       ['SELECT'],
 *       ['  foo,', '  bar, --comment', '  baz'],
 *       ['FROM']
 *     ]
 */

function groupCommaDelimitedLines(lines) {
  const groups = [];

  for (let i = 0; i < lines.length; i++) {
    const group = [lines[i]]; // when line ends with comma,
    // gather together all following lines that also end with comma,
    // plus one (which doesn't end with comma)

    while (lines[i].match(/.*,(\s*(--.*)?$)/)) {
      i++;
      group.push(lines[i]);
    }

    groups.push(group);
  }

  return groups;
} // makes all lines the same length by appending spaces before comma


function formatTabular(commaLines) {
  const commaPosition = maxLength(trimTrailingComments(commaLines)) - 1;
  return commaLines.map((line, i) => {
    if (i === commaLines.length - 1) {
      return line; // do not add comma for last item
    }

    return indentComma(line, commaPosition);
  });
}

function indentComma(line, commaPosition) {
  const [, code, comment] = line.match(/^(.*?),(\s*--.*)?$/) || [];
  const spaces = ' '.repeat(commaPosition - code.length);
  return `${code}${spaces},${comment ?? ''}`;
}

function formatBefore(commaLines, indent) {
  return trimTrailingCommas(commaLines).map((line, i) => {
    if (i === 0) {
      return line; // do not add comma for first item
    }

    const [whitespace] = line.match(PRECEDING_WHITESPACE_REGEX) || [''];
    return removeLastIndent(whitespace, indent) + indent.replace(/ {2}$/, ', ') + // add comma to the end of last indent
    line.trimStart();
  });
}

function removeLastIndent(whitespace, indent) {
  return whitespace.replace(new RegExp(indent + '$'), '');
}

function trimTrailingCommas(lines) {
  return lines.map(line => line.replace(/,(\s*(--.*)?$)/, '$1'));
}

function trimTrailingComments(lines) {
  return lines.map(line => line.replace(/\s*--.*/, ''));
}
//# sourceMappingURL=formatCommaPositions.js.map