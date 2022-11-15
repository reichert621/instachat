export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

export const debug = (...args: any) => {
  if (!isProd) {
    console.debug('[Debug]', ...args);
  }
};

export const inspect = (data: any) => {
  console.debug('[Inspect]', data);

  return data;
};

export const sleep = async (ms: number) =>
  new Promise((res) => setTimeout(res, ms));
