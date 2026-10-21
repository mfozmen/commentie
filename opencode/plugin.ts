import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { Hooks, Plugin, PluginOptions } from "@opencode-ai/plugin"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SCRIPT = path.join(ROOT, "scripts", "check_comments.py")
const EDIT_TOOLS = new Set(["edit", "write", "apply_patch", "patch"])

type Config = Parameters<NonNullable<Hooks["config"]>>[0] & {
  agent?: Record<string, Record<string, unknown>>
  command?: Record<string, Record<string, unknown>>
}

function stripFrontmatter(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n+/, "")
}

function readDoc(file: string) {
  return stripFrontmatter(readFileSync(path.join(ROOT, file), "utf8")).trim()
}

function scriptRoot() {
  return ROOT.replaceAll("\\", "/")
}

function findPython() {
  for (const bin of ["python3", "python"]) {
    const probe = spawnSync(bin, ["--version"], { encoding: "utf8", windowsHide: true })
    if (!probe.error && probe.status === 0) return bin
  }
}

function changedFiles(input: { tool: string; args: any }, metadata: any) {
  if (input.tool === "apply_patch" || input.tool === "patch") {
    const files = Array.isArray(metadata?.files) ? metadata.files : []
    return [...new Set(files.map((file: any) => file?.filePath).filter((file: any) => typeof file === "string"))]
  }
  const file = input.args?.filePath
  return typeof file === "string" && file ? [file] : []
}

function enabled(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1"
}

export const Commentie: Plugin = async (input, rawOptions?: PluginOptions) => {
  const options = rawOptions ?? {}
  const hook = enabled(options.hook) || enabled(process.env.COMMENTIE_HOOK)
  const criticModel = typeof options.criticModel === "string" ? options.criticModel : undefined
  const python = hook ? findPython() : undefined

  const rule = readDoc("skills/comments/SKILL.md")
  const cleanup = readDoc("skills/cleanup/SKILL.md").replaceAll("${CLAUDE_PLUGIN_ROOT}", scriptRoot())
  const install = readDoc("opencode/install.md").replaceAll("${CLAUDE_PLUGIN_ROOT}", scriptRoot())
  const critic = readDoc("agents/comment-critic.md").replaceAll("${CLAUDE_PLUGIN_ROOT}", scriptRoot())

  return {
    config: async (config) => {
      const cfg = config as Config
      cfg.agent ??= {}
      cfg.agent["comment-critic"] ??= {
        description:
          "Read-only review of the comments ADDED in a diff range. Reports narrative comments as one warning-level finding, raised once per branch, never a blocker.",
        mode: "subagent",
        prompt: critic,
        steps: 15,
        maxSteps: 15,
        color: "#e5c07b",
        permission: { edit: "deny" },
        ...(criticModel ? { model: criticModel } : {}),
      }
      cfg.command ??= {}
      cfg.command["commentie-cleanup"] ??= {
        description: "Clean the comments in a diff range or path. Never changes code behaviour.",
        template: cleanup,
      }
      cfg.command["commentie-install"] ??= {
        description: "Install the commentie comments rule and optional pre-commit or CI wiring.",
        template: install,
      }
    },
    "experimental.chat.system.transform": async (_input, output) => {
      if (rule && !output.system.includes(rule)) output.system.push(rule)
    },
    "tool.execute.after": async (toolInput, output) => {
      if (!hook || !python || !EDIT_TOOLS.has(toolInput.tool)) return
      const files = changedFiles(toolInput, output.metadata)
      if (!files.length) return

      const findings: string[] = []
      for (const file of files) {
        const result = spawnSync(python, [SCRIPT, "--file", file], {
          cwd: input.directory,
          encoding: "utf8",
          timeout: 15000,
          windowsHide: true,
        })
        const text = (result.stdout ?? "").trim()
        if (text) findings.push(text)
      }
      if (!findings.length) return

      output.output +=
        "\n\ncommentie: comments in this edit look narrative (warning only):\n" +
        findings.join("\n") +
        "\nKeep only the why, the trap or the coupling, in one short sentence."
    },
  }
}
