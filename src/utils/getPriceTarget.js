const { default: axios } = require("axios");

const getPriceTarget = async (ticker) => {
  const response = await axios.get("https://www.tipranks.com/api/assets", {
    params: {
      tickers: ticker,
    },
    headers: {
      authority: "www.tipranks.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "en",
      cookie:
        'FPAU=1.2.605524906.1694412708; _fbp=fb.2.1694412709918.1013820183; _gaTR=GA1.2.1404413048.1694412710; _fbp=fb.2.1694412709918.1013820183; _gcl_au=1.1.904139002.1694412712; prism_90278194=b731308d-f67e-4247-96f6-2dbef138f7ed; GCLB=CP6gk7Sar-CePQ; tr-experiments-version=1.14; tipranks-experiments=%7b%22Experiments%22%3a%5b%7b%22Name%22%3a%22general_A%22%2c%22Variant%22%3a%22v2%22%2c%22SendAnalytics%22%3afalse%7d%2c%7b%22Name%22%3a%22general_B%22%2c%22Variant%22%3a%22v2%22%2c%22SendAnalytics%22%3afalse%7d%5d%7d; tipranks-experiments-slim=general_A%3av2%7cgeneral_B%3av2; rbzid=lP/e7dMzhVTKwTWiF4K/7W6lQfAkIrl02wGa+Bm7neaLkyootPTBwzDQgi2cJJ1VdDMgA6S533TtPR3Gq2lfFWZvpP249EJOYs3vWS1NBeCgh0amkzauK7Q7kBK5DtccOt+bFzM3B2DGHGWtEU8qwu/XeC6MWT3/3CMYJBdxtM6aTIcSJvkm8GfN+qY1aUZFpfrZ/ZA4HYojyVd9ZBpLSYSIHvn3wWQ7Yv8OINsztTAL8IJxSc/wdE4XWatmbMUN9SMFg2YyLTovbdb0s+6hGw==; rbzsessionid=2a661c13b906f55cb465018ec1bd3da7; _gid=GA1.2.944775485.1696832740; ln_or=eyIyMTA2MDQ0IjoiZCJ9; g_state={"i_l":0}; token=f1af573a907ecf7d6ed1d94d96e12e122edf63d5; user=vasyldubno@gmail.com,,; loginType=login; tr-plan-id=1; tr-plan-name=basic; tr-uid=24EC3D2B4BF37CECB763F9001EC015A5; DontShowUserSatisfactionPopup=true; TiPMix=55.12709720690049; x-ms-routing-name=self; _gat_UA-38500593-6=1; __gads=ID=57ff51dd26b31182:T=1694412713:RT=1696857456:S=ALNI_MYEr32ttzHsULj8d6UglrHAnjcLFA; __gpi=UID=00000c71c2ed0fa3:T=1694412713:RT=1696857456:S=ALNI_MaE-ilUBTEv3wHkktCxM61U99Tj4Q; IC_ViewCounter_www.tipranks.com=2; stocks_tab_pv_counter=2; _ga_FFX3CZN1WY=GS1.1.1696857466.3.1.1696857484.0.0.0; _ga=GA1.1.1404413048.1694412710',
      dnt: "1",
      referer: "https://www.tipranks.com/stocks/aapl/forecast",
      "sec-ch-ua":
        '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    },
  });

  if(response) {
    try {
      const priceTarget = response.data.data[0].priceTarget;
      return Number(priceTarget.toFixed(2))
    } catch {
      return 'error'
    }
  } else {
    return null
  }
}

module.exports = getPriceTarget