import * as ko from 'knockout';
// Use an alias for `ParkMap` since we're only importing it for the type
// information. The real constructor is provided later from a resolved Promise.
// This avoids shadowing the variable name at that point.
import {awaitDom} from './await';
import getMapConstructorAsync, {ParkMap as ParkMapType} from './googlemaps';
import getParksAsync, {ParkAddress, ParkData} from './nationalparks';

/** Represent an individual National Park */
export class Park {
    public address?: ParkAddress;
    public description: string;
    public id: string;
    public imgAlt?: string;
    public imgCaption?: string;
    public imgUrl?: string;
    public isFavorite: KnockoutObservable<boolean>;
    public latLng: google.maps.LatLngLiteral;
    public name: string;
    public parkType: string;
    public website: string;

    public isCurrentPark = ko.pureComputed(() => {
        return this.parent.currentPark() === this;
    });

    public isHovered = ko.pureComputed(() => {
        return this.parent.hoveredPark() === this;
    });

    constructor(parkObj: ParkData, public parent: ViewModel) {
        this.address = parkObj.address;
        this.description = parkObj.description;
        this.id = parkObj.id;
        this.imgAlt = parkObj.imgAlt;
        this.imgCaption = parkObj.imgCaption;
        this.imgUrl = parkObj.imgUrl;
        this.isFavorite = ko.observable(false);
        this.latLng = parkObj.latLng;
        this.name = parkObj.name;
        this.parkType = parkObj.parkType;
        this.website = parkObj.website;
    }
}

/** Constructor for our Knockout ViewModel */
class ViewModel {
    public currentPark: KnockoutObservable<Park | undefined>;
    public hoveredPark: KnockoutObservable<Park | undefined>;
    public onlyShowFavorites: KnockoutObservable<string>;
    public parkMap?: ParkMapType;
    public parkTypeFilter: KnockoutObservable<string | undefined>;
    public parkTypes: KnockoutObservableArray<string>;
    public parks: KnockoutObservableArray<Park>;

    public favoriteParks = ko.pureComputed(() => {
        return this.parks().filter((park) => park.isFavorite());
    });

    public visibleParks = ko.pureComputed(() => {
        // The value of `onlyShowFavorites` is a string rather than real boolean
        // because it is set to the `value` attribute of an `<input>` element.
        let result = this.onlyShowFavorites() === 'true'
            ? this.favoriteParks()
            : this.parks();

        const parkType = this.parkTypeFilter();

        if (parkType) {
            result = result.filter((park) => park.parkType === parkType);
        }

        return result;
    });

    constructor() {
        this.parks = ko.observableArray();
        this.currentPark = ko.observable();
        this.hoveredPark = ko.observable();
        this.parkTypes = ko.observableArray();
        this.parkTypeFilter = ko.observable();
        this.onlyShowFavorites = ko.observable('false');

        // Fetch park data from the National Parks Service
        const parksPromise = getParksAsync().then((parks) => {
            // Create `Park` instances and save them in our model
            this.parks.push(...parks.map((park) => new Park(park, this)));

            // Calculate a sorted list of unique park types
            const parkTypes = this.parks()
                .map((park) => park.parkType)
                // Only keep the first occurrence of each park type
                .filter((parkType, idx, arr) => arr.indexOf(parkType) === idx)
                .sort();

            // Add the park types to our model
            this.parkTypes.push(...parkTypes);
        }).catch((error) => {
            console.log(error);
        });

        // Initialize the map and save our `ParkMap` instance in our model
        getMapConstructorAsync().then((ParkMap) => {
            this.parkMap = new ParkMap({
                /** Set the "hovered" park by its park ID */
                markerHoverCallback: (parkId?: string) => {
                    this.hoveredPark(this.getParkById(parkId));
                },
                parkSelectCallback: (parkId?: string) => {
                    this.currentPark(this.getParkById(parkId));
                }
            });

            // Display map markers once the park array is also initialized
            parksPromise.then(() => {
                this.parkMap!.initMarkers(this.visibleParks());

                // Update the map whenever the list of visible markers changes
                ko.computed(() => {
                    const parkIds = this.visibleParks().map((park) => park.id);
                    this.parkMap!.setVisibleMarkers(parkIds);
                });
            });
        }).catch((error) => {
            console.log(error);
        });
    }

    /** Retrieve an existing park */
    public getParkById(id?: string): Park | undefined {
        if (id === undefined) {
            return undefined;
        }

        const result = this.parks().find((park) => park.id === id);

        if (!result) {
            throw new Error(`Could not find a park with ID "${id}"`);
        }

        return result;
    }

    /* === Event handlers === */
    // These handlers are arrow functions so that `this` is always the ViewModel

    /**
     * Set the current park to `park` if it isn't already set that way. If it
     * *is* already the current park, unset the current park.
     */
    public selectPark = (park: Park) => {
        const newPark = this.currentPark() === park
            ? undefined // Unset if it's already the current park
            : park; // Otherwise, set it as the new one

        this.currentPark(newPark);

        // Only continue if the map has loaded
        if (!this.parkMap) {
            return;
        }

        // Update the map to reflect the status of the current park
        if (newPark) {
            this.parkMap.infoOpen(newPark.id);
        } else {
            this.parkMap.infoClose();
        }
    }

    /**
     * Enable the map to mirror the hover state of the handled DOM element.
     * This function expects to handle 'mouseover' and 'mouseout' events.
     */
    public toggleHover = (park: Park, event: MouseEvent) => {
        if (this.parkMap) {
            this.parkMap.setHoverState(park.id, event.type === 'mouseover');
        }
    }
}

// Initialize the ViewModel right away
const viewModel = new ViewModel();

// Wait for the DOM to load before applying the ViewModel to it
awaitDom.then(() => {
    ko.applyBindings(viewModel);
});
