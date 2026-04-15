# Variables
NODEMODULES = ./node_modules
ROLLUP = $(NODEMODULES)/.bin/rollup

.PHONY: all clean install build

all: install build

# Install dependencies if node_modules doesn't exist
install:
	@if [ ! -d "$(NODEMODULES)" ]; then \
		npm install; \
	fi

# Bundle the JS using Rollup
# --plugin node-resolve: allows Rollup to find CodeMirror inside node_modules
# --format iife: "Immediately Invoked Function Expression" - perfect for plain <script> tags
build:
	$(ROLLUP) src/bundle/editor.js \
		--plugin @rollup/plugin-node-resolve \
		--file dist/editor.bundle.js \
		--format iife \
		--name CMExport 
	cp src/index.html dist/
	cp src/*.js dist/
	cp src/*.css dist/

# Clean up the bundle
clean:
	rm -f dist/editor.bundle.js
