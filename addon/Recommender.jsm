  /* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Storage", "resource://focused-cfr-shield-study/Storage.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Doorhanger", "resource://focused-cfr-shield-study/Doorhanger.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "NotificationBar", "resource://focused-cfr-shield-study/NotificationBar.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Preferences", "resource://gre/modules/Preferences.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Bookmarks", "resource://gre/modules/Bookmarks.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "RecentWindow", "resource:///modules/RecentWindow.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "AddonManager", "resource://gre/modules/AddonManager.jsm");

const bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                      .getService(Components.interfaces.nsINavBookmarksService);

let notificationBar;
let doorhanger;
let pocketPrefCheck;
let mobilePrefCheck;
let progressListener;

const AMAZON_AFFILIATIONS = [
  "www.amazon.com",
  "www.amazon.ca",
  "www.amazon.co.uk",
  "www.audible.com",
  "www.audible.ca",
  "www.audible.co.uk",
];

const PAGE_VISIT_GAP_MINUTES = 15;
const NOTIFICATION_GAP_MINUTES = 24 * 60;
const MAX_NUMBER_OF_NOTIFICATIONS = 3;

const NOTIFICATION_GAP_PREF = "extensions.focused_cfr_study.notification_gap_minutes";
const MAX_NUMBER_OF_NOTIFICATIONS_PREF = "extensions.focused_cfr_study.max_number_of_notifications";
const INIT_PREF = "extensions.focused_cfr_study.initialized";
const POCKET_BOOKMARK_COUNT_PREF = "extensions.focused_cfr_study.pocket_bookmark_count_threshold";
const AMAZON_COUNT_PREF = "extensions.focused_cfr_study.amazon_count_threshold";
const PAGE_VISIT_GAP_PREF = "extensions.focused_cfr_study.page_visit_gap_minutes";
const DEBUG_MODE_PREF = "extensions.focused_cfr_study.debug_mode";
const POCKET_LATEST_SINCE_PREF = "extensions.pocket.settings.latestSince";
const MOBILE_PRESENTATION_DELAY_PREF = "extensions.focused_cfr_study.mobile_presentation_delay_minutes";
const QUEUED_PREF = "extensions.focused_cfr_study.queued";

const POCKET_BOOKMARK_COUNT_TRHESHOLD = 80;
const AMAZON_VISIT_THRESHOLD = 1;
const MOBILE_PRESENTATION_DELAY_MINS = 5;

const AMAZON_LINK = "www.amazon.com/gp/BIT/ref=bit_v2_BDFF1?tagbase=mozilla1";
const AMAZON_ADDON_ID = "abb@amazon.com";

this.EXPORTED_SYMBOLS = ["Recommender"];

const log = function(...args) {
  if (!Preferences.get(DEBUG_MODE_PREF)) return;
  console.log(...args);
};

let bookmarkObserver;
let currentId;
let windowListener;
let addonListener;

const recipes = {
  "amazon-assistant": {
    id: "amazon-assistant",
    message: {
      text: `Instant product matches while you shop across the web with Amazon Assistant`,
      link: {
        text: "Amazon Assistant",
        url: `${AMAZON_LINK}`,
      },
    },
    primaryButton: {
      label: `Add to Firefox`,
      url: `${AMAZON_LINK}`,
    },
    icon: {
      url: "resource://focused-cfr-shield-study-content/images/amazon-assistant.png",
      alt: "Amazon Assistant logo",
    },
    sponsored: true,
  },
  "mobile-promo": {
    id: "mobile-promo",
    message: {
      text: `Your Firefox account meets your phone. They fall in love. Get Firefox on your phone now.`,
      link: {},
    },
    primaryButton: {
      label: "Make a match",
      url: `https://www.mozilla.org/en-US/firefox/mobile-download/desktop/?src=cfr-v2`,
    },
    icon: {
      url: "resource://focused-cfr-shield-study-content/images/mobile-promo.png",
      alt: "Firefox Mobile logo",
    },
  },
  "pocket": {
    id: "pocket",
    message: {
      text: "Pocket lets you save for later articles, videos, or pretty much anything!",
      link: {
        text: "Pocket",
        url: "https://getpocket.com/firefox/?src=cfr-tooltip",
      },
    },
    primaryButton: {
      label: "Try it Now",
      url: "http://www.getpocket.com/firefox_tryitnow",
    },
    icon: {
      url: "resource://focused-cfr-shield-study-content/images/pocket.png",
      alt: "Pocket Logo",
    },
  },
};

function getMostRecentBrowserWindow() {
  return RecentWindow.getMostRecentBrowserWindow({
    private: false,
    allowPopups: false,
  });
}

class Recommender {
  constructor(telemetry, variation) {

    if (variation.sponsored === "false") {
      recipes["amazon-assistant"]["sponsored"] = false;
    }

    this.telemetry = telemetry;
    this.variation = variation.name;
    this.variationUi = variation.ui;
    this.variationAmazon = variation.amazon;
    this.variationSponsored = variation.sponsored;
  }

  test() {
    // setInterval(()=>console.log(`window document: `, getMostRecentBrowserWindow().document.hasFocus()), 3000);
    currentId = "amazon-assistant";
    // (new Doorhanger(recipes[currentId], this.presentationMessageListener.bind(this))).present();
    (new Doorhanger(recipes[currentId], this.presentationMessageListener.bind(this))).present();

    // setInterval(() => Utils.printStorage(), 10000);
  }

  async start() {
    const isFirstRun = !(await Storage.has("general"));
    if (isFirstRun)
      await this.firstRun();

    Utils.printStorage();

    await this.listenForMobilePromoTrigger();
    await this.listenForPageViews();
    await this.listenForPocketUse();
    await this.listenForBookmarks();
    await this.listenForAddonInstalls();

    await this.reportSummary();
  }

  async firstRun() {
    log("first run");

    await this.initRecommendations();
    await this.initLogs();

    await Storage.set("general", {
      started: true,
      lastNotification: (new Date(0)).getTime(),
    });

    log("setting prefs");

    Preferences.set(NOTIFICATION_GAP_PREF, NOTIFICATION_GAP_MINUTES);
    Preferences.set(MAX_NUMBER_OF_NOTIFICATIONS_PREF, MAX_NUMBER_OF_NOTIFICATIONS);
    Preferences.set(POCKET_BOOKMARK_COUNT_PREF, POCKET_BOOKMARK_COUNT_TRHESHOLD);
    if (this.variationAmazon === "high")
      Preferences.set(AMAZON_COUNT_PREF, AMAZON_VISIT_THRESHOLD);
    else
      Preferences.set(AMAZON_COUNT_PREF, AMAZON_VISIT_THRESHOLD * 3);
    Preferences.set(PAGE_VISIT_GAP_PREF, PAGE_VISIT_GAP_MINUTES);
    Preferences.set(DEBUG_MODE_PREF, false);
    Preferences.set(MOBILE_PRESENTATION_DELAY_PREF, MOBILE_PRESENTATION_DELAY_MINS);
    Preferences.set(QUEUED_PREF, 0);

    Preferences.set(INIT_PREF, true);

    this.checkForAmazonPreuse();
  }

  async reportSummary() {
    const logs = await Storage.get("logs");
    let data = {
      "message_type": "summary_log",
      "variation": this.variation,
      "variation_ui": this.variationUi,
      "variation_amazon": this.variationAmazon,
      "variation_sponsored": this.variationSponsored,
    };

    data = Object.assign({}, data, logs);
    log(`summary report`, data);
    this.telemetry(data);
  }

  async finalReport() {
    let data = {
      "message_type": "final_report",
      "variation": this.variation,
      "variation_ui": this.variationUi,
      "variation_amazon": this.variationAmazon,
      "variation_sponsored": this.variationSponsored,
    };

    const amazon = await Storage.get("recomms.amazon-assistant");
    const pocket = await Storage.get("recomms.pocket");
    const mobile = await Storage.get("recomms.mobile-promo");

    data = Object.assign({}, data, {
      "amazon_status": amazon.status,
      "amazon_show_count": String(amazon.presentation.count),
      "amazon_trigger_count": String(amazon.trigger.visitCount),
      "amazon_nevershow": String(amazon.presentation.never),
      "mobile-promo_status": mobile.status,
      "mobile-promo_show_count": String(mobile.presentation.count),
      "mobile-promo_nevershow": String(mobile.presentation.never),
      "pocket_status": pocket.status,
      "pocket_show_count": String(pocket.presentation.count),
      "pocket_nevershow": String(pocket.presentation.count),
    });
    log(`final report`, data);
    await this.telemetry(data);
  }

  async reportEvent(id, event) {
    const data = {
      "message_type": "event",
      "variation": this.variation,
      "variation_ui": this.variationUi,
      "variation_amazon": this.variationAmazon,
      "variation_sponsored": this.variationSponsored,
      "id": id,
      "event": event,
    };
    log(`event report:`, data);
    this.telemetry(data);
    this.finalReport();
  }

  async reportNotificationResult(result, nevershow) {
    const recomm = await Storage.get(`recomms.${currentId}`);

    const data = {
      "message_type": "notification_result",
      "variation": this.variation,
      "variation_ui": this.variationUi,
      "variation_amazon": this.variationAmazon,
      "variation_sponsored": this.variationSponsored,
      "count": String(recomm.presentation.count),
      "status": recomm.status,
      "id": currentId,
      "nevershow": String(!!nevershow),
      "result": result,
    };

    log("notification result: ", data);

    Utils.printStorage();
    this.telemetry(data);
  }

  async updateLog(attribute, value) {
    const obj = {};
    obj[attribute] = String(value);
    return Storage.update("logs", obj);
  }

  async updateLogWithId(id, attribute, value) {
    return this.updateLog(`${id}_${attribute}`, value);
  }

  async initLogs() {
    const logs = {
      "amazon_delivered": "false",
      "amazon_action": "false",
      "amazon_close": "false",
      "amazon_dismiss": "false",
      "amazon_nevershow": "false",
      "amazon_timeout": "false",
      "amazon_preused": "false",
      "amazon_postused": "false",
      "mobile-promo_delivered": "false",
      "mobile-promo_action": "false",
      "mobile-promo_close": "false",
      "mobile-promo_dismiss": "false",
      "mobile-promo_nevershow": "false",
      "mobile-promo_timeout": "false",
      "mobile-promo-preused": "false",
      "mobile-promo-postued": "false",
      "pocket_delivered": "false",
      "pocket_action": "false",
      "pocket_close": "false",
      "pocket_dismiss": "false",
      "pocket_nevershow": "false",
      "pocket_timeout": "false",
      "pocket_preused": "false",
      "pocket_postused": "false",
    };

    await Storage.set("logs", logs);
  }

  async initRecommendations() {
    const mobilePromo = {
      id: "mobile-promo",
      status: "waiting",
      presentation: {
        count: 0,
        never: false,
      },
    };

    const amazonAssistant = {
      id: "amazon-assistant",
      status: "waiting",
      presentation: {
        count: 0,
        never: false,
      },
      trigger: {
        visitCount: 0,
        lastVisit: (new Date(0)).getTime(),
      },
    };

    const pocket = {
      id: "pocket",
      status: "waiting",
      presentation: {
        count: 0,
        never: false,
      },
    };

    const recomms = {ids: ["mobile-promo", "amazon-assistant", "pocket"]};
    await Storage.set("recomms", recomms);
    await Storage.set("recomms.mobile-promo", mobilePromo);
    await Storage.set("recomms.amazon-assistant", amazonAssistant);
    await Storage.set("recomms.pocket", pocket);
  }

  async checkForAmazonPreuse() {
    const addon = await AddonManager.getAddonByID(AMAZON_ADDON_ID);

    if (!addon) {
      log(`no Amazon preuse`);
      return;
    }

    // preuse
    const recomm = await Storage.get("recomms.amazon-assistant");
    recomm.status = "preused";
    log("amazon preused");
    this.reportEvent("amazon-assistant", "preused");
    await Storage.update("recomms.amazon-assistant", recomm);
  }

  listenForAddonInstalls() {
    const that = this;

    addonListener = {
      async onInstalled(addon) {
        if (addon.id === AMAZON_ADDON_ID) {
          log("Amazon addon installed");

          that.reportEvent("amazon-assistant", "addon_install");

          const recomm = await Storage.get("recomms.amazon-assistant");

          if (recomm.status === "preused" || recomm.status === "postused") return;

          if (recomm.status === "waiting" || recomm.status === "queued") {
            recomm.status = "preused";
            log("amazon preused");
            that.reportEvent("amazon-assistant", "preused");
            that.updateLogWithId("amazon-assistant", "preused", "true");
          } else {
            recomm.status = "postused";
            log("amazon postused");
            that.reportEvent("amazon-assistant", "postused");
            that.updateLogWithId("amazon-assistant", "postused", "true");
          }

          await Storage.update("recomms.amazon-assistant", recomm);
        }
      },
    };

    AddonManager.addAddonListener(addonListener);
  }

  async listenForPocketUse() {

    const that = this;

    async function checkPrefs() {
      const latestSince = Preferences.get(POCKET_LATEST_SINCE_PREF);

      if (latestSince) {
        const recomm = await Storage.get("recomms.pocket");

        if (recomm.status === "preused" || recomm.status === "postused") return;

        if (recomm.status === "waiting" || recomm.status === "queued") {
          recomm.status = "preused";
          log("pocket preused");
          that.reportEvent("pocket", "preused");
          that.updateLogWithId("pocket", "preused", "true");
        } else {
          recomm.status = "postused";
          log("pocket postused");
          that.reportEvent("pocket", "postused");
          that.updateLogWithId("pocket", "postused", "true");
        }

        await Storage.update("recomms.pocket", recomm);
      }
    }

    pocketPrefCheck = checkPrefs;

    Preferences.observe(POCKET_LATEST_SINCE_PREF, checkPrefs);

    await checkPrefs();
  }

  async checkForAmazonVisit(hostname) {
    if (!AMAZON_AFFILIATIONS.includes(hostname)) return;

    const data = await Storage.get("recomms.amazon-assistant");

    if (Date.now() - data.trigger.lastVisit < (Preferences.get(PAGE_VISIT_GAP_PREF) || PAGE_VISIT_GAP_MINUTES) * 60 * 1000) {
      log(`not counted as a new amazon visit, last visit: ${(Date.now() - data.trigger.lastVisit) / (1000)} seconds ago`);
      return;
    }

    log("amazon assistant visit");

    data.trigger.lastVisit = Date.now();
    data.trigger.visitCount += 1;

    log(`visit count: ${data.trigger.visitCount}`);

    await Storage.update("recomms.amazon-assistant", data);

    if (data.trigger.visitCount >= (Preferences.get(AMAZON_COUNT_PREF) || AMAZON_VISIT_THRESHOLD)) {
      await this.queueRecommendation("amazon-assistant");
    }

    await this.presentRecommendation("amazon-assistant");
  }

  async listenForBookmarks() {

    const that = this;
    async function checkThreshold() {
      const bookmarkCount = (await Bookmarks.getRecent(200)).length;
      that.reportEvent("bookmark-count", `${bookmarkCount}`);
      log(`bookmark count: ${bookmarkCount}`);
      const threshold = Preferences.get(POCKET_BOOKMARK_COUNT_PREF) || POCKET_BOOKMARK_COUNT_TRHESHOLD;
      if (bookmarkCount > threshold) {
        await that.queueRecommendation("pocket");
      }
    }

    bookmarkObserver = {
      async onItemAdded(aItemId, aParentId, aIndex, aItemType, aURI, aTitle,
                    aDateAdded, aGuid, aParentGuid) {
        log("bookmark added");

        await checkThreshold().then(() => that.presentRecommendation("pocket"));
      },
      onItemRemoved() {},

      QueryInterface: XPCOMUtils.generateQI(Ci.nsINavBookmarkObserver),

      onBeginUpdateBatch() {},
      onEndUpdateBatch() {},
      onItemChanged() {},
      onItemVisited() {},
      onItemMoved() {},
    };

    bmsvc.addObserver(bookmarkObserver, false);

    await checkThreshold();
  }

  listenForPageViews() {

    const that = this;

    progressListener = {
      QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
        "nsISupportsWeakReference"]),

      onStateChange(aWebProgress, aRequest, aFlag, aStatus) {
      },

      onLocationChange(aProgress, aRequest, aURI) {
        // This fires when the location bar changes; that is load event is confirmed
        // or when the user switches tabs. If you use myListener for more than one tab/window,
        // use aProgress.DOMWindow to obtain the tab/window which triggered the change.
        log("location change");
        let hostname;

        try {
          hostname = aURI.host;
        } catch (e) {
          return;
        }

        that.checkForAmazonVisit(hostname);
      },

      // For definitions of the remaining functions see related documentation
      onProgressChange(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
      onStatusChange(aWebProgress, aRequest, aStatus, aMessage) {},
      onSecurityChange(aWebProgress, aRequest, aState) {},
    };

    // current windows
    const windowEnumerator = Services.wm.getEnumerator("navigator:browser");

    while (windowEnumerator.hasMoreElements()) {
      const window = windowEnumerator.getNext();

      const onOpenWindow = function(e) {
        window.gBrowser.addProgressListener(progressListener);
        window.removeEventListener("load", onOpenWindow);
      };

      if (window.gBrowser) {
        window.gBrowser.addProgressListener(progressListener);
      } else {
        window.addEventListener("load", onOpenWindow, true);
      }
    }

    // new windows
    windowListener = {
      onWindowTitleChange() { },
      onOpenWindow(xulWindow) {
        // xulWindow is of type nsIXULWindow, we want an nsIDOMWindow
        // see https://dxr.mozilla.org/mozilla-central/rev/53477d584130945864c4491632f88da437353356/browser/base/content/test/general/browser_fullscreen-window-open.js#316
        // for how to change XUL into DOM

        const domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIDOMWindow);

        // we need to use a listener function so that it's injected
        // once the window is loaded / ready
        const onWindowOpen = () => {
          log("window opened");

          domWindow.removeEventListener("load", onWindowOpen);

          if (domWindow.document.documentElement.getAttribute("windowtype") !== "navigator:browser") return;

          // add progress listener
          domWindow.gBrowser.addProgressListener(progressListener);
        };

        domWindow.addEventListener("load", onWindowOpen, true);
      },
      onCloseWindow() { },
    };
    Services.wm.addListener(windowListener);
  }

  async listenForMobilePromoTrigger() {

    const that = this;

    async function checkPrefs() {

      log(`checking prefs for mobile promo`);

      const desktopClients = Preferences.get("services.sync.clients.devices.desktop", 0);
      const mobileClients = Preferences.get("services.sync.clients.devices.mobile", 0);

      log(`desktop clients: ${desktopClients}`);
      log(`mobile clients: ${mobileClients}`);

      if (mobileClients > 0) {

        // check for preuse or postuse

        const recomm = await Storage.get("recomms.mobile-promo");

        if (recomm.status === "preused" || recomm.status === "postused") return;

        if (recomm.status === "waiting" || recomm.status === "queued") {
          recomm.status = "preused";
          log("mobile promo preused");
          that.reportEvent("mobile-promo", "preused");
          that.updateLogWithId("mobile-promo", "preused", "true");
        } else {
          recomm.status = "postused";
          log("mobile promo postused");
          that.reportEvent("mobile-promo", "postused");
          that.updateLogWithId("mobile-promo", "postused", "true");
        }

        await Storage.update("recomms.mobile-promo", recomm);
      }

      if (desktopClients > 0 && mobileClients === 0)
        await that.queueRecommendation("mobile-promo");
    }

    mobilePrefCheck = checkPrefs;

    Preferences.observe("services.sync.clients.devices.mobile", checkPrefs);

    setTimeout(() => {
      if (getMostRecentBrowserWindow().document.hasFocus())
        that.presentRecommendation("mobile-promo");
    }, (Preferences.get(MOBILE_PRESENTATION_DELAY_PREF) || MOBILE_PRESENTATION_DELAY_MINS) * 60 * 1000);

    return checkPrefs();
  }

  async action(id) {
    await Storage.update(`recomms.${id}`, {status: `action`});
    log(`${id} status changed to action`);
    this.reportEvent(id, "action");
  }

  async queueRecommendation(id) {
    log(`trying to queue recommendation ${id}`);

    const recomm = await Storage.get(`recomms.${id}`);
    if (recomm.status !== "waiting") return;

    log(`queueing recommendation ${id}`);
    recomm.status = "queued";

    await Storage.update(`recomms.${id}`, recomm);
    Preferences.set(QUEUED_PREF, Preferences.get(QUEUED_PREF) + 1);

    this.reportEvent(id, "queued");
  }

  async presentRecommendation(id) {

    log(`trying to present recommendation ${id}`);

    const recomm = await Storage.get(`recomms.${id}`);
    const general = await Storage.get("general");

    log(recomm);

    if (recomm.status === "waiting" || recomm.status === "action" || recomm.status === "preused" || recomm.status === "postused") return;
    if (recomm.presentation.count >= (Preferences.get(MAX_NUMBER_OF_NOTIFICATIONS_PREF) || MAX_NUMBER_OF_NOTIFICATIONS)) {
      log(`max number of notifications delivered for ${id}`);
      return;
    }
    if (Date.now() - general.lastNotification < (Preferences.get(NOTIFICATION_GAP_PREF) || NOTIFICATION_GAP_MINUTES) * 60 * 1000) {
      log(`notification gap not enough for delivery`);
      return;
    }
    if (recomm.presentation.never) {
      log(`user has disabled further notification delivery for ${id}`);
      return;
    }
    if (this.variation === "control") return;

    log(`presenting recommendation ${id}`);

    // present
    const recommRecipe = recipes[id];
    currentId = id;

    if (this.variationUi === "doorhanger") {
      doorhanger = new Doorhanger(recommRecipe, this.presentationMessageListener.bind(this));
      doorhanger.present();
    }

    if (this.variationUi === "bar") {
      notificationBar = new NotificationBar(recommRecipe, this.presentationMessageListener.bind(this));
      notificationBar.present();
    }

    recomm.status = "presented";
    recomm.presentation.count += 1;

    await Storage.update("general", {lastNotification: Date.now()});

    await this.updateLogWithId(id, "delivered", "true");

    await Storage.update(`recomms.${id}`, recomm);

    this.reportEvent(id, "presented");
    this.reportSummary();
  }

  async neverShow(id) {
    const recomm = await Storage.get(`recomms.${id}`);
    recomm.presentation.never = true;
    await Storage.update(`recomms.${id}`, recomm);
    this.reportEvent(id, "nevershow");
  }

  async presentationMessageListener(message) {
    log("message received from presentation");

    switch (message.name) {
      case "FocusedCFR::openUrl":
        getMostRecentBrowserWindow().gBrowser.loadOneTab(message.data, {
          inBackground: false,
        });
        break;
      case "FocusedCFR::dismiss":
        await this.updateLogWithId(currentId, "dismiss", "true");
        if (message.data === true) {
          await this.updateLogWithId(currentId, "nevershow", "true");
          await this.neverShow(currentId);
        }
        await this.reportSummary();
        await this.reportNotificationResult("dismiss", message.data);
        break;

      case "FocusedCFR::timeout":
        await this.updateLogWithId(currentId, "timeout", "true");
        if (message.data === true) {
          await this.updateLogWithId(currentId, "nevershow", "true");
          await this.neverShow(currentId);
        }
        await this.reportSummary();
        await this.reportNotificationResult("timeout", message.data);
        break;


      case "FocusedCFR::action":
        await this.updateLogWithId(currentId, "action", "true");
        await this.action(currentId);
        await this.reportSummary();
        await this.reportNotificationResult("action");
        break;

      case "FocusedCFR::close":
        await this.updateLogWithId(currentId, "close", "true");
        if (message.data === true) {
          await this.updateLogWithId(currentId, "nevershow", "true");
          await this.neverShow(currentId);
        }
        await this.reportSummary();
        await this.reportNotificationResult("close", message.data);
        break;
    }
  }

  shutdown() {

    log("shutting down Recommender.jsm");

    bmsvc.removeObserver(bookmarkObserver);

    const windowEnumerator = Services.wm.getEnumerator("navigator:browser");

    while (windowEnumerator.hasMoreElements()) {
      const window = windowEnumerator.getNext();
      window.gBrowser.removeProgressListener(progressListener);
    }

    Preferences.ignore("services.sync.clients.devices.mobile", mobilePrefCheck);
    Preferences.ignore(POCKET_LATEST_SINCE_PREF, pocketPrefCheck);

    if (doorhanger) {
      doorhanger.shutdown();
    }
    if (notificationBar) {
      notificationBar.shutdown();
    }
    if (windowListener) {
      Services.wm.removeListener(windowListener);
    }
    if (addonListener) {
      AddonManager.removeAddonListener(addonListener);
    }

    Cu.unload("resource://focused-cfr-shield-study/Doorhanger.jsm");
    Cu.unload("resource://focused-cfr-shield-study/NotificationBar.jsm");
    Cu.unload("resource://focused-cfr-shield-study/Storage.jsm");
  }
}

const Utils = {
  async printStorage() {
    return Storage.getAll().then((...args) => { log("Storage contents: ", ...args); });
  },
};
