
TARGET=build/Release/tilemill.app/Contents/Resources/tilemill/

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

run:
	open build/Release/tilemill.app

.PHONY: build clean package run
