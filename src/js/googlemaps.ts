import {mdiMapMarker} from '@mdi/js'; // Material Design Icon as SVG path
import {Promise} from 'es6-promise';
import {Park} from './app';

export class ParkMap {
    public infowindow: google.maps.InfoWindow;
    public map: google.maps.Map;
    public markerIconDefault: google.maps.Symbol;
    public markerIconHover: google.maps.Symbol;
    public markers: google.maps.Marker[];
    public oregonBounds: google.maps.LatLngBounds;

    constructor() {
        this.markers = [];
        this.markerIconDefault = this.createMarkerIcon('red');
        this.markerIconHover = this.createMarkerIcon('yellow');

        /* === Initialize and configure the map === */

        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 43.8041334, lng: -120.5542012}, // Center of Oregon
            zoom: 7
        });

        // We're hardcoding these coordinates since they don't change
        this.oregonBounds = new google.maps.LatLngBounds(
            {lat: 41.9917941, lng: -124.7035411}, // Southwest
            {lat: 46.299099, lng: -116.463262} // Northeast
        );

        this.map.fitBounds(this.oregonBounds);

        /* === Initialize and configure the infowindow === */

        this.infowindow = new google.maps.InfoWindow({
            content: document.getElementById('infowindow') as HTMLElement
        });

        this.infowindow.addListener('closeclick', () => {
            this.infowindow.set('marker', undefined);
            // TODO Inform the ViewModel
        });
    }

    /** Create a map marker icon with the specified fill color */
    public createMarkerIcon(color: string): google.maps.Symbol {
        /*
         * We're using the "place" icon from Material Design Icons via the
         * `@mdi/js` npm package (which gives us access to the SVG path and
         * allows us to tree shake the unused icons).
         *
         * We're resizing the icon from 24x24 to 36x36, another of the
         * recommended sizes for these icons as documented here:
         * https://google.github.io/material-design-icons/#sizing
         *
         * Material Design icons are distributed with the Appache License 2.0.
         * The `@mdi/js` npm package is distributed with the MIT License.
         */
        return {
            anchor: new google.maps.Point(12, 24), // Anchor at bottom center
            fillColor: color,
            fillOpacity: 1,
            path: mdiMapMarker, // Natural size: 24x24
            scale: 1.5, // Scale to 36x36
            strokeWeight: 1 // Don't scale the stroke weight
        };
    }

    /** Add new markers to our markers array and display them on the map */
    public initMarkers(parks: Park[]) {
        this.markers.push(...parks.map((park) => {
            // Create a new marker
            const marker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                icon: this.markerIconDefault,
                map: this.map,
                position: park.latLng,
                title: park.name
            });

            // Open the info window when the marker is clicked
            marker.addListener('click', () => {
                if (this.infowindow.get('marker') !== marker) {
                    this.infowindow.set('marker', marker);
                    this.infowindow.open(this.map, marker);
                    // TODO Inform the ViewModel
                }
            });

            marker.addListener('mouseover', () => {
                marker.setIcon(this.markerIconHover);
            });

            marker.addListener('mouseout', () => {
                marker.setIcon(this.markerIconDefault);
            });

            return marker;
        }));
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
