'use client';

import { useState, useEffect } from 'react';
import { getFundingRates, getTopSymbolsByVolume } from '@/services/exchange';
import { FundingRate } from '@/types/exchange';

export default function Home() {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [topSymbols, setTopSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取交易量最大的10个交易对
        const symbols = await getTopSymbolsByVolume(10);
        setTopSymbols(symbols);

        // 获取所有交易对的资金费率
        const allRates: FundingRate[] = [];
        for (const symbol of symbols) {
          try {
            const symbolRates = await getFundingRates(symbol);
            if (symbolRates && symbolRates.length > 0) {
              allRates.push(...symbolRates);
            }
          } catch (error) {
            console.error(`Error fetching rates for ${symbol}:`, error);
          }
        }
        console.log('Fetched rates:', allRates); // 添加日志
        setRates(allRates);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  // 按交易对分组费率数据
  const groupedRates = rates.reduce((acc, rate) => {
    if (!acc[rate.symbol]) {
      acc[rate.symbol] = {};
    }
    acc[rate.symbol][rate.exchange] = rate;
    return acc;
  }, {} as Record<string, Record<string, FundingRate>>);

  // 获取特定交易所的费率
  const getRateByExchange = (symbol: string, exchange: string) => {
    const rate = groupedRates[symbol]?.[exchange.charAt(0).toUpperCase() + exchange.slice(1).toLowerCase()];
    return rate ? rate.rate : null;
  };

  // 计算最大费率差
  const getMaxRateDifference = (symbol: string) => {
    const rates = Object.values(groupedRates[symbol] || {})
      .map(rate => rate.rate)
      .filter(rate => rate !== null) as number[];
    if (rates.length < 2) return 0;
    return Math.max(...rates) - Math.min(...rates);
  };

  if (isLoading) {
    return <div className="p-8">加载中...</div>;
  }

  // 添加调试信息
  console.log('Grouped rates:', groupedRates);
  console.log('Top symbols:', topSymbols);

  // 检查数据是否有效
  if (!rates.length || !topSymbols.length) {
    return <div className="p-8">暂无数据</div>;
  }

  // 添加调试信息
  console.log('Rates data:', rates);
  console.log('Grouped rates details:', Object.entries(groupedRates).map(([symbol, exchanges]) => ({
    symbol,
    exchanges: Object.entries(exchanges).map(([exchange, rate]) => ({
      exchange,
      rate: rate.rate
    }))
  })));

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">加密货币资金费率监控</h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">资金费率差最大的5个交易对</h2>
        <table className="min-w-full bg-gray-800 text-white border border-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2 border-b border-gray-600 text-center">交易对</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最大费率差</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最高费率</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最高费率交易所</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最低费率</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最低费率交易所</th>
            </tr>
          </thead>
          <tbody>
            {topSymbols
              .map(symbol => {
                const rates = Object.entries(groupedRates[symbol] || {})
                  .map(([exchange, rate]) => ({ exchange, rate: rate.rate }))
                  .filter(item => item.rate !== null) as { exchange: string; rate: number }[];
                if (rates.length < 2) return null;
                
                const maxRate = Math.max(...rates.map(r => r.rate));
                const minRate = Math.min(...rates.map(r => r.rate));
                const maxExchange = rates.find(r => r.rate === maxRate)?.exchange;
                const minExchange = rates.find(r => r.rate === minRate)?.exchange;
                const diff = maxRate - minRate;
                
                return { symbol, diff, maxRate, minRate, maxExchange, minExchange };
              })
              .filter(item => item !== null)
              .sort((a, b) => b!.diff - a!.diff)
              .slice(0, 5)
              .map(({ symbol, diff, maxRate, minRate, maxExchange, minExchange }) => (
                <tr key={symbol} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-2 text-center">{symbol}</td>
                  <td className="px-4 py-2 text-green-400 text-center">{(diff * 100).toFixed(4)}%</td>
                  <td className="px-4 py-2 text-green-400 text-center">{(maxRate * 100).toFixed(4)}%</td>
                  <td className="px-4 py-2 text-green-400 text-center">{maxExchange}</td>
                  <td className="px-4 py-2 text-red-400 text-center">{(minRate * 100).toFixed(4)}%</td>
                  <td className="px-4 py-2 text-red-400 text-center">{minExchange}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">所有交易对资金费率</h2>
        <table className="min-w-full bg-gray-800 text-white border border-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2 border-b border-gray-600 text-center">交易对</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Binance</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">OKX</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Bybit</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Bitget</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Backpack</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Hyperliquid</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">Paradex</th>
              <th className="px-4 py-2 border-b border-gray-600 text-center">最大费率差</th>
            </tr>
          </thead>
          <tbody>
            {topSymbols.map(symbol => {
              const maxDiff = getMaxRateDifference(symbol);
              const hasData = Object.values(groupedRates[symbol] || {}).some(rate => rate.rate !== null);
              
              if (!hasData) return null;
              
              return (
                <tr key={symbol} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-2 text-center">{symbol}</td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'binance') !== null ? (getRateByExchange(symbol, 'binance')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'binance') !== null ? `${(getRateByExchange(symbol, 'binance')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'okx') !== null ? (getRateByExchange(symbol, 'okx')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'okx') !== null ? `${(getRateByExchange(symbol, 'okx')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'bybit') !== null ? (getRateByExchange(symbol, 'bybit')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'bybit') !== null ? `${(getRateByExchange(symbol, 'bybit')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'bitget') !== null ? (getRateByExchange(symbol, 'bitget')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'bitget') !== null ? `${(getRateByExchange(symbol, 'bitget')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'backpack') !== null ? (getRateByExchange(symbol, 'backpack')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'backpack') !== null ? `${(getRateByExchange(symbol, 'backpack')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'hyperliquid') !== null ? (getRateByExchange(symbol, 'hyperliquid')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'hyperliquid') !== null ? `${(getRateByExchange(symbol, 'hyperliquid')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className={`px-4 py-2 text-center ${getRateByExchange(symbol, 'paradex') !== null ? (getRateByExchange(symbol, 'paradex')! > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                    {getRateByExchange(symbol, 'paradex') !== null ? `${(getRateByExchange(symbol, 'paradex')! * 100).toFixed(4)}%` : '-'}
                  </td>
                  <td className="px-4 py-2 text-green-400 text-center">
                    {(maxDiff * 100).toFixed(4)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
