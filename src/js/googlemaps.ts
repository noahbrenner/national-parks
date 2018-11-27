import {Promise} from 'es6-promise';
import {Park} from './app';

export class ParkMap {
    public map: google.maps.Map;
    public markers: google.maps.MVCArray<google.maps.Marker>;
    public oregonBounds: google.maps.LatLngBounds;

    constructor() {
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 43.8041334, lng: -120.5542012}, // Center of Oregon
            zoom: 7
        });

        this.markers = new google.maps.MVCArray();

        // We're hardcoding these coordinates since they don't change
        this.oregonBounds = new google.maps.LatLngBounds(
            {lat: 41.9917941, lng: -124.7035411}, // Southwest
            {lat: 46.299099, lng: -116.463262} // Northeast
        );

        this.map.fitBounds(this.oregonBounds);
    }

    /** Add new markers to our markers array and display them on the map */
    public initMarkers(parks: Park[]) {
        for (const park of parks) {
            const marker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                map: this.map,
                position: park.latLng,
                title: park.name
            });

            this.markers.push(marker);
        }
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
        const mapScript = document.getElementById('maps-script') as HTMLElement;

        // Reject if the script doesn't load after 5 seconds
        const timeout = setTimeout(() => {
            mapScript.removeEventListener('load', resolveInit);
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
            mapScript.addEventListener('load', resolveInit);

            // Reject if the script fails to load
            mapScript.addEventListener('error', () => {
                mapScript.removeEventListener('load', resolveInit);
                reject('Failed to load Google Maps API.'
                       + 'Try reloading the page.');
            });
        }
    });
}
