SHELL:=/bin/bash

analyze:
	bash scripts/agent/analyze.sh

improve:
	bash scripts/agent/improve.sh "$(OBJ)"

test:
	bash scripts/agent/test.sh

document:
	bash scripts/agent/document.sh

git:
	bash scripts/agent/git-safe.sh "$(CMD)"

troubleshoot:
	bash scripts/agent/troubleshoot.sh "$(HINT)"

bootstrap:
	mkdir -p report docs .claude scripts/agent .github
	test -f STATE.md || echo "# Estado del agente\n" > STATE.md
	test -f TASKS.json || echo '[]' > TASKS.json
	@echo "Bootstrap OK."
