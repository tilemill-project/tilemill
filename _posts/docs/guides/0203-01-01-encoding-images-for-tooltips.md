---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Encoding images for tooltips
permalink: /docs/guides/images-in-tooltips
---
MBTiles files are sometimes used in mobile applications where internet connections can be expensive, unreliable, or unavailable. When this is the case, you will want to avoid referencing remote images from the tooltips and legends contained in an MBTiles file.

You can store any type of image file in the MBTiles file itself by referencing [a data URI](http://en.wikipedia.org/wiki/Data_URI_scheme) instead of a standard URL or file path. To do this, you will need to base64-encode the image - a process that will take the binary image data and transform it into a string of text and numbers that can be pasted into HTML or CSS code.

## Preparing the code

To include a base64-encoded image in your tooltip or legend, use the following HTML code:

    <img src='data:image/png;base64,[image-data]' />

Replace the `[image-data]` part with the code that you'll generate in the next step.

## Encoding the image (Mac OS X)

Encoding the image will require the Terminal application. You'll also need to know the file path to your image, or navigate to the folder it is in with the `cd` command. Then run:

    openssl enc -base64 -in /path/to/your_file.png | tr -d '\n' | pbcopy

The base64-encoded image will now be copied to your clipboard. Paste it into the appropriate place in your code and the image should appear in your legend or tooltip.

## Encoding the image (Ubuntu or other Linux)

The steps on Ubuntu are very similar to Mac OS X, but first we're going to install a utility to copy terminal output straight to the clipboard:

    sudo apt-get install xclip

Except for the different copy utility, the rest of the command is the same:

    openssl -in /path/to/your_file.png enc -base64 | tr -d '\n' | xclip -selection c

The base64-encoded image will now be copied to your clipboard. Paste it into the appropriate place in your code and the image should appear in your legend or tooltip.

