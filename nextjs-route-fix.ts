// Fix for src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Await the params before using
    const { id } = await params;

    console.log(`Get user by ID request received for ID: ${id}`);

    // Make request to your User Service
    const response = await fetch(`http://localhost:3001/users/${id}`, {
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`Backend get user by ID response: ${await response.text()}`);
      return NextResponse.json(
        { message: "User not found", error: "Not Found", statusCode: 404 },
        { status: 404 }
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: "Server Error",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
