/** A Promise which resolves once the DOM has loaded. */
export const awaitDom = new Promise((resolve) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    } else {
        resolve();
    }
});

/**
 * A Promise which resolves once the Google Maps API has loaded.
 *
 * We assume Google Maps has loaded if `window.google` exists. This check is
 * necessary because we're loading scripts asynchronously and we can't predict
 * whether ours or Google's will load first.
 */
export const awaitGoogleMaps = new Promise((resolve, reject) => {
    const mapScript = document.getElementById('maps-script') as HTMLElement;

    // Reject if the script doesn't load after 5 seconds
    const timeout = setTimeout(() => {
        mapScript.removeEventListener('load', handleResolve);
        reject('The Google Maps API took too long to load.'
               + ' Try reloading the page or visiting again later.');
    }, 5_000);

    /** Handle the steps necessary for resolving our returned Promise */
    const handleResolve = () => {
        clearTimeout(timeout);
        resolve();
    };

    if ('google' in window && 'maps' in google) {
        // We can resolve immediately
        handleResolve();
    } else {
        // Resolve once Google script has loaded
        mapScript.addEventListener('load', handleResolve);

        // Reject if the script fails to load
        mapScript.addEventListener('error', () => {
            mapScript.removeEventListener('load', handleResolve);
            reject('Failed to load Google Maps API. Try reloading the page.');
        });
    }
});
