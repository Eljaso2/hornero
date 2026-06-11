# Workspace

Your dedicated work area organized for consistency and clarity.

## Structure

```
Workspace/
├── global-rules/          # System-wide conventions
│   ├── STYLE-GUIDE.md     # Code style and formatting
│   ├── TASK-WORKFLOWS.md  # Standard task process
│   ├── BRIEFING.md        # AI assistant context
│   └── README.md
│
└── concrete-projects/     # Specific projects and tasks
    ├── example-project/   # Template project
    ├── [your-project-1]/
    ├── [your-project-2]/
    └── README.md
```

## Quick Start

1. **Review Global Rules**: Read [global-rules/README.md](global-rules/README.md) to understand the conventions
2. **Create a New Project**: Follow the template in [concrete-projects/README.md](concrete-projects/README.md)
3. **Keep Notes**: Document decisions and learnings in each project's `notes/` folder
4. **Follow Workflows**: Use the task workflows from `global-rules/` for all work

## Key Documents

| Document | Purpose | Location |
|----------|---------|----------|
| Style Guide | Code conventions and formatting | [global-rules/STYLE-GUIDE.md](global-rules/STYLE-GUIDE.md) |
| Task Workflows | Standard process for planning and completing work | [global-rules/TASK-WORKFLOWS.md](global-rules/TASK-WORKFLOWS.md) |
| Briefing | Context for your AI assistant | [global-rules/BRIEFING.md](global-rules/BRIEFING.md) |
| Project Template | Structure for new projects | [concrete-projects/](concrete-projects/) |

## Principles

- **Consistency**: All projects follow global rules
- **Clarity**: Clear documentation and organization
- **Scalability**: Easy to add new projects
- **Maintainability**: Notes and decisions stay with the project

## Getting Started with a New Project

```bash
cd concrete-projects/
mkdir my-new-project
cd my-new-project

# Create project structure
touch README.md
mkdir notes src tests

# Update README with project details
# Follow STYLE-GUIDE.md for code
# Use TASK-WORKFLOWS.md for project management
```

## Tips

- 📝 Keep [global-rules/BRIEFING.md](global-rules/BRIEFING.md) updated with your preferences
- 📌 Reference global rules in all projects
- 🗂️ Use `notes/` folders extensively for decisions and learnings
- ✅ Track progress using TODO lists in README files
- 🔗 Link between projects when they share patterns or code

---

**Location**: `/Users/eljaso/Workspace/`  
**Last Updated**: 2026-06-10
