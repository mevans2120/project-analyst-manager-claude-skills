# Project Management Dashboard - Vite + Lit

**Status**: PM-19 Complete ✅
**Version**: 1.0.0
**Tech Stack**: Vite 5 + Lit 3 + TypeScript

## Quick Start

### Development
```bash
npm run dev
```
Opens browser at http://localhost:5173 with Hot Module Replacement (HMR)

### Build for Production
```bash
npm run build
```
Outputs to `dist/` directory

### Preview Production Build
```bash
npm run preview
```

### Type Check
```bash
npm run type-check
```

## Project Structure

```
dashboard/
├── index.html              # Entry point
├── package.json            # Dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── main.ts            # Application entry
│   ├── components/        # Lit components
│   ├── styles/
│   │   └── global.css     # Global styles
│   ├── types/             # TypeScript types
│   └── services/          # Services (FileWatcher, etc.)
├── public/                # Static assets
│   └── favicon.svg
└── dist/                  # Production build (generated)
```

## Features Implemented (PM-19)

✅ Vite 5 development server with HMR
✅ Lit 3 web components framework
✅ TypeScript strict mode
✅ Path aliases (@components, @types, @styles, @services)
✅ GitHub dark theme global styles
✅ Fast build times (~300ms dev server start)

## What's Next (PM-20)

- TypeScript component architecture
- Base component classes
- Reactive state management
- Type-safe data structures

## Development Notes

### Hot Module Replacement (HMR)
Changes to `.ts`, `.css`, and component files automatically reload without full page refresh.

### Path Aliases
```typescript
import { MyComponent } from '@components/my-component';
import { Feature } from '@types/roadmap';
import '@styles/global.css';
```

### TypeScript Configuration
- Strict mode enabled
- Experimental decorators for Lit
- `useDefineForClassFields: false` required for Lit decorators

## Migration Status

### Old Static Files (Backed Up)
- `index.html.old` - Original roadmap view
- `tests.html.old` - Original tests view
- `data.js` - Still used for roadmap data

These will be migrated to Lit components in PM-22 and PM-23.

## Browser Support

Modern browsers with ES2020 support:
- Chrome/Edge 80+
- Firefox 74+
- Safari 13.1+

## Performance

- Dev server starts in ~300ms
- HMR updates in <100ms
- Production build TBD (will be <100KB gzipped)
