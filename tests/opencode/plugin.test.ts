import { expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Commentie } from "../../opencode/plugin"

async function loaded(options: Record<string, unknown> = {}, directory = process.cwd()) {
  const hooks = await Commentie({ directory } as any, options)
  const config: any = {}
  await hooks.config!(config)
  return { hooks, config }
}

test("registers the rule, commands and critic", async () => {
  const { hooks, config } = await loaded()

  expect(Object.keys(config.command)).toEqual(["commentie-cleanup", "commentie-install"])
  expect(config.agent["comment-critic"].mode).toBe("subagent")
  expect(config.agent["comment-critic"].permission.edit).toBe("deny")
  expect(config.agent["comment-critic"].prompt).not.toContain("---")
  expect(config.command["commentie-cleanup"].template).not.toContain("CLAUDE_PLUGIN_ROOT")

  const system = { system: [] as string[] }
  await hooks["experimental.chat.system.transform"]!({}, system)
  expect(system.system[0]).toContain("# Comments")
  expect(system.system[0]).toContain("HIDDEN COUPLING")
})

test("pins the critic model when configured", async () => {
  const { config } = await loaded({ criticModel: "anthropic/claude-haiku-4-5" })
  expect(config.agent["comment-critic"].model).toBe("anthropic/claude-haiku-4-5")
})

test("leaves the edit hook off by default", async () => {
  const { hooks } = await loaded()
  const output = { title: "Edit", output: "Applied", metadata: {} }
  await hooks["tool.execute.after"]!(
    { tool: "edit", sessionID: "s", callID: "c", args: { filePath: "a.py" } },
    output,
  )
  expect(output.output).toBe("Applied")
})

test("checks the destination of an apply_patch move", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "commentie-"))
  const from = path.join(directory, "a.py")
  const to = path.join(directory, "b.py")
  writeFileSync(from, "x = 1\n")
  writeFileSync(to, "x = 1\n# previously this was different\n")

  const { hooks } = await loaded({ hook: true }, directory)
  const output = {
    title: "Patch",
    output: "Applied",
    metadata: { files: [{ filePath: from, movePath: to }] },
  }
  await hooks["tool.execute.after"]!(
    { tool: "apply_patch", sessionID: "s", callID: "c", args: { patchText: "" } },
    output,
  )
  expect(output.output).toContain("history")
})
