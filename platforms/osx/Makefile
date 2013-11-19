TARGET=build/Release/TileMill.app/Contents/Resources/
JOBS=`sysctl -n hw.ncpu`

build:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj

clean:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj clean
	rm -rf ./build

package: build
	./copy_tilemill_base.sh $(TARGET)
	./copy_node.sh $(TARGET)
	chmod +x $(TARGET)index.js
	rm -rf $(TARGET)test

run: package
	open ./build/Release/TileMill.app

sign: package
	@codesign --verbose --keychain /Library/Keychains/System.keychain -f -s "Developer ID Application: Development Seed" $(TARGET)/../..

zip: sign
	cd build/Release/; ditto -c -k --sequesterRsrc --keepParent --zlibCompressionLevel 9 TileMill.app/ ../../TileMill.zip

tar: sign
	tar cfj TileMill.tar.bz2 -C build/Release/TileMill.app

sparkle:
	@./sparkle.sh

.PHONY: build clean package run sign zip tar sparkle
