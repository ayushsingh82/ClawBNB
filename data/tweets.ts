export const tweets = [
  "https://x.com/user/status/123456789",
  "https://x.com/user/status/123456790",
  "https://x.com/user/status/123456791",
];

export function getTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : url;
}
