import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { email } = auth;

    const client = await clientPromise;
    const db = client.db();
    const ingredients = await db
      .collection("ingredients")
      .find({ userId: email })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("GET /api/ingredients error:", error);
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { email } = auth;

    const body = await req.json();
    const { name, quantity, unit, category } = body;

    // IDOR attempt logging: ignore any identifier fields
    if (body && typeof body === "object") {
      const b: any = body;
      if (b.userId || b._id || b.email) {
        console.warn("[IDOR] Ingredients POST included identifier fields and was ignored", {
          path: "/api/ingredients",
          actorEmail: email,
          provided: { userId: b.userId, _id: b._id, email: b.email },
        });
      }
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newIngredient = {
      userId: email,
      name: name.trim(),
      quantity: quantity?.trim() || "",
      unit: unit?.trim() || "",
      category: category?.trim() || "Other",
      createdAt: new Date(),
    };

    const result = await db.collection("ingredients").insertOne(newIngredient);

    return NextResponse.json({ _id: result.insertedId, ...newIngredient }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ingredients error:", error);
    return NextResponse.json({ error: "Failed to create ingredient" }, { status: 500 });
  }
}