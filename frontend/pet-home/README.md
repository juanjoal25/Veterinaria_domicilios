# PetHome Frontend

Plataforma web para servicios veterinarios a domicilio construida con React + Vite y Supabase.

## Características

- Autenticación completa con Supabase Auth
- Protección de rutas por roles (cliente/admin)
- Landing page responsive con diseño moderno
- Dashboard para clientes y administradores
- Diseño mobile-first con colores cálidos

## Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Estilos**: CSS puro con variables personalizadas
- **Autenticación**: Supabase Auth
- **Base de datos**: Supabase PostgreSQL
- **Iconos**: Lucide React
- **Router**: React Router DOM

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/juanjoal25/Veterinaria_domicilios.git
   cd frontend
   cd pet-home
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env en la raíz del proyecto
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_publica
   ```

4. **Configurar base de datos**
   - Ejecutar las queries SQL del archivo `supabase-rls-policies.sql` en el SQL Editor de Supabase
   - Esto configurará las tablas, políticas RLS y datos iniciales

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## Rutas

| Ruta | Descripción | Acceso |
|------|-------------|---------|
| `/` | Landing page | Público |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro | Público |
| `/dashboard` | Dashboard cliente | Solo clientes |
| `/admin` | Dashboard admin | Solo administradores |

## Autenticación

El sistema maneja dos roles:

- **client**: Usuarios que pueden agendar citas y gestionar sus mascotas
- **admin**: Administradores con acceso completo al sistema

### Registro de usuarios
- Los nuevos usuarios se registran automáticamente como 'client'
- Requiere confirmación por email
- Validación de contraseñas seguras

### Protección de datos
- Row Level Security (RLS) habilitada
- Los clientes solo ven sus propios datos
- Los administradores tienen acceso completo

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
```

## Paleta de Colores
```css
--color-base: #F5EDE3      /* Fondo principal */
--color-primary: #ED7959   /* Color primario */
--color-secondary: #FFD8C2 /* Color secundario */
--color-text: #2F2F2F      /* Texto principal */
```