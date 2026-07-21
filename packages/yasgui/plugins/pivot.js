/* global Yasr */

/*
 * A pivot table plugin for YASR.
 *
 * It lets users cross-tabulate the bindings of a SPARQL result set: pick a
 * field for the rows, one for the columns, and an aggregation to compute for
 * every cell. It is intentionally dependency free, both to keep the bundle
 * small and to keep the markup under Trifid's control.
 */

const NONE = '';

const aggregators = {
  count: {
    label: 'Count',
    /**
     * @param {string[]} values Raw cell values.
     * @returns {number} Number of values.
     */
    compute: (values) => values.length,
  },
  countUnique: {
    label: 'Count unique',
    compute: (values) => new Set(values).size,
  },
  sum: {
    label: 'Sum',
    numeric: true,
    compute: (values) => numbers(values).reduce((total, value) => total + value, 0),
  },
  average: {
    label: 'Average',
    numeric: true,
    compute: (values) => {
      const parsed = numbers(values);
      if (parsed.length === 0) {
        return undefined;
      }
      return parsed.reduce((total, value) => total + value, 0) / parsed.length;
    },
  },
  min: {
    label: 'Minimum',
    numeric: true,
    compute: (values) => {
      const parsed = numbers(values);
      return parsed.length === 0 ? undefined : Math.min(...parsed);
    },
  },
  max: {
    label: 'Maximum',
    numeric: true,
    compute: (values) => {
      const parsed = numbers(values);
      return parsed.length === 0 ? undefined : Math.max(...parsed);
    },
  },
};

/**
 * Keep only the values that can be read as numbers.
 *
 * @param {string[]} values Raw cell values.
 * @returns {number[]} Parsed numbers.
 */
const numbers = (values) => values
  .map((value) => Number.parseFloat(value))
  .filter((value) => !Number.isNaN(value));

/**
 * Format an aggregated value for display.
 *
 * @param {number|undefined} value Aggregated value.
 * @returns {string} Value to display.
 */
const formatValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }
  if (!Number.isFinite(value)) {
    return String(value);
  }
  // Avoid long floating point tails on averages
  return String(Math.round(value * 1000) / 1000);
};

/**
 * Shorten IRIs so that the table stays readable.
 *
 * @param {string} value Raw binding value.
 * @returns {string} Value to display.
 */
const shorten = (value) => {
  if (!/^https?:\/\//.test(value)) {
    return value;
  }
  const withoutTrailingSlash = value.replace(/\/$/, '');
  const lastSegment = withoutTrailingSlash.split(/[#/]/).pop();
  return lastSegment || value;
};

/**
 * Build a labelled `<select>` element.
 *
 * @param {string} label Label of the field.
 * @param {Array<{value: string, label: string}>} options Available options.
 * @param {string} selected Currently selected value.
 * @param {Function} onChange Called with the new value.
 * @returns {HTMLElement} The wrapper element.
 */
const buildSelect = (label, options, selected, onChange) => {
  const wrapper = document.createElement('label');
  wrapper.className = 'trifid-pivot-field';

  const text = document.createElement('span');
  text.textContent = label;
  wrapper.appendChild(text);

  const select = document.createElement('select');
  options.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    if (option.value === selected) {
      optionElement.selected = true;
    }
    select.appendChild(optionElement);
  });
  select.addEventListener('change', () => onChange(select.value));
  wrapper.appendChild(select);

  return wrapper;
};

class YasguiPivot {
  priority = 5;

  hideFromSelection = false;

  // Persisted across redraws so that the selection survives a new query
  state = {
    rowField: undefined,
    columnField: undefined,
    valueField: undefined,
    aggregator: 'count',
  };

  constructor(yasr) {
    this.yasr = yasr;
  }

  getBindings() {
    if (
      !this.yasr
      || !this.yasr.results
      || !this.yasr.results.json
      || !this.yasr.results.json.results
      || !this.yasr.results.json.results.bindings
    ) {
      return { variables: [], bindings: [] };
    }

    const json = this.yasr.results.json;
    const bindings = json.results.bindings;
    const variables = (json.head && json.head.vars) ? json.head.vars : [];

    return { variables, bindings };
  }

  /**
   * Read a single binding value as a string.
   *
   * @param {object} binding One row of the result set.
   * @param {string} variable Variable name.
   * @returns {string} The value, or an empty string when unbound.
   */
  readValue(binding, variable) {
    const cell = binding[variable];
    if (!cell || cell.value === undefined) {
      return '';
    }
    return cell.value;
  }

