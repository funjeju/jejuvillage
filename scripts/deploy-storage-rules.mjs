/**
 * Firebase CLI 없이 Storage 보안규칙을 배포한다. (서비스계정 토큰 → firebaserules API)
 * 실행: node --env-file=.env.local scripts/deploy-storage-rules.mjs
 */
import { readFileSync } from "fs";
import { initializeApp, cert, getApp } from "firebase-admin/app";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const bucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ FIREBASE_ADMIN_* 자격증명이 필요합니다.");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const app = getApp();
const rules = readFileSync(new URL("../storage.rules", import.meta.url), "utf8");

async function token() {
  return (await app.options.credential.getAccessToken()).access_token;
}
async function api(path, method, body) {
  const res = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log("📤 storage ruleset 생성 중…");
  const ruleset = await api(`projects/${projectId}/rulesets`, "POST", {
    source: { files: [{ name: "storage.rules", content: rules }] },
  });
  console.log("   ruleset:", ruleset.name);

  const releaseId = `firebase.storage/${bucket}`;
  const releaseName = `projects/${projectId}/releases/${releaseId}`;
  console.log(`🚀 release(${releaseId}) 갱신 중…`);
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
  console.log("✅ Storage 보안규칙 배포 완료 (bucket:", bucket + ")");
}

main().catch((e) => {
  console.error("❌ 배포 실패:", e.message);
  process.exit(1);
});
