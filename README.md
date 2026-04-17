
**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 1) Set up Figma MCP in VS Code

This project uses the Figma MCP server so Copilot can read design context directly from Figma.

Option A: Manual config file

Create or confirm this file exists:

- `.vscode/mcp.json`

Use this config:

```json
{
	"servers": {
		"figma": {
			"url": "https://mcp.figma.com/mcp",
			"type": "http"
		}
	},
	"inputs": []
}
```

Option B: Command Palette setup

1. Open Command Palette (`Cmd+Shift+P`).
2. Run an MCP server setup command (for example `MCP: Add Server`).
3. Choose HTTP server type.
4. Enter URL: `https://mcp.figma.com/mcp`.
5. Name it `figma`.
6. Save to workspace settings (`.vscode/mcp.json`).

Then reload VS Code (`Developer: Reload Window`) so the MCP server is picked up.

## 2) Use Figma MCP (select layer + provide URL)

1. In Figma, select the layer/frame/component you want to implement.
2. Copy the link to that selection (it must include `node-id`).
3. In VS Code Copilot Chat, send the Figma URL and ask for design context or implementation.

Example prompt:

```text
Use mcp_figma_get_design_context for this URL:
https://www.figma.com/design/FILE_KEY/File-Name?node-id=332-330
Then update my homepage to match it.
```

Tips:

- If the URL has no `node-id`, re-copy the link from the selected layer in Figma.
- You can target a different layer by selecting it and copying that layer URL again.
- Keep using the same prompt style for faster design-to-code updates.
