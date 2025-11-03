import { NextResponse } from "next/server";

export async function POST() {
  // Delete the cookie
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/", 
  });
  return response;
}
