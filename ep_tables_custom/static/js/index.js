// Keep track of the Ace editor instance
let padEditor;

exports.aceInitialized = (hook, context) => {
  // Store a reference to the editor
  padEditor = context.editorInfo.editor;
  
  // Add click handler for the table button
  $('#table-button').click(function() {
    showTableDialog();
  });
};

function showTableDialog() {
  const html = `
    <div id="table-dialog">
      <h3>Insert Table</h3>
      <div class="table-config">
        <label>Rows: <input type="number" id="table-rows" value="3" min="1" max="20"></label>
        <label>Columns: <input type="number" id="table-cols" value="3" min="1" max="10"></label>
      </div>
      <div class="table-actions">
        <button id="table-insert">Insert</button>
        <button id="table-cancel">Cancel</button>
      </div>
    </div>
  `;
  
  $('body').append(html);
  
  $('#table-cancel').click(function() {
    $('#table-dialog').remove();
  });
  
  $('#table-insert').click(function() {
    const rows = parseInt($('#table-rows').val(), 10);
    const cols = parseInt($('#table-cols').val(), 10);
    insertTable(rows, cols);
    $('#table-dialog').remove();
  });
}

function insertTable(rows, cols) {
  if (!padEditor) {
    console.error('Editor not available');
    return;
  }
  
  padEditor.callWithAce((ace) => {
    const rep = ace.ace_getRep();
    
    // Create a text-based table using ASCII characters
    let tableText = '\n'; // Start with a newline
    
    // Calculate the column width (fixed width for all columns)
    const colWidth = 15; // Fixed width for better alignment
    
    // Create the top border
    tableText += '+';
    for (let c = 0; c < cols; c++) {
      tableText += '-'.repeat(colWidth) + '+';
    }
    tableText += '\n';
    
    // Create the rows
    for (let r = 0; r < rows; r++) {
      // Cell content row
      tableText += '|';
      for (let c = 0; c < cols; c++) {
        // Center the initial "Cell" text
        const padding = Math.floor((colWidth - 4) / 2);
        tableText += ' '.repeat(padding) + 'Cell' + ' '.repeat(colWidth - 4 - padding) + '|';
      }
      tableText += '\n';
      
      // Row separator
      tableText += '+';
      for (let c = 0; c < cols; c++) {
        tableText += '-'.repeat(colWidth) + '+';
      }
      tableText += '\n';
    }
    
    tableText += '\n'; // End with a newline
    
    // Insert the table text
    ace.ace_replaceRange(rep.selStart, rep.selEnd, tableText);
  }, 'insertTable', true);
}

// Updated to use custom-table classes
exports.aceAttribsToClasses = (hook, context) => {
  if (!context || !context.key) {
    return [];
  }
  
  if (context.key === 'custom-table-container' || 
      context.key === 'custom-table-row' || 
      context.key === 'custom-table-cell') {
    return [context.key];
  }
  return [];
};

exports.aceCreateDomLine = (hook, context) => {
  if (!context) {
    return [];
  }
  
  const cls = context.cls || '';
  
  if (cls.indexOf('custom-table-container') !== -1) {
    return [{
      cls: cls,
      extraOpenTags: '<div class="custom-table-container">',
      extraCloseTags: '</div>',
    }];
  }
  
  if (cls.indexOf('custom-table-row') !== -1) {
    return [{
      cls: cls,
      extraOpenTags: '<div class="custom-table-row">',
      extraCloseTags: '</div>',
    }];
  }
  
  if (cls.indexOf('custom-table-cell') !== -1) {
    return [{
      cls: cls,
      extraOpenTags: '<div class="custom-table-cell">',
      extraCloseTags: '</div>',
    }];
  }
  
  return [];
};

exports.aceEditorCSS = () => {
  return ['ep_tables_custom/static/css/tables.css'];
};

exports.acePaste = (hook, context) => {
  if (!context || !context.text) {
    return false;
  }
  
  const content = context.text;
  if (content.indexOf('<table') !== -1) {
    // Future enhancement: Convert HTML table to text-based format
    return false;
  }
  return false;
};

exports.acePostWriteDomLineHTML = (hook, context) => {
  const node = context.node;
  const text = node.innerText || '';
  
  // Check if this is a table border line (contains + and -)
  if (text.includes('+') && text.includes('-')) {
    node.setAttribute('data-table-line', 'true');
  }
  
  // Check if this is a table cell line (contains | but not + or -)
  if (text.includes('|') && !text.includes('+') && !text.includes('-')) {
    node.setAttribute('data-table-cell', 'true');
  }
  
  return [];
};
