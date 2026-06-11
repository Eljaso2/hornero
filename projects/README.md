# Concrete Projects

This folder contains your specific projects and tasks. Each project is independent but follows the global conventions from the `global-rules/` folder.

## Project Structure Template

For each new project, create a folder with this structure:

```
project-name/
├── README.md              # Project overview, setup, and status
├── notes/                 # Project-specific documentation
│   ├── architecture.md
│   ├── decisions.md
│   └── learnings.md
├── src/                   # Source code
│   └── ...
├── tests/                 # Tests
│   └── ...
├── .instructions.md       # (Optional) Project-specific AI instructions
└── package.json           # (Optional) Or relevant config files
```

## Adding a New Project

1. Create a new folder with a descriptive kebab-case name (e.g., `my-awesome-feature`)
2. Copy the structure above
3. Update the README with project-specific information
4. Reference [global rules](../global-rules/) for conventions
5. Keep notes updated as you work

## Conventions

- Follow the **Style Guide** from `global-rules/STYLE-GUIDE.md`
- Use **Task Workflows** from `global-rules/TASK-WORKFLOWS.md`
- Use session memory (`/memories/session/`) for task-specific context
- Use repo memory (`/memories/repo/`) for project-discovered conventions

## Current Projects

- [seminario-historia-norte-santa-fe/](seminario-historia-norte-santa-fe/) — Seminario Permanente de Historia del Norte de Santa Fe (1870-1983). Programa, unidades y 8 encuentros.

