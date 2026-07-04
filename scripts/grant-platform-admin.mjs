/**
 * 이메일 계정을 플랫폼 관리자(platform_admin)로 승격한다.
 * 계정이 없으면 새로 만들고 임시 비밀번호를 발급한다.
 *
 * 실행:
 *   node --env-file=.env.local scripts/grant-platform-admin.mjs <email> [password]
 * 예:
 *   node --env-file=.env.local scripts/grant-platform-admin.mjs platform@jeju.kr jeju1234
 */
import { randomBytes } from "crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) {
  console.error("❌ 사용법: node --env-file=.env.local scripts/grant-platform-admin.mjs <email> [password]");
  process.exit(1);
}
const passwordArg = process.argv[3];

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ FIREBASE_ADMIN_* 자격증명이 필요합니다.");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const auth = getAuth();
const db = getFirestore();

async function main() {
  let user;
  let tempPassword = null;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    tempPassword = passwordArg ?? randomBytes(6).toString("base64url");
    user = await auth.createUser({ email, password: tempPassword, displayName: "플랫폼 관리자" });
  }

  // 기존 managedVillages 유지, role 만 승격
  const claims = user.customClaims ?? {};
  await auth.setCustomUserClaims(user.uid, {
    role: "platform_admin",
    managedVillages: claims.managedVillages ?? [],
  });

  await db.doc(`users/${user.uid}`).set(
    {
      name: user.displayName ?? "플랫폼 관리자",
      email,
      role: "platform_admin",
      managedVillages: claims.managedVillages ?? [],
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  console.log("✅ platform_admin 승격 완료:", email);
  if (tempPassword) console.log("   임시 비밀번호:", tempPassword);
  console.log("   로그인: /login → /platform");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ 실패:", e.message);
    process.exit(1);
  });
