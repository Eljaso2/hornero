# Proyecto de Emails para Promoción de Eventos

> Sistema de gestión de contactos por grupos temáticos para difusión de eventos académicos y activistas.

## Estructura

```
emails/
├── README.md                        # Este archivo
├── grupos/                          # Listas de contactos por temática
│   ├── violencia-empresarial.md     # Violencia empresarial, memoria y reparación
│   ├── historia-norte-santa-fe.md   # Historia del norte de Santa Fe
│   └── jornada-interescuelas.md     # Jornada Interescuelas de Historia
└── envios/                          # Registro de envíos realizados
```

## Cómo usar

### Agregar un contacto
Editar el archivo del grupo correspondiente y agregar una fila en la tabla de contactos.

### Agregar un grupo nuevo
1. Crear un archivo `grupos/nombre-del-grupo.md`
2. Copiar la estructura de cualquier grupo existente
3. Agregar el grupo al índice de este README

### Registrar un envío
1. Crear un archivo en `envios/` con formato `YYYY-MM-DD-grupo-evento.md`
2. Incluir: fecha, grupo, asunto, evento, cantidad de destinatarios

## Grupos activos

| Grupo | Archivo | Contactos |
|-------|---------|-----------|
| Violencia Empresarial | [violencia-empresarial.md](grupos/violencia-empresarial.md) | 93 |
| Historia del Norte de Santa Fe | [historia-norte-santa-fe.md](grupos/historia-norte-santa-fe.md) | 93 |
| Jornada Interescuelas de Historia | [jornada-interescuelas.md](grupos/jornada-interescuelas.md) | 93 |

## Convenciones

- **Formato**: Markdown con tablas, editable en cualquier editor
- **Datos por contacto**: Nombre, Email, Institución, Notas
- **Instituciones**: Inferir del dominio del email cuando sea posible (`.edu.ar`, `.unc.edu.ar`, etc.)
- **Notas**: Campo libre para contexto (ej: "colega de X", "asistió a jornada 2024")
- **Versionado**: Cada cambio se commitea con git
