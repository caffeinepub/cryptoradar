import Text "mo:core/Text";
import Time "mo:core/Time";
import Blob "mo:core/Blob";
import Map "mo:core/Map";
import Int "mo:core/Int";
import OutCall "http-outcalls/outcall";

actor {
  type Symbol = Text;
  type Timestamp = Int;

  type NewsItem = {
    title : Text;
    url : Text;
    sourceName : Text;
    publishedTime : Timestamp;
    body : Text; // First 200 chars
  };

  type CachedNews = {
    news : [NewsItem];
    fetchedAt : Timestamp;
  };

  let newsCache = Map.empty<Symbol, CachedNews>();
  let cacheDuration : Int = 10 * 60 * 1_000_000_000; // 10 minutes in nanoseconds

  public query func transform(input: OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func fetchNewsFromAPI(symbol : Symbol) : async [NewsItem] {
    let url = "https://min-api.cryptocompare.com/data/v2/news/?categories=" # symbol # "&excludeCategories=Sponsored&lang=EN";
    let result = await OutCall.httpGetRequest(url, [], transform);

    // Parse JSON in frontend, not in backend
    let newsItems : [NewsItem] = [
      {
        title = ""; // incomplete
        url = "";
        sourceName = "";
        publishedTime = 0;
        body = "";
      }
    ];
    newsItems;
  };

  public shared ({ caller }) func getNews(symbol : Symbol) : async [NewsItem] {
    let lowerSymbol = symbol.toLower();
    let currentTime = Time.now();

    switch (newsCache.get(lowerSymbol)) {
      case (null) {
        let news = await fetchNewsFromAPI(lowerSymbol);
        newsCache.add(
          lowerSymbol,
          {
            news;
            fetchedAt = currentTime;
          },
        );
        news;
      };
      case (?cached) {
        if (currentTime - cached.fetchedAt > cacheDuration) {
          let news = await fetchNewsFromAPI(lowerSymbol);
          newsCache.add(
            lowerSymbol,
            {
              news;
              fetchedAt = currentTime;
            },
          );
          news;
        } else {
          cached.news;
        };
      };
    };
  };
};
