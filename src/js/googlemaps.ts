import {mdiMapMarker} from '@mdi/js'; // Material Design Icon as SVG path
import {Promise} from 'es6-promise';
import {Park} from './app';

class Marker extends google.maps.Marker {
    private static iconDefault: google.maps.Symbol;
    private static iconHovered: google.maps.Symbol;

    /** Create a map marker icon with the specified fill color */
    private static createMarkerIcon(color: string): google.maps.Symbol {
        /*
         * We're using the "place" icon from Material Design Icons via the
         * `@mdi/js` npm package (which gives us access to the SVG path and
         * allows us to tree shake the unused icons).
         *
         * We're resizing the icon from 24x24 to 36x36, another of the
         * recommended sizes for these icons as documented here:
         * https://google.github.io/material-design-icons/#sizing
         *
         * Material Design icons are distributed with the Apache License 2.0.
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

    /** Create marker icons if they don't exist yet. */
    private static ensureMarkerIcons() {
        if (!Marker.iconDefault || !Marker.iconHovered) {
            Marker.iconDefault = Marker.createMarkerIcon('red');
            Marker.iconHovered = Marker.createMarkerIcon('yellow');
        }
    }

    constructor(park: Park, map: google.maps.Map) {
        // Make sure icons exist. We're doing this in the constructor because
        // we can't guarantee that Google maps will be loaded when the class is
        // defined, but it *will* be loaded before instances are created.
        Marker.ensureMarkerIcons();

        super({
            animation: google.maps.Animation.DROP,
            icon: Marker.iconDefault,
            map,
            position: park.latLng,
            title: park.name
        });
    }

    /** Set the color of a marker icon to represent a hover state */
    public setHovered(hover: boolean) {
        this.setIcon(hover ? Marker.iconHovered : Marker.iconDefault);
    }
}

interface MapConstructorConfig {
    markerHoverCallback: (parkId?: string) => void;
}

export class ParkMap {
    public infoElement: HTMLElement;
    public infowindow: google.maps.InfoWindow;
    public map: google.maps.Map;
    public markers: Marker[];
    public onMarkerClick: () => void;
    public onMarkerMouseout: () => void;
    public onMarkerMouseover: () => void;
    public oregonBounds: google.maps.LatLngBounds;

    constructor(config: MapConstructorConfig) {
        this.markers = [];

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

        this.infowindow = new google.maps.InfoWindow();
        this.infoElement = document.getElementById('infowindow') as HTMLElement;

        this.infowindow.addListener('closeclick', () => {
            // Handle all tasks that are needed when closing the infowindow
            this.infoClose();
        });

        /* === Define event listener handlers for markers === */

        /** Change a marker's icon (for 'mouseover' event) */
        this.onMarkerMouseover = function (this: Marker) {
            this.setHovered(true);
            config.markerHoverCallback(this.get('id'));
        };

        /** Reset a marker's icon (for 'mouseout' event) */
        this.onMarkerMouseout = function (this: Marker) {
            this.setHovered(false);
            config.markerHoverCallback(undefined);
        };

        /** Open/close the infowindow at a marker (for 'click' event) */
        this.onMarkerClick = (() => {
            const parkMap = this;

            return function (this: Marker) {
                if (parkMap.infowindow.get('marker') === this) {
                    // Close infowindow if the already active marker was clicked
                    parkMap.infoClose();
                } else {
                    parkMap.infoOpen(this);
                }
            };
        })();
    }

    /** Retrieve an existing marker */
    public getMarkerById(id: string) {
        const result = this.markers.find((marker) => marker.get('id') === id);

        if (!result) {
            throw new Error(`Could not find a marker with ID "${id}"`);
        }

        return result;
    }

    /** Close the infowindow */
    public infoClose() {
        // If our infowindow content is removed from the DOM, Knockout will
        // stop tracking it. Since calling `infowindow.close()` would cause
        // exactly that to happen, we'll move our content out of the infowindow
        // before closing it.
        document.body.appendChild(this.infoElement);
        this.infowindow.close();
        this.infowindow.set('marker', undefined);
    }

    /**
     * Open the infowindow on the specified marker
     * @param target - Either a Marker instance or a parkID
     */
    public infoOpen(target: Marker | string) {
        const marker = target instanceof Marker
            ? target
            : this.getMarkerById(target);

        // Move infowindow content back to the infowindow before opening
        this.infowindow.setContent(this.infoElement);
        this.infowindow.open(this.map, marker);
        this.infowindow.set('marker', marker);
    }

    /** Add new markers to our markers array and display them on the map */
    public initMarkers(parks: Park[]) {
        this.markers.push(...parks.map((park) => {
            // Create a new marker
            const marker = new Marker(park, this.map);

            marker.set('id', park.id);

            marker.addListener('click', this.onMarkerClick);
            marker.addListener('mouseover', this.onMarkerMouseover);
            marker.addListener('mouseout', this.onMarkerMouseout);

            return marker;
        }));
    }

    /** Update the display of a marker as if its hover state were changed */
    public setHoverState(parkId: string, hover: boolean) {
        this.getMarkerById(parkId).setHovered(hover);
    }
}

/** Initialize our map only after the DOM has loaded */
function getMapConstructorOnLoadAsync(): Promise<typeof ParkMap> {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                resolve(ParkMap);
            });
        } else {
            resolve(ParkMap);
        }
    });
}

/**
 * Initialize our map once both Google Maps and the DOM have loaded. We'll
 * assume Google Maps has loaded if `window.google` exists. This check is
 * necessary because we're loading scripts asynchronously and we can't predict
 * whether ours or Google's will load first.
 */
export default function getMapConstructorAsync(): Promise<typeof ParkMap> {
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
            resolve(getMapConstructorOnLoadAsync());
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
                       + ' Try reloading the page.');
            });
        }
    });
}
