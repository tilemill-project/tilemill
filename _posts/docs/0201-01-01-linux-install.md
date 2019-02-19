---
layout: docs
category: installation
tag: Installation
title: Installing on Ubuntu
permalink: /docs/linux-install/
hidden: true
nextup:
- "Make your first map with [CSV data](/tilemill/docs/tutorials/point-data/)."
- "Read the [TileMill manual](/tilemill/docs/manual/)."
---
<span style="color:red">WARNING:</span> These instructions will only work with TileMill v0.10.1 or earlier. For v1.0.0 or later, you will need to install from source.

This page is for installing TileMill on **Ubuntu Desktop** from the Mapbox provided [Launchpad PPA](https://launchpad.net/~developmentseed/+archive/mapbox/). You can use this approach for a headless Ubuntu Server as well - see the [Ubuntu Service](/tilemill/docs/guides/ubuntu-service/) for details.

TileMill can also run great on other Linux distributions, Solaris, and FreeBSD - basically anywhere you can run Node.js and Mapnik. But on these platforms TileMill will need to be built from source because, at this time, pre-built packages are only provided for Ubuntu. See the [source build instructions](/tilemill/docs/source) for more details. We also have instructions for [Mac OS X](/tilemill/docs/mac-install) and [Windows](/tilemill/docs/win-install). 

### Requirements
<ul class='checklist'>
  <li class='check'>Ubuntu 10.04+ (Lucid and above)</li>
  <li class='check'>2 GB memory</li>
  <li class='check'>A modern browser (Chrome, Firefox)</li>
  <li class='check'>Internet connection for remote datasources</li>
</ul>

### Installation
1. [Download the TileMill installer](/tilemill) for Ubuntu. If the download window appears, choose **Save File**.
  ![](/tilemill/assets/pages/linux-install-1.png)
2. Select **install-tilemill.tar.gz** in your **Downloads** folder. Choose **Edit > Extract Here** from the menu.
  ![](/tilemill/assets/pages/linux-install-2.png)
3. Double-click on **install-tilemill.sh** to start the installation process. If prompted, choose **Run in terminal**. Enter your system password when prompted.
  ![](/tilemill/assets/pages/linux-install-3.png)
4. Start TileMill using the Ubuntu launcher (11.10) or by choosing **Applications > Graphics > TileMill** from the menu (11.04).
  ![](/tilemill/assets/pages/linux-install-4.png)

### Terminal installation
If you're terminal savvy, you can install TileMill with the following commands:

    sudo add-apt-repository ppa:developmentseed/mapbox
    sudo apt-get update
    sudo apt-get install tilemill libmapnik nodejs

Then start TileMill from the command line:

    node /usr/share/tilemill/index.js

For more details on running from the command line see the [Ubuntu Service](/tilemill/docs/guides/ubuntu-service/) for details.

{% include nextup.html %}
