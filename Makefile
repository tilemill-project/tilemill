ext:
	-test ! -d ext && mkdir ext
	wget -q --no-check-certificate https://github.com/marijnh/CodeMirror2/raw/v2.11/lib/codemirror.js -O ext/codemirror.js
	wget -q --no-check-certificate https://github.com/marijnh/CodeMirror2/raw/v2.11/lib/codemirror.css -O ext/codemirror.css

build/vendor.js:
	cat ext/*.js > build/vendor.js

build/vendor.css:
	cat ext/*.css > build/vendor.css

build_setup:
	mkdir -p build

build: build_setup build/vendor.js build/vendor.css

clean:
	rm -rf build

.PHONY: ext clean
