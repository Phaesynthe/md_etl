var _ = require('lodash');

var mappings = [
  { key: 'originalSource', label: 'Original Source' },
  { key: 'servings', label: 'Servings' },
  { key: 'totalTime', label: 'Total time' },
  { key: 'cookTime', label: 'Cook time' },
  { key: 'ovenTemp', label: 'Oven temp' }
];

module.exports = {
  getFieldFromLabel: label => {
    _(mappings)
      .filter({ label: label })[0];
  }
};
