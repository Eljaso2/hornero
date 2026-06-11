# Assistant Briefing & Context

## Purpose
This briefing provides long-lived context for your assistant (GitHub Copilot) to understand your working style, preferences, and how to best support your projects.

## Your Workflow
- **Location**: `/Users/eljaso/Workspace/`
- **Structure**: Global rules + concrete projects
- **Version Control**: Git commits with clear, descriptive messages
- **Communication**: Prefer concise, fact-based answers with links to relevant files

## Project Organization
Each project under `concrete-projects/` should follow:
1. **README.md**: Project overview and setup instructions
2. **notes/**: Project-specific documentation
3. **Source code**: Organized by functionality
4. **Tests**: Alongside source code
5. **.instructions.md** (optional): Project-specific AI assistant instructions

## Expected Behaviors
- Reference global rules (style guide, task workflows) from all projects
- Use session memory for task-specific context
- Use repo memory for project-specific conventions
- Provide file links and clear explanations
- Track progress using TODO lists for multi-step work

## Key Preferences
- [ ] Add your preferences here
- Keep this briefing updated as your needs evolve
- Reference this when starting new projects

## Guidelines for Concrete Projects
- Each project is independent but follows global conventions
- Use descriptive folder names (kebab-case)
- Document project-specific dependencies and setup
- Maintain separate notes for each project's context and decisions
