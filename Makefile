build:
	pnpm run build
	pnpm link

install:
	mkdir -p ~/.n8n/custom && cd ~/.n8n/custom && pnpm link n8n-nodes-fractalforge

patch:
	pnpm version patch && git push

publish:
	pnpm publish
