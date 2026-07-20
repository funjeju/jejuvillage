/**
 * Firestore 컬렉션 경로 (client/admin SDK 공용).
 * 구조는 기획서 9.1.2절을 따른다.
 */
export const paths = {
  villages: "villages",
  village: (vid: string) => `villages/${vid}`,
  stories: (vid: string) => `villages/${vid}/stories`,
  feedPosts: (vid: string) => `villages/${vid}/feed_posts`,
  products: (vid: string) => `villages/${vid}/products`,
  bookings: (vid: string) => `villages/${vid}/bookings`,
  pois: (vid: string) => `villages/${vid}/pois`,
  theme: (vid: string) => `villages/${vid}/theme`,
  themeDocId: "main",
  themeDoc: (vid: string) => `villages/${vid}/theme/main`,
  reportDoc: (vid: string) => `villages/${vid}/report/main`,
  mediaAssets: "media_assets",
  users: "users",
} as const;

/** Collection Group 이름 (통합 피드/상품 진열 전역 조회) */
export const collectionGroups = {
  feedPosts: "feed_posts",
  products: "products",
} as const;
