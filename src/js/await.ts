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

    /** Remove all listeners tracking the load progress of the Maps API */
    const clearListeners = () => {
        clearTimeout(timeout);
        mapScript.removeEventListener('load', loadListener);
        mapScript.removeEventListener('error', handleLoadError);
    };

    /** Handle the steps necessary for resolving our returned Promise */
    const handleResolve = () => {
        clearListeners();
        resolve();
    };

    /** Handle the steps necessary for rejecting our returned Promise */
    const handleLoadError = () => {
        clearListeners();
        reject(new Error(
            'Failed to load Google Maps API. Try reloading the page.'
        ));
    };

    /** Handle the 'load' event of the `mapScript` element */
    const loadListener = () => {
        // Verify that the script successfully loaded the Maps API
        if ('google' in window && 'maps' in google) {
            handleResolve();
        } else {
            handleLoadError();
        }
    };

    // Reject if the script doesn't load after 5 seconds
    const timeout = setTimeout(() => {
        clearListeners();
        reject(new Error(
            'The Google Maps API took too long to respond.'
            + ' Try reloading the page or visiting again later.'
        ));
    }, 5_000);

    if ('google' in window && 'maps' in google) {
        // We can resolve immediately
        handleResolve();
    } else {
        // Wait for the script to load
        mapScript.addEventListener('load', loadListener);
        mapScript.addEventListener('error', handleLoadError);
    }
});
