VERSION := $(shell node -p "require('./package.json').version")

.PHONY: release bump-patch bump-minor bump-major

# Tag and push the current version — triggers the GitHub Actions release workflow
release:
	@echo "Releasing v$(VERSION)..."
	@git diff --exit-code --quiet || (echo "Uncommitted changes — commit first." && exit 1)
	git tag v$(VERSION)
	git push origin v$(VERSION)

# Bump version across all three config files, commit, then release
bump-patch:
	npm version patch --no-git-tag-version
	@$(MAKE) _sync-versions _commit-bump release

bump-minor:
	npm version minor --no-git-tag-version
	@$(MAKE) _sync-versions _commit-bump release

bump-major:
	npm version major --no-git-tag-version
	@$(MAKE) _sync-versions _commit-bump release

# Sync the version from package.json into tauri.conf.json and Cargo.toml
_sync-versions:
	$(eval NEW_VERSION := $(shell node -p "require('./package.json').version"))
	node -e "\
		const fs = require('fs'); \
		const p = 'src-tauri/tauri.conf.json'; \
		const c = JSON.parse(fs.readFileSync(p)); \
		c.version = '$(NEW_VERSION)'; \
		fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');"
	sed -i.bak 's/^version = ".*"/version = "$(NEW_VERSION)"/' src-tauri/Cargo.toml && rm src-tauri/Cargo.toml.bak

_commit-bump:
	$(eval NEW_VERSION := $(shell node -p "require('./package.json').version"))
	git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
	git commit -m "chore: bump version to v$(NEW_VERSION)"
