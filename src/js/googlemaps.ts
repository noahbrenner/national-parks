import {Promise} from 'es6-promise';

class ParkMap {
    public map: google.maps.Map;

    constructor() {
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 40.7413549, lng: -73.9980244},
            zoom: 13
        });
    }
}

/** Initialize our map only after the DOM has loaded */
function initMapOnLoadAsync(): Promise<ParkMap> {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                resolve(new ParkMap());
            });
        } else {
            resolve(new ParkMap());
        }
    });
}

/**
 * Initialize our map once both Google Maps and the DOM have loaded. We'll
 * assume Google Maps has loaded if `window.google` exists. This check is
 * necessary because we're loading scripts asynchronously and we can't predict
 * whether ours or Google's will load first.
 */
export default function initMapAsync(): Promise<ParkMap> {
    return new Promise((resolve, reject) => {
        const googleScript = document.getElementById('maps-script');

        // Reject if the script doesn't load after 5 seconds
        const timeout = setTimeout(() => {
            googleScript.removeEventListener('load', resolveInit);
            reject('The Google Maps API took too long to load.'
                   + ' Try reloading the page or visiting again later.');
        }, 5_000);

        /** Handle the steps necessary for resolving our returned Promise */
        const resolveInit = () => {
            clearTimeout(timeout);
            resolve(initMapOnLoadAsync());
        };

        if ('google' in window) {
            // We can resolve immediately
            resolveInit();
        } else {
            // Resolve once Google script has loaded
            googleScript.addEventListener('load', resolveInit);

            // Reject if the script fails to load
            googleScript.addEventListener('error', () => {
                googleScript.removeEventListener('load', resolveInit);
                reject('Failed to load Google Maps API.'
                       + 'Try reloading the page.');
            });
        }
    });
}
