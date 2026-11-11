async function webSearch(query) {
    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results: 5
        })
      }
    );
  
    if (!response.ok) {
      throw new Error("Web search failed");
    }
  
    const data = await response.json();
  
    return data.results.map(item => ({
      title: item.title,
      url: item.url,
      content: item.content
    }));
  }
  
  export default webSearch;