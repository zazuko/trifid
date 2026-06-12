import { selectAll } from 'hast-util-select';

import type { Element, Nodes } from 'hast';

// inspired by: https://github.com/martypdx/rehype-add-classes

type ClassAdditions = Record<string, string>;

export default (additions: ClassAdditions) => {
  const adders = Object.entries(additions).map(adder);
  return (node: Nodes) => adders.forEach((a) => a(node));
};

const adder = ([selector, className]: [string, string]) => {
  const writer = write(className);
  return (node: Nodes) => selectAll(selector, node).forEach(writer);
};

/**
 * Add a class name to the properties of a node.
 *
 * @param className Class name to add.
 * @returns Function that adds the class name to the properties.
 */
const write = (className: string) => ({ properties }: Element) => {
  if (!properties.className) {
    properties.className = className;
  } else {
    properties.className = `${properties.className} ${className}`;
  }
};
