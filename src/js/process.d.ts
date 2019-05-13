/**
 * Define types for node's `process.env`.
 *
 * Accessing environment variables is our only use of the node standard library.
 * Because `@types/node` is a large dependency for something so simple, we're
 * just defining necessary types here.
 *
 * This type of solution was recommended here:
 * https://github.com/parcel-bundler/parcel/issues/305#issuecomment-416028516
 */
declare module 'process' {
    export const env: {
        NATIONAL_PARK_SERVICE_API_KEY: string
    };
}
