import { existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { mainLogger } from './Logger';
import { pathToFileURL } from 'url';
type TBootstrap = {
  isProd : boolean,
  pathLocation : string
  nitroPort: number
  initPath : string
}

export default class Bootstrap {
  private nitroPort : number  = 3000
  private isProd : boolean = false
  private pathLocation : string
  private initPath: string
  private nitroServer : unknown
  private preloadPath : string
  private databasePath ?: string

  constructor({isProd, pathLocation, nitroPort, initPath} : TBootstrap){
    this.isProd = isProd
    this.pathLocation = pathLocation
    this.nitroPort = nitroPort
    this.initPath = initPath
    this.preloadPath = isProd ?
      join(pathLocation,'app.asar','dist-electron', 'preload.js') :
      join(pathLocation,'dist-electron', 'preload.js')
  }

  getNitroPort = () => this.nitroPort
  getNitroServer = () => this.nitroServer
  getPreloadPath = () => this.preloadPath


  init = async () => {
    try {
      await this.initializedDB()
      await this.startWebServer()
    } catch (error) {
      mainLogger.error(`${error}`)
    }
  }

  loadEnv = async () => {
    try {
      const envPath = this.isProd ? join(this.pathLocation,'app.asar.unpacked', 'env-file') : join(process.cwd(), 'env-file');
      
      if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf8');
        const envVars = envFile.split('\n');
        
        for (const line of envVars) {
          const [key, ...value] = line.split('=');
          if (key && !key.startsWith('#')) {
            process.env[key.trim()] = value.join('=').trim();
          }
        }
      }
    } catch (error) {
      mainLogger.error(`Error loading env file: ${error}` );
    }
  }

  initializedDB = async () => {
    try {
      const logDir =  join( this.isProd ? this.initPath : process.cwd(), 'logs');
      const dbOrigin = this.isProd ? join( this.pathLocation,'app.asar.unpacked' , 'data.db') : join( process.cwd(),  'data.db')
    
      if (this.isProd) {
        const targetPath = join(this.initPath, 'data.db');
        
        if (!existsSync(targetPath)) {
          copyFileSync(dbOrigin, targetPath);
        }
      }
      
      await this.loadEnv()
      this.databasePath = join( this.isProd ?  this.initPath : process.cwd(),  'data.db');


      process.env.DB_STORAGE_PATH =  this.databasePath
      process.env.LOGS_PATH= logDir
      process.env.TEMPLATE_PATH=  this.isProd? join(this.pathLocation,'app.asar.unpacked') : join( process.cwd())
      process.env.NITRO_PORT=`${this.nitroPort}`
    } catch (error) {
      mainLogger.error(`InitializedDB : ${error}`);
    }
  }

  startWebServer = async () => {
    if(!this.isProd) return 

    const pathLocation = this.pathLocation
    try {
    
      const modulePath = this.isProd ? 
        join(pathLocation,'app.asar','.output', 'server', 'index.mjs') :
        join(pathLocation, '.output', 'server', 'index.mjs');
  
      const moduleUrl = pathToFileURL(modulePath).href;
      
      // Dynamically import the server module
      const { default: nodeServer } = await import(moduleUrl);
      if (typeof nodeServer === 'function') {
        const server = await nodeServer();
  
        const address = server.address();
        const port = typeof address === 'string' ? address : address?.port;
        mainLogger.log(`Listening to port ${port}`);
  
        this.nitroServer = server
        this.nitroPort = port
        return this.nitroServer;
      } else {
        mainLogger.log('Nuxt SSR server loaded (auto-started on import)');
        return nodeServer;
      }
    } catch (error) {
      mainLogger.error(`Failed to start web server: ${error}`);
      throw error;
    }
  }
  
  stopWebServer = async () => {
    if (this.nitroServer) {
      try {
        if (typeof this.nitroServer?.close === 'function') {
          await new Promise((resolve, reject) => {
            this.nitroServer?.close((err: unknown) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
          mainLogger.log('Nuxt SSR server stopped');
        }
      } catch (error) {
        mainLogger.log(`Error stopping web server: ${error}`);
      } finally {
        this.nitroServer = null;
      }
    }
  }
}