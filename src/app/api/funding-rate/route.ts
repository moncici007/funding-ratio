import { NextResponse } from 'next/server';
import axios from 'axios';
import { exchanges } from '@/config/exchanges';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 代理配置
const PROXY_CONFIG = {
  host: process.env.PROXY_HOST,
  port: parseInt(process.env.PROXY_PORT || '1337'),
  auth: {
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  }
};

// 创建代理 agent
const httpsAgent = new HttpsProxyAgent(`http://${PROXY_CONFIG.auth.username}:${PROXY_CONFIG.auth.password}@${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);

// 创建带有详细日志的 axios 实例
const axiosInstance = axios.create({
  httpsAgent,
  proxy: false,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(request => {
  console.log('发送请求:', {
    method: request.method,
    url: request.url,
    headers: request.headers,
    data: request.data,
    proxy: PROXY_CONFIG,
  });
  return request;
});

axiosInstance.interceptors.response.use(
  response => {
    console.log('收到响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  error => {
    console.error('请求错误:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
        proxy: PROXY_CONFIG,
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    });
    return Promise.reject(error);
  }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const rates = [];

  for (const [exchangeId, exchange] of Object.entries(exchanges)) {
    try {
      console.log(`开始请求 ${exchange.name} API: ${symbol}`);
      const formattedSymbol = exchange.symbolFormat(symbol);
      const url = `${exchange.baseUrl}${exchange.endpoints.fundingRate}`;
      console.log(`完整 URL: ${url}`);
      
      let response;
      if (exchangeId === 'hyperliquid') {
        response = await axiosInstance.post(url, exchange.body, {
          headers: exchange.headers
        });
      } else {
        response = await axiosInstance.get(`${url}?symbol=${formattedSymbol}`);
      }

      let rate: number | null = null;
      let nextFundingTime: number | undefined;

      switch (exchangeId) {
        case 'binance':
          rate = parseFloat(response.data.lastFundingRate);
          nextFundingTime = response.data.nextFundingTime;
          break;
        case 'okx':
          if (response.data.data && response.data.data.length > 0) {
            rate = parseFloat(response.data.data[0].fundingRate);
            nextFundingTime = parseInt(response.data.data[0].nextFundingTime);
          }
          break;
        case 'bybit':
          if (response.data.retCode === 0 && response.data.result && response.data.result.list && response.data.result.list.length > 0) {
            rate = parseFloat(response.data.result.list[0].fundingRate);
            nextFundingTime = parseInt(response.data.result.list[0].fundingRateTimestamp);
          }
          break;
        case 'bitget':
          if (response.data.code === '00000' && response.data.data) {
            rate = parseFloat(response.data.data.fundingRate);
            nextFundingTime = response.data.requestTime + 8 * 60 * 60 * 1000;
          }
          break;
        case 'backpack':
          if (Array.isArray(response.data) && response.data.length > 0) {
            rate = parseFloat(response.data[0].fundingRate);
            nextFundingTime = new Date(response.data[0].intervalEndTimestamp).getTime();
          }
          break;
        case 'hyperliquid':
          if (Array.isArray(response.data)) {
            // 查找对应的交易对
            const marketData = response.data.find((item: [string, any[]]) => item[0] === formattedSymbol);
            if (marketData && Array.isArray(marketData[1])) {
              // 查找 BinPerp 的数据
              const binPerpData = marketData[1].find((item: [string, any]) => item[0] === 'BinPerp');
              if (binPerpData && binPerpData[1]) {
                rate = parseFloat(binPerpData[1].fundingRate);
                nextFundingTime = binPerpData[1].nextFundingTime;
              }
            }
          }
          break;
      }

      if (rate !== null) {
        rates.push({
          exchange: exchange.name,
          symbol,
          rate,
          timestamp: Date.now(),
          nextFundingTime
        });
      }
    } catch (error) {
      console.error(`Error fetching funding rate from ${exchange.name}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('详细错误信息:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
    }
  }

  return NextResponse.json(rates);
} 