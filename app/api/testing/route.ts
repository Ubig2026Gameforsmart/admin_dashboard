import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "testing.txt");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    return NextResponse.json({
      success: true,
      data: fileContent.trim()
    });
  } catch (error) {
    console.error("Error reading testing.txt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read file" },
      { status: 500 }
    );
  }
}
