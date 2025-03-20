const eejs = require('ep_etherpad-lite/node/eejs');
const Changeset = require('ep_etherpad-lite/static/js/Changeset');
const path = require('path');

exports.eejsBlock_editbarMenuLeft = (hook, context) => {
  context.content += `
    <li class="separator"></li>
    <li id="table-button">
      <a class="grouped-middle" data-l10n-id="ep_tables_custom.toolbar.table" title="Insert Table">
        <span class="table-button-icon"></span>
      </a>
    </li>
  `;
};

exports.eejsBlock_styles = (hook, context) => {
  context.content += '<link href="../static/plugins/ep_tables_custom/static/css/tables.css" rel="stylesheet">';
};

exports.collectContentPre = (hook, context) => {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  
  if (tname === 'div' && context.node.className.indexOf('table-') !== -1) {
    // Handle table rows
    if (context.node.className.indexOf('table-row') !== -1) {
      lineAttributes.tableRow = 'true';
    }
    // Handle table cells
    else if (context.node.className.indexOf('table-cell') !== -1) {
      lineAttributes.tableCell = 'true';
    }
  }
};

exports.collectContentPost = (hook, context) => {
  const tname = context.tname;
  const state = context.state;
  const lineAttributes = state.lineAttributes;
  
  if (tname === 'div' && (lineAttributes.tableRow || lineAttributes.tableCell)) {
    delete lineAttributes.tableRow;
    delete lineAttributes.tableCell;
  }
};
