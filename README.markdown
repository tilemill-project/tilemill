LetsMove
========

This is a sample project that demonstrates how to move a running Mac OS X application to the Applications folder.

First it checks if /Applications is writable and offer to move it there if it is. If not, it sees if ~/Applications
exists and offers to move it there instead. Finally, if there is no ~/Applications it asks to move it to /Applications
after administrator authentication.

Requirements
------------
You need Mac OS X 10.5 (Leopard) or higher to build but the code runs on 10.4
