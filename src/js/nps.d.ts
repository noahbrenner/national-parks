/**
 * Define the data structure returned from the National Park Service API.
 *
 * These definitions assume that the request was made to the `/parks` endpoint
 * and included a `fields` URL parameter specifying "addresses" and "images".
 */
declare namespace nps {
    interface response {
        data: park[];
        limit: number;
        start: number;
        total: number;
    }

    interface park {
        addresses: address[];
        description: string;
        designation: string;
        directionsInfo: string;
        directionsUrl: string;
        fullName: string;
        id: string;
        images: image[];
        latLong: string;
        name: string;
        parkCode: string;
        states: string;
        url: string;
        weatherInfo: string;
    }

    interface address {
        city: string;
        line1: string;
        line2: string;
        line3: string;
        postalCode: string;
        stateCode: string;
        type: 'Physical' | 'Mailing';
    }

    interface image {
        altText: string;
        caption: string;
        credit: string;
        id: number;
        title: string;
        url: string;
    }
}
