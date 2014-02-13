---
layout: docs
section: help
category: reference
tag: Reference
title: TileMill settings
permalink: /docs/manual/tilemill-settings
---

## Documents

The directory where TileMill stores files for projects and exports. If you want to keep your current projects, move the directory before changing this setting.

## Mapbox Account

The [Mapbox](https://mapbox.com) account TileMill is authorized to upload maps to. MapBox provides hosting for maps created in TileMill. [Register](http://mapbox.com/plans/) for a free MapBox account.

## HTTP Proxy

If your computer uses a HTTP proxy, you will need to specify the details for TileMill to work correctly. The proxy details need to be entered in the form of `http://user:pass@hostname:port` where *user*, *pass*, *hostname* and *port* are replaced with the relevant proxy details. After entering and saving this setting, you will need to restart TileMill. You should then be able to make use of TileMill's features requiring network access.

*Note: TileMill does not support proxies for authorization. To authorize, open `http://localhost:20009` in a browser after starting TileMill.*
