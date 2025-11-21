declare module 'passport-microsoft' {
  export class Strategy {
    constructor(options: any, verify: any);
  }
  
  export type VerifyCallback = (error: any, user?: any, info?: any) => void;
}
