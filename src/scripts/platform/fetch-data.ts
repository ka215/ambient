export async function fetchData(
  url = '',
  method = 'get',
  data: Record<string, unknown> = {},
  datatype = 'json',
  timeout = 15000,
  logger?: (...args: unknown[]) => void
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  if (!url || !/^(get|post|put|delete|patch)$/i.test(method)) {
    return Promise.reject({
      type: 'bad_request',
      status: 400,
      message: 'Invalid argument(s) given.',
    });
  }

  const params = new URLSearchParams();
  const sendData: RequestInit = {
    method: method.toUpperCase(),
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    signal: controller.signal,
  };

  Object.keys(data || {}).forEach((key) => {
    params.append(key, String(data[key]));
  });

  if (sendData.method !== 'GET') {
    sendData.body = params;
  } else if (params.size > 0) {
    url += `?${params}`;
  }

  try {
    const response = await fetch(url, sendData);
    logger?.('fetchData::after:', response);

    if (response.ok) {
      const retval = datatype === 'json' ? await response.json() : await response.text();
      logger?.('fetchData::after:2:', retval);
      return Promise.resolve(retval);
    }

    const errObj = await response.json();
    return Promise.reject({
      code: errObj.code,
      status: errObj.data.status,
      message: errObj.message,
    });
  } catch (error) {
    logger?.('error', 'fetchData::error:', error, 'force');
    return Promise.reject(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
