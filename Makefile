PACKAGE := capture-this
VERSION := $(shell node -e "x=`cat assets/manifest.json`; console.log(x.version)")
COMMIT := $(shell git rev-parse --short HEAD)
DEV_TAG := $(if $(shell git tag --points-at=HEAD),,-dev)
DIRTY_TAG := $(if $(shell git status --porcelain),-dirty,)
FULL_VERSION := $(VERSION)$(DEV_TAG)-$(COMMIT)$(DIRTY_TAG)

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
	$(MAKE) distclean release-tag
	$(MAKE) rel-inner
.PHONY: rel

# rel-inner is separate from rel since the version-number variables at the top
# of this file will change after the release tag is created.
rel-inner:
	$(MAKE) pkg-webext pkg-source
	$(MAKE) -C $(RELEASE_DIR)/$(SRCPKG_DIR) release-tag pkg-webext pkg-source
	[ -z "$$(diff -Nru dist $(RELEASE_DIR)/$(SRCPKG_DIR)/dist)" ]
	rm -rf $(RELEASE_DIR)/$(SRCPKG_DIR)
	@echo ""
	@echo "Ready for release $(VERSION)!"
	@echo
	@echo "Git tag:         v$(VERSION)"
	@echo "Release package: $(DIST_PKG)"
	@echo "Source package:  $(SRC_PKG)"
	@echo
	@echo "If everything looks good, run \"git push && git push --tags\", and"
	@echo "upload to AMO."
	@echo ""
.PHONY: rel-inner

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



# Icons
# (Makefile code copied from Tab Stash)

DARK_ICONS = $(patsubst icons/%,dist/icons/dark/%,$(wildcard icons/*.svg))
LIGHT_ICONS = $(patsubst icons/%,dist/icons/light/%,$(wildcard icons/*.svg))
LOGO_ICONS = dist/icons/logo.svg \
	$(foreach size,48 96 128,dist/icons/logo-$(size).png)
TOOLBAR_ICONS = \
	$(foreach size,16 32,dist/icons/logo-$(size).png) \
	$(foreach theme,dark light,$(foreach size,16 32,dist/icons/$(theme)/logo-$(size).png))

icons: $(DARK_ICONS) $(LIGHT_ICONS) $(LOGO_ICONS) $(TOOLBAR_ICONS)
.PHONY: icons

dist/icons/dark/%.svg: icons/%.svg
	@mkdir -p $(dir $@)
	sed 's%style="[^"]*"%style="fill:#fbfbfe"%g' <$< >$@

dist/icons/%.svg: icons/%.svg
	@mkdir -p $(dir $@)
	sed 's%style="[^"]*"%style="fill:#808080"%g' <$< >$@

dist/icons/light/%.svg: icons/%.svg
	@mkdir -p $(dir $@)
	sed 's%style="[^"]*"%style="fill:#222426"%g' <$< >$@

%-16.png: %.svg
	inkscape "$<" -o "$@" -D -w 16 -h 16
%-32.png: %.svg
	inkscape "$<" -o "$@" -D -w 32 -h 32
%-48.png: %.svg
	inkscape "$<" -o "$@" -D -w 48 -h 48
%-64.png: %.svg
	inkscape "$<" -o "$@" -D -w 64 -h 64
%-96.png: %.svg
	inkscape "$<" -o "$@" -D -w 96 -h 96
%-128.png: %.svg
	inkscape "$<" -o "$@" -D -w 128 -h 128



# Cleanup targets

distclean: clean
	rm -rf node_modules $(RELEASE_DIR)/$(SRCPKG_DIR) $(SRC_PKG) $(DIST_PKG)
.PHONY: distclean

clean:
	rm -rf dist
.PHONY: clean
