# TileMill Sparkle Workflow

Sparkle[1] is an OS X framework for delivering software updates in-app via RSS feed enclosures. 
The Sparkle feed ("appcast") delivers the version number, changelog, and a cryptographically-
signed `.zip` binary, prompts the user to update, automatically downloads the update,
and replaces the app, prompting a relaunch.

# Developer Setup

The `sparkle.sh` script takes care of updating the local `appcast.xml`, preparing it for 
publication to GitHub Pages via the `gh-pages` branch. You may also use the `make sparkle` 
target of the `Makefile`. 

## Requirements

Aside from an OS X standard installation (including Bash, Perl with `XML::LibXML`, `stat`, 
and OpenSSL), you will need: 

 * Node.js in your path with `node-markdown` (which installs via the TileMill build process).
 * A Git tag for the version you want to release (e.g., `0.4.2` or `v0.4.2`).
 * A `.zip` already uploaded to the server configured in `sparkle.sh`.
 * A changelog entry for the version in `../../CHANGELOG.md`. 
 * A copy of the private key corresponding to `dsa_public.pem` in a secure note in your OS X 
   keychain named **TileMill Sparkle Private Key** (*Keychain Access.app > File > New Secure 
   Note Item...*). Running `security find-generic-password -g -s "TileMill Sparkle Private
   Key"` should yield output.

## Usage

Run `./sparkle.sh` (or `make sparkle`) and follow the prompts. Appcast push instructions are
given at the end of a successful local update process.

[1]: http://sparkle.andymatuschak.org/