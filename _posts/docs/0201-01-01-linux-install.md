---
section: documentation
layout: book
category: TileMill
tag: Installation
title: Installing
permalink: /docs/linux-install
hidden: true
nextup:
- "Make your first map with [CSV data](/tilemill/docs/tutorials/point-data/)."
- "Read the [TileMill manual](/tilemill/docs/manual/)."
---
This page is for **Ubuntu**. We also have instructions for [Mac OS X](/tilemill/docs/mac-install) and [Windows](/tilemill/docs/win-install).

### Requirements
<ul class='checklist'>
  <li class='check'>Ubuntu 10.10, 11.04 or 11.10</li>
  <li class='check'>2 GB memory</li>
  <li class='check'>A modern browser (Chrome, Firefox)</li>
  <li class='check'>Internet connection for remote datasources</li>
</ul>

### Installation
1. [Download the TileMill installer]({{site.categories.homepage[0].platforms[1].url}}) for Ubuntu. If the download window appears, choose **Save File**.
  ![](/tilemill/assets/pages/linux-install-1.png)
2. Select **install-tilemill.tar.gz** in your **Downloads** folder. Choose **Edit > Extract Here** from the menu.
  ![](/tilemill/assets/pages/linux-install-2.png)
3. Double-click on **install-tilemill.sh** to start the installation process. If prompted, choose **Run in terminal**. Enter your system password when prompted.
  ![](/tilemill/assets/pages/linux-install-3.png)
4. Start TileMill using the Ubuntu launcher (11.10) or by choosing **Applications > Graphics > TileMill** from the menu (10.10 & 11.04).
  ![](/tilemill/assets/pages/linux-install-4.png)

### Terminal installation
If you're terminal savy, you can install TileMill with the following commands:

    sudo add-apt-repository ppa:developmentseed/mapbox
    sudo apt-get update
    sudo apt-get install tilemill

{% include nextup.html %}
