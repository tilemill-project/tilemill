
TARGET=build/Release/TileMill.app/Contents/Resources/

build:
	@xcodebuild -project tilemill.xcodeproj

clean:
	@xcodebuild -project tilemill.xcodeproj clean

package: build
	chmod +x $(TARGET)index.js
	rm -rf $(TARGET)node_modules/jshint
	rm -rf $(TARGET)node_modules/expresso
	rm -rf $(TARGET)test

run: package
	open ./build/Release/TileMill.app

zip: package
	zip -9qr TileMill.zip build/Release/TileMill.app/

tar: package
	tar cfz TileMill.tar.gz -C build/Release/ TileMill.app

.PHONY: build clean package run zip tar
