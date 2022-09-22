export type HijackOptions = {
  enable?: boolean;
  prefix?: string;
  /**
   * Auto smart infer rewrite options from `proxyTable` config
   */
  smartInfer?: boolean;
  rewrite?: {
    from: string;
    to: string;
  }[];
  /**
   * Pages to be hijacked
   */
   page?: string | RegExp;
   excludes?: (string | RegExp)[] | string | RegExp;
};

export type ProxyTable = {
  [key: string]: {
    target?: string;
    path?: string;
    pathRewrite?: {
      [key: string]: string;
    }
  }
}