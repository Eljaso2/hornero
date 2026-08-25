# Workspace

Área de trabajo central. Los proyectos activos viven en `projects/`.

## Estructura

```
Workspace/
├── projects/                  # Proyectos activos
│   ├── hornero/               # Ecosistema Hornero (app + backend + RAG)
│   ├── estudios-masacres/     # Red de Estudios sobre Masacres en AL
│   ├── historia-norte-santa-fe/ # Seminario Historia Norte de Santa Fe
│   ├── violencia-empresarial/ # Violencia empresarial, memoria y reparación
│   ├── tricontinental/        # Newsletter Tricontinental IA en AL
│   └── operativos/            # Operativos sindicales
│
├── global-rules/              # Convenciones transversales
│   ├── STYLE-GUIDE.md
│   ├── TASK-WORKFLOWS.md
│   └── BRIEFING.md
│
├── render.yaml                # Deploy Render.com (backend Hornero)
├── skills-lock.json           # Lock de skills Claude Code
└── .github/                   # CI / workflows
```

## Archivos raíz

| Archivo | Función |
|---|---|
| `render.yaml` | Config de deploy en Render.com para `hornero-ia` |
| `skills-lock.json` | Lock file de skills Claude Code (auto-generado, no editar a mano) |

## Principios

- **Consistencia**: seguir convenciones de `global-rules/`
- **Documentación**: cada proyecto mantiene su propio README y notas
- **Commits frecuentes**: un commit por paso lógico, no acumular al final
