export default defineNuxtConfig({
  app : {
    head : {
      title : 'Nuxt Electron Template'
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxt/eslint', 'nuxt-electron', '@nuxt/ui'],

  // Required to redirect to '/' on
  router: {
    options: {
      hashMode: true,  
    }
  },

  css: ['~/assets/css/main.css'],
  typescript: {
    includeWorkspace: true,
    tsConfig: {
      include: ["./electron/electron.d.ts"] 
    }
  },
  electron: {
      build: [
          {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  rollupOptions: {
                    external: [ ]
                  }
                }
              }
          },
          {
              entry: 'electron/preload.ts',
          },
      ],
      disableDefaultOptions: true,
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },
  build: {
    transpile: [ ]
  },
  imports: {
      dirs: [
        'composables',
        'composables/*/index.{ts,js,mjs,mts}',
        'composables/**',
      ]
  },
})