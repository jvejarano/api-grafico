function calculateBinanceSpread(sellPrice) {
    const estimatedSpread = 0.005; // 0.5% spread estimado
    const buyPrice = sellPrice * (1 - estimatedSpread);
    
    return {
        sell: sellPrice,
        buy: Number(buyPrice.toFixed(2)),
        spread: Number((sellPrice - buyPrice).toFixed(2))
    };
}