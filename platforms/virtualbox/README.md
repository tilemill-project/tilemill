# TileMill VirtualBox VM

Details on setup of TileMill in a VirtualBox Virtual Machine


# Requires

 * VirtualBox 4.0.x
 * VB supported OS with >= 2GB memory
 * Ubuntu Maverick or Natty iso - either 32 bit or 64 bit

# Updating an existing VM

If you are updating an existing VM after a TileMill release do:

    sudo apt-get update
    apt-get install tilemill
    sudo stop tilemill
    sudo start tilemill

Then test to make sure things are still working.

You can check the version with:

    apt-cache show tilemill

Now skip down to 'Testing and configuration' below and update the readme.


# Creating a new Virtual Machine

 * VB > Machine > New..
 * Choose OS "Linux", Version "Ubuntu" (or Ubuntu 64 if iso is 64 bit)
 * Name it "TileMill-$VER-$arch" like: "TileMill-0.5.0-32bit"
 * First run, create a new dynamically expanding virtual disk >=  150GB


# Install Ubuntu

 * London timezone
 * USA keyboard
 * name: ubuntu
 * computer name: TileMill-VirtualBox
 * username: ubuntu
 * pass: ubuntu

Once done installing, shut down.

Then edit the settings to avoid the machine booting from the .iso:

 * System > Motherboard > Boot Order: move "Hard Disk" above CD
 * Or simply unmount the iso by removing it from that "Storage"
 
But, ideally do not unmount it, if you plan to update tilemill on this vm
since compacting the disk requires being able to boot again from the CD.

Then optionally enable Bridged internet (to later be able to ssh from host).


# Setup

Restart VM. Unity will likely fail - no problem.

Optional: Install guest additions for copy/paste between
host/guest and nicer screen resizing.

Then on the guest open a terminal and do:

    sudo apt-get install openssh-server
    ifconfig -a # get ip from 'inet addr', like 10.0.1.8

Now you can ssh in from the host to finish setup. From host do:

    ssh ubuntu@10.0.x.x # where x can be fetched from guest ifconfig -a command

Install tilemill:

    wget https://github.com/downloads/mapbox/tilemill/install-tilemill.sh
    chmod +x install-tilemill.sh
    sudo ./install-tilemill.sh


# Testing and configuration

Test tilemill:
  
  * Make sure it running at http://localhost:8889/
  * Make sure it can write data (indicates proper perms to /usr/share/mapbox)
  * Make sure you can manually add files to /usr/share/mapbox
  
For now, to get the permissions to work for both the app and the user you need to do:

    sudo chmod -R 777 /usr/share/mapbox

  
Now set up niceties:

  * Make the user an admin user in System > Administration > Users & Groups
  * Make a Desktop symlink to /usr/share/mapbox
  * Make bookmarks in Firefox to local TileMill, MapBox support, and TileStream


Add a README.txt to the desktop like:

```
TileMill VM
-----------

This is Ubuntu 32bit machine with TileMill pre-installed.

Start TileMill via the Desktop Icon. Then in FireFox and go to http://localhost:8889/ to start making maps.

Note: TileMill can be run either as a server process or as a
desktop application. This machine runs as a desktop application.

See more details at http://mapbox.com/tilemill/docs/manual/usage/

For more information on the VM visit:

http://mapbox.com/tilemill/docs/tutorials/virtualbox/

And for support visit:

http://support.mapbox.com/    
```

Now, optionally, we can try to compact the VM's disk saving potentially a few GB of space.

There are two approaches:

 * Use `dd` to write zeros over free space

 * Use `zerofree` tool which is more robust but involves more steps

The `dd` approach is (on the vm):

    sudo apt-get install ae2fslibs
    time sudo dd if=/dev/zero of=/fillerup.zero
    sync
    rm /fillerup.zero

You may see: "ran out of space..." error which I'm not sure how to avoid.

Then shutdown the VM and compact it:

    time VBoxManage modifyhd .vdi --compact

The `zerofree` approach is to first boot from the CD.

Booting from the CD requires doing:

    System > Motherboard > Boot Order: move CD above "Hard Disk"

And adding (if needed) the .iso back as an IDE controller:

    Storage > IDE Controller > Add CD/DVD Device > Choose Disk > ubuntu*.iso

Then boot the machine (ignore any non-fatal messages).

At the "Welcome" screen choose "Try Ubuntu" and it will again reboot into demo mode.

Now open a terminal in this mode (which is read-only) and do:

    sudo apt-get install zerofree e2fslibs
    sudo mount -r /dev/sda1 /mnt
    # will take ~20 minutes:
    sudo /mnt/usr/sbin/zerofree -v /dev/sda1
    sudo umount /mnt
    # optional check
    sudo fsck.ext2 -f /dev/sda1

Then power off the vm and compact:

    time VBoxManage modifyhd TileMill-$VER.vdi --compact


# Package

First switch back to NAT (if you switched to Bridged before) for network settings
as Bridged will break on other systems.

Finally export:

    Machine > Export Appliance > TileMill-$VER-32bit.ova

Put this link in the Vendor URL:

    http://mapbox.com/tilemill/docs/tutorials/virtualbox

And upload to:

 http://tilemill-vm.s3.amazonaws.com/TileMill-$VER-32bit.ova