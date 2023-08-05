const getPriceGrowth = (
  priceTarget,
  priceCurrent
) => {
  if (priceTarget && priceCurrent) {
    return Number(
      (((priceTarget - priceCurrent) / priceCurrent) * 100).toFixed(2)
    );
  }
  return null;
};

module.exports = getPriceGrowth