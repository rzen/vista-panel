# Web UI for Honeywell Vista 20P Control Panel 

Lightweight Web UI for Vista 20P (and probably others) control panel.

Works (and requires account) with [AlarmDealer](https://alarmdealer.com).

## Getting started

- Clone this repository
- Create `secrets.js` and populate with your account info (see below)
- Open panel.html in any modern browser
- Enjoy!

## AlarmDealer account info

After you login to your `alarmdealer.com` control panel, look at the source code of that page, you'll find a `<script>` block towards the bottom of the page that looks like this.

	window.username = "<your-alarm-dealer-account-name>";
	window.epass = "<hashed-password>";
	window.device_id = "<device-id>";
	window.user_type = "user";

Simply copy it into newly created `secrets.js`, thats all you'll need. An example secrets.js is included as `secrets-template.js`.

## Words of praise to AlarmDealer

First off I'm in no way associated with this company other than having been a happy customer for many years. Their staff is always responsive and very competent.

I'm going to reach out to them in a few weeks with an offer to use this applet free of charge.

My ultimate goal is to integrate access to Vista control panel into [Home Assistant](https://www.home-assistant.io/). 

## Browser compatibility

Successfully tested with:

- Safari Version 11.1.2 (12605.3.8.1)
- Chrome Version 67.0.3396.87 (Official Build) (64-bit)
- Firefox 60.0.2 (64-bit)

## Compatibility with other vendors

My understanding is this integration is possible via [IPDateTel](https://ipdatatel.com) a cellular network communication device. I own an older version of what looks like [this guy](https://ipdatatel.com/products/cellular-alarm-communicators/).

I can easily imagine that other vendors might be using the same back-end software and as such at least in principle compatibility is conceivable.

If anyone can offer technical details on this, I'd really appreciate a note.

## Screenshot

![Screenshot](panel.png)

## Open Source License

[MIT](https://opensource.org/licenses/MIT)