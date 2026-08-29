import { supabase } from "@/integrations/supabase/client";

/**
 * Converte Data URL Base64 para Blob
 */
export function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/webp';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Comprime uma imagem localmente no Canvas e retorna um Blob otimizado em WebP
 */
export async function compressImageToBlob(
  file: File | Blob, 
  maxWidth = 1920, 
  maxHeight = 1080, 
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback pro arquivo original
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Falha ao processar imagem para compressão"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de imagem"));
    reader.readAsDataURL(file);
  });
}

/**
 * Faz o upload de um File ou Blob para o Supabase Storage e retorna a URL pública permanente
 */
export async function uploadToStorage(
  fileOrBlob: File | Blob, 
  bucket = "banners", 
  prefix = "banner"
): Promise<string> {
  const ext = fileOrBlob.type.includes("webp") 
    ? "webp" 
    : fileOrBlob.type.includes("png") 
    ? "png" 
    : fileOrBlob.type.includes("jpeg") || fileOrBlob.type.includes("jpg")
    ? "jpg"
    : "webp";

  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${prefix}_${Date.now()}_${randomStr}.${ext}`;
  const filePath = `${fileName}`;

  // Tenta o bucket principal
  let currentBucket = bucket;
  let uploadRes = await supabase.storage
    .from(currentBucket)
    .upload(filePath, fileOrBlob, { upsert: true, contentType: fileOrBlob.type || 'image/webp' });

  // Se der erro de bucket não encontrado, tenta 'logos' como fallback seguro
  if (uploadRes.error && currentBucket !== "logos") {
    console.warn(`Bucket ${currentBucket} indisponível, tentando fallback em logos:`, uploadRes.error.message);
    currentBucket = "logos";
    uploadRes = await supabase.storage
      .from(currentBucket)
      .upload(filePath, fileOrBlob, { upsert: true, contentType: fileOrBlob.type || 'image/webp' });
  }

  if (uploadRes.error) {
    throw new Error(`Erro no upload para o Supabase Storage: ${uploadRes.error.message}`);
  }

  const { data } = supabase.storage.from(currentBucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Se o valor fornecido for uma string Base64 (data:image/...), converte e faz upload para obter URL pública.
 * Se já for uma URL (http/https ou relativa), retorna como está.
 */
export async function ensureUrlNotBase64(value?: string | null, bucket = "banners", prefix = "banner"): Promise<string> {
  if (!value) return "";
  const trimmed = value.trim();
  
  if (!trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  try {
    const blob = base64ToBlob(trimmed);
    const url = await uploadToStorage(blob, bucket, prefix);
    return url;
  } catch (err) {
    console.error("Erro ao converter base64 para URL do storage:", err);
    return trimmed; // Fallback se o upload falhar
  }
}

/**
 * Varre todos os campos de imagem de um Banner e converte qualquer Base64 remanescente em URLs de storage.
 */
export async function sanitizeBannerImages(bannerData: any): Promise<any> {
  const result = { ...bannerData };

  if (result.imageUrl && result.imageUrl.startsWith("data:image/")) {
    result.imageUrl = await ensureUrlNotBase64(result.imageUrl, "banners", "desktop");
  }
  if (result.mobileImageUrl && result.mobileImageUrl.startsWith("data:image/")) {
    result.mobileImageUrl = await ensureUrlNotBase64(result.mobileImageUrl, "banners", "mobile");
  }
  if (result.imageUrl2 && result.imageUrl2.startsWith("data:image/")) {
    result.imageUrl2 = await ensureUrlNotBase64(result.imageUrl2, "banners", "desktop_2");
  }
  if (result.mobileImageUrl2 && result.mobileImageUrl2.startsWith("data:image/")) {
    result.mobileImageUrl2 = await ensureUrlNotBase64(result.mobileImageUrl2, "banners", "mobile_2");
  }
  if (result.imageUrl3 && result.imageUrl3.startsWith("data:image/")) {
    result.imageUrl3 = await ensureUrlNotBase64(result.imageUrl3, "banners", "desktop_3");
  }
  if (result.mobileImageUrl3 && result.mobileImageUrl3.startsWith("data:image/")) {
    result.mobileImageUrl3 = await ensureUrlNotBase64(result.mobileImageUrl3, "banners", "mobile_3");
  }

  // Verifica se dentro de formatoExtra existem itens de tarja com ícone em base64
  if (result.formatoExtra && typeof result.formatoExtra === "string" && result.formatoExtra.startsWith("[")) {
    try {
      const items = JSON.parse(result.formatoExtra);
      if (Array.isArray(items)) {
        let changed = false;
        for (let i = 0; i < items.length; i++) {
          if (items[i]?.icon && typeof items[i].icon === "string" && items[i].icon.startsWith("data:image/")) {
            items[i].icon = await ensureUrlNotBase64(items[i].icon, "banners", `tarja_icon_${i}`);
            changed = true;
          }
        }
        if (changed) {
          result.formatoExtra = JSON.stringify(items);
        }
      }
    } catch (e) {
      // Ignora erro de parse
    }
  }

  return result;
}
