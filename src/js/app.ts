import * as ko from 'knockout';
import initMapAsync, {ParkMap} from './googlemaps';
import getParksAsync, {ParkData} from './nationalparks';

/** Represent an individual National Park */
class Park {
    public address: string;
    public description: string;
    public imgCaption?: string; // And/or credit, title
    public imgUrl?: string;
    public isFavorite: KnockoutObservable<boolean>;
    public latLng: google.maps.LatLngLiteral;
    public name: string;
    public parkType: string;
    public website: string;

    // private id: string;

    constructor(parkObj: ParkData) {
        this.address = parkObj.address;
        this.description = parkObj.description;
        this.imgCaption = parkObj.imgCaption;
        this.imgUrl = parkObj.imgUrl;
        this.isFavorite = ko.observable(parkObj.id === 'a');
        this.latLng = parkObj.latLng;
        this.name = parkObj.name;
        this.parkType = parkObj.parkType;
        this.website = parkObj.website;

        // this.id = parkObj.id;
    }
}

/** Constructor for our Knockout ViewModel */
class ViewModel {
    public parks: KnockoutObservableArray<Park>;
    public parkMap?: ParkMap;
    public parkTypes: KnockoutObservableArray<string>;

    constructor() {
        this.parks = ko.observableArray();
        this.parkTypes = ko.observableArray();

        // Fetch park data from the National Parks Service
        getParksAsync().then((parks) => {
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
        initMapAsync().then((parkMap) => {
            this.parkMap = parkMap;
        }).catch((error) => {
            console.log(error);
        });
    }
}

ko.applyBindings(new ViewModel());
