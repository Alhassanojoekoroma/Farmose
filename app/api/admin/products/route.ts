import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../admin-auth";
import { deleteProductImage, getCloudinaryClient, uploadProductImage } from "../../../../lib/cloudinary";
import { validateProductImageFile } from "../../../../lib/image-validation";
import { deleteProductFromSupabase, saveProductToSupabase } from "../../../../lib/supabase-products";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const shortName = String(formData.get("shortName") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const unit = String(formData.get("unit") ?? "").trim();
    const tag = String(formData.get("tag") ?? "").trim();
    const stockQuantity = Number(formData.get("stockQuantity") ?? 0);
    const imageFile = formData.get("image") as File | null;
    const keepExistingImage = String(formData.get("keepExistingImage") ?? "") === "true";
    const existingImagePublicId = String(formData.get("existingImagePublicId") ?? "").trim();

    if (!name || !slug || !shortName || !category || !description || !details || !unit || !price) {
      return NextResponse.json({ error: "Please complete the product fields before saving." }, { status: 400 });
    }

    let imageUrl = String(formData.get("imageUrl") ?? "").trim();
    let imagePublicId = String(formData.get("imagePublicId") ?? "").trim();

    if (imageFile) {
      const validationError = validateProductImageFile(imageFile);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      try {
        getCloudinaryClient();
        const uploaded = await uploadProductImage(imageFile);
        imageUrl = uploaded.secureUrl;
        imagePublicId = uploaded.publicId;
      } catch (error) {
        console.error("Cloudinary upload failed", error);
        return NextResponse.json({ error: "The image could not be uploaded. Please try again." }, { status: 500 });
      }
    } else if (!keepExistingImage && !imageUrl) {
      imageUrl = "";
      imagePublicId = "";
    }

    const productData = {
      slug,
      name,
      short_name: shortName,
      shortName,
      category,
      tag: tag || "NEW",
      price,
      unit,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      stock_quantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
      description,
      details,
      features: ["Freshly sourced", "Packed with care"],
      active: true,
      sort_order: 0,
    };

    try {
      await saveProductToSupabase(productData);
      if (imageFile && existingImagePublicId && existingImagePublicId !== imagePublicId) {
        try {
          await deleteProductImage(existingImagePublicId);
        } catch (cleanupError) {
          console.error("Previous Cloudinary image cleanup failed", cleanupError);
        }
      }
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (imageFile && imagePublicId) {
        try {
          await deleteProductImage(imagePublicId);
        } catch (cleanupError) {
          console.error("Cloudinary cleanup failed", cleanupError);
        }
      }
      console.error("Supabase product create failed", error);
      return NextResponse.json({ error: "The product could not be saved." }, { status: 500 });
    }
  } catch (error) {
    console.error("Product create failed", error);
    return NextResponse.json({ error: "The product could not be processed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") ?? "";
    if (!slug) {
      return NextResponse.json({ error: "A product slug is required." }, { status: 400 });
    }

    const currentRecord = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?slug=eq.${slug}`, {
      method: "GET",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      },
    }).then((response) => response.json());

    const publicId = currentRecord?.[0]?.image_public_id;
    await deleteProductFromSupabase(slug);
    if (publicId) {
      try {
        await deleteProductImage(publicId);
      } catch (error) {
        console.error("Cloudinary deletion failed", error);
        return NextResponse.json({ error: "The product was removed from Supabase, but the image could not be deleted from Cloudinary." }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product delete failed", error);
    return NextResponse.json({ error: "The product could not be deleted." }, { status: 500 });
  }
}
