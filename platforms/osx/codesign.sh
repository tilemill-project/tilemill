aws s3 cp "s3://mapbox/mapbox-studio/keys/Developer ID Certification Authority.cer" authority.cer
aws s3 cp "s3://mapbox/mapbox-studio/keys/Developer ID Application: Mapbox, Inc. (GJZR2MEM28).cer" signing-key.cer
aws s3 cp "s3://mapbox/mapbox-studio/keys/Mac Developer ID Application: Mapbox, Inc..p12" signing-key.p12
security create-keychain -p travis signing.keychain \
    && echo "+ signing keychain created"
security import authority.cer -k ~/Library/Keychains/signing.keychain -T /usr/bin/codesign \
    && echo "+ authority cer added to keychain"
security import signing-key.cer -k ~/Library/Keychains/signing.keychain -T /usr/bin/codesign \
    && echo "+ signing cer added to keychain"
security import signing-key.p12 -k ~/Library/Keychains/signing.keychain -P "" -T /usr/bin/codesign \
    && echo "+ signing key added to keychain"
rm authority.cer
rm signing-key.cer
rm signing-key.p12

# update time to try to avoid occaisonal codesign error of "timestamps differ by N seconds - check your system clock"
sudo ntpdate -u time.apple.com

# Sign .app file.
echo "signing"
PRODUCT=build/Release/TileMill.app
codesign --keychain ~/Library/Keychains/signing.keychain --sign "Developer ID Application: Mapbox, Inc." --deep --verbose --force ${PRODUCT}
codesign --verify -v ${PRODUCT}

# Nuke signin keychain.
echo "dropping keychain"
security delete-keychain signing.keychain
