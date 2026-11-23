# 🍲💪 FamilyFit

Planificador familiar de **nutrición y entrenamiento** con comida peruana y
**lista de compras semanal económica**. Web mobile-first: una cuenta por
familia, varios miembros, cálculos energéticos personalizados y planes de
comida donde **toda la familia come lo mismo, en porciones distintas**.

> ⚠️ **Aviso:** la app ofrece estimaciones generales y **no sustituye la
> asesoría de un nutricionista o médico**. Cada miembro debe corroborar su
> plan con un profesional, especialmente ante alergias, intolerancias o
> condiciones de salud.

## Stack

- **Next.js 14 (App Router) + React + TypeScript**, responsive mobile-first.
- **Tailwind CSS** para la UI.
- **Supabase** (PostgreSQL + Auth + Row Level Security).
- Pensado para desplegar en **Vercel**.

## Qué hace

- **Cuentas por familia** y miembros con peso, estatura, edad, sexo, NEAT,
  deporte y si quiere ir al gimnasio.
- **Cálculos energéticos**: BMR (Mifflin-St Jeor) → TDEE → objetivo según
  fase → macros (proteína por g/kg, grasa mínima saludable, resto carbos),
  en gramos y %.
- **3 fases**: Recomposición, Ajuste y Mantenimiento, cada una con sus
  calorías objetivo, déficit/superávit y macros.
- **Rutina de gimnasio** básica por fase/objetivo, solo si el miembro lo pide.
- **Platos e ingredientes peruanos editables** (CRUD): cada plato calcula
  solo sus calorías y macros desde sus ingredientes.
- **Plan semanal + lista de compras** consolidada con costo estimado y el
  desglose de **porciones por miembro** por comida.
- **Composición corporal**: registra las mediciones de tu balanza (peso, % de
  grasa, masa muscular, grasa visceral). Con % de grasa, el BMR pasa a
  **Katch-McArdle** (usa tu masa magra) y la app te muestra cuánto músculo
  ganar y cuánta grasa perder para llegar a tu meta.
- **Rutina personalizada** por día de la semana (fuerza, cardio o descanso),
  con plantillas de partida que luego editas.
- **Diario de comidas**: registra alimentos (por gramos o porción: 1 scoop,
  1 cda, 1 huevo), platos o comidas fuera de casa, y ve en tiempo real cuánto
  te falta de calorías y proteína.
- **Básicos fitness y suplementos** en la despensa (whey, creatina,
  mantequilla de maní, tilapia, camote, yogurt griego…) con platos de ejemplo.

Todos los cálculos y la lista de compras se **derivan de la base de datos
editable**, nunca de valores fijos en el código.

## Estructura

```
src/
  app/                # Rutas (App Router): login, dashboard, members,
                      # ingredients, dishes, planner + server actions
  components/         # UI reutilizable (mobile-first)
  lib/
    calc/             # Motor de cálculo PURO y testeado
      energy.ts       #   BMR, TDEE, fases, macros
      nutrition.ts    #   nutrición de platos, porciones, lista de compras
      training.ts     #   rutinas de gimnasio por fase/objetivo
    seed/             # Data peruana de ARRANQUE (editable) — ver aviso abajo
    supabase/         # Clientes (browser/server) y tipos de la BD
    data.ts           # Acceso a datos del servidor
supabase/
  migrations/         # Esquema SQL + Row Level Security
```

> La data de `src/lib/seed/peruvian-seed.ts` es **solo un punto de partida**.
> Precios y nutrición son referenciales (sector B-C) y se siembran una vez
> por familia. A partir de ahí editas todo desde la app o desde Supabase.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto Supabase y aplicar el esquema

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_tracking.sql`
3. (Opcional) En **Authentication → Providers → Email**, desactiva la
   confirmación por correo si quieres entrar de inmediato tras registrarte.

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y rellena con los datos de
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Correr en local

```bash
npm run dev
```

Al crear tu familia (registro), la app siembra automáticamente los platos e
ingredientes peruanos de ejemplo, listos para editar.

### Si ya tenías la app funcionando

Ejecuta solo `supabase/migrations/0003_tracking.sql` en el SQL Editor y, en la
app, entra a **Despensa → “Agregar básicos fitness y suplementos que falten”**.
No toca lo que ya editaste.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests del motor de cálculo (Vitest) |
| `npm run typecheck` | Verifica tipos |
| `npm run lint` | ESLint |

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Define las dos variables `NEXT_PUBLIC_SUPABASE_*` en el proyecto de Vercel.
3. Deploy. (El esquema SQL ya debe estar aplicado en Supabase).

## Editar la base de datos

Puedes administrar ingredientes y platos de **dos formas**:

- **Desde la app**: secciones *Despensa* (ingredientes) y *Platos*.
- **Desde Supabase**: el *Table Editor* del dashboard, tablas `ingredients`,
  `dishes` y `dish_ingredients`.

Ambas respetan Row Level Security: cada familia solo ve y edita lo suyo.
