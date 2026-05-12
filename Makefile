.PHONY: dev build preview deploy-cdn clean

dev:
	npm run dev

build:
	npm run build

preview: build
	npm run preview

# Sync assets-cdn/ → ftp.ssbx.site:/cue/  (requires ssh access configured)
# Set FTP_SSH=user@host in environment.
deploy-cdn:
	@if [ -z "$$FTP_SSH" ]; then echo "Set FTP_SSH=user@host first"; exit 1; fi
	rsync -avz --progress assets-cdn/ "$$FTP_SSH":/var/www/ftp/cue/

clean:
	rm -rf dist node_modules/.vite
