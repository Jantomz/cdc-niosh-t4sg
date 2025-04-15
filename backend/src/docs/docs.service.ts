import { Injectable } from '@nestjs/common';

@Injectable()
export class DocsService {
  queryDocs(query: string, context: string) {
    // TODO: Implement logic to process the query and context, rank keywords, and return relevant documentation URLs.
    // Example placeholder logic:
    const keywords = this.extractKeywords(query, context);
    const rankedKeywords = this.rankKeywords(keywords);
    const documentationUrls = this.getDocumentationUrls(rankedKeywords);

    return {
      query,
      context,
      rankedKeywords,
      documentationUrls,
    };
  }

  private extractKeywords(query: string, context: string): string[] {
    // Extract keywords from the query and context
    return [...new Set(query.split(' ').concat(context.split(' ')))];
  }

  private rankKeywords(
    keywords: string[],
  ): { keyword: string; rank: number }[] {
    // Rank keywords based on frequency and recency (placeholder logic)
    return keywords.map((keyword, index) => ({
      keyword,
      rank: keywords.length - index, // Example ranking logic
    }));
  }

  private getDocumentationUrls(
    rankedKeywords: { keyword: string; rank: number }[],
  ): string[] {
    // Map ranked keywords to documentation URLs (placeholder logic)
    return rankedKeywords.map(
      // Or make a list of valid URLs
      (keywordObj) => `https://docs.example.com/${keywordObj.keyword}`,
    );
  }
}
