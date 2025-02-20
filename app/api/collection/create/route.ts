import { NextResponse } from "next/server";
import { createBubbleGumTree } from "../collection.helper";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    const results = await createBubbleGumTree();

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
