# Contribuir a Remedis

Remedis está bajo [AGPL v3](LICENSE): puedes usarlo, estudiarlo y modificarlo,
y lo que aportes aquí se publica con esa misma licencia.

---

## Entorno

Requisitos: **Node 20+**, **pnpm** y **Docker**.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:setup      # migraciones + seed
pnpm dev
```

El seed crea una **Clínica Demo** con un usuario por rol e imprime las
contraseñas al terminar.

### Las variables van en el entorno, no sólo en `.env`

La configuración de Prisma resuelve `DATABASE_URL` desde el entorno del
proceso. Por eso los scripts usan `node --env-file=.env`. Si ejecutas Prisma a
mano, expórtalas primero o fallará con `PrismaConfigEnvError`:

```bash
set -a; . ./.env; set +a
node node_modules/prisma/build/index.js migrate status
```

Y comprueba siempre a qué base apuntas antes de migrar o sembrar.

---

## Cómo está modelado

Vale la pena entender esto antes de tocar el esquema.

### El paciente no siempre es un empleado

`Employee` y `Dependent` son entidades distintas, y casi todo lo clínico
—`Appointment`, `MedicalRecord`, `Prescription`, `Incapacidad`— lleva **las
dos claves foráneas, ambas opcionales**: se rellena una u otra. Al escribir una
consulta nueva, no asumas que hay empleado: puede ser el hijo de uno.

### El medicamento tiene procedencia

`ProductSource` distingue `EMPRESA` de `IHSS`. La procedencia viaja en el
producto, en el lote y en el almacén, porque lo que compra la empresa y lo que
llega del seguro social se despachan del mismo mostrador pero **se reportan por
separado**. Perder ese dato convierte el reporte de consumo en algo que no se
puede presentar a nadie.

### El inventario se mueve por lotes, no por producto

`ProductBatch` tiene su propia caducidad y su propio `currentQty`. Una
dispensación descuenta de un lote concreto; descontar del producto en abstracto
rompería la trazabilidad y las alertas de vencimiento.

### El aislamiento entre empresas es por `tenantId`

Cada tabla del negocio lo lleva. **Toda consulta tiene que filtrar por él.**
No hay Row Level Security que te cubra el descuido: si olvidas el `where`, la
consulta devuelve datos de otras empresas y nada falla visiblemente. Es el
error más caro que se puede cometer en este código.

### Los valores de dominio son enums de PostgreSQL

`Gender`, `AppointmentType`, `AppointmentStatus`, `IncapacidadTipo`,
`ProductCategory`, `ProductSource`, `PrescriptionStatus`. La base rechaza un
valor que no exista, así que consúltalos antes de inventar cadenas.

---

## Antes del pull request

```bash
pnpm lint
pnpm build
```

Si cambiaste el esquema, añade la migración y súbela con el cambio.

---

## Estilo

- **Español** en la interfaz y en los mensajes de commit; el esquema y el
  código están en inglés salvo el vocabulario que no tiene traducción útil
  (`incapacidades`, `IHSS`).
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`.
- Comenta el **porqué**, no el qué.

---

## Pull requests

1. Rama descriptiva: `feat/recetas-parciales`, `fix/lote-vencido`.
2. Un pull request, un tema.
3. En la descripción: qué problema resuelve y cómo lo probaste. Si tocaste
   consultas a la base, di explícitamente que filtran por `tenantId`.
4. **Nunca subas datos clínicos reales**: ni volcados, ni capturas con
   pacientes de verdad. Las imágenes de este repositorio salen de una
   instancia local con datos inventados.

---

## Seguridad

Una vulnerabilidad no se reporta en un issue público. Escribe a
<Esdras.Clother@outlook.com> con los pasos para reproducirla.

Ten presente el radio de impacto: esto guarda expedientes médicos. Un fallo en
el filtrado por `tenantId` no expone los datos de una empresa, sino los de
todas.
