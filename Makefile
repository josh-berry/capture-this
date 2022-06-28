PACKAGE := capture-this
VERSION := $(shell node -e "x=`cat assets/manifest.json`; console.log(x.version)")
COMMIT := $(shell git rev-parse --short HEAD)
FULL_VERSION := $(VERSION)-$(COMMIT)

ifeq ($(VERSION),)
$(error Unable to determine the current version number)
endif

ifeq ($(COMMIT),)
$(error Unable to determine the HEAD commit)
endif

RELEASE_DIR = releases

SRCPKG_DIR = $(PACKAGE)-src-$(FULL_VERSION)
SRC_PKG = $(RELEASE_DIR)/$(SRCPKG_DIR).tar.gz
DIST_PKG = $(RELEASE_DIR)/$(PACKAGE)-$(FULL_VERSION).zip

# Primary (user-facing) targets
debug: build-dbg
.PHONY: debug

rel:
	make distclean
	make release-tag pkg-webext pkg-source
	make -C $(RELEASE_DIR)/$(SRCPKG_DIR) release-tag pkg-webext pkg-source
	[ -z "$$(diff -Nru dist $(RELEASE_DIR)/$(SRCPKG_DIR)/dist)" ]
	rm -rf $(RELEASE_DIR)/$(SRCPKG_DIR)
	@echo ""
	@echo "Ready for release $(VERSION)!"
	@echo
	@echo "Git tag:         v$(VERSION)"
	@echo "Release package: $(DIST_PKG)"
	@echo "Source package:  $(SRC_PKG)"
	@echo
	@echo "If everything looks good, run \"git push --tags\", and"
	@echo "upload to AMO."
	@echo ""
.PHONY: rel

# My version of `npm update`, since `npm update` seems to leave stale stuff
# lying around in package-lock.json. :/
up:
	rm -rf package-lock.json node_modules
	$(MAKE)
.PHONY: up



# Builds

build-dbg: node_modules icons
	npm run build
	npm run test
.PHONY: build-dbg

ICONS := $(foreach icon,$(wildcard assets/icons/*.svg),\
			$(foreach size,16 32 48 96,\
				$(patsubst assets/icons/%.svg,dist/icons/%-$(size).png,$(icon))))
icons: $(ICONS)
.PHONY: icons

dist/%-16.png: assets/%.svg
	mkdir -p $(dir $@)
	inkscape "$<" -o "$@" -D -w 16 -h 16
dist/%-32.png: assets/%.svg
	mkdir -p $(dir $@)
	inkscape "$<" -o "$@" -D -w 32 -h 32
dist/%-48.png: assets/%.svg
	mkdir -p $(dir $@)
	inkscape "$<" -o "$@" -D -w 48 -h 48
dist/%-96.png: assets/%.svg
	mkdir -p $(dir $@)
	inkscape "$<" -o "$@" -D -w 96 -h 96



# Releases

pkg-webext: clean-working-tree build-rel
	mkdir -p $(RELEASE_DIR)
	cd dist && zip -9rvo ../$(DIST_PKG) `find . -type f -not -name 'test.*'`
.PHONY: pkg-webext

pkg-source: clean-working-tree
	mkdir -p $(RELEASE_DIR)
	rm -rf $(RELEASE_DIR)/$(SRCPKG_DIR) $(SRC_PKG)
	git fetch -f origin
	git clone -b v$(VERSION) . $(RELEASE_DIR)/$(SRCPKG_DIR)
	git -C $(RELEASE_DIR)/$(SRCPKG_DIR) gc --aggressive
	tar -C $(RELEASE_DIR) -czf $(SRC_PKG) $(SRCPKG_DIR)
.PHONY: pkg-source

build-rel: node_modules icons
	npm run build-rel
	npm run test
	./node_modules/.bin/web-ext lint -s dist -i 'test.*'
.PHONY: build-rel

release-tag: clean-working-tree
	[ `git name-rev --tags --name-only HEAD` = "v$(VERSION)" ] || \
	    git tag v$(VERSION) HEAD
.PHONY: release-tag
.NOTPARALLEL: release-tag

clean-working-tree:
	[ -z "$$(git status --porcelain)" ] # Working tree must be clean.
.PHONY: clean-working-tree
.NOTPARALLEL: clean-working-tree



# Dependencies

node_modules package-lock.json: package.json
	npm install
	touch node_modules package-lock.json

node_modules: package-lock.json



# Cleanup targets

distclean: clean
	rm -rf node_modules $(RELEASE_DIR)/$(SRCPKG_DIR) $(SRC_PKG) $(DIST_PKG)
.PHONY: distclean

clean:
	rm -rf dist
.PHONY: clean
