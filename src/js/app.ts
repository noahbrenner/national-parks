import * as ko from 'knockout';
import getMapConstructorAsync, {ParkMap} from './googlemaps';
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

    constructor(parkObj: ParkData) {
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
    public parkMap?: ParkMap;
    public parkTypes: KnockoutObservableArray<string>;
    public parks: KnockoutObservableArray<Park>;

    constructor() {
        this.parks = ko.observableArray();
        this.currentPark = ko.observable();
        this.parkTypes = ko.observableArray();

        // Fetch park data from the National Parks Service
        const parksPromise = getParksAsync().then((parks) => {
            // Create `Park` instances and save them in our model
            this.parks.push(...parks.map((park) => new Park(park)));

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
            this.parkMap = new ParkMap();

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
        if (this.currentPark() === park) {
            this.currentPark(undefined);
        } else {
            this.currentPark(park);
        }
    }

    /**
     * Enable the map to mirror the hover state of the handled DOM element.
     * This function expects to handle 'mouseover' and 'mouseout' events.
     */
    public toggleHover = (park: Park, event: MouseEvent) => {
        if (this.parkMap) {
            this.parkMap.setHoverStateById(park.id, event.type === 'mouseover');
        }
    }
}

ko.applyBindings(new ViewModel());
