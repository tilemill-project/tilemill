---
layout: book
section: documentation
category: tutorials
title: VirtualBox VM
permalink: /docs/tutorials/virtualbox
---

[VirtualBox](http://www.virtualbox.org) is software that runs on all operating systems and allows you to launch Linux as an application. It is then easy to start and stop Linux when you need and safe to cleanly remove at any time.

We provide an Ubuntu Linux (32 bit) machine with the latest TileMill release pre-installed and running when you boot up. This provides a great way for Windows users to learn and experiment with TileMill without having to upgrade their operating system.

## Getting Started

First start [downloading the TileMill 0.7.0 VM](http://tilemill-vm.s3.amazonaws.com/TileMill-0.7.0-32bit.ova) (1.3 GB).

Then make sure you have installed [VirtualBox 4.0.x](http://www.virtualbox.org/wiki/Downloads) or greater.

When the .ova file is finished downloading open VirtualBox and do:

    Machine > Import Appliance


## Booting the VM

The new machine should now appear in your VirtualBox menu of machines. Boot the machine by hitting 'start' and you will be greeted with an ubuntu login.

The main account is an administrative user with the username "ubuntu" and password "ubuntu".

After logging in you will find a TileMill icon on the desktop. Double click it to start TileMill and it will then be available in a browser at http://localhost:8889/. To start making maps just open Firefox and view that url (there is a browser toolbar bookmark for you too).


## Next Steps

TileMill comes with a remote data resource called [MapBox Geodata](/tilemill/docs/manual/mapbox-geodata).

But you will likely also want to load your own data. VirtualBox has a feature called "shared folders" to allow mapping a connection between your Windows machine and the virtual machine. See [this post](http://blogs.oracle.com/tao/entry/virtual_box_shared_folder_between) for more details.

[Dropbox](www.dropbox.com) can also be an easy way to transfer data. Simply create a folder in Dropbox to store your TileMill data. Copy the files from your PC into this folder, and then sign into Dropbox online from within the Virtual machine. On the Virtual Machine download the files into the “data” folder in the MapBox directory.  You will now be able to access your data from TileMill.


## Previous versions

TileMill 0.5.0 is archived [here](http://tilemill-vm.s3.amazonaws.com/TileMill-0.5.0-32bit.ova) (1.2 GB).

TileMill 0.4.2 is archived [here](http://tilemill-vm.s3.amazonaws.com/TileMill-0.4.2-32bit.ova) (1.1 GB).

We also have an archive of TileMill 0.3 on a VM specifically prepared for [FOSS4G 2011](http://2011.foss4g.org/sessions/leveraging-mapnik-designing-custom-map-tiles-and-scalable-applications).

The user is "mapnik" and the password is "mapnik" for this FOSS4G VM.

Download it [here](http://tilemill-vm.s3.amazonaws.com/mapnik-foss4g-2011v2.ova) (2.8 GB).


## More details

Advanced users curious about how we create this VM can see [this guide](https://github.com/mapbox/tilemill/tree/master/platforms/virtualbox).
