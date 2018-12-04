// While it's not ideal to publish API keys on GitHub, these keys are used on
// the client side of a publicly-accessible website, so it's not possible to
// keep them secret, as it would be with server-side keys.
const googleApiKey = (
    process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAgWqPCo0aCPPpcX3WQQFXrVTzEojNJzJg'
);

const polyfillFeatures = [
    'Array.prototype.find',
    'Array.prototype.includes',
    'Promise'
];

// These values will be accessible from `.pug` template files
exports.locals = {
    googleApiKey,
    polyfillFeatures: polyfillFeatures.join(','),
    web: {
        noah: 'https://noahbrenner.github.io/',
        repo: 'https://github.com/noahbrenner/national-parks',
        nps: 'https://www.nps.gov/subjects/developer/api-documentation.htm',
        maps: 'https://developers.google.com/maps/documentation/',
        ko: 'https://knockoutjs.com/'
    }
};
