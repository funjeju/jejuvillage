import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { getPublishedVillages } from "@/lib/repo/server";
import { FieldValue } from "firebase-admin/firestore";
import type { Village } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface RelevanceResult {
  relevant: boolean;
  summary: string;
}

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const villages = await getPublishedVillages();
    if (!villages.length) {
      return NextResponse.json({ ok: true, message: "게시된 마을 없음", posted: 0 });
    }

    let totalPosted = 0;

    for (const village of villages) {
      const posted = await processVillage(village);
      totalPosted += posted;
    }

    return NextResponse.json({
      ok: true,
      villages: villages.length,
      posted: totalPosted,
    });
  } catch (err) {
    console.error("[collect-news] 실패:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

async function processVillage(village: Village): Promise<number> {
  const searchTerms = buildSearchTerms(village);
  const allNews: NewsItem[] = [];

  for (const term of searchTerms) {
    const items = await searchNaverNews(term);
    allNews.push(...items);
  }

  const unique = dedupeByLink(allNews);
  if (!unique.length) return 0;

  const db = adminDb();
  const alreadyPosted = await getPostedLinks(db, village.id);
  const fresh = unique.filter((n) => !alreadyPosted.has(n.link));
  if (!fresh.length) return 0;

  const apiKey = process.env.OPENAI_API_KEY;
  let posted = 0;

  for (const news of fresh.slice(0, 5)) {
    const relevance = apiKey
      ? await checkRelevanceWithAI(apiKey, village, news)
      : checkRelevanceHeuristic(village, news);

    if (!relevance.relevant) continue;

    await postNewsToFeed(db, village, news, relevance.summary);
    posted++;
  }

  return posted;
}

function buildSearchTerms(village: Village): string[] {
  const terms: string[] = [];
  terms.push(`제주 ${village.name}`);
  const regionParts = village.region.split(" ").filter(Boolean);
  if (regionParts.length >= 2) {
    const eup = regionParts[regionParts.length - 1];
    if (eup !== village.name) {
      terms.push(`제주 ${eup}`);
    }
  }
  return terms;
}

async function searchNaverNews(query: string): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encoded}&display=10&sort=date`;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return searchNaverRSS(query);
  }

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) return searchNaverRSS(query);
    const data = await res.json();
    return (data.items ?? []).map((item: Record<string, string>) => ({
      title: stripHtml(item.title ?? ""),
      link: item.originallink || item.link || "",
      description: stripHtml(item.description ?? ""),
      pubDate: item.pubDate ?? "",
    }));
  } catch {
    return searchNaverRSS(query);
  }
}

async function searchNaverRSS(query: string): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml);
  } catch {
    return [];
  }
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (title && link) {
      items.push({
        title: stripHtml(title),
        link,
        description: stripHtml(description),
        pubDate,
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`).exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const simpleMatch = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function dedupeByLink(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}

async function getPostedLinks(
  db: FirebaseFirestore.Firestore,
  villageId: string
): Promise<Set<string>> {
  const snap = await db
    .collection(paths.newsLog)
    .where("villageId", "==", villageId)
    .select("link")
    .get();
  return new Set(snap.docs.map((d) => d.data().link as string));
}

async function checkRelevanceWithAI(
  apiKey: string,
  village: Village,
  news: NewsItem
): Promise<RelevanceResult> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `너는 제주 마을 뉴스 큐레이터다. 뉴스가 특정 마을과 관련 있는지 판별하고, 관련 있으면 마을 주민/방문객에게 유용한 1~2줄 요약을 작성한다. JSON으로만 응답: {"relevant": boolean, "summary": "요약문"}`,
          },
          {
            role: "user",
            content: `마을: ${village.name} (${village.region})
뉴스 제목: ${news.title}
뉴스 내용: ${news.description}

이 뉴스가 "${village.name}" 마을 또는 "${village.region}" 지역과 직접 관련이 있는지 판별해줘.
- 제주도 전체 뉴스는 관련 없음으로 처리 (해당 마을/지역이 직접 언급되어야 함)
- 부정적 뉴스(사건사고)는 관련 없음으로 처리
- 관광, 축제, 행사, 맛집, 문화, 자연 관련 뉴스만 관련 있음으로 처리`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) return checkRelevanceHeuristic(village, news);

    const text = data?.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return checkRelevanceHeuristic(village, news);

    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      relevant: parsed.relevant === true,
      summary: String(parsed.summary ?? "").slice(0, 200),
    };
  } catch {
    return checkRelevanceHeuristic(village, news);
  }
}

function checkRelevanceHeuristic(
  village: Village,
  news: NewsItem
): RelevanceResult {
  const text = `${news.title} ${news.description}`.toLowerCase();
  const villageName = village.name.toLowerCase();
  const regionParts = village.region.toLowerCase().split(" ");

  const negative = /사고|사건|범죄|폭행|사망|화재|살인|절도/;
  if (negative.test(text)) return { relevant: false, summary: "" };

  const nameMatch = text.includes(villageName);
  const regionMatch = regionParts.length >= 2 && text.includes(regionParts[regionParts.length - 1]);

  if (nameMatch || regionMatch) {
    return {
      relevant: true,
      summary: news.description.slice(0, 150),
    };
  }
  return { relevant: false, summary: "" };
}

async function postNewsToFeed(
  db: FirebaseFirestore.Firestore,
  village: Village,
  news: NewsItem,
  summary: string
) {
  const caption = summary || news.title;

  await db.collection(paths.feedPosts(village.id)).add({
    villageId: village.id,
    villageSlug: village.slug,
    villageName: village.name,
    caption: `📰 ${caption}`,
    tags: ["뉴스", "자동수집"],
    visibility: "global",
    isPinned: false,
    media: [],
    publishedAt: FieldValue.serverTimestamp(),
    authorId: "system:news-bot",
    newsUrl: news.link,
    newsTitle: news.title,
    isNews: true,
  });

  await db.collection(paths.newsLog).add({
    villageId: village.id,
    link: news.link,
    title: news.title,
    postedAt: FieldValue.serverTimestamp(),
  });

  await db.doc(paths.village(village.id)).update({
    lastPostedAt: FieldValue.serverTimestamp(),
  });
}
