import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({}); //to load the .env file

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;

  private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/chattyapp-backend';
  // private readonly DEFAULT_JWT_TOKEN= 'thisisatoeknfromme'
  // private readonly DEFAULT_NODE_ENV = 'development'
  // private readonly DEFAULT_SECRET_KEY_ONE = 'thisisasecretkeyone'
  // private readonly DEFAULT_SECRET_KEY_TWO = 'thisisasecretkeytwo'
  // private readonly DEFAULT_CLIENT_URL='http://localhost:3000'

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    for (const [k, v] of Object.entries(this)) {
      if (v === undefined) {
        throw new Error(`Configurtion ${k} is undefined`);
      }
    }
  }
}

export const config: Config = new Config();
