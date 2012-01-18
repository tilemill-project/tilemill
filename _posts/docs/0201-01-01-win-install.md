---
section: documentation
layout: book
category: TileMill
tag: Installation
title: Installing
permalink: /docs/win-install
hidden: true
nextup:
- "Make your first map with [CSV data](/tilemill/docs/tutorials/point-data/)."
- "Read the [TileMill manual](/tilemill/docs/manual/)."
---
This page is for **Windows**. We also have instructions for [Mac OS X](/tilemill/docs/mac-install) and [Ubuntu](/tilemill/docs/linux-install).

Native support for Windows support is [coming soon](http://mapbox.com/tilemill/windows). Until then you can run TileMill using an Ubuntu virtual machine. To make this easy, we provide a VirtualBox image for download.

[VirtualBox](http://www.virtualbox.org) is software that runs on all operating systems and allows you to launch Linux as an application. It is then easy to start and stop Linux as needed and safely and cleanly remove at any time.

We provide an Ubuntu Linux machine with the latest TileMill release pre-installed. This is a great way for Windows users to learn and experiment with TileMill without having to upgrade their operating system.

1. Start downloading the [TileMill 0.7.0 VM](http://tilemill-vm.s3.amazonaws.com/TileMill-0.7.0.ova) (1.3 GB)
2. While you wait for the VM download to complete, download and install [VirtualBox 4.0.x](http://www.virtualbox.org/wiki/Downloads).
3. When the .ova file is finished downloading open VirtualBox and choose **Machine > Import Appliance** from the menu.
4. Select the new machine in VirtualBox and boot it by clicking the **Start** button.
5. You will be greeted with an Ubuntu login screen. Login with the username "ubuntu" and password "ubuntu".
3. Start TileMill by choosing **Applications > Graphics > TileMill** from the menu.
4. Open the **Firefox Web Browser** inside the virtual machine and navigate to http://localhost:20009.

You can share data files with the virtual machine using a [VirtualBox shared folder](http://blogs.oracle.com/tao/entry/virtual_box_shared_folder_between) or with a tool like [Dropbox](http://dropbox.com).

{% include nextup.html %}
