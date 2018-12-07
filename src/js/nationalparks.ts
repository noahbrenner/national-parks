// Import type definitions for the National Park Service API
// Parcel errors out if this is `import`ed, so we're using triple-slash syntax
// tslint:disable-next-line:no-reference
/// <reference path="./nps.d.ts" />

import axios from 'axios';
// Needed in order to reference environment variables during build process:
// https://github.com/parcel-bundler/parcel/issues/305#issuecomment-352241629
import * as process from 'process';

/* === Interfaces === */

export interface ParkData {
    id: string;
    address?: ParkAddress;
    description: string;
    imgAlt?: string;
    imgCaption?: string;
    imgUrl?: string;
    latLng: google.maps.LatLngLiteral;
    name: string;
    parkType: string;
    website: string;
}

export interface ParkAddress {
    street: string;
    cityState: string;
}

/* === Helper functions === */

// This RegEx is defined at the module level so it isn't compiled more than once
const parkLatLongRegex = /^lat:([\d.-]+), long:([\d.-]+)$/;

/** Create a LatLng out of a string having the form: "lat:0.00, long:0.00" */
function getLatLng(parkLatLong: string): google.maps.LatLngLiteral {
    const coordinates = parkLatLongRegex.exec(parkLatLong);

    if (coordinates === null) {
        /*
         * Some parks returned by the NPS have an empty string as their latLong
         * value (which must not be passed to this function). If we fail to
         * parse a *non*-empty string, however, the formatting of this data
         * must have changed. Since we can't reasonably handle such a change
         * dynamically, we'll simply throw an error.
         */
        throw new Error('Could not parse latLong string received from NPS.');
    }

    const lat = Number(coordinates[1]);
    const lng = Number(coordinates[2]);

    if (isNaN(lat) || isNaN(lng)) {
        // If these values can't be parsed as numbers, their formatting has
        // probably changed, so we'll throw an error (see comment above).
        throw new Error('Could not parse coordinates received from NPS.');
    }

    return {lat, lng};
}

/** Create a `ParkAddress` object */
function getAddress(address?: nps.address): ParkAddress | undefined {
    if (address) {
        const {line1, line2, city, stateCode, postalCode} = address;

        // Combine `line1` and `line2` if `line2` isn't an empty string
        const street = line2 ? `${line1}, ${line2}` : line1;
        const cityState = `${city}, ${stateCode} ${postalCode}`;

        return {street, cityState};
    }

    return undefined;
}

/** Create an array of ParkData objects from the NPS API response */
function extractParkData(parkAPIData: nps.response): ParkData[] {
    /*
     * Some parks span multiple states. We're only requesting parks that are in
     * Oregon, but the provided coordinates and address may be far away. We
     * want to limit results to those that are at least adjacent to Oregon.
     */
    const nearbyStates = ['CA', 'ID', 'NV', 'OR', 'WA'];

    return parkAPIData.data
        .filter((park) => {
            // Verify that the API returned a non-empty latLong string
            const hasCoordinates = park.latLong;

            // Verify that the address given is at least *near* Oregon
            const isNearby = (
                park.addresses[0]
                && nearbyStates.includes(park.addresses[0].stateCode)
            );

            return hasCoordinates && isNearby;
        })
        .map((park) => {
            // Extract the specific data we need
            const image: nps.image = park.images[0];
            return {
                address: getAddress(park.addresses[0]),
                description: park.description,
                id: park.parkCode,
                imgAlt: image && image.altText,
                imgCaption: image && image.caption,
                imgUrl: image && image.url,
                latLng: getLatLng(park.latLong),
                name: park.name,
                parkType: park.designation,
                website: park.url
            };
        });
}

/* === Primary export === */

/** Return a Promise which resolves with data from the NPS API */
export default function getParksAsync(): Promise<ParkData[]> {
    return axios.get('https://developer.nps.gov/api/v1/parks', {
        params: {
            // Parcel inserts this environment variable value at build time
            api_key: process.env.NATIONAL_PARKS_SERVICE_API_KEY,
            fields: 'addresses,images',
            stateCode: 'OR'
        },
        timeout: 5_000
    }).then((response) => extractParkData(response.data));
}
