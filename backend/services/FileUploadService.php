<?php
// =====================================================================
// File Upload Service (Photo Evidence & Resolutions)
// =====================================================================

class FileUploadService {
    private static array $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif'
    ];

    private static int $maxSizeBytes = 5242880; // 5 MB

    public static function upload(array $file, string $targetFolder = 'evidence'): array {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new Exception('Invalid file upload parameters.');
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new Exception('No file was uploaded.');
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new Exception('Exceeded maximum file size (5MB limit).');
            default:
                throw new Exception('Unknown file upload error.');
        }

        if ($file['size'] > self::$maxSizeBytes) {
            throw new Exception('File size exceeds the 5MB limit.');
        }

        // Validate MIME type securely using finfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!array_key_exists($mime, self::$allowedMimeTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
        }

        $extension = self::$allowedMimeTypes[$mime];
        $safeFileName = $targetFolder . '_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $extension;

        $targetDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . $targetFolder;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $destinationPath = $targetDir . DIRECTORY_SEPARATOR . $safeFileName;

        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            throw new Exception('Failed to save uploaded file on server.');
        }

        $publicUrl = '/KinilisIbaKa/backend/storage/' . $targetFolder . '/' . $safeFileName;

        return [
            'original_name' => basename($file['name']),
            'saved_name'    => $safeFileName,
            'file_path'     => $publicUrl,
            'file_size'     => round($file['size'] / (1024 * 1024), 2) . ' MB',
            'file_type'     => $mime
        ];
    }
}
