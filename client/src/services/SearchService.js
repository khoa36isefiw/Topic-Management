import WebService from "./WebService"

const SearchService = {
  search: async (query, advancedQueries) => {
    const _query = {
      q: query,
      ...advancedQueries
    };

    const response = await WebService.get('/', _query);
    return await response.json();
  },
};

export default SearchService;
