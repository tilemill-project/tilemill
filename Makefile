ext:
	-test ! -d ext && mkdir ext
	wget -q --no-check-certificate https://github.com/stamen/modestmaps-js/raw/0.16.1/modestmaps.min.js -O ext/modestmaps.js
	wget -q --no-check-certificate https://github.com/marijnh/CodeMirror2/raw/v2.0/lib/codemirror.js -O ext/codemirror.js
	wget -q --no-check-certificate https://github.com/marijnh/CodeMirror2/raw/v2.0/lib/codemirror.css -O ext/codemirror.css
	wget -q --no-check-certificate https://github.com/andyet/ICanHaz.js/raw/v0.7/ICanHaz.min.js -O ext/ICanHaz.min.jz.js
	wget -q --no-check-certificate https://github.com/jaz303/tipsy/raw/v1.0.0a/src/javascripts/jquery.tipsy.js -O ext/jquery.tipsy.js
	wget -q --no-check-certificate https://github.com/jaz303/tipsy/raw/v1.0.0a/src/stylesheets/tipsy.css -O ext/tipsy.css
# @TODO: inclusion of this seems to break codemirror -- probably as a result of concatenation.
#	wget -q --no-check-certificate https://github.com/dankogai/js-base64/raw/b1d15613be6651917ef5761e0bc29c7c07aabd90/base64.js -O ext/base64.js

build/vendor.js:
	cat ext/*.js > build/vendor.js

build/vendor.css:
	cat ext/*.css > build/vendor.css

build_setup:
	mkdir -p build

build: build_setup build/vendor.js build/vendor.css

files/resources:
	wget -q --no-check-certificate http://tilemill-data.s3.amazonaws.com/tilemill_resources.zip -O files/tilemill_resources.zip
	unzip -q -d files/resources files/tilemill_resources.zip
	rm files/tilemill_resources.zip

files/data:
	wget -q --no-check-certificate http://tilemill-data.s3.amazonaws.com/example_data.zip -O files/example_data.zip
	unzip -q -d files/data files/example_data.zip
	rm files/example_data.zip

files/project:
	mkdir -p files/project
	wget -q --no-check-certificate https://github.com/mapbox/tilemill_examples/tarball/0.4.0 -O files/examples.tar
	tar --strip=1 --directory=files/project -xzvf files/examples.tar
	rm files/examples.tar

files: files/resources files/data files/project

clean:
	rm -rf build

.PHONY: ext clean files
