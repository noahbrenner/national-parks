Oregon National Parks Map (web app)
===================================

Check out this app running live: https://noahbrenner.github.io/national-parks/

A front end web app which provides information on National Parks in Oregon using data from the [National Parks Service][]. Built using [Knockout.js][] and the [Google Maps API][].

Building the app
----------------

### Install dependencies

* You'll first need to install [Node.js][], if you haven't done so already.
* Clone this repo: `$ git clone https://github.com/noahbrenner/national-parks.git`
* Install dependencies using [npm][] (which comes with Node).

  ```bash
  $ cd path/to/local/repo

  # Use the exact dependency tree specified in package-lock.json
  $ npm ci

  # Alternatively, you can install from the version ranges in package.json (for development)
  $ npm install
  ```

### Configure API keys

Before you can build the app, you'll need to provide 2 API keys. You could set them in environment variables at build time, but the easiest way is to save them in a file named `.env` in the project root; it will be read as part of the build process. This file is listed in `.gitignore` so it won't be accidentally committed.

Below is the format of what you'll need to enter in the `.env` file. [See the next section](#api-keys) for how to get your API keys.

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NATIONAL_PARKS_SERVICE_API_KEY=your_nps_api_key
```

#### API keys

API keys can be acquired and used for free, assuming you don't have enormous traffic where you're hosting the app.

##### Google

To get an API key for Google Maps, first register a web application at <https://console.developers.google.com/>. Once you've registered your application:

* Make sure your new application name is shown near the top left of the page. If another of your Google-registered apps is shown there instead, select the correct app by first clicking on the currently-shown application name.
* Go to the "Credentials" section, if you're not already there.
* Click the blue "Create credentials" button and select "API key".
* Since this API key will be used on the front end, it's best to restrict its access to only those services that are needed for the app. You can do this by editing the API key settings and selecting/entering:
    - **Application restrictions:** "HTTP referrers (web sites)"
    - **Accept requests from these HTTP referrers (web sites):** *The app URL, e.g. http://localhost:3000*
    - **API restrictions:** "Maps JavaScript API"
        - If the Maps API isn't present in the drop-down menu, you'll need to enable that API from this page first: https://console.developers.google.com/apis/library

##### National Parks Service

You can get an API key from the National Parks Service by filling out the very short form at <https://www.nps.gov/subjects/developer/get-started.htm>.

### Build it!

* Build the app and start up a development server.

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
* `devbuild` — Build the app in development mode after running the `clean` task (dev mode builds are not minified and include source maps).
* `start` — Build the app in development mode and serve it locally on port 3000. Reload on HTML changes. Inject CSS changes without reloading (the same is done for JavaScript changes, but a manual reload is usually necessary in this case because Knockout bindings can't be applied more than once).
* `build` — Build the app in production mode after running the `clean` and `lint` tasks. Code is minified and tree-shaken.

### Languages/tools/libraries used (that weren't mentioned already)

* TypeScript (⇒ JavaScript)
* Sass (SCSS) (⇒ CSS)
* Pug (⇒ HTML)
* Parcel (bundler)
* TSLint (TypeScript linter)
* Axios (AJAX library)
* Polyfill.io (polyfill service)
* Sanitize.css (style normalizer)
* Material Design Icons (simple, clear icons)

[Google Maps API]: https://developers.google.com/maps/documentation/javascript/
[Knockout.js]: https://knockoutjs.com/
[National Parks Service]: https://www.nps.gov/subjects/developer/api-documentation.htm
[Node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
