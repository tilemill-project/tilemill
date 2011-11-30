

TARGET=build/Release/TileMill.app/Contents/Resources/
JOBS=`sysctl -n hw.ncpu`

build:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj

clean:
	@xcodebuild -jobs $(JOBS) -project TileMill.xcodeproj clean

package: build
	chmod +x $(TARGET)index.js
	rm -rf $(TARGET)node_modules/jshint
	rm -rf $(TARGET)node_modules/expresso
	rm -rf $(TARGET)test
	find $(TARGET) -name test -exec rm -rf {} \;
	rm -rf $(TARGET)node_modules/mapnik/{build,examples,src,tests}
	rm -rf $(TARGET)node_modules/sqlite3/build{build,deps,src}
	rm -rf $(TARGET)node_modules/tilelive/examples
	rm -rf $(TARGET)node_modules/millstone/node_modules/srs/{build,tools,deps,src}
	rm -rf $(TARGET)node_modules/millstone/node_modules/zipfile/{build,deps,src}
	rm -rf $(TARGET)node_modules/bones/node_modules/jquery/node_modules/htmlparser/testdata
	rm -rf $(TARGET)node_modules/bones/node_modules/backbone/{raw,docs,examples}
	rm -rf $(TARGET)node_modules/bones/node_modules/jquery/jquery
	rm -rf $(TARGET)node_modules/JSV/jsdoc-toolkit

run: package
	open ./build/Release/TileMill.app

zip: package
	cd build/Release/; zip -9qr ../../TileMill.zip TileMill.app/

tar: package
	tar cfj TileMill.tar.bz2 -C build/Release/ TileMill.app

sparkle:
	@./sparkle.sh

.PHONY: build clean package run zip tar sparkle
