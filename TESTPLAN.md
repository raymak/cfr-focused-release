# Test Plan for the Focused CFR Addon (in release)

## Manual / QA TEST Instructions

## Overall overview of what the addon 

We would like to build a Firefox system addon that has the capability of proactively recommending Firefox features based on user behavior. This study is a limited version of the system addon that focuses only on three features. By focusing on three features, we focus on exploring the effects of various UI treatments and timing parameters.

###Features
This study involves recommending three Firefox features:

* Amazon Assistant (extension)
* Pocket (system addon)
* Mobile Promotion

## TEST CONDITIONS
Do the tests in Windows and in Firefox release (version 56).

## Before starting the testing
Look at the 'Signed addon 1.0.3' attachment in the [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1412410). Download the attachment. This is the 'cfr-focused-release' addon.

Look at the '@qa-shield-study-helper-1.0.0-signed.xpi' attachment in [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1407757). Download the attachment. This is the 'shield-qa-helper' addon. 

### BEFORE EACH TEST: CREATE AND GO to a CLEAN (NEW) PROFILE

0.  (create profile:  https://developer.mozilla.org/en-US/Firefox/Multiple_profiles, or via some other method such as using about:profiles)

### To install the addon 
1.  In your Firefox profile
2.  `about:addons` > `extensions`
3.  Open the drop-down menu with the cog icon in the upper right corner
4.  `Install Add-on From File`

### Do these tests

## 1. UI APPEARANCE -- Amazon Assistant and Pocket (DOORHANGER)

1.  Setup

    - [CREATE STRING PREFRENCE][create-preference]
    
        name: `extensions.focused_cfr_study.variation` 
        value: `{"name": "doorhanger-amazon-high", "weight": 1, "ui": "doorhanger", "amazon": "high", "sponsored": "false"}`
    
    - INSTALL ADDON:  cfr-focused-release
    
2.  ACTION: NAVIGATE to amazon.com
    
3.  VERIFY doorhanger panel

     1. A doorhanger opens attached from the awesome bar ![screenshot](https://i.imgur.com/D1cyiFW.png)
     2. Text is 'Instant product matches while you shop across the web with Amazon Assistant'
     3. Two buttons.  Labels 'Not Now' and 'Add to Firefox'

4.  ACTION: CLICK on 'Not Now'

5.  VERIFY doorhanger closes

6. [CHANGE INTEGER PREF][create-preference]

  name: `extensions.focused_cfr_study.pocket_bookmark_count_threshold`
  new value:  `1`
7. ACTION: BOOKMARK any webpage
8. VERIFY: no notifications are shown
9. [CHANGE INTEGER PREF][create-preference]

  name: `extensions.focused_cfr_study.notification_gap_minutes`
new value: `-1`
10. [CHANGE INTEGER PREF][create-preference]

  name: `extensions.focused_cfr_study.max_number_of_notifications`
new value: `2`

11. ACTION: BOOKMARK any webpage
12. VERIFY doorhanger panel

  1. A doorhanger opens attached from the Pocket icon ![screenshot](https://i.imgur.com/zZbMvQ0.png)
  2. Text is 'Pocket lets you save for later articles, videos, or pretty much anything!'
  3. Two buttons. Labels 'Not Now' and 'Try it Now'
13. ACTION: Click on 'Try it Now'
14. VERIFY: A new tab opens with url: 'https://getpocket.com/a/queue/'
15. ACTION: Shut down Firefox
16. ACTION: Open Firefox with the same profile created in step 1
17. ACTION: navigate to `amazon.com`
18. VERIFY: no notifications are shown
19. ACTION: bookmark any web page
20. VERIFY: no notifications are shown
21. [CHANGE INTEGER PREF][create-preference]

  name: `extensions.focused_cfr_study.page_visit_gap_minutes`
new value: `-1`
22. ACTION: NAVIGATE to `amazon.com`
23. VERIFY doorhanger panel

     1. A doorhanger opens attached from the awesome bar ![screenshot](https://i.imgur.com/D1cyiFW.png)
     2. Text is 'Instant product matches while you shop across the web with Amazon Assistant'
     3. Two buttons.  Labels 'Not Now' and 'Add to Firefox'
24. ACTION: CLICK on 'Not Now'
25. VERIFY: doorhanger closes
26. ACTION: NAVIGATE to 'amazon.com'
27. VERIFY: no notifications are shown


[create-preference]: http://kb.mozillazine.org/About:config

## 2. Telemetry -- Amazon Assistant (NOTIFICATION BAR)

1.  Setup

    - [CREATE STRING PREFRENCE][create-preference]
    
        name: `extensions.focused_cfr_study.variation` 
        value: `{"name": "bar-amazon-high", "weight": 1, "ui": "bar", "amazon": "high", "sponsored": "false"}`
    
    - INSTALL ADDON:  shield-qa-helper
    - INSTALL ADDON:  cfr-focused-release
    
2.  ACTION: NAVIGATE to amazon.com
    
3.  VERIFY notification bar

     1. A notification bar appears on top of the web page ![screenshot](https://i.imgur.com/wOeXCRK.png)
     2. Text is 'Instant product matches while you shop across the web with Amazon Assistant'
     3. Two buttons.  'Add to Firefox' and a 'x' button on the right corner.

4.  ACTION: CLICK on 'x'

5.  VERIFY notification bar closes
6.  Use the 'QA Shield Study' button on the toolbar to open the Shield QA helper
7. VERIFY you see the following log (everything except for the exact dates)

<pre>
// common fields

branch        bar-amazon-high        // should describe Question text
study_name    focused-cfr-release-2
addon_version 1.0.3
version       3

0 2017-10-30T16:54:02.555Z shield-study
{
  "study_state": "enter"
}


1 2017-10-30T16:54:02.561Z shield-study
{
  "study_state": "installed"
}


2 2017-10-30T16:54:02.610Z shield-study-addon
{
  "attributes": {
    "message_type": "event",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "id": "bookmark-count",
    "event": "5"
  }
}


3 2017-10-30T16:54:02.619Z shield-study-addon
{
  "attributes": {
    "message_type": "summary_log",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
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
    "pocket_postused": "false"
  }
}


4 2017-10-30T16:54:02.623Z shield-study-addon
{
  "attributes": {
    "message_type": "final_report",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "amazon_status": "waiting",
    "amazon_show_count": "0",
    "amazon_trigger_count": "0",
    "amazon_nevershow": "false",
    "mobile-promo_status": "waiting",
    "mobile-promo_show_count": "0",
    "mobile-promo_nevershow": "false",
    "pocket_status": "waiting",
    "pocket_show_count": "0",
    "pocket_nevershow": "0"
  }
}


5 2017-10-30T16:54:13.763Z shield-study-addon
{
  "attributes": {
    "message_type": "event",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "id": "amazon-assistant",
    "event": "queued"
  }
}


6 2017-10-30T16:54:13.786Z shield-study-addon
{
  "attributes": {
    "message_type": "final_report",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "amazon_status": "queued",
    "amazon_show_count": "0",
    "amazon_trigger_count": "1",
    "amazon_nevershow": "false",
    "mobile-promo_status": "waiting",
    "mobile-promo_show_count": "0",
    "mobile-promo_nevershow": "false",
    "pocket_status": "waiting",
    "pocket_show_count": "0",
    "pocket_nevershow": "0"
  }
}


7 2017-10-30T16:54:13.818Z shield-study-addon
{
  "attributes": {
    "message_type": "event",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "id": "amazon-assistant",
    "event": "presented"
  }
}


8 2017-10-30T16:54:13.841Z shield-study-addon
{
  "attributes": {
    "message_type": "summary_log",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
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
    "amazon-assistant_delivered": "true"
  }
}


9 2017-10-30T16:54:13.845Z shield-study-addon
{
  "attributes": {
    "message_type": "final_report",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "amazon_status": "presented",
    "amazon_show_count": "1",
    "amazon_trigger_count": "1",
    "amazon_nevershow": "false",
    "mobile-promo_status": "waiting",
    "mobile-promo_show_count": "0",
    "mobile-promo_nevershow": "false",
    "pocket_status": "waiting",
    "pocket_show_count": "0",
    "pocket_nevershow": "0"
  }
}


10 2017-10-30T16:55:05.939Z shield-study-addon
{
  "attributes": {
    "message_type": "summary_log",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
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
    "amazon-assistant_delivered": "true",
    "amazon-assistant_close": "true"
  }
}


11 2017-10-30T16:55:05.950Z shield-study-addon
{
  "attributes": {
    "message_type": "notification_result",
    "variation": "bar-amazon-high",
    "variation_ui": "bar",
    "variation_amazon": "high",
    "variation_sponsored": "false",
    "count": "1",
    "status": "presented",
    "id": "amazon-assistant",
    "nevershow": "false",
    "result": "close"
  }
}
</pre>