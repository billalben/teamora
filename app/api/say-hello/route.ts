import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // check if there are any query parameters
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "World";

  //   return new Response(`Hello, ${name}!`);
  return Response.json({ message: `Hello, ${name}!` });

  //   return new Response("Hello, World!");
  //   return Response.json({ message: "Hello World!" });
}
