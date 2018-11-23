import ko from 'knockout';
import stub from './stub';

class ViewModel {
    public parks: ko.ObservableArray<string>;
    public parkTypes: ko.ObservableArray<string>;

    constructor() {
        this.parks = ko.observableArray(stub.getParks());
        this.parkTypes = ko.observableArray(stub.getParkTypes());
    }
}

ko.applyBindings(new ViewModel());
