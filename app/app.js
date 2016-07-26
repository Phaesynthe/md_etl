const fs = require('fs');

const keyMappings = require('./labelKeyMapping');

var parseQuantityFromString = stringQuantity => {
  var value;
  var quantityParts = stringQuantity.trim().split(' ');
  var secondMeasurementPart;

  value = Number.parseInt(quantityParts[ 0 ]);

  if (quantityParts.length > 1) {

    // Divide character can be 47, 8260
    var seperatorCharacter = quantityParts[ 0 ].indexOf(String.fromCharCode(47)) > -1 ? String.fromCharCode(47) : String.fromCharCode(8260);
    secondMeasurementPart = quantityParts[ 1 ].split(seperatorCharacter);
    value += secondMeasurementPart[ 0 ] / secondMeasurementPart[ 1 ];
  }

  return value;
};

//
// Individual Transformation Processes
//

var parseMdTable = sectionMdArray => {
  var output = [];
  // Table expression starts with a label row
  // that is followed by a row of seperators
  sectionMdArray.slice( 2 ).forEach(ingredient => {
    var ingredientData = ingredient.split('|');
    output.push({
      quantity: parseQuantityFromString( ingredientData[ 1 ].trim() ),
      ingredientName: ingredientData[ 3 ].trim(),
      preperation: ingredientData[ 4 ].trim(),
      unit: ingredientData[ 2 ].trim()
    });
  });
  return output;
};

var parseSequence = sectionMdSequence => {
  var output = []; // Accumulator
  var step = {}; // Item staging
  var currentMainStep = null;

  // we will assume that the instruction list can go exactly 2 layers deep
  sectionMdSequence.forEach(stepItem => {
    var parts = stepItem.split('. ');
    var num = Number.parseInt( parts[0] );

    // The first item
    // if ( currentMainStep === null) {
    if( output.length === 0 && Object.keys(step).length === 0 ) {
      currentMainStep = num;
      step = {
        number: num,
        description: parts[ 1 ],
        subSteps: []
      };
    }
    // A sub item
    else if (stepItem.startsWith(' ') ) {
      step.subSteps.push({
        number: parts[ 0 ],
        description: parts[ 1 ],
      });
    }
    // Subsiquent main item
    else {
      output.push(step);
      step = {
        number: num,
        description: parts[ 1 ],
        subSteps: []
      };
    }
  });

  // add the last step if it's valid
  output.push(step);
  return output;
};

//
// Extract
//

fs.readFile('file.md', 'utf8', (err, fileContents) => {
  if (err) throw err;

  var lines = fileContents.split( '\n' );

  var sections = [];
  var currentSection = null;

  var transformError; // Will be populated if there is a missing section.

  lines.forEach(line => {
    if (line.startsWith( '#' )) {
      if (currentSection !== null) {
        sections.push(currentSection);
      }
      currentSection = [];
    }
    if (line !== '') {
      currentSection.push(line);
    }
  });

  //
  // Rout each section to be transformed
  //

  var doc ={};
  sections.forEach(section => {

    // If it is the main document title
    // snag the title value and all root values
    if (section[ 0 ].startsWith('# ')) {
      doc.title = section[ 0 ].split( '# ' )[ 1 ];
      section.slice( 1 ).forEach(headItem => {
        var pieces = headItem.split(': ');

        // Pull the object key out of mappings and save the value
        // and save the value to the object under that key.
        doc[ keyMappings.getFieldFromLabel( pieces[ 0 ] ).key ] = pieces[ 1 ].trim();
      });
    } else {
      switch ( section[ 0 ].trim() ) {
        case '## Vital Notes':
          console.log('No transform for ## Vital Notes');
          // transformError = new Error('No transform for ## Vital Notes');
          break;
        case '### Special Equipment':
          console.log('No transform for ### Special Equipment');
          // transformError = new Error('No transform for ## Vital Notes');
          break
        case '## Ingredients':
          doc.ingredients = parseMdTable(section.slice( 1 ));
          break;
        case '## Instructions':
          doc.instructions = parseSequence(section.slice( 1 ));
          break;
        default:
          // Throw error indicating that the section has not transformation
          // process defined for it.
          transformError = new Error('No transform for ' + section[ 0 ].trim());
          break;
      }
    }
  });

  if (!transformError) {
    // Dispatch the load process
    console.log(doc);
  } else {
    console.log(transformError);
  }
});
