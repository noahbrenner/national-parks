import {Promise} from 'es6-promise';

export interface ParkData {
    id: string;
    address: string;
    description: string;
    imgCaption?: string; // And/or credit, title
    imgUrl?: string;
    // latLng?: google.maps.LatLng;
    name: string;
    parkType: string;
    website: string;
}

/* tslint:disable:object-literal-sort-keys */
const parks: ParkData[] = [{
    id: 'a',
    name: 'Park One',
    parkType: 'National Park',
    imgUrl: 'https://httpbin.org/image/jpeg',
    imgCaption: 'A picture of something',
    website: 'https://www.example.net',
    description: 'Park One has stuff at it.',
    address: '123 Sessame St.'
}, {
    id: 'b',
    name: 'Park Name Two',
    parkType: 'Campground',
    // imgUrl: '',
    // imgCaption: '',
    website: 'https://www.example.org',
    description: 'When you visit Park Name Two, you will see things.',
    address: '42 Question Univ.'
}];

export default function getParksAsync() {
    return Promise.resolve(parks);
}
