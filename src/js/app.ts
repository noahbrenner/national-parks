import * as ko from 'knockout';
import initMapAsync from './googlemaps';
import stub from './stub';

const parkMap = initMapAsync();
parkMap.catch((error) => console.log(error));

class ViewModel {
    public parks: KnockoutObservableArray<string>;
    public parkTypes: KnockoutObservableArray<string>;

    constructor() {
        this.parks = ko.observableArray(stub.getParks());
        this.parkTypes = ko.observableArray(stub.getParkTypes());
    }
}

ko.applyBindings(new ViewModel());
