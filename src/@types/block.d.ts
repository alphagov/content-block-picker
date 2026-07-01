export interface BlockOrganisation {
  name: string;
  content_id: string;
}

export interface BlockSearchResult {
  title: string;
  block_type: string;
  organisation: BlockOrganisation;
  state: string;
  embed_code: string;
  formats: string[];
}

export interface BlockSearchLink {
  href: string;
  rel: string;
}

export interface BlockSearchResponse {
  total: number;
  pages: number;
  current_page: number;
  links: BlockSearchLink[];
  results: BlockSearchResult[];
}
