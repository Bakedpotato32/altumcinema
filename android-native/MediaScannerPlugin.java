package com.altumcinema.app;

import android.Manifest;
import android.content.ContentUris;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.Size;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(
    name = "MediaScanner",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_MEDIA_VIDEO },
            alias = "videos"
        ),
        @Permission(
            strings = { Manifest.permission.READ_EXTERNAL_STORAGE },
            alias = "storage"
        )
    }
)
public class MediaScannerPlugin extends Plugin {

    @PluginMethod
    public void setOrientation(PluginCall call) {
        String orientation = call.getString("orientation", "auto");
        getActivity().runOnUiThread(() -> {
            try {
                if ("landscape".equalsIgnoreCase(orientation)) {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                } else if ("portrait".equalsIgnoreCase(orientation)) {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                } else {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Orientation error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void checkStoragePermissions(PluginCall call) {
        boolean granted = false;
        if (Build.VERSION.SDK_INT >= 33) {
            granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED;
        } else {
            granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }
        if (Build.VERSION.SDK_INT >= 30) {
            if (Environment.isExternalStorageManager()) {
                granted = true;
            }
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestStoragePermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissionForAlias("videos", call, "storageCallback");
        } else {
            requestPermissionForAlias("storage", call, "storageCallback");
        }
    }

    @PermissionCallback
    private void storageCallback(PluginCall call) {
        checkStoragePermissions(call);
    }

    @PluginMethod
    public void openAllFilesSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            } catch (Exception e) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                getActivity().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("opened", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void scanVideos(PluginCall call) {
        getBridge().execute(() -> {
            JSArray foldersArray = new JSArray();
            Map<String, JSArray> folderMap = new HashMap<>();
            Map<String, JSObject> folderMetaMap = new HashMap<>();

            try {
                Uri collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;

                String[] projection = new String[] {
                    MediaStore.Video.Media._ID,
                    MediaStore.Video.Media.DISPLAY_NAME,
                    MediaStore.Video.Media.DATA,
                    MediaStore.Video.Media.DURATION,
                    MediaStore.Video.Media.SIZE,
                    MediaStore.Video.Media.BUCKET_DISPLAY_NAME
                };

                String sortOrder = MediaStore.Video.Media.DATE_MODIFIED + " DESC";

                try (Cursor cursor = getContext().getContentResolver().query(collection, projection, null, null, sortOrder)) {
                    if (cursor != null) {
                        int idColumn = cursor.getColumnIndex(MediaStore.Video.Media._ID);
                        int nameColumn = cursor.getColumnIndex(MediaStore.Video.Media.DISPLAY_NAME);
                        int dataColumn = cursor.getColumnIndex(MediaStore.Video.Media.DATA);
                        int durationColumn = cursor.getColumnIndex(MediaStore.Video.Media.DURATION);
                        int sizeColumn = cursor.getColumnIndex(MediaStore.Video.Media.SIZE);
                        int bucketColumn = cursor.getColumnIndex(MediaStore.Video.Media.BUCKET_DISPLAY_NAME);

                        int thumbCount = 0;
                        while (cursor.moveToNext()) {
                            long id = cursor.getLong(idColumn);
                            String name = nameColumn != -1 ? cursor.getString(nameColumn) : "";
                            String path = dataColumn != -1 ? cursor.getString(dataColumn) : "";
                            long durationMs = durationColumn != -1 ? cursor.getLong(durationColumn) : 0;
                            long sizeBytes = sizeColumn != -1 ? cursor.getLong(sizeColumn) : 0;
                            String folder = bucketColumn != -1 ? cursor.getString(bucketColumn) : "Videos";

                            if (folder == null || folder.trim().isEmpty()) {
                                folder = "Device Videos";
                            }
                            if (name == null || name.trim().isEmpty()) {
                                name = path != null && !path.isEmpty() ? new File(path).getName() : "Video_" + id;
                            }

                            // Generate high-resolution 640x360 thumbnail for the top 12 videos immediately
                            String thumbBase64 = null;
                            if (thumbCount < 12) {
                                try {
                                    Bitmap bmp = null;
                                    if (Build.VERSION.SDK_INT >= 29) {
                                        Uri contentUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                                        bmp = getContext().getContentResolver().loadThumbnail(contentUri, new Size(640, 360), null);
                                    } else if (path != null && new File(path).exists()) {
                                        bmp = ThumbnailUtils.createVideoThumbnail(path, MediaStore.Images.Thumbnails.MINI_KIND);
                                    }

                                    if (bmp != null) {
                                        ByteArrayOutputStream stream = new ByteArrayOutputStream();
                                        bmp.compress(Bitmap.CompressFormat.JPEG, 82, stream);
                                        byte[] byteArray = stream.toByteArray();
                                        thumbBase64 = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
                                        bmp.recycle();
                                        thumbCount++;
                                    }
                                } catch (Throwable ignored) {}
                            }

                            JSObject videoObj = new JSObject();
                            videoObj.put("id", "media_" + id);
                            videoObj.put("name", name);
                            videoObj.put("path", path != null ? path : "");
                            videoObj.put("url", path != null ? path : "");
                            videoObj.put("duration", durationMs > 0 ? (int)(durationMs / 1000) : 0);
                            videoObj.put("currentTime", 0);
                            if (thumbBase64 != null) {
                                videoObj.put("thumbnail", thumbBase64);
                            }

                            double sizeMb = sizeBytes > 0 ? (double)sizeBytes / (1024 * 1024) : 0;
                            videoObj.put("size", sizeMb > 1024 ? String.format("%.2f GB", sizeMb / 1024) : String.format("%.1f MB", sizeMb));
                            videoObj.put("folder", folder);
                            videoObj.put("date", "Recent");

                            if (!folderMap.containsKey(folder)) {
                                folderMap.put(folder, new JSArray());

                                JSObject folderMeta = new JSObject();
                                folderMeta.put("id", "f_" + folder.toLowerCase().replaceAll("[^a-z0-9]", "_"));
                                folderMeta.put("name", folder);
                                folderMeta.put("path", path != null ? new File(path).getParent() : folder);
                                folderMetaMap.put(folder, folderMeta);
                            }

                            folderMap.get(folder).put(videoObj);
                        }
                    }
                }

                for (Map.Entry<String, JSArray> entry : folderMap.entrySet()) {
                    String folderName = entry.getKey();
                    JSArray videos = entry.getValue();
                    JSObject folderObj = folderMetaMap.get(folderName);
                    folderObj.put("videoCount", videos.length());
                    folderObj.put("totalSize", videos.length() + " videos");
                    folderObj.put("videos", videos);
                    foldersArray.put(folderObj);
                }

                JSObject res = new JSObject();
                res.put("folders", foldersArray);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Scan error: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void getVideoThumbnail(PluginCall call) {
        long id = call.getInt("id", -1);
        String path = call.getString("path", "");
        getBridge().execute(() -> {
            try {
                Bitmap bmp = null;
                // High-resolution 640x360 frame capture
                if (Build.VERSION.SDK_INT >= 29 && id != -1) {
                    Uri contentUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                    bmp = getContext().getContentResolver().loadThumbnail(contentUri, new Size(640, 360), null);
                } else if (!path.isEmpty() && new File(path).exists()) {
                    bmp = ThumbnailUtils.createVideoThumbnail(path, MediaStore.Images.Thumbnails.MINI_KIND);
                }

                if (bmp != null) {
                    ByteArrayOutputStream stream = new ByteArrayOutputStream();
                    bmp.compress(Bitmap.CompressFormat.JPEG, 82, stream);
                    byte[] byteArray = stream.toByteArray();
                    String b64 = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
                    bmp.recycle();
                    JSObject ret = new JSObject();
                    ret.put("thumbnail", b64);
                    call.resolve(ret);
                } else {
                    call.reject("No thumbnail available");
                }
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
