PRODUCT="build/Release/TileMill.app"
JOBS=`sysctl -n hw.ncpu`
VERSION=`node -e "console.log(require('../../package.json').version)"`

build:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj

clean:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj clean
	rm -rf ./build

package: build

run: package
	open ./build/Release/TileMill.app

sign: package
	@codesign --deep --verbose --keychain /Library/Keychains/System.keychain -f -s "Developer ID Application: Development Seed" $(PRODUCT)

zip:
	cd build/Release/; ditto -c -k --sequesterRsrc --keepParent --zlibCompressionLevel 9 TileMill.app/ ../../TileMill.zip

upload: zip
	aws s3 cp TileMill.zip s3://tilemill/latest/TileMill-$(VERSION).zip --acl public-read
	echo "ready at http://tilemill.s3.amazonaws.com/latest/TileMill-$(VERSION).zip"

tar: sign
	tar cfj TileMill.tar.bz2 -C build/Release/TileMill.app

sparkle:
	@./sparkle.sh

.PHONY: build clean package run sign zip tar sparkle
