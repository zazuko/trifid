import { Request, Response, NextFunction } from "express";

/**
 * Trifid configuration
 */
export type TrifidConfig = {
  server?: {
    listener: {
      host?: string;
      port?: number | string;
    };
    logLevel?:
      | "fatal"
      | "error"
      | "warn"
      | "info"
      | "debug"
      | "trace"
      | "silent";
    express?: Record<string, any>;
  };
  globals?: Record<string, any>;
  template?: Record<string, any>;
  middlewares?: Record<
    string,
    {
      order?: number;
      module: string;
      paths?: string | string[];
      methods?: string | string[];
      hosts?: string | string[];
      config?: Record<string, any>;
    }
  >;
};

/**
 * Trifid configuration with `extends` field
 */
export type TrifidConfigWithExtends = {
  extends?: string[];
} & TrifidConfig;

/** Express middleware */
export type ExpressMiddleware =
  | ((req: Request, res: Response, next: NextFunction) => void)
  | ((error: Error, req: Request, res: Response, next: NextFunction) => void);

/** Trifid Middleware Argument */
export type TrifidMiddlewareArgument = {
  logger: import("pino").Logger;
  server: import("express").Express;
  config: Record<string, any>;
  render: (
    templatePath: string,
    context: Record<string, any>,
    options: Record<string, any>
  ) => Promise<string>;
  query: TrifidQuery;
};

/** Trifid Middleware */
export type TrifidMiddleware = (
  trifid: TrifidMiddlewareArgument
) => Promise<ExpressMiddleware> | ExpressMiddleware;

export type TrifidQuery = (
  query: string,
  options?: Record<string, any>
) => Promise<any>;
