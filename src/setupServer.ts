import { CustomError, IErrorResponse } from './shared/globals/helpers/error-handlers';
import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
  application
} from 'express';
import http from 'http';
//Security library
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
//standard middleware library
import cookieSession from 'cookie-session'; // compress our request and response
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import 'express-async-errors';
import compression from 'compression';
import { config } from './config';
import applicationRoutes from './routes';

const SERVER_PORT = 3001;
const log: Logger = config.createLogger('server');

export class ChattyServer {
  private app: Application; // create instance of express application

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000, //time for which cookie will be valid
        secure: config.NODE_ENV !== 'development' //set this to true when deployed in priduction and use https
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true, //for using cookie
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }
  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(
      json({
        limit: '50mb' //request limit will be 50mb max if more than that it will through error
      })
    );
    //serve encoded data from server to client and vice-versa
    app.use(
      urlencoded({
        extended: true,
        limit: '50mb'
      })
    );
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  // handle errors in our application
  private globalHandler(app: Application): void {
    //catch errors related to url
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
    } catch (error) {
      log.error(error);
    }
  }
  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    //server connection
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    //create redis publisher client and subscription client
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }

  //define all socket io connection methods
  private socketIOconnection(io: Server): void {}
}
