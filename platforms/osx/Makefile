
TARGET=build/Release/TileMill.app/Contents/Resources/

build:
	@xcodebuild -project tilemill.xcodeproj

clean:
	@xcodebuild -project tilemill.xcodeproj clean

package: build
	chmod +x $(TARGET)index.js

run: package
	./build/Release/TileMill.app/Contents/MacOS/tilemill

zip: package
	zip -9qr tilemill-0.4.0alpha.zip build/Release/TileMill.app/

tar: package
	tar -cjf tilemill-0.4.0alpha.tar.bz2 -C build/Release/ TileMill.app


.PHONY: build clean package run zip
