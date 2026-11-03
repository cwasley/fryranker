export const site = {
  name: 'FryRanker',
  url: 'https://fryranker.com',
  description:
    'The definitive fast food fry rankings, decided by head-to-head votes. Pick between two fries, watch the global standings move, and find your own #1.',
  credit: 'Made with 🍟 by fry enthusiasts Max & Collin',
}

export const absoluteUrl = (path: string) => `${site.url}${path === '/' ? '' : path}`
