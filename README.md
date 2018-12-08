Oregon National Parks Map (web app)
===================================

A front end web app which provides information on National Parks in Oregon using data from the [National Parks Service][]. Built using [Knockout.js][] and the [Google Maps API][].

Building the app
----------------

### Install dependencies

* You'll first need to install [Node.js][], if you haven't done so already.
* Clone this repo: `$ git clone https://github.com/noahbrenner/national-parks.git`
* Install dependencies using [npm][] (which comes with Node)

  ```bash
  $ cd path/to/local/repo

  # Use the exact dependency tree specified in package-lock.json
  $ npm ci

  # Alternatively, you can install from the version ranges in package.json (for development)
  $ npm install
  ```

### Build it!

* Build the app and start up a development server

  ```bash
  $ npm start
  ```

* Open up http://localhost:3000/ in your favorite browser!

Development details
-------------------

### Browser support

Internet Explorer 9 and older are ***not*** supported. They aren't supported by Google Maps, which is the core feature of this app.

See: https://developers.google.com/maps/documentation/javascript/browsersupport

### `npm` scripts

Run any of these as `$ npm run _____`:

* `clean` — Delete the contents of the `dist/` directory.
* `lint` — Check typings and lint TypeScript files.
* `typewatch` — Check TypeScript typings and continue to run that check every time a `*.ts` file is modified.
* `devbuild` — Build the app in development mode after running the `clean` task.
* `start` — Build the app in development mode and serve it locally on port 3000. Reload on HTML changes. Inject CSS changes without reloading (the same is done for JavaScript changes, but a manual reload is usually necessary in this case because Knockout bindings can't be applied more than once).
* `build` — Build the app in production mode after running the `clean` task. Code is minified and tree-shaken.

### Using your own API keys (optional)

The Google API key used here will only work on `localhost:3000`, so if you want to run on a different port or host, you'll need your own. You can get one by starting here: https://console.developers.google.com/

The National Parks Service API has a rate limit, so you might consider getting your own API key, which you can do here: https://www.nps.gov/subjects/developer/get-started.htm

When building the app, you can specify either or both of these API keys using environment variables (or by editing the `.env` file). The relevant environment variables are:

* `GOOGLE_MAPS_API_KEY`
* `NATIONAL_PARKS_SERVICE_API_KEY`

Example: `$ GOOGLE_MAPS_API_KEY=yourveryspecialkey npm run build`

### Languages/tools/libraries used (that weren't mentioned already)

* TypeScript (⇒ JavaScript)
* Sass (SCSS) (⇒ CSS)
* Pug (⇒ HTML)
* Parcel (bundler)
* TSLint (TypeScript linter)
* Axios (AJAX library)
* Sanitize.css (style normalizer)
* Material Design Icons (simple, clear icons)

[Google Maps API]: https://developers.google.com/maps/documentation/javascript/
[Knockout.js]: https://knockoutjs.com/
[National Parks Service]: https://www.nps.gov/subjects/developer/api-documentation.htm
[Node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
