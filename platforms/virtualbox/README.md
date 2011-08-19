# TileMill VirtualBox VM

Details on setup of TileMill in a VirtualBox Virtual Machine

# Requires

 * VirtualBox 4.0.x
 * VB supported OS with >= 2GB memory
 * Ubuntu Maverick or Natty iso - either 32 bit or 64 bit


# Create new Virtual Machine

 * VB > Machine > New..
 * Choose OS "Linux", Version "Ubuntu" (or Ubuntu 64 if iso is 64 bit)
 * Name it "TileMill-$VER-$arch" like: "TileMill-0.4.2-32bit"
 * First run, create a new dyamically expanding virtual disk >=  150GB
 
# Install Ubuntu

 * London timezone
 * USA keyboard
 * name: ubuntu
 * computer name:tilemill-virtualbox
 * username: ubuntu
 * pass: ubuntu

Once done installing, shut down.

Then edit the settings to avoid the machine booting from the .iso:

 * System > Motherboard > Boot Order: move "Hard Disk" above CD
 * Or simply unmount the iso by removing it from that "Storage"

Then enable Bridged internet (to later be able to ssh from host).

# Setup

Restart VM. Unity will likely fail - no problem.

Optional: Install guest additions for copy/paste between
host/guest and nicer screen resising.

Then on the guest open a terminal and do:

    sudo apt-get install openssh-server
    ifconfig -a # get ip from 'inet addr', like 10.0.1.8

Now you can ssh in from the host to finish setup. From host do:

    ssh ubuntu@10.0.x.x # where x can be fetched from guest ifconfig -a command

Install tilemill:

    wget https://github.com/downloads/mapbox/tilemill/install-tilemill.sh
    chmod +x install-tilemill.sh
    sudo ./install-tilemill.sh

Test tilemill, make bookmarks in Firefox.


Add a README.txt to the desktop like:

    TileMill 0.4.2 VM
    -----------------
    
    This is Ubuntu Natty 32bit running TileMill 0.4.2.
    
    Open FireFox and click on the "TileMill" bookmark
    to start making maps.
    
    For more information visit:
    
    http://support.mapbox.com/kb/introduction-installation/tilemill-virtualbox-vm
    
    And for support visit:
    
    http://support.mapbox.com/
    

Now prep to compact the disk:

    sudo apt-get install zerofree e2fslibs
    time sudo dd if=/dev/zero of=/fillerup.zero
    rm /fillerup.zero # you may see: "ran out of space..."


Close down the VM.

# Compact and package

First switch back to NAT for network settings as Bridged will break on other systems.

Then compress:

    time VBoxManage modifyhd .vdi --compact # should shave at least half a GB
    
Finally export:

    Machine > Export Appliance > TileMill-0.4.2-32bit.ova

Put this link in the Vendor URL:

    http://support.mapbox.com/kb/introduction-installation/tilemill-virtualbox-vm
