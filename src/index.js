const browserstack = require("browserstack-local");

const event = require("codeceptjs").event;
const recorder = require("codeceptjs").recorder;
const runHook = require("codeceptjs").hook;

const DEFAULT_CONFIG = {
  local: false
};

let _config = {};

const bsInitializer = new browserstack.Local();

module.exports = function(givenConfig) {
  _config = Object.assign(DEFAULT_CONFIG, givenConfig);
  
  recorder.startUnlessRunning();
  
  // not works
  // event emitter run all hooks, but not waits for promise resolving
  event.dispatcher.on(event.all.before, () => {
    recorder.add("Start BrowserStack connection.", startBrowserStackConnection, true);
  });
  event.dispatcher.on(event.all.after, () => {
    recorder.add("Close BrowserStack connection.", closeBrowserStackConnection);
  });
};

const startBrowserStackConnection = async () => {
  console.log("CONFIG", _config);
  if (typeof _config.key === "undefined") {
    console.log("Property 'key' is not defined in plugin config.");
    throw "Property 'key' is not defined in plugin config.";
  }

  const localIdentifier = `run_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;

  console.log(
    `Connecting to BrowserStack. Local identifier: "${localIdentifier}"`
  );

  function _start() {
    return new Promise((resolve, reject) => {
      bsInitializer.start(
        {
          forceLocal: _config.local,
          key: _config.key,
          localIdentifier: localIdentifier
        },
        error => {
          if (error) {
            console.log(error);
            reject(error);
          }
          console.log("Connected to BrowserStack.");
          resolve("Connected to BrowserStack.");
        }
      );
    });
  }

  try {
    const res = await _start();
    console.log("CONNECTION ESTABLISHED", res);
    return res;
  } catch (error) {
    console.log("ERROR IN CONNECTION", error);
    throw error;
  }
};

const closeBrowserStackConnection = done => {
  if (typeof _config.key === "undefined") {
    console.log("Property 'key' is not defined in plugin config.");
    throw "Property 'key' is not defined in plugin config.";
  }

  function _stop() {
    return new Promise((resolve, reject) => {
      bsInitializer.stop(error => {
        if (error) {
          console.log(error);
          reject(error);
        }
        console.log("Disconnected.");
        resolve("Disconnected");
      });
    });
  }

  _stop()
    .then(res => console.log("CONNECTION ClOSED", res))
    .catch(err => console.log("ERROR IN CONNECTION CLOSE", err));
};
