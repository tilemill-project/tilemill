# TileMill Sparkle Workflow

Sparkle[1] is an OS X framework for delivering software updates in-app via RSS feed enclosures.
The Sparkle feed ("appcast") delivers the version number, changelog, and a cryptographically-
signed `.zip` binary, prompts the user to update, automatically downloads the update,
and replaces the app, prompting a relaunch.

## Requirements

 * A Git tag for the version you want to release (e.g., `0.4.2` or `v0.4.2`).
 * A `.zip` already uploaded to the server configured in `sparkle.sh`.
 * A changelog entry for the version in `../../CHANGELOG.md`.
 * A copy of the private key corresponding to `dsa_public.pem` in a secure note in your OS X
   keychain named **TileMill Sparkle Private Key** (*Keychain Access.app > File > New Secure
   Note Item...*). Running `security find-generic-password -g -s "TileMill Sparkle Private
   Key"` should yield output.

## Usage

Run `./sparkle.sh` (or `make sparkle`) and follow the prompts. Appcast update instructions
are given at the end of a successful local update process.

## Dev Channel

We can issue "dev channel" releases in between regular, stable releases using the same
`../../CHANGELOG.md` file. Users can check a box in TileMill's preferences to follow
this channel and receive these intermediate updates as well as the stable releases.

To issue a dev channel update:

 1. Say the version you want to issue is `v0.9.0-141-g1b9a2ab`. This means that the update
 was issued after the `0.9.0` stable release and (following `git help describe`) the
 corresponding hash for the release is `1b9a2ab` (remove the `g`).
 1. Make sure the `TileMill-0.9.0.141.zip` is uploaded to GitHub Downloads.
 1. On your local copy of the repo, `git reset --hard 1b9a2ab`.
 1. From `platforms/osx` issue a `make sparkle`. It will confirm that you want to push a
 Sparkle update for `TileMill-0.9.0.141`, then pull down the appropriate download. This
 ensures that you don't have to go through the somewhat-lengthy and error-prone release
 build process locally.
 1. The command will output something like:
   ```
   --(~/src/tilemill/platforms/osx)--($ make sparkle
   
   Updating Sparkle for TileMill-0.9.0.141. Proceed? y
   
   Downloading http://cloud.github.com/downloads/mapbox/tilemill/TileMill-0.9.0.141.zip... done.
   Zip size is 82793436 bytes.
   Generating DSA signature... done.
   
   Add the following to the CHANGELOG (_posts/0100-01-01-CHANGELOG.md)
       date: 2012-04-24
       size: 82793436
       sign: MC4CFQDzIVUGGWA9LguQtoA0N1QrKSMuBQIVAKa8mlfzFAotbt6wInGGIs4pPe0G
   ```
 1. Modify `../../CHANGELOG.md` manually and commit & push the changes, updating the 
 Sparkle RSS feed and notifying beta testers.
 1. **IMPORTANT:** Be sure to add a `dev: true` line to the same entry so that the dev
 channel is triggered. If you don't do this, it will go out as a stable release to all
 OS X users of TileMill.

[1]: http://sparkle.andymatuschak.org/
