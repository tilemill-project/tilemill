
TARGET=build/Release/tilemill.app/Contents/Resources/tilemill/
NODE=`which node`

# we manually list items here to be able
# to easily avoid unneeded files/folders
DIRS= assets \
      commands \
      controllers \
      index.html \
      index.js \
      lib \
      models \
      node_modules \
      package.json \
      servers \
      templates \
      views
      

build:
	@xcodebuild -project tilemill.xcodeproj

clean:
	@xcodebuild -project tilemill.xcodeproj clean

package: build
	mkdir -p $(TARGET)
	$(foreach i,$(DIRS), \
		if ! [ -d $(TARGET)$i ]; then cp -R ../../$i $(TARGET); fi; \
	)
	if ! [ -d $(TARGET)node ];  then cp $(NODE) $(TARGET); fi;

zip: package
	zip -9qr tilemill-0.4.0alpha.zip build/Release/tilemill.app/

tar: package
	tar -cjf tilemill-0.4.0alpha.tar.bz2 -C build/Release/ tilemill.app

run:
	open build/Release/tilemill.app

.PHONY: build clean package run zip
