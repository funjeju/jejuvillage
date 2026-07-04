/**
 * Firebase CLI 없이 Firestore 보안규칙을 배포한다.
 * (CLI 로그인 계정이 프로젝트 권한이 없을 때, 서비스계정 토큰으로 firebaserules API 직접 호출)
 *
 * 실행: node --env-file=.env.local scripts/deploy-firestore-rules.mjs
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getApp } from "firebase-admin/app";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ FIREBASE_ADMIN_* 자격증명이 필요합니다.");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const app = getApp();

const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

async function token() {
  const t = await app.options.credential.getAccessToken();
  return t.access_token;
}

async function api(path, method, body) {
  const res = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  console.log("📤 ruleset 생성 중…");
  const ruleset = await api(`projects/${projectId}/rulesets`, "POST", {
    source: { files: [{ name: "firestore.rules", content: rules }] },
  });
  console.log("   ruleset:", ruleset.name);

  console.log("🚀 release(cloud.firestore) 갱신 중…");
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;
  // 기존 release 가 있으면 PATCH, 없으면 POST
  try {
    await api(releaseName, "PATCH", {
      release: { name: releaseName, rulesetName: ruleset.name },
    });
  } catch {
    await api(`projects/${projectId}/releases`, "POST", {
      name: releaseName,
      rulesetName: ruleset.name,
    });
  }
  console.log("✅ Firestore 보안규칙 배포 완료");
}

main().catch((e) => {
  console.error("❌ 배포 실패:", e.message);
  process.exit(1);
});
