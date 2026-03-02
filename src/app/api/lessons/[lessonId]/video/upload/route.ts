/**
 * POST /api/lessons/[lessonId]/video/upload
 *
 * Upload video for a lesson
 * Supports:
 * - Local file upload
 * - Cloudinary upload
 * - Video validation
 * - Metadata extraction
 */

import { NextRequest, NextResponse } from "next/server";
import { queryOneBuilder, update, db as supabaseAdmin } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { uploadImage } from "@/lib/cloudinary";

interface Params {
    lessonId: string;
}

// Maximum file sizes - Cloudinary recommends smaller sizes for better async processing
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (Cloudinary async limit is ~700MB but 500MB is safer)
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
const ALLOWED_FORMATS = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
];

/**
 * POST handler for video upload
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<Params> },
) {
    try {
        const { lessonId } = await params;
        const contentType = request.headers.get("content-type") || "";

        // Verify lesson exists and user has admin access
        const { data: lessonData, error: lessonError } = await supabaseAdmin!
            .from("lessons")
            .select("*, chapters!inner(course_id)")
            .eq("id", lessonId)
            .single();

        if (lessonError || !lessonData) {
            return NextResponse.json(
                { error: "Lesson not found" },
                { status: 404 },
            );
        }

        const lesson = {
            ...lessonData,
            course_id: (lessonData.chapters as any).course_id,
        };

        // TODO: Verify user is course instructor or admin
        // For now, allowing all uploads for testing

        let videoUrl: string;
        let videoDuration: number | null = null;

        // Handle different upload methods
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const file = (formData as any).get("video") as File | null;

            if (!file || typeof file === "string") {
                return NextResponse.json(
                    { error: "No video file provided" },
                    { status: 400 },
                );
            }

            // Validate file
            const validation = validateVideoFile(file);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 },
                );
            }

            // Upload to storage
            const uploadMethod = process.env.VIDEO_STORAGE || "local"; // local, cloudinary, s3
            const result = await uploadVideoToStorage(
                file,
                lessonId,
                uploadMethod,
            );

            videoUrl = result.url;
            videoDuration = result.duration;
        } else if (contentType.includes("application/json")) {
            // External URL provided (for links to YouTube, Vimeo, etc.)
            const body = await request.json();
            const { videoUrl: externalUrl, duration } = body;

            if (!externalUrl) {
                return NextResponse.json(
                    { error: "No video URL provided" },
                    { status: 400 },
                );
            }

            videoUrl = externalUrl;
            videoDuration = duration || null;
        } else {
            return NextResponse.json(
                { error: "Invalid content type" },
                { status: 400 },
            );
        }

        // Update lesson with video URL
        await update(
            "lessons",
            { id: lessonId },
            {
                video_url: videoUrl,
                video_duration: videoDuration
                    ? Math.round(videoDuration)
                    : null,
                updated_at: new Date().toISOString(),
            },
        );

        return NextResponse.json({
            success: true,
            videoUrl,
            videoDuration,
            lessonId,
        });
    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload video" },
            { status: 500 },
        );
    }
}

/**
 * Validate video file
 */
function validateVideoFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_VIDEO_SIZE) {
        const maxSizeMB = MAX_VIDEO_SIZE / (1024 * 1024);
        const fileSizeMB = file.size / (1024 * 1024);
        return {
            valid: false,
            error: `File quá lớn. Giới hạn: ${maxSizeMB.toFixed(0)}MB, file: ${fileSizeMB.toFixed(2)}MB. Vui lòng nén video hoặc giảm độ phân giải.`,
        };
    }

    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
        return {
            valid: false,
            error: `Định dạng video không hợp lệ. Hỗ trợ: ${ALLOWED_FORMATS.join(", ")}, nhận được: ${file.type}`,
        };
    }

    // Check file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["mp4", "webm", "ogv", "mov", "avi", "mkv"];
    if (!ext || !allowedExts.includes(ext)) {
        return {
            valid: false,
            error: `Phần mở rộng tệp không hợp lệ. Hỗ trợ: ${allowedExts.join(", ")}, nhận được: .${ext}`,
        };
    }

    return { valid: true };
}

