build:
	pnpm run build
	pnpm link

install:
	mkdir -p ~/.n8n/custom && cd ~/.n8n/custom && pnpm link n8n-nodes-fractalforge

run:
	n8n

patch:
	pnpm version patch && git push

minor:
	pnpm version minor && git push

publish:
	pnpm publish
