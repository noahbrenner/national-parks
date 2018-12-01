import * as ko from 'knockout';
// Use an alias for `ParkMap` since we're only importing it for the type
// information. The real constructor is provided later from a resolved Promise.
// This avoids shadowing the variable name at that point.
import getMapConstructorAsync, {ParkMap as ParkMapType} from './googlemaps';
import getParksAsync, {ParkData} from './nationalparks';

/** Represent an individual National Park */
export class Park {
    public address: string;
    public description: string;
    public id: string;
    public imgCaption?: string; // And/or credit, title
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
        this.imgCaption = parkObj.imgCaption;
        this.imgUrl = parkObj.imgUrl;
        this.isFavorite = ko.observable(parkObj.id === 'a');
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
    public parkMap?: ParkMapType;
    public parkTypes: KnockoutObservableArray<string>;
    public parks: KnockoutObservableArray<Park>;

    constructor() {
        this.parks = ko.observableArray();
        this.currentPark = ko.observable();
        this.hoveredPark = ko.observable();
        this.parkTypes = ko.observableArray();

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
                    const hoveredPark = parkId
                        ? this.parks().find((park) => park.id === parkId)
                        : undefined;

                    this.hoveredPark(hoveredPark);
                }
            });

            // Display map markers once the park array is also initialized
            parksPromise.then(() => {
                this.parkMap!.initMarkers(this.parks());
            });
        }).catch((error) => {
            console.log(error);
        });
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

ko.applyBindings(new ViewModel());
