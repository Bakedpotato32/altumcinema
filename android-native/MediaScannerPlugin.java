package com.altumcinema.app;

import android.Manifest;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(
    name = "MediaScanner",
    permissions = {
        @Permission(
            strings = {
                Manifest.permission.READ_MEDIA_VIDEO,
                Manifest.permission.READ_MEDIA_AUDIO
            },
            alias = "mediaVideos"
        ),
        @Permission(
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            },
            alias = "legacyStorage"
        )
    }
)
public class MediaScannerPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        boolean granted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            granted = getPermissionState("mediaVideos") == com.getcapacitor.PermissionState.GRANTED;
        } else {
            granted = getPermissionState("legacyStorage") == com.getcapacitor.PermissionState.GRANTED;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionForAlias("mediaVideos", call, "permissionCallback");
        } else {
            requestPermissionForAlias("legacyStorage", call, "permissionCallback");
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        checkPermissions(call);
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
        JSArray foldersArray = new JSArray();
        Map<String, JSArray> folderMap = new HashMap<>();
        Map<String, JSObject> folderMetaMap = new HashMap<>();

        try {
            Uri collection;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
            } else {
                collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
            }

            String[] projection = new String[] {
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.DATA,
                MediaStore.Video.Media.DURATION,
                MediaStore.Video.Media.SIZE,
                MediaStore.Video.Media.BUCKET_DISPLAY_NAME,
                MediaStore.Video.Media.DATE_MODIFIED
            };

            String sortOrder = MediaStore.Video.Media.DATE_MODIFIED + " DESC";

            try (Cursor cursor = getContext().getContentResolver().query(collection, projection, null, null, sortOrder)) {
                if (cursor != null) {
                    int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID);
                    int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME);
                    int dataColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATA);
                    int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION);
                    int sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE);
                    int bucketColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.BUCKET_DISPLAY_NAME);

                    while (cursor.moveToNext()) {
                        long id = cursor.getLong(idColumn);
                        String name = cursor.getString(nameColumn);
                        String path = cursor.getString(dataColumn);
                        long durationMs = cursor.getLong(durationColumn);
                        long sizeBytes = cursor.getLong(sizeColumn);
                        String folder = cursor.getString(bucketColumn);

                        if (folder == null || folder.isEmpty()) {
                            folder = "Internal Storage";
                        }
                        if (name == null || name.isEmpty()) {
                            name = path != null ? new File(path).getName() : "Video_" + id;
                        }

                        Uri contentUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);

                        JSObject videoObj = new JSObject();
                        videoObj.put("id", "media_" + id);
                        videoObj.put("name", name);
                        videoObj.put("path", path != null ? path : "");
                        videoObj.put("url", path != null ? path : contentUri.toString());
                        videoObj.put("duration", durationMs > 0 ? (int)(durationMs / 1000) : 0);
                        videoObj.put("currentTime", 0);

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
            call.reject("Failed to scan videos: " + e.getMessage(), e);
        }
    }
}
