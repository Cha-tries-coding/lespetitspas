import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Version minimale de diagnostic : laisse passer l'intégralité des requêtes
  // sans invoquer la logique Supabase / cookie de session.
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
