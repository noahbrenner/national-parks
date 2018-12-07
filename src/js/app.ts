import * as ko from 'knockout';
// Use an alias for `ParkMap` since we're only importing it for the type
// information. The real constructor is provided later from a resolved Promise.
// This avoids shadowing the variable name at that point.
import {awaitDom} from './await';
import getMapConstructorAsync, {ParkMap as ParkMapType} from './googlemaps';
import getParksAsync, {ParkAddress, ParkData} from './nationalparks';

/** Represent an individual National Park */
export class Park implements ParkData {
    /*
     * The TypeScript compiler isn't understanding that `Object.assign` in the
     * constructor means that all required properties are definitely assigned.
     * As a workaround, we're asserting that all required properties coming from
     * `parkObj` are definitely assigned by putting a `!` after each one here:
     */
    public address?: ParkAddress;
    public description!: string;
    public id!: string;
    public imgAlt?: string;
    public imgCaption?: string;
    public imgUrl?: string;
    public isFavorite!: KnockoutObservable<boolean>;
    public latLng!: google.maps.LatLngLiteral;
    public name!: string;
    public parent: ViewModel;
    public parkType!: string;
    public website!: string;

    public isCurrentPark = ko.pureComputed(() => {
        return this.parent.currentPark() === this;
    });

    public isHovered = ko.pureComputed(() => {
        return this.parent.hoveredPark() === this;
    });

    constructor(parkObj: ParkData, favorites: string[], parent: ViewModel) {
        Object.assign(this, parkObj);
        this.isFavorite = ko.observable(favorites.includes(parkObj.id));
        this.parent = parent;
    }
}

/** Constructor for our Knockout ViewModel */
class ViewModel {
    public currentPark: KnockoutObservable<Park | undefined>;
    public errorMessage: KnockoutObservable<string | undefined>;
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
        this.errorMessage = ko.observable();

        // Fetch park data from the National Parks Service
        const parksPromise = getParksAsync().then((parks) => {
            const favorites = this.dataLoad();

            // Create `Park` instances and save them in our model
            this.parks
                .push(...parks.map((park) => new Park(park, favorites, this)));

            // Calculate a sorted list of unique park types
            const parkTypes = this.parks()
                .map((park) => park.parkType)
                // Only keep the first occurrence of each park type
                .filter((parkType, idx, arr) => arr.indexOf(parkType) === idx)
                .sort();

            // Add the park types to our model
            this.parkTypes.push(...parkTypes);

            // Any time favorites change, save them to persistent storage.
            // This is done *after* initializing parks to avoid redundant saves
            // at load time (in case some parks are already set as favorites).
            this.favoriteParks.subscribe(() => {
                this.dataSave();
            });
        }).catch((error) => {
            this.errorMessage(error.message);
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
            this.errorMessage(error.message);
        });
    }

    /** Return the list of favorite parks saved in `localStorage` */
    public dataLoad(): string[] {
        if ('localStorage' in window) {
            const jsonData = localStorage.getItem('favorites');

            if (jsonData) {
                let favoriteIds;

                try {
                    favoriteIds = JSON.parse(jsonData);
                } catch {
                    // The JSON was invalid, so try setting it from scratch
                    this.dataSave();
                }

                // Verify that the data has the structure we expect
                if (
                    favoriteIds instanceof Array
                    && favoriteIds.every((id) => typeof id === 'string')
                ) {
                    return favoriteIds;
                }
            }
        }

        return [];
    }

    /** Save the list of favorite parks to `localStorage` */
    public dataSave() {
        if ('localStorage' in window) {
            const favoriteIds = this.favoriteParks().map((park) => park.id);
            const jsonData = JSON.stringify(favoriteIds);

            try {
                localStorage.setItem('favorites', jsonData);
            } catch {
                // Storage has run out (may be set to `0`)
                // Silently fail (gracefully degrade this feature)
            }
        }
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

    /** Fit visible markers inside the map; no-op before map is initialized */
    public resetMapZoom = () => {
        if (this.parkMap) {
            this.parkMap.zoomToVisibleMarkers();
        }
    }

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
