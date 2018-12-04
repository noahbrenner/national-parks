import {mdiMapMarker} from '@mdi/js'; // Material Design Icon as SVG path
import {Park} from './app';
import {awaitDom, awaitGoogleMaps} from './await';

declare class Marker extends google.maps.Marker {
    public setHovered: (hover: boolean) => void;
    constructor(park: Park, map: google.maps.Map);
}

/**
 * Return a custom Marker class which extends `google.maps.Marker`.
 * We need to create this class dynamically because the Google Maps API might
 * not be available at the time this script is parsed.
 */
function createMarkerClass(): typeof Marker {
    /** Create a map marker icon with the specified fill color */
    function createMarkerIcon(color: string): google.maps.Symbol {
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

    // tslint:disable-next-line:no-shadowed-variable
    return class Marker extends google.maps.Marker {
        private static iconDefault = createMarkerIcon('red');
        private static iconHovered = createMarkerIcon('yellow');

        constructor(park: Park, map: google.maps.Map) {
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
    };
}

type Callback = (parkId?: string) => void;

interface MapConstructorConfig {
    markerHoverCallback: Callback;
    parkSelectCallback: Callback;
}

export class ParkMap {
    public Marker = createMarkerClass();
    public infoElement: HTMLElement;
    public infowindow: google.maps.InfoWindow;
    public map: google.maps.Map;
    public markers: Marker[];
    public onMarkerClick: () => void;
    public onMarkerMouseout: () => void;
    public onMarkerMouseover: () => void;
    public oregonBounds: google.maps.LatLngBounds;
    public parkSelectCallback: Callback;

    constructor(config: MapConstructorConfig) {
        this.markers = [];
        this.parkSelectCallback = config.parkSelectCallback;

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
        this.parkSelectCallback();
    }

    /**
     * Open the infowindow on the specified marker
     * @param target - Either a Marker instance or a parkID
     */
    public infoOpen(target: Marker | string) {
        const marker = target instanceof this.Marker
            ? target
            : this.getMarkerById(target);

        // Move infowindow content back to the infowindow before opening
        this.infowindow.setContent(this.infoElement);
        this.infowindow.open(this.map, marker);
        this.infowindow.set('marker', marker);
        this.parkSelectCallback(marker.get('id'));
    }

    /** Add new markers to our markers array and display them on the map */
    public initMarkers(parks: Park[]) {
        this.markers.push(...parks.map((park) => {
            // Create a new marker
            const marker = new this.Marker(park, this.map);

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

/**
 * Return a Promise which resolves with the ParkMap constructor.
 *
 * The promise will only resolve after both the Google Maps API and the DOM
 * have loaded, since both are required before the constructor can be used.
 */
export default function getMapConstructorAsync(): Promise<typeof ParkMap> {
    return Promise.all([awaitDom, awaitGoogleMaps]).then(() => ParkMap);
}
