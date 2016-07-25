const fs = require('fs');

const keyMappings = require('./labelKeyMapping');

var parseQuantityFromString = stringQuantity => {
  var value;
  var quantityParts = stringQuantity.trim().split(' ');
  var secondMeasurementPart;

  value = Number.parseInt(quantityParts[0]);

  if (quantityParts.length > 1) {

    // Divide character can be 47, 8260
    var seperatorCharacter = quantityParts[0].indexOf(String.fromCharCode(47)) > -1 ? String.fromCharCode(47) : String.fromCharCode(8260);
    secondMeasurementPart = quantityParts[1].split(seperatorCharacter);
    value += secondMeasurementPart[0] / secondMeasurementPart[1];
  }

  return value;
};

var parseMdTable = sectionMdArray => {
  var output = [];
  // Table expression starts with a label row
  // that is followed by a row of seperators
  sectionMdArray.slice(2).forEach(ingredient => {
    var ingredientData = ingredient.split('|');
    output.push({
      quantity: parseQuantityFromString( ingredientData[1].trim() ),
      ingredientName: ingredientData[3].trim(),
      preperation: ingredientData[4].trim(),
      unit: ingredientData[2].trim()
    });
  });
  return output;
};

fs.readFile('file.md', 'utf8', (err, fileContents) => {
  if (err) throw err;

  var lines = fileContents.split('\n');

  var sections = [];
  var currentSection = null;

  lines.forEach(line => {
    if (line.startsWith('#')) {
      if (currentSection !== null) {
        sections.push(currentSection);
      }
      currentSection = [];
    }
    if (line !== '') {
      currentSection.push(line);
    }
  });

  // Process Sections
  var doc ={};
  sections.forEach(section => {

    // If it is the main document title
    if (section[0].startsWith('# ')) {
      doc.title = section[0].split('# ')[1];
      section.slice(1).forEach(headItem => {
        var pieces = headItem.split(': ');
        doc[pieces[0]] = pieces[1].trim();
      });
    } else if (section[0].trim() === '## Ingredients') {
      // console.log(section);
      doc.ingredients = parseMdTable(section.slice(1));
    }

  });

  console.log(doc);
});
