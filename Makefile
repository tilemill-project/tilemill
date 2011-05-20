ext:
	-test ! -d ext && mkdir ext
	wget -q --no-check-certificate https://github.com/stamen/modestmaps-js/raw/0.16.1/modestmaps.min.js -O ext/modestmaps.js
	wget -q --no-check-certificate https://github.com/dankogai/js-base64/raw/b1d15613be6651917ef5761e0bc29c7c07aabd90/base64.js -O ext/base64.js
	wget -q --no-check-certificate https://github.com/marijnh/CodeMirror2/raw/v2.0/lib/codemirror.js -O ext/codemirror.js
	wget -q --no-check-certificate https://github.com/andyet/ICanHaz.js/raw/v0.7/ICanHaz.min.js -O ext/ICanHaz.min.jz.js
	wget -q --no-check-certificate https://github.com/jaz303/tipsy/raw/v1.0.0a/src/javascripts/jquery.tipsy.js -O ext/jquery.tipsy.js

build/vendor.js:
	cat ext/*.js > build/vendor.js

build_setup:
	mkdir -p build

build: build_setup build/vendor.js

clean:
	rm -rf build

.PHONY: ext clean
