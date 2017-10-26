# Test Plan for the Focused CFR Addon (in release)

## Manual / QA TEST Instructions

## Overall overview of what the addon does

You can read an overview of what the addon is doing [here](https://docs.google.com/a/mozilla.com/document/d/17KHk42HdoLq4FvDk4g1lDRSgpOwaB2kuDE1vk7sBENY/edit?usp=sharing) that helps you understand why we set certain things up before each test.

### BEFORE EACH TEST: INSTALL THE ADDON to a CLEAN (NEW) PROFILE

0.  (create profile:  https://developer.mozilla.org/en-US/Firefox/Multiple_profiles, or via some other method)
1.  In your Firefox profile
2.  `about:addons` > `extensions`
3.  Open the drop-down menu with the cog icon in the upper right corner
4.  `Install Add-on From File`

### BEFORE EACH TEST: SET THE SPECIFIED PREFERENCES in `about:config`

This makes testing simpler as you don't have to long repititive tasks to trigger recommendations or wait too long to see next recommendations.

### Do these tests.

1.  UI APPEARANCE -- Amazon Assistant (DOORHANGER)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "doorhanger-amazon-high", "weight": 1, "ui": "doorhanger", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    *  Go to `amazon.com`
    *  A doorhanger hangs from the awesome bar ([screenshot](https://i.imgur.com/qPSg63E.png))
    *  Text is 'Instant product matches while you shop across the web with Amazon Assistant'
    *  Buttons are "Not Now" and 'Add to Firefox'
    *  'Not Now' closes the doorhanger
    *  'Add to Firefox' directs the user to 'www.amazon.com/gp/BIT/ref=bit_v2_BDFF1?tagbase=mozilla1' and closes the panel

    Test fails IF:

    - Doorhanger does not pop up
    - Elements are not correct or are not displayed

2.  UI APPEARANCE -- Amazon Assistant (NOTIFICATION BAR)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "bar-amazon-high", "weight": 1, "ui": "bar", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    *  Go to `amazon.com`
    *  A notification bar appears on top of the page ([screenshot](https://i.imgur.com/O2pg5Nv.png))
    *  Text is 'Instant product matches while you shop across the web with Amazon Assistant'
    *  Buttons are 'Add to Firefox' and an 'x' button on the right corner of the panel
    *  'x' closes the panel
    *  'Add to Firefox' directs the user to "www.amazon.com/gp/BIT/ref=bit_v2_BDFF1?tagbase=mozilla1" and closes the panel

    Test fails IF:

    - Notification bar does not pop up
    - Elements are not correct or are not displayed

3.  UI APPEARANCE -- Pocket (DOORHANGER)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "doorhanger-amazon-high", "weight": 1, "ui": "doorhanger", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    * Set Preferences
    &nbsp; extensions.focused_cfr_study.pocket_bookmark_count_threshold = 2
    *  Bookmark any web page
    *  A doorhanger hangs from the awesome bar ([screenshot](https://i.imgur.com/JmSKatg.png))
    *  Text is 'Pocket lets you save for later articles, videos, or pretty much anything!'
    *  Buttons are 'Make a match'
    *  'Not Now' closes the doorhanger
    *  'Make a match' directs the user to 'https://getpocket.com/firefox/' and closes the panel

    Test fails IF:

    - Doorhanger does not pop up
    - Elements are not correct or are not displayed

4.  UI APPEARANCE -- Pocket (NOTIFICATION BAR)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "bar-amazon-high", "weight": 1, "ui": "bar", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    * Set Preferences
    &nbsp; extensions.focused_cfr_study.pocket_bookmark_count_threshold = 2
    *  Bookmark any web page
    *  A notification bar appears on top of the page ([screenshot](https://i.imgur.com/a72w2Op.png))
    *  Text is 'Pocket lets you save for later articles, videos, or pretty much anything!'
    *  Buttons are 'Try it Now' and an 'x' button on the right corner of the panel
    *  'x' closes the panel
    *  'Try it Now' directs the user to 'https://getpocket.com/firefox/' and closes the panel

    Test fails IF:

    - Notification bar does not pop up
    - Elements are not correct or are not displayed

5.  UI APPEARANCE -- Mobile Promotion (DOORHANGER)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "doorhanger-amazon-high", "weight": 1, "ui": "doorhanger", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    *  (Create and) log into a Firefox Sync account that has no mobile devices attached to it
    *  Wait for 5 minutes after logging in
    *  A doorhanger hangs from the awesome bar ([screenshot](https://i.imgur.com/stQsKLJ.png))
    *  Text is 'Your Firefox account meets your phone. They fall in love. Get Firefox on your phone now.'
    *  Buttons are 'Not Now' and 'Try it Now'
    *  'Not Now' closes the doorhanger
    *  'Make a match' directs the user to 'https://www.mozilla.org/en-US/firefox/mobile-download/desktop/' and closes the panel

    Test fails IF:

    - Doorhanger does not pop up
    - Elements are not correct or are not displayed

6.  UI APPEARANCE -- Pocket (NOTIFICATION BAR)

    * Set Preferences
    &nbsp; etensions.focused_cfr_study.variation = {"name": "bar-amazon-high", "weight": 1, "ui": "bar", "amazon": "high", "sponsored": "false"}
    *  Install the addon
    *  (Create and) log into a Firefox Sync account that has no mobile devices attached to it
    *  Wait for 10 minutes after logging in
    *  A notification bar appears on top of the page ([screenshot](https://i.imgur.com/vOzhbOf.png))
    *  Text is 'Your Firefox account meets your phone. They fall in love. Get Firefox on your phone now.'
    *  Buttons are 'Make a Match' and an 'x' button on the right corner of the panel
    *  'x' closes the panel
    *  'Make a match' directs the user to 'https://www.mozilla.org/en-US/firefox/mobile-download/desktop/' and closes the panel

    Test fails IF:

    - Notification bar does not pop up
    - Elements are not correct or are not displayed

7. TELEMETRY PING -- Notification Result

  * Performing one of tests 1 to 6 should result in the Telemetry ping with a payload similar to the following: 

``` {
  "version": 3,
  "study_name": "focused-cfr-release-2",
  "branch": "doorhanger-amazon-low",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "message_type": "notification_result",
      "variation": "doorhanger-amazon-low",
      "variation_ui": "doorhanger",
      "variation_amazon": "low",
      "variation_sponsored": "false",
      "nevershow": "false",
      "count": "1",
      "status": "presented",
      "id": "amazon-assistant",
      "result": "dismiss"
    }
  },
  "testing": true
}

```
  * the "result" field should be one of [`dismiss`, `action`, `close`, `timeout`] depending on what you do on the panel: `dimiss` is clicking on `Not Now`; `action` is clicking the blue button; `close` is clicking the `x` button; `timeout` is not interacting with the panel for two minutes (and it fades)
  * the "nevershow" field should be "false" or "true" based on whether the "Don't show this me again" checkbox has been checked

    Test fails IF:

    - No such ping is submitted to telemetry
    - Any of the fields is empty
    - Any of the fields does not match the branch or the recommended feature

8. TELEMETRY PING -- Events

  * Performing one of the tests 1 to 6 should result in the Telemetry ping with a payload similar to the following: 

``` 
{
  "version": 3,
  "study_name": "focused-cfr-release-2",
  "branch": "doorhanger-amazon-high-sponsored",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "message_type": "event",
      "variation": "doorhanger-amazon-high",
      "variation_ui": "doorhanger",
      "variation_amazon": "high",
      "variation_sponsored": "true",
      "id": "amazon-assistant",
      "event": "presented"
    }
  },
  "testing": false
}
```

  * you should see at least two pings with `message_type`: `event`: one with `event`: `presented` and one with `event`: `queued`

   Test fails IF:

    - No such ping is submitted to telemetry
    - Any of the fields is empty
    - Any of the fields does not match the branch or the recommended feature

9. PERSISTENCE TEST -- Initialization

  * Install the addon
  * Shut down Firefox and open it again with the same profile
  * Perform one of tests 1 to 6
  * You should still see the expected result

10. NOTIFICATION LIMITING -- Global Notification Limiting

  * Perform test 1
  * Perform test 3 on the *same profile* after the installation step (do not reinstall the addon)
  * No notification should be shown

  Test fails IF:

    - A notification is shown after the bookmarking


11. NOTIFICATION LIMITING -- Per Feature Limiting

  * Set Preferences
  &nbsp; etensions.focused_cfr_study.variation = {"name": "doorhanger-amazon-high-sponsored", "weight": 1, "ui": "doorhanger", "amazon": "high", "sponsored": "true"}
  * Install the addon
  * Set Preferences
  &nbsp; extensions.focused_cfr_study.page_visit_gap_minutes = 0
  &nbsp; extensions.focused_cfr_study.max_number_of_notifications = 1
  &nbsp; extensions.focused_cfr_study.notification_gap_minutes = 0
  * Go to `amazon.com`
  * You should see a doorhanger with the Amazon Assistant recommendation
  * Dismiss the doorhanger by clicking on "Not Now"
  * Go to `amazon.com` again
  * You should not see any notifications

  Test fails IF:

    - A notification is shown after the second visit to `Amazon.com`



