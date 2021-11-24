import type { AxiosInstance } from "axios";

export type User = {
  username: string;
  password: string;
};

export type Adapter = {
  /**
   * 系统对应用户信息标识
   * 
   * 一个用户信息可以对应多个系统用户信息
   */
  userType: string;

  /**
   * 系统类型
   */
  platform: string;


  /**
   * @param request
   * @param user 当前用户
   * @param adapter
   * @returns 返回的 cookie 数据
   */
  auth(request: AxiosInstance, user: User, adapter: Adapter): Promise<string | string[]>;

  /**
   * 拦截响应，是否需要发起 SSO 登录
   * @param response
   * @returns {boolean} true 表示需要发起 SSO 登录
   */
  intercept(response: any): boolean;
}