/**
 * Upload video to storage
 * Supports: local storage, Cloudinary, AWS S3
 */
async function uploadVideoToStorage(
    file: File,
    lessonId: string,
    method: string,
): Promise<{ url: string; duration: number | null }> {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    if (method === "cloudinary") {
        return uploadToCloudinary(uint8Array, lessonId, file.name);
    } else if (method === "s3") {
        return uploadToS3(uint8Array, lessonId, file.name);
    } else {
        // Default: local storage
        return uploadToLocal(uint8Array, lessonId, file.name);
    }
}

/**
 * Upload to local server storage
 */
async function uploadToLocal(
    buffer: Uint8Array,
    lessonId: string,
    fileName: string,
): Promise<{ url: string; duration: number | null }> {
    try {
        // Create videos directory if it doesn't exist
        const videosDir = resolve(process.cwd(), "public", "videos");
        await mkdir(videosDir, { recursive: true });

        // Generate filename with timestamp
        const ext = fileName.split(".").pop();
        const timestamp = Date.now();
        const storageName = `${lessonId}-${timestamp}.${ext}`;
        const filePath = resolve(videosDir, storageName);

        // Write file to disk
        await writeFile(filePath, buffer);

        // Generate URL (relative to public folder)
        const videoUrl = `/videos/${storageName}`;

        // For local files, extract duration if possible
        let duration = null;
        try {
            // Try to get duration using ffprobe (if available)
            // For now, we'll let the client extract duration from <video> element
            // This is handled by the VideoPlayer component using HTMLVideoElement API
            duration = null;
        } catch (err) {
            // Duration extraction failed, will be extracted on client side
            console.log(
                "Could not extract video duration server-side, client will handle it",
            );
        }

        console.log(`✅ Video uploaded locally: ${videoUrl}`);

        return {
            url: videoUrl,
            duration,
        };
    } catch (error) {
        console.error("Local upload error:", error);
        throw new Error(
            `Failed to upload video to local storage: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Upload to Cloudinary
 */
async function uploadToCloudinary(
    buffer: Uint8Array,
    lessonId: string,
    fileName: string,
): Promise<{ url: string; duration: number | null }> {
    try {
        const cloudinaryModule = await import("cloudinary");
        const { v2: cloudinary } = cloudinaryModule;

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        return new Promise((resolve, reject) => {
            // Set timeout for upload (300 seconds = 5 minutes for large files)
            const timeout = setTimeout(() => {
                reject(
                    new Error(
                        "Upload timeout - video processing took too long. Vui lòng thử lại hoặc giảm kích thước file.",
                    ),
                );
            }, 300000); // 5 minutes

            try {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "dhvlearnx/videos",
                        public_id: `${lessonId}-${Date.now()}`,
                        resource_type: "video",
                        // Video optimization
                        quality: "auto", // Auto optimize quality
                        eager_async: true, // Process video asynchronously
                        eager: [
                            {
                                width: 300,
                                height: 300,
                                crop: "fill",
                                format: "jpg",
                            }, // Thumbnail
                        ],
                        // Performance settings
                        max_bytes: 500000000, // 500MB max
                    },
                    (error: any, result: any) => {
                        clearTimeout(timeout);

                        if (error) {
                            console.error("Cloudinary error details:", {
                                message: error.message,
                                http_code: error.http_code,
                                status_code: error.status_code,
                            });

                            // Handle specific Cloudinary errors
                            if (
                                error.http_code === 400 ||
                                error.status_code === 400
                            ) {
                                // 400 errors - likely invalid parameters or unsupported codec
                                if (
                                    error.message?.includes("too large") ||
                                    error.message?.includes("maximum")
                                ) {
                                    reject(
                                        new Error(
                                            "Video quá lớn. Giới hạn: 500MB. Vui lòng nén video.",
                                        ),
                                    );
                                } else if (
                                    error.message?.includes("codec") ||
                                    error.message?.includes("format")
                                ) {
                                    reject(
                                        new Error(
                                            "Định dạng video không được hỗ trợ. Hãy dùng MP4 (H.264 codec).",
                                        ),
                                    );
                                } else if (
                                    error.message?.includes("parameter") ||
                                    error.message?.includes("option")
                                ) {
                                    reject(
                                        new Error(
                                            "Lỗi cấu hình upload. Thử lại hoặc liên hệ support.",
                                        ),
                                    );
                                } else {
                                    reject(
                                        new Error(
                                            `Lỗi Cloudinary: ${error.message}`,
                                        ),
                                    );
                                }
                            } else if (
                                error.http_code === 401 ||
                                error.http_code === 403
                            ) {
                                reject(
                                    new Error(
                                        "Lỗi xác thực Cloudinary. Vui lòng kiểm tra credentials.",
                                    ),
                                );
                            } else if (error.http_code === 429) {
                                reject(
                                    new Error(
                                        "Rate limit. Chờ vài giây rồi thử lại.",
                                    ),
                                );
                            } else if (
                                error.http_code === 499 ||
                                error.message?.includes("Timeout")
                            ) {
                                reject(
                                    new Error(
                                        "Timeout. Kiểm tra kết nối internet và thử lại.",
                                    ),
                                );
                            } else {
                                reject(error);
                            }
                        } else if (result) {
                            resolve({
                                url: result.secure_url,
                                duration: result.duration || null,
                            });
                        } else {
                            reject(
                                new Error(
                                    "Upload failed - no response from Cloudinary",
                                ),
                            );
                        }
                    },
                );

                // Handle stream errors
                uploadStream.on("error", (error: any) => {
                    clearTimeout(timeout);
                    console.error("Stream error:", error);
                    reject(new Error(`Stream error: ${error.message}`));
                });

                // Handle stream close
                uploadStream.on("close", () => {
                    clearTimeout(timeout);
                });

                // Write buffer to stream
                if (buffer && buffer.length > 0) {
                    uploadStream.end(Buffer.from(buffer));
                } else {
                    clearTimeout(timeout);
                    reject(new Error("Buffer is empty"));
                }
            } catch (err: any) {
                clearTimeout(timeout);
                reject(new Error(`Upload setup error: ${err.message}`));
            }
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(
            `Failed to upload video to Cloudinary: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Upload to AWS S3
 */
async function uploadToS3(
    buffer: Uint8Array,
    lessonId: string,
    fileName: string,
): Promise<{ url: string; duration: number | null }> {
    try {
        // This requires AWS SDK setup
        // Example placeholder:
        const bucketName = process.env.AWS_BUCKET_NAME;
        const region = process.env.AWS_REGION;

        if (!bucketName || !region) {
            throw new Error("AWS credentials not configured");
        }

        // TODO: Implement AWS S3 upload using @aws-sdk/client-s3
        throw new Error("AWS S3 upload not yet implemented");
    } catch (error) {
        console.error("S3 upload error:", error);
        throw error;
    }
}

/**
 * DELETE handler to delete video
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> },
) {
    try {
        const { lessonId } = await params;

        // Verify lesson exists
        const lesson = await queryOneBuilder<{ video_url: string | null }>(
            "lessons",
            {
                select: "video_url",
                filters: { id: lessonId },
            },
        );

        if (!lesson || !lesson.video_url) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 },
            );
        }

        // TODO: Delete from storage (local file or Cloudinary)

        // Update lesson to remove video URL
        await update(
            "lessons",
            { id: lessonId },
            {
                video_url: null,
                video_duration: null,
                updated_at: new Date().toISOString(),
            },
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Video delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete video" },
            { status: 500 },
        );
    }
}
