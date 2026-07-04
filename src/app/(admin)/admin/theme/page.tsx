import { redirect } from "next/navigation";

// 테마 편집은 홈페이지 빌더의 [디자인] 탭으로 통합됨
export default function ThemeRedirect() {
  redirect("/admin/homepage");
}
