import axios from "axios";

interface IResponse {
  last_price: number;
}

export const getPriceCurrent = async (
  ticker: string,
  exchange: string | null
) => {
  if (ticker && exchange) {
    const response = await axios.get<IResponse>(
      `https://markets.sh/api/v1/symbols/${exchange}:${ticker}?api_token=7ea62693bd4ebc0ae34595335732676b`
    );

    return Number(response.data.last_price.toFixed(2));
  }
};
