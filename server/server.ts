import * as fs from 'fs'

import * as restify from 'restify'
import * as mongoose from 'mongoose'
import {environment} from '../common/environment'
import {Router} from '../common/Router'
import {mergePatchBodyParser} from './merge-patch.parser'
import {handleError} from './error.handler'
import {tokenParser} from '../security/token.parser'

export class Server {

  application:restify.Server

  useNewUrlParser: true
  useUnifiedTopology: true


  initializeDb(): mongoose.MongooseThenable{
    (<any>mongoose).Promise = global.Promise
    return (<any>mongoose).connect(environment.db.url, {

      useCreateIndex: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,

     });


  }

  initRoutes(routers: Router[]): Promise<any>{
    return new Promise((resolve, reject)=>{
    try{

      const options: restify.ServerOptions = {
        name: 'novoprojeto',
        version:'1.0.0',
      }
      if(environment.security.enableHTTPS){

        options.certificate = fs.readFileSync(environment.security.certificate),
        options.key = fs.readFileSync(environment.security.key)
      }

      this.application = restify.createServer(options)

      this.application.use(restify.plugins.queryParser())
      this.application.use(restify.plugins.bodyParser())
      this.application.use(mergePatchBodyParser)
      this.application.use(tokenParser)

      //Routes
      for(let router of routers){
        router.applyRoutes(this.application)
      }

      this.application.listen(environment.server.port, ()=> {
        resolve(this.application)
      })

      this.application.on('restifyError', handleError)

    }catch(error){
      reject(error)
    }
  })
}


  bootstrap(routers: Router[] = []): Promise<Server>{
    return this.initializeDb().then(() =>
     this.initRoutes(routers).then(() => this))
  }

  shutdown(){
    return mongoose.disconnect().then(()=>this.application.close()
  )
  }




}
