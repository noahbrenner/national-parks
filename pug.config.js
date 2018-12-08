const icons = require('@mdi/js');

const polyfillFeatures = [
    'Array.prototype.find',
    'Array.prototype.includes',
    'Object.assign',
    'Promise'
];

// These values will be accessible from `.pug` template files
exports.locals = {
    googleApiKey: process.env.GOOGLE_MAPS_API_KEY,
    polyfillFeatures: polyfillFeatures.join(','),
    svgPathMenu: icons.mdiMenu,
    web: {
        noah: 'https://noahbrenner.github.io/',
        repo: 'https://github.com/noahbrenner/national-parks',
        nps: 'https://www.nps.gov/subjects/developer/api-documentation.htm',
        maps: 'https://developers.google.com/maps/documentation/',
        mdi: 'https://google.github.io/material-design-icons/',
        ko: 'https://knockoutjs.com/'
    }
};