  draw() {
    const { variables, bindings } = this.getBindings();

    // Default the selection the first time the plugin is drawn, and reset it
    // whenever the current selection no longer matches the result set.
    if (!variables.includes(this.state.rowField)) {
      this.state.rowField = variables[0];
    }
    if (this.state.columnField !== NONE && !variables.includes(this.state.columnField)) {
      this.state.columnField = variables.length > 1 ? variables[1] : NONE;
    }
    if (this.state.valueField !== NONE && !variables.includes(this.state.valueField)) {
      this.state.valueField = variables[0];
    }

    const container = document.createElement('div');
    container.className = 'trifid-pivot';

    const fieldOptions = variables.map((variable) => ({ value: variable, label: variable }));
    const optionalFieldOptions = [{ value: NONE, label: '(none)' }, ...fieldOptions];

    const redraw = () => this.draw();

    const controls = document.createElement('div');
    controls.className = 'trifid-pivot-controls';
    controls.appendChild(buildSelect('Rows', fieldOptions, this.state.rowField, (value) => {
      this.state.rowField = value;
      redraw();
    }));
    controls.appendChild(buildSelect('Columns', optionalFieldOptions, this.state.columnField, (value) => {
      this.state.columnField = value;
      redraw();
    }));
    controls.appendChild(buildSelect(
      'Aggregation',
      Object.entries(aggregators).map(([value, { label }]) => ({ value, label })),
      this.state.aggregator,
      (value) => {
        this.state.aggregator = value;
        redraw();
      },
    ));
    controls.appendChild(buildSelect('Value', optionalFieldOptions, this.state.valueField, (value) => {
      this.state.valueField = value;
      redraw();
    }));
    container.appendChild(controls);

    container.appendChild(this.buildTable(bindings));

    this.yasr.resultsEl.textContent = '';
    this.yasr.resultsEl.appendChild(container);
  }

  /**
   * Cross-tabulate the bindings and render the resulting table.
   *
   * @param {object[]} bindings Result set bindings.
   * @returns {HTMLElement} The rendered table.
   */
  buildTable(bindings) {
    const { rowField, columnField, valueField, aggregator } = this.state;
    const aggregate = aggregators[aggregator] || aggregators.count;

    // cells: row -> column -> values
    const cells = new Map();
    const rowKeys = [];
    const columnKeys = [];

    bindings.forEach((binding) => {
      const rowKey = this.readValue(binding, rowField);
      const columnKey = columnField === NONE ? '' : this.readValue(binding, columnField);
      // Counting rows does not need a value, so fall back to the row key
      const value = valueField === NONE
        ? this.readValue(binding, rowField)
        : this.readValue(binding, valueField);

      if (!cells.has(rowKey)) {
        cells.set(rowKey, new Map());
        rowKeys.push(rowKey);
      }
      const row = cells.get(rowKey);
      if (!row.has(columnKey)) {
        row.set(columnKey, []);
        if (!columnKeys.includes(columnKey)) {
          columnKeys.push(columnKey);
        }
      }
      row.get(columnKey).push(value);
    });

    rowKeys.sort();
    columnKeys.sort();

    const table = document.createElement('table');
    table.className = 'trifid-pivot-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const corner = document.createElement('th');
    corner.textContent = columnField === NONE
      ? rowField
      : `${rowField} \\ ${columnField}`;
    headerRow.appendChild(corner);

    columnKeys.forEach((columnKey) => {
      const th = document.createElement('th');
      th.textContent = columnField === NONE ? aggregate.label : shorten(columnKey);
      th.title = columnKey;
      headerRow.appendChild(th);
    });

    const totalHeader = document.createElement('th');
    totalHeader.textContent = 'Total';
    totalHeader.className = 'trifid-pivot-total';
    headerRow.appendChild(totalHeader);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rowKeys.forEach((rowKey) => {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = shorten(rowKey);
      th.title = rowKey;
      tr.appendChild(th);

      const rowValues = [];
      columnKeys.forEach((columnKey) => {
        const td = document.createElement('td');
        const values = cells.get(rowKey).get(columnKey) || [];
        rowValues.push(...values);
        td.textContent = values.length === 0 ? '' : formatValue(aggregate.compute(values));
        tr.appendChild(td);
      });

      const totalCell = document.createElement('td');
      totalCell.className = 'trifid-pivot-total';
      totalCell.textContent = formatValue(aggregate.compute(rowValues));
      tr.appendChild(totalCell);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const tfoot = document.createElement('tfoot');
    const totalRow = document.createElement('tr');
    const totalRowHeader = document.createElement('th');
    totalRowHeader.scope = 'row';
    totalRowHeader.textContent = 'Total';
    totalRow.appendChild(totalRowHeader);

    const allValues = [];
    columnKeys.forEach((columnKey) => {
      const columnValues = [];
      rowKeys.forEach((rowKey) => {
        columnValues.push(...(cells.get(rowKey).get(columnKey) || []));
      });
      allValues.push(...columnValues);

      const td = document.createElement('td');
      td.className = 'trifid-pivot-total';
      td.textContent = formatValue(aggregate.compute(columnValues));
      totalRow.appendChild(td);
    });

    const grandTotal = document.createElement('td');
    grandTotal.className = 'trifid-pivot-total';
    grandTotal.textContent = formatValue(aggregate.compute(allValues));
    totalRow.appendChild(grandTotal);

    totalRow.className = 'trifid-pivot-total';
    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);

    const scroller = document.createElement('div');
    scroller.className = 'trifid-pivot-scroller';
    scroller.appendChild(table);
    return scroller;
  }

  canHandleResults() {
    const { variables, bindings } = this.getBindings();
    // A pivot table only makes sense for SELECT results with at least one row
    return variables.length > 0 && bindings.length > 0;
  }

  getIcon() {
    const textIcon = document.createElement('div');
    textIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-table"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>';
    return textIcon;
  }
}

Yasr.registerPlugin('Pivot', YasguiPivot);
