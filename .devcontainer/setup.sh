#!/bin/bash
set -e

# Configure network restrictions and git hooks

sudo sh -c '
  iptables -A OUTPUT -d api.openai.com -j DROP
  iptables -A OUTPUT -d api.anthropic.com -j DROP
  iptables -A OUTPUT -d codeium.com -j DROP
  iptables -A OUTPUT -d server.codeium.com -j DROP
  iptables -A OUTPUT -d tabnine.com -j DROP
  iptables -A OUTPUT -d api.tabnine.com -j DROP
  iptables -A OUTPUT -d api.continue.dev -j DROP
  iptables -A OUTPUT -d api.supermaven.com -j DROP
  iptables -A OUTPUT -d models.inference.ai.azure.com -j DROP
  iptables -A OUTPUT -d api.githubcopilot.com -j DROP
  iptables -A OUTPUT -d copilot-proxy.githubusercontent.com -j DROP
  iptables -A OUTPUT -d api.sourcegraph.com -j DROP
  iptables -A OUTPUT -d cody-gateway.sourcegraph.com -j DROP
  iptables -A OUTPUT -d generativelanguage.googleapis.com -j DROP
  iptables -A OUTPUT -d api.anthropic.com -j DROP
  iptables -A OUTPUT -d bedrock.amazonaws.com -j DROP
  iptables -A OUTPUT -d api-inference.huggingface.co -j DROP
  iptables -A OUTPUT -d api.replicate.com -j DROP
  iptables -A OUTPUT -d api.together.ai -j DROP
  iptables -A OUTPUT -d api.baseten.co -j DROP
  iptables -A OUTPUT -d api.mistral.ai -j DROP
  iptables -A OUTPUT -d api.deepseek.com -j DROP
  iptables -A OUTPUT -d perplexity.ai -j DROP
  iptables -A OUTPUT -d api.perplexity.ai -j DROP
' 2>/dev/null || true

chmod +x .devcontainer/hooks/prepare-commit-msg 2>/dev/null || true
git config core.hooksPath .devcontainer/hooks

echo ""
echo "— Jobtern assessment environment ready. Read TASK.md to begin. —"
echo ""